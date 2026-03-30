<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaultSettings = [
            // General Settings
            ['key' => 'site_name', 'value' => 'Learning Management System', 'category' => 'general', 'type' => 'text', 'description' => 'Site name displayed in header', 'is_encrypted' => false],
            ['key' => 'site_description', 'value' => 'A comprehensive learning management system', 'category' => 'general', 'type' => 'text', 'description' => 'Site description for SEO', 'is_encrypted' => false],
            ['key' => 'timezone', 'value' => 'UTC', 'category' => 'general', 'type' => 'text', 'description' => 'Default timezone', 'is_encrypted' => false],
            ['key' => 'site_logo', 'value' => '', 'category' => 'general', 'type' => 'text', 'description' => 'Custom site logo URL', 'is_encrypted' => false],
            ['key' => 'site_favicon', 'value' => '', 'category' => 'general', 'type' => 'text', 'description' => 'Custom favicon URL', 'is_encrypted' => false],
            ['key' => 'pagination_limit', 'value' => '10', 'category' => 'general', 'type' => 'number', 'description' => 'Default items per page for paginated listings', 'is_encrypted' => false],
            ['key' => 'footer_text', 'value' => 'All rights reserved.', 'category' => 'general', 'type' => 'text', 'description' => 'Footer text shown across the app', 'is_encrypted' => false],


            // Course Settings
            ['key' => 'default_course_duration', 'value' => '40', 'category' => 'course', 'type' => 'number', 'description' => 'Default course duration in hours', 'is_encrypted' => false],
            ['key' => 'max_file_upload_size', 'value' => '10', 'category' => 'course', 'type' => 'number', 'description' => 'Maximum file upload size in MB', 'is_encrypted' => false],
            ['key' => 'allowed_file_types', 'value' => 'jpg,jpeg,png,pdf,doc,docx,mp4,mp3', 'category' => 'course', 'type' => 'text', 'description' => 'Allowed file types for uploads', 'is_encrypted' => false],
            ['key' => 'auto_approve_courses', 'value' => '0', 'category' => 'course', 'type' => 'boolean', 'description' => 'Auto-approve new courses', 'is_encrypted' => false],

            // Payment Settings
            ['key' => 'paypal_enabled', 'value' => '1', 'category' => 'payment', 'type' => 'boolean', 'description' => 'Enable PayPal payments', 'is_encrypted' => false],
            ['key' => 'paypal_mode', 'value' => 'sandbox', 'category' => 'payment', 'type' => 'text', 'description' => 'PayPal mode (sandbox/live)', 'is_encrypted' => false],
            ['key' => 'paypal_currency', 'value' => 'USD', 'category' => 'payment', 'type' => 'text', 'description' => 'PayPal currency', 'is_encrypted' => false],

            // Email Settings
            ['key' => 'email_notifications_enabled', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Enable email notifications', 'is_encrypted' => false],
            ['key' => 'smtp_host', 'value' => '', 'category' => 'notification', 'type' => 'text', 'description' => 'SMTP server host', 'is_encrypted' => false],
            ['key' => 'smtp_port', 'value' => '587', 'category' => 'notification', 'type' => 'number', 'description' => 'SMTP server port', 'is_encrypted' => false],
            ['key' => 'smtp_username', 'value' => '', 'category' => 'notification', 'type' => 'text', 'description' => 'SMTP username', 'is_encrypted' => false],
            ['key' => 'smtp_password', 'value' => '', 'category' => 'notification', 'type' => 'password', 'description' => 'SMTP password', 'is_encrypted' => false],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'category' => 'notification', 'type' => 'text', 'description' => 'SMTP encryption (tls/ssl)', 'is_encrypted' => false],
            ['key' => 'mail_from_address', 'value' => '', 'category' => 'notification', 'type' => 'text', 'description' => 'From email address', 'is_encrypted' => false],
            ['key' => 'mail_from_name', 'value' => 'Learning Management System', 'category' => 'notification', 'type' => 'text', 'description' => 'From name', 'is_encrypted' => false],
            
            // Email Notification Types
            ['key' => 'email_user_registration', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email on user registration', 'is_encrypted' => false],
            ['key' => 'email_course_enrollment', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email on course enrollment', 'is_encrypted' => false],
            ['key' => 'email_payment_confirmation', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email on payment confirmation', 'is_encrypted' => false],
            ['key' => 'email_course_completion', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email on course completion', 'is_encrypted' => false],
            ['key' => 'email_password_reset', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email on password reset', 'is_encrypted' => false],
            ['key' => 'email_instructor_notifications', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send email notifications to instructors', 'is_encrypted' => false],
            
            // Slack Settings
            ['key' => 'slack_notifications_enabled', 'value' => '0', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Enable Slack notifications', 'is_encrypted' => false],
            ['key' => 'slack_webhook_url', 'value' => '', 'category' => 'notification', 'type' => 'password', 'description' => 'Slack webhook URL', 'is_encrypted' => false],
            
            // Slack Notification Types
            ['key' => 'slack_user_registration', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send Slack notification on user registration', 'is_encrypted' => false],
            ['key' => 'slack_course_submission', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send Slack notification on course submission for review', 'is_encrypted' => false],
            ['key' => 'slack_payment_transactions', 'value' => '1', 'category' => 'notification', 'type' => 'boolean', 'description' => 'Send Slack notification on payment transactions', 'is_encrypted' => false],
        ];

        foreach ($defaultSettings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
