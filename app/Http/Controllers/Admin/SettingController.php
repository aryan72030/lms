<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use DateTimeZone;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{
    /**
     * Display settings page
     */
    public function index()
    {
        $settings = [
            'general' => Setting::getByCategory(Setting::CATEGORY_GENERAL),
            'course' => Setting::getByCategory(Setting::CATEGORY_COURSE),
            'payment' => Setting::getByCategory(Setting::CATEGORY_PAYMENT),
            'notification' => Setting::getByCategory(Setting::CATEGORY_NOTIFICATION),
        ];

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'timezones' => DateTimeZone::listIdentifiers(DateTimeZone::ALL),
        ]);
    }

    /**
     * Update payment settings
     */
    public function updatePaymentSettings(Request $request)
    {
        $request->validate([
            'paypal_client_id' => 'nullable|string|max:255',
            'paypal_client_secret' => 'nullable|string|max:255',
            'paypal_mode' => 'required|in:sandbox,live',
            'paypal_webhook_id' => 'nullable|string|max:255',
            'paypal_currency' => 'required|string|size:3',
            'paypal_enabled' => 'boolean',
        ]);

        try {
            // PayPal Configuration
            Setting::set('paypal_client_id', $request->paypal_client_id, Setting::CATEGORY_PAYMENT, Setting::TYPE_PASSWORD, true);
            Setting::set('paypal_client_secret', $request->paypal_client_secret, Setting::CATEGORY_PAYMENT, Setting::TYPE_PASSWORD, true);
            Setting::set('paypal_mode', $request->paypal_mode, Setting::CATEGORY_PAYMENT);
            Setting::set('paypal_webhook_id', $request->paypal_webhook_id, Setting::CATEGORY_PAYMENT);
            Setting::set('paypal_currency', $request->paypal_currency, Setting::CATEGORY_PAYMENT);
            Setting::set('paypal_enabled', $request->paypal_enabled ?? false, Setting::CATEGORY_PAYMENT, Setting::TYPE_BOOLEAN);

            // Log the change
            Log::info('Payment settings updated', [
                'admin_id' => auth()->id(),
                'admin_email' => auth()->user()->email,
                'settings_updated' => array_keys($request->all()),
            ]);

            return back()->with('success', 'Payment settings updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update payment settings', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return back()->with('error', 'Failed to update payment settings. Please try again.');
        }
    }

    /**
     * Test PayPal connection
     */
    public function testPayPalConnection(Request $request)
    {
        $request->validate([
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
            'mode' => 'required|in:sandbox,live',
        ]);

        try {
            $baseUrl = $request->mode === 'live' 
                ? 'https://api.paypal.com' 
                : 'https://api.sandbox.paypal.com';

            $response = \Illuminate\Support\Facades\Http::withBasicAuth($request->client_id, $request->client_secret)
                ->asForm()
                ->post("{$baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'PayPal connection successful!',
                    'data' => [
                        'token_type' => $response->json()['token_type'],
                        'expires_in' => $response->json()['expires_in'],
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'PayPal connection failed. Please check your credentials.',
                'error' => $response->body(),
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'PayPal connection test failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update general settings
     */
    public function updateGeneralSettings(Request $request)
    {
        try {
            $validated = $request->validate([
                'site_name' => 'required|string|max:255',
                'site_description' => 'nullable|string|max:500',
                'timezone' => ['required', 'string', Rule::in(DateTimeZone::listIdentifiers(DateTimeZone::ALL))],
                'site_logo' => 'nullable|file|image|mimes:jpg,jpeg,png,svg,webp|max:2048',
                'site_favicon' => 'nullable|file|max:1024',
                'pagination_limit' => 'required|integer|min:5|max:200',
                'footer_text' => 'nullable|string|max:255',
            ]);
        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $e->errors(),
                ], 422);
            }

            throw $e;
        }

        try {
            Setting::set('site_name', $validated['site_name'], Setting::CATEGORY_GENERAL);
            Setting::set('site_description', $validated['site_description'] ?? null, Setting::CATEGORY_GENERAL);
            Setting::set('timezone', $validated['timezone'], Setting::CATEGORY_GENERAL);
            Setting::set(
                'site_logo',
                $this->storeGeneralImage($request, 'site_logo', 'settings/branding', Setting::get('site_logo')),
                Setting::CATEGORY_GENERAL
            );
            Setting::set(
                'site_favicon',
                $this->storeGeneralImage($request, 'site_favicon', 'settings/branding', Setting::get('site_favicon')),
                Setting::CATEGORY_GENERAL
            );
            Setting::set('pagination_limit', $validated['pagination_limit'], Setting::CATEGORY_GENERAL, Setting::TYPE_NUMBER);
            Setting::set('footer_text', $validated['footer_text'] ?? null, Setting::CATEGORY_GENERAL);

            Log::info('General settings updated', [
                'admin_id' => auth()->id(),
                'admin_email' => auth()->user()->email,
            ]);

            return back()->with('success', 'General settings updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update general settings', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return back()->with('error', 'Failed to update general settings. Please try again.');
        }
    }

    private function storeGeneralImage(Request $request, string $field, string $directory, ?string $currentValue): ?string
    {
        if (!$request->hasFile($field)) {
            return $currentValue;
        }

        $uploadedFile = $request->file($field);
        $path = $uploadedFile->store($directory, 'public');

        if ($currentValue && (str_starts_with($currentValue, '/storage/') || str_starts_with($currentValue, '/files/'))) {
            $oldPath = ltrim(str_replace(['/storage/', '/files/'], '', $currentValue), '/');

            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        return Storage::url($path);
    }

    /**
     * Update course settings
     */
    public function updateCourseSettings(Request $request)
    {
        $request->validate([
            // Basic Course Settings
            'default_course_duration' => 'nullable|integer|min:1',
            'require_course_description' => 'boolean',
            'require_course_thumbnail' => 'boolean',
            'min_lessons_per_course' => 'nullable|integer|min:1|max:10',
            
            // File Upload Settings
            'max_file_upload_size' => 'nullable|integer|min:1',
            'allowed_file_types' => 'nullable|string',
            'max_files_per_lesson' => 'nullable|integer|min:1|max:10',
            
            // Approval Settings
            'auto_approve_courses' => 'boolean',
            'require_admin_approval' => 'boolean',
            
            // Quiz & Completion Settings
            'require_final_quiz' => 'boolean',
            'min_quiz_passing_score' => 'nullable|integer|min:1|max:100',
            'max_quiz_attempts' => 'nullable|integer|min:1|max:10',
            
            // Certificate Settings
            'enable_certificates' => 'boolean',
            'auto_email_certificates' => 'boolean',
            
            // Enrollment Settings
            'allow_free_courses' => 'boolean',
            'max_students_per_course' => 'nullable|integer|min:0',
        ]);

        try {
            // Basic Course Settings
            Setting::set('default_course_duration', $request->default_course_duration ?? 40, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            Setting::set('require_course_description', $request->require_course_description ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('require_course_thumbnail', $request->require_course_thumbnail ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('min_lessons_per_course', $request->min_lessons_per_course ?? 3, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            
            // File Upload Settings
            Setting::set('max_file_upload_size', $request->max_file_upload_size ?? 10, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            Setting::set('allowed_file_types', $request->allowed_file_types ?? 'jpg,jpeg,png,pdf,doc,docx,mp4,mp3', Setting::CATEGORY_COURSE);
            Setting::set('max_files_per_lesson', $request->max_files_per_lesson ?? 5, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            
            // Approval Settings
            Setting::set('auto_approve_courses', $request->auto_approve_courses ?? false, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('require_admin_approval', $request->require_admin_approval ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            
            // Quiz & Completion Settings
            Setting::set('require_final_quiz', $request->require_final_quiz ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('min_quiz_passing_score', $request->min_quiz_passing_score ?? 70, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            Setting::set('max_quiz_attempts', $request->max_quiz_attempts ?? 3, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER);
            
            // Certificate Settings
            Setting::set('enable_certificates', $request->enable_certificates ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('auto_email_certificates', $request->auto_email_certificates ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            
            // Enrollment Settings
            Setting::set('allow_free_courses', $request->allow_free_courses ?? true, Setting::CATEGORY_COURSE, Setting::TYPE_BOOLEAN);
            Setting::set('max_students_per_course', $request->max_students_per_course ?? 0, Setting::CATEGORY_COURSE, Setting::TYPE_NUMBER); // 0 = unlimited

            Log::info('Course settings updated', [
                'admin_id' => auth()->id(),
                'admin_email' => auth()->user()->email,
            ]);

            return back()->with('success', 'Course settings updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update course settings', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return back()->with('error', 'Failed to update course settings. Please try again.');
        }
    }
    
    /**
     * Update notification settings
     */
    public function updateNotificationSettings(Request $request)
    {
        $request->validate([
            // Email Settings
            'email_notifications_enabled' => 'boolean',
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|integer|min:1|max:65535',
            'smtp_username' => 'nullable|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'smtp_encryption' => 'nullable|in:tls,ssl,none',
            'mail_from_address' => 'nullable|email|max:255',
            'mail_from_name' => 'nullable|string|max:255',
            
            // Email Notification Types
            'email_user_registration' => 'boolean',
            'email_course_enrollment' => 'boolean',
            'email_payment_confirmation' => 'boolean',
            'email_course_completion' => 'boolean',
            'email_password_reset' => 'boolean',
            'email_instructor_notifications' => 'boolean',
            
            // Slack Settings
            'slack_notifications_enabled' => 'boolean',
            'slack_webhook_url' => 'nullable|url|max:500',
            
            // Slack Notification Types
            'slack_user_registration' => 'boolean',
            'slack_course_submission' => 'boolean',
            'slack_payment_transactions' => 'boolean',
        ]);

        try {
            // Email Settings
            Setting::set('email_notifications_enabled', $request->email_notifications_enabled ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('smtp_host', $request->smtp_host, Setting::CATEGORY_NOTIFICATION);
            Setting::set('smtp_port', $request->smtp_port ?? 587, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_NUMBER);
            Setting::set('smtp_username', $request->smtp_username, Setting::CATEGORY_NOTIFICATION);
            Setting::set('smtp_password', $request->smtp_password, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_PASSWORD, true);
            Setting::set('smtp_encryption', $request->smtp_encryption ?? 'tls', Setting::CATEGORY_NOTIFICATION);
            Setting::set('mail_from_address', $request->mail_from_address, Setting::CATEGORY_NOTIFICATION);
            Setting::set('mail_from_name', $request->mail_from_name ?? 'Learning Management System', Setting::CATEGORY_NOTIFICATION);
            
            // Email Notification Types
            Setting::set('email_user_registration', $request->email_user_registration ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('email_course_enrollment', $request->email_course_enrollment ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('email_payment_confirmation', $request->email_payment_confirmation ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('email_course_completion', $request->email_course_completion ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('email_password_reset', $request->email_password_reset ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('email_instructor_notifications', $request->email_instructor_notifications ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            
            // Slack Settings
            Setting::set('slack_notifications_enabled', $request->slack_notifications_enabled ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('slack_webhook_url', $request->slack_webhook_url, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_PASSWORD, true);
            
            // Slack Notification Types
            Setting::set('slack_user_registration', $request->slack_user_registration ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('slack_course_submission', $request->slack_course_submission ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);
            Setting::set('slack_payment_transactions', $request->slack_payment_transactions ?? false, Setting::CATEGORY_NOTIFICATION, Setting::TYPE_BOOLEAN);

            Log::info('Notification settings updated', [
                'admin_id' => auth()->id(),
                'admin_email' => auth()->user()->email,
            ]);

            return back()->with('success', 'Notification settings updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update notification settings', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return back()->with('error', 'Failed to update notification settings. Please try again.');
        }
    }
    
    /**
     * Test email connection
     */
    public function testEmailConnection(Request $request)
    {
        $request->validate([
            'smtp_host' => 'required|string',
            'smtp_port' => 'required|integer',
            'smtp_username' => 'required|string',
            'smtp_password' => 'required|string',
            'smtp_encryption' => 'required|in:tls,ssl,none',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'nullable|string',
            'test_email' => 'required|email',
        ]);

        try {
            // Configure mail settings temporarily
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $request->smtp_host,
                'mail.mailers.smtp.port' => (int) $request->smtp_port,
                'mail.mailers.smtp.encryption' => $request->smtp_encryption === 'none' ? null : $request->smtp_encryption,
                'mail.mailers.smtp.username' => $request->smtp_username,
                'mail.mailers.smtp.password' => $request->smtp_password,
                'mail.from.address' => $request->mail_from_address,
                'mail.from.name' => $request->mail_from_name ?? 'LMS System',
            ]);

            // Clear mail manager cache
            app()->forgetInstance('mail.manager');
            app()->forgetInstance('mailer');

            // Send test email
            \Illuminate\Support\Facades\Mail::raw(
                'This is a test email from your LMS system. If you received this, your email configuration is working correctly!',
                function ($message) use ($request) {
                    $message->to($request->test_email)
                           ->subject('LMS Email Configuration Test')
                           ->from($request->mail_from_address, $request->mail_from_name ?? 'LMS System');
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully! Check your inbox.',
            ]);

        } catch (\Exception $e) {
            Log::error('Email connection test failed', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Email connection test failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
        
    /**
     * Test Slack connection
     */
    public function testSlackConnection(Request $request)
    {
        $request->validate([
            'webhook_url' => 'required|url',
        ]);

        try {
            $payload = [
                'text' => 'This is a test message from your LMS system. If you received this, your Slack integration is working correctly!',
            ];

            $response = \Illuminate\Support\Facades\Http::post($request->webhook_url, $payload);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test message sent to Slack successfully!',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Slack connection test failed. Please check your webhook URL.',
                'error' => $response->body(),
            ], 400);

        } catch (\Exception $e) {
            Log::error('Slack connection test failed', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Slack connection test failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
