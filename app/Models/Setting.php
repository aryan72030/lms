<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'category',
        'type',
        'description',
        'is_encrypted',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    // Setting categories
    const CATEGORY_GENERAL = 'general';
    const CATEGORY_COURSE = 'course';
    const CATEGORY_PAYMENT = 'payment';
    const CATEGORY_NOTIFICATION = 'notification';

    // Setting types
    const TYPE_TEXT = 'text';
    const TYPE_NUMBER = 'number';
    const TYPE_BOOLEAN = 'boolean';
    const TYPE_JSON = 'json';
    const TYPE_PASSWORD = 'password';

    /**
     * Get setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $cacheKey = "setting_{$key}";
        
        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }
            
            $value = $setting->value;
            
            // Only decrypt if the setting is marked as encrypted and has a non-empty value
            if ($setting->is_encrypted && !empty($value)) {
                try {
                    $value = Crypt::decrypt($value);
                } catch (\Exception $e) {
                    // If decryption fails, return the raw value (for backwards compatibility)
                    $value = $setting->value;
                }
            }
            
            // Cast value based on type
            return match ($setting->type) {
                self::TYPE_BOOLEAN => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                self::TYPE_NUMBER => is_numeric($value) ? (float) $value : $default,
                self::TYPE_JSON => json_decode($value, true) ?? $default,
                default => $value,
            };
        });
    }

    /**
     * Set setting value
     */
    public static function set(string $key, $value, string $category = self::CATEGORY_GENERAL, string $type = self::TYPE_TEXT, bool $encrypt = false): void
    {
        $processedValue = match ($type) {
            self::TYPE_BOOLEAN => $value ? '1' : '0',
            self::TYPE_JSON => json_encode($value),
            default => (string) $value,
        };

        if ($encrypt) {
            $processedValue = Crypt::encrypt($processedValue);
        }

        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $processedValue,
                'category' => $category,
                'type' => $type,
                'is_encrypted' => $encrypt,
            ]
        );

        // Clear cache
        Cache::forget("setting_{$key}");
        Cache::forget("settings_category_{$category}");
    }

    /**
     * Get all settings by category
     */
    public static function getByCategory(string $category): array
    {
        $cacheKey = "settings_category_{$category}";
        
        return Cache::remember($cacheKey, 3600, function () use ($category) {
            $settings = static::where('category', $category)->get();
            $result = [];
            
            foreach ($settings as $setting) {
                $value = $setting->value;
                
                // Only decrypt if the setting is marked as encrypted and has a non-empty value
                if ($setting->is_encrypted && !empty($value)) {
                    try {
                        $value = Crypt::decrypt($value);
                    } catch (\Exception $e) {
                        // If decryption fails, use the raw value
                        $value = $setting->value;
                    }
                }
                
                $result[$setting->key] = match ($setting->type) {
                    self::TYPE_BOOLEAN => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                    self::TYPE_NUMBER => is_numeric($value) ? (float) $value : null,
                    self::TYPE_JSON => json_decode($value, true),
                    default => $value,
                };
            }
            
            return $result;
        });
    }

    /**
     * Clear settings cache
     */
    public static function clearCache(): void
    {
        $keys = static::pluck('key');
        
        foreach ($keys as $key) {
            Cache::forget("setting_{$key}");
        }
        
        // Clear category caches
        $categories = [self::CATEGORY_GENERAL, self::CATEGORY_COURSE, self::CATEGORY_PAYMENT, self::CATEGORY_NOTIFICATION];
        foreach ($categories as $category) {
            Cache::forget("settings_category_{$category}");
        }
    }

    /**
     * Get PayPal settings
     */
    public static function getPayPalSettings(): array
    {
        return [
            'client_id' => static::get('paypal_client_id'),
            'client_secret' => static::get('paypal_client_secret'),
            'mode' => static::get('paypal_mode', 'sandbox'),
            'webhook_id' => static::get('paypal_webhook_id'),
            'currency' => static::get('paypal_currency', 'USD'),
            'enabled' => static::get('paypal_enabled', true),
        ];
    }
    
    /**
     * Get email settings
     */
    public static function getEmailSettings(): array
    {
        return [
            'enabled' => static::get('email_notifications_enabled', true),
            'smtp_host' => static::get('smtp_host'),
            'smtp_port' => static::get('smtp_port', 587),
            'smtp_username' => static::get('smtp_username'),
            'smtp_password' => static::get('smtp_password'),
            'smtp_encryption' => static::get('smtp_encryption', 'tls'),
            'from_address' => static::get('mail_from_address'),
            'from_name' => static::get('mail_from_name', 'Learning Management System'),
            'types' => [
                'user_registration' => static::get('email_user_registration', true),
                'course_enrollment' => static::get('email_course_enrollment', true),
                'payment_confirmation' => static::get('email_payment_confirmation', true),
                'payment_refund' => static::get('email_payment_refund', true),
                'course_completion' => static::get('email_course_completion', true),
                'password_reset' => static::get('email_password_reset', true),
                'instructor_notifications' => static::get('email_instructor_notifications', true),
            ],
        ];
    }
    
    /**
     * Get Slack settings
     */
    public static function getSlackSettings(): array
    {
        return [
            'enabled' => static::get('slack_notifications_enabled', false),
            'webhook_url' => static::get('slack_webhook_url'),
            'types' => [
                'user_registration' => static::get('slack_user_registration', true),
                'course_submission' => static::get('slack_course_submission', true),
                'payment_transactions' => static::get('slack_payment_transactions', true),
                // These are intentionally fixed (not configurable in admin Slack settings).
                'system_errors' => true,
                'daily_reports' => false,
            ],
        ];
    }

    /**
     * Boot method to clear cache on model events
     */
    protected static function boot()
    {
        parent::boot();

        static::saved(function () {
            static::clearCache();
        });

        static::deleted(function () {
            static::clearCache();
        });
    }
}
