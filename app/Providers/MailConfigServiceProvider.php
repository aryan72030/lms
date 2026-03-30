<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class MailConfigServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        try {
            $emailSettings = Setting::getEmailSettings();
            
            if ($emailSettings['enabled'] && $emailSettings['smtp_host']) {
                Config::set([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.host' => $emailSettings['smtp_host'],
                    'mail.mailers.smtp.port' => $emailSettings['smtp_port'],
                    'mail.mailers.smtp.username' => $emailSettings['smtp_username'],
                    'mail.mailers.smtp.password' => $emailSettings['smtp_password'],
                    'mail.mailers.smtp.encryption' => $emailSettings['smtp_encryption'],
                    'mail.from.address' => $emailSettings['from_address'],
                    'mail.from.name' => $emailSettings['from_name'],
                ]);
            }
        } catch (\Exception $e) {
            // If database is not available or settings don't exist, use default config
            \Log::warning('Could not load email settings from database: ' . $e->getMessage());
        }
    }
}