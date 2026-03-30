<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send email notification
     */
    public function sendEmail(string $type, string $to, string $subject, string $message, array $data = []): bool
    {
        $emailSettings = Setting::getEmailSettings();
        
        // Check if email notifications are enabled
        if (!$emailSettings['enabled']) {
            return false;
        }
        
        // Check if this specific email type is enabled
        if (!($emailSettings['types'][$type] ?? true)) {
            return false;
        }
        
        try {
            $fromAddress = $emailSettings['from_address'] ?? config('mail.from.address');
            $fromName = $emailSettings['from_name'] ?? config('mail.from.name', 'Learning Management System');

            if (empty($fromAddress) || !is_string($fromAddress)) {
                Log::error('Email notification skipped: missing from_address', [
                    'type' => $type,
                    'to' => $to,
                    'subject' => $subject,
                ]);

                return false;
            }

            // Configure mail settings
            config([
                'mail.mailers.smtp.host' => $emailSettings['smtp_host'],
                'mail.mailers.smtp.port' => $emailSettings['smtp_port'],
                'mail.mailers.smtp.username' => $emailSettings['smtp_username'],
                'mail.mailers.smtp.password' => $emailSettings['smtp_password'],
                'mail.mailers.smtp.encryption' => $emailSettings['smtp_encryption'] === 'none' ? null : $emailSettings['smtp_encryption'],
                'mail.from.address' => $fromAddress,
                'mail.from.name' => $fromName,
            ]);
            
            Mail::raw($message, function ($mail) use ($to, $subject, $fromAddress, $fromName) {
                $mail->to($to)
                     ->subject($subject)
                     ->from($fromAddress, $fromName);
            });
            
            Log::info('Email notification sent', [
                'type' => $type,
                'to' => $to,
                'subject' => $subject,
            ]);
            
            return true;
            
        } catch (\Throwable $e) {
            Log::error('Failed to send email notification', [
                'type' => $type,
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
    
    /**
     * Send Slack notification
     */
    public function sendSlack(string $type, string $message, array $data = []): bool
    {
        // Log the intended notification to the dedicated notifications channel first
        // This way we can see what would be sent even if Slack is not configured
        Log::channel('notifications')->info('Slack Notification Triggered', [
            'type' => $type,
            'message' => $message,
            'data' => $data,
        ]);

        $slackSettings = Setting::getSlackSettings();
        
        // Check if Slack notifications are enabled
        if (!$slackSettings['enabled']) {
            return true; // Return true because we logged it
        }
        
        // Check if this specific Slack type is enabled
        if (!($slackSettings['types'][$type] ?? true)) {
            return true;
        }
        
        // Check if webhook URL is configured
        if (empty($slackSettings['webhook_url'])) {
            return true;
        }
        
        try {
            /*
            $payload = [
                'text' => $message,
            ];
            
            // Add rich formatting if provided
            if (isset($data['attachments'])) {
                $payload['attachments'] = $data['attachments'];
            }
            
            $response = Http::post($slackSettings['webhook_url'], $payload);
            
            if ($response->successful()) {
                Log::info('Slack notification sent', [
                    'type' => $type,
                    'message' => $message,
                ]);
                
                return true;
            }
            
            Log::error('Failed to send Slack notification', [
                'type' => $type,
                'message' => $message,
                'response' => $response->body(),
            ]);
            
            return false;
            */

            return true; 

        } catch (\Throwable $e) {
            Log::error('Failed to send Slack notification', [
                'type' => $type,
                'message' => $message,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }
    
    /**
     * Send user registration notifications
     */
    public function notifyUserRegistration(array $user): void
    {
        // Email notification
        $this->sendEmail(
            'user_registration',
            $user['email'],
            'Welcome to ' . Setting::get('site_name', 'LMS'),
            "Welcome {$user['name']}!\n\nThank you for registering with our Learning Management System. Your account has been created successfully.\n\nYou can now log in and start exploring our courses.\n\nBest regards,\nThe LMS Team"
        );
        
        // Slack notification
        $this->sendSlack(
            'user_registration',
            "🎉 New user registered: *{$user['name']}* ({$user['email']}) - Role: {$user['role']}"
        );
    }
    
    /**
     * Send course enrollment notifications
     */
    public function notifyCourseEnrollment(array $student, array $course): void
    {
        // Email notification to student
        $this->sendEmail(
            'course_enrollment',
            $student['email'],
            'Course Enrollment Confirmation',
            "Hi {$student['name']},\n\nYou have successfully enrolled in the course: {$course['title']}\n\nYou can now access the course content and start learning.\n\nBest regards,\nThe LMS Team"
        );
    }
    
    /**
     * Send payment confirmation notifications
     */
    public function notifyPaymentConfirmation(array $student, array $course, array $payment): void
    {
        // Email notification
        $this->sendEmail(
            'payment_confirmation',
            $student['email'],
            'Payment Confirmation - ' . $course['title'],
            "Hi {$student['name']},\n\nYour payment of {$payment['currency']} {$payment['amount']} for the course '{$course['title']}' has been processed successfully.\n\nTransaction ID: {$payment['transaction_id']}\n\nYou now have full access to the course.\n\nBest regards,\nThe LMS Team"
        );
        
        // Slack notification
        $this->sendSlack(
            'payment_transactions',
            "💰 Payment received: {$payment['currency']} {$payment['amount']} from *{$student['name']}* for course *{$course['title']}*"
        );
    }
    
    /**
     * Send course completion notifications
     */
    public function notifyCourseCompletion(array $student, array $course): void
    {
        // Email notification
        $this->sendEmail(
            'course_completion',
            $student['email'],
            'Congratulations! Course Completed',
            "Hi {$student['name']},\n\nCongratulations! You have successfully completed the course: {$course['title']}\n\nYour certificate is now available for download in your dashboard.\n\nBest regards,\nThe LMS Team"
        );
    }
    
    /**
     * Send course submission notifications (to admin)
     */
    public function notifyCourseSubmission(array $instructor, array $course): void
    {
        // Slack notification
        $this->sendSlack(
            'course_submission',
            "📚 New course submitted for review: *{$course['title']}* by instructor *{$instructor['name']}*",
            [
                'attachments' => [
                    [
                        'color' => 'warning',
                        'fields' => [
                            [
                                'title' => 'Course Title',
                                'value' => $course['title'],
                                'short' => true
                            ],
                            [
                                'title' => 'Instructor',
                                'value' => $instructor['name'],
                                'short' => true
                            ],
                            [
                                'title' => 'Category',
                                'value' => $course['category'] ?? 'N/A',
                                'short' => true
                            ],
                            [
                                'title' => 'Price',
                                'value' => $course['price'] > 0 ? '$' . $course['price'] : 'Free',
                                'short' => true
                            ]
                        ]
                    ]
                ]
            ]
        );
    }
    
    /**
     * Send system error notifications
     */
    public function notifySystemError(string $error, array $context = []): void
    {
        $this->sendSlack(
            'system_errors',
            "🚨 System Error: {$error}",
            [
                'attachments' => [
                    [
                        'color' => 'danger',
                        'fields' => [
                            [
                                'title' => 'Error Details',
                                'value' => json_encode($context, JSON_PRETTY_PRINT),
                                'short' => false
                            ]
                        ]
                    ]
                ]
            ]
        );
    }
    
    /**
     * Send daily reports
     */
    public function sendDailyReport(array $stats): void
    {
        $message = "📊 Daily LMS Report - " . date('Y-m-d');
        
        $this->sendSlack(
            'daily_reports',
            $message,
            [
                'attachments' => [
                    [
                        'color' => 'good',
                        'fields' => [
                            [
                                'title' => 'New Users',
                                'value' => $stats['new_users'] ?? 0,
                                'short' => true
                            ],
                            [
                                'title' => 'New Enrollments',
                                'value' => $stats['new_enrollments'] ?? 0,
                                'short' => true
                            ],
                            [
                                'title' => 'Payments',
                                'value' => '$' . ($stats['total_payments'] ?? 0),
                                'short' => true
                            ],
                            [
                                'title' => 'Course Completions',
                                'value' => $stats['completions'] ?? 0,
                                'short' => true
                            ]
                        ]
                    ]
                ]
            ]
        );
    }
}
