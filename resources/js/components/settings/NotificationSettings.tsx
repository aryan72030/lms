import { router } from '@inertiajs/react';
import {
    Bell,
    Mail,
    MessageSquare,
    Send,
    TestTube,
    Eye,
    EyeOff,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Props {
    settings: Record<string, any>;
}

export default function NotificationSettings({ settings }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTestingEmail, setIsTestingEmail] = useState(false);
    const [isTestingSlack, setIsTestingSlack] = useState(false);
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showSlackWebhook, setShowSlackWebhook] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const notificationMessages = useActionMessages('Notification settings');

    const [formData, setFormData] = useState({
        // Email Settings
        email_notifications_enabled:
            settings.email_notifications_enabled ?? true,
        smtp_host: settings.smtp_host ?? '',
        smtp_port: settings.smtp_port ?? 587,
        smtp_username: settings.smtp_username ?? '',
        smtp_password: settings.smtp_password ?? '',
        smtp_encryption: settings.smtp_encryption ?? 'tls',
        mail_from_address: settings.mail_from_address ?? '',
        mail_from_name: settings.mail_from_name ?? 'Learning Management System',

        // Email Notification Types
        email_user_registration: settings.email_user_registration ?? true,
        email_course_enrollment: settings.email_course_enrollment ?? true,
        email_payment_confirmation: settings.email_payment_confirmation ?? true,
        email_payment_refund: settings.email_payment_refund ?? true,
        email_course_completion: settings.email_course_completion ?? true,
        email_password_reset: settings.email_password_reset ?? true,
        email_instructor_notifications:
            settings.email_instructor_notifications ?? true,

        // Slack Settings
        slack_notifications_enabled:
            settings.slack_notifications_enabled ?? false,
        slack_webhook_url: settings.slack_webhook_url ?? '',

        // Slack Notification Types
        slack_user_registration: settings.slack_user_registration ?? true,
        slack_course_submission: settings.slack_course_submission ?? true,
        slack_payment_transactions: settings.slack_payment_transactions ?? true,
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        router.post('/admin/settings/notification', formData, {
            preserveScroll: true,
            onSuccess: () => {
            },
            onError: () => {
                notificationMessages.error('save');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            notificationMessages.error('test', 'Email test');

            return;
        }

        if (
            !formData.smtp_host ||
            !formData.smtp_port ||
            !formData.smtp_username ||
            !formData.smtp_password ||
            !formData.mail_from_address
        ) {
            notificationMessages.error('test', 'Email test');

            return;
        }

        setIsTestingEmail(true);

        try {
            const response = await fetch('/admin/settings/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    smtp_host: formData.smtp_host,
                    smtp_port: formData.smtp_port,
                    smtp_username: formData.smtp_username,
                    smtp_password: formData.smtp_password,
                    smtp_encryption: formData.smtp_encryption,
                    mail_from_address: formData.mail_from_address,
                    mail_from_name: formData.mail_from_name,
                    test_email: testEmail,
                }),
            });

            const result = await response.json();

            if (result.success) {
                notificationMessages.success('test', 'Email test');
            } else {
                notificationMessages.error('test', 'Email test');
            }
        } catch (error) {
            notificationMessages.error('test', 'Email test');
        } finally {
            setIsTestingEmail(false);
        }
    };

    const handleTestSlack = async () => {
        if (!formData.slack_webhook_url) {
            notificationMessages.error('test', 'Slack test');

            return;
        }

        setIsTestingSlack(true);

        try {
            const response = await fetch('/admin/settings/test-slack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    webhook_url: formData.slack_webhook_url,
                }),
            });

            const result = await response.json();

            if (result.success) {
                notificationMessages.success('test', 'Slack test');
            } else {
                notificationMessages.error('test', 'Slack test');
            }
        } catch (error) {
            notificationMessages.error('test', 'Slack test');
        } finally {
            setIsTestingSlack(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable Email Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">
                                Enable Email Notifications
                            </Label>
                            <div className="text-sm text-muted-foreground">
                                Turn on/off all email notifications
                            </div>
                        </div>
                        <Switch
                            checked={formData.email_notifications_enabled}
                            onCheckedChange={(checked) =>
                                handleInputChange(
                                    'email_notifications_enabled',
                                    checked,
                                )
                            }
                        />
                    </div>

                    <Separator />

                    {/* SMTP Configuration */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium">
                            SMTP Configuration
                        </h4>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtp_host">
                                    SMTP Host{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="smtp_host"
                                    value={formData.smtp_host}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'smtp_host',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="smtp.gmail.com"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_port">
                                    SMTP Port{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="smtp_port"
                                    type="number"
                                    value={formData.smtp_port}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'smtp_port',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    placeholder="587"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_username">
                                    SMTP Username{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="smtp_username"
                                    value={formData.smtp_username}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'smtp_username',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="your-email@gmail.com"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_password">
                                    SMTP Password{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="smtp_password"
                                        type={
                                            showSmtpPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={formData.smtp_password}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'smtp_password',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Your app password"
                                        disabled={
                                            !formData.email_notifications_enabled
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() =>
                                            setShowSmtpPassword(
                                                !showSmtpPassword,
                                            )
                                        }
                                        disabled={
                                            !formData.email_notifications_enabled
                                        }
                                    >
                                        {showSmtpPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtp_encryption">
                                    Encryption
                                </Label>
                                <select
                                    id="smtp_encryption"
                                    value={formData.smtp_encryption}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'smtp_encryption',
                                            e.target.value,
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                >
                                    <option value="tls">TLS</option>
                                    <option value="ssl">SSL</option>
                                    <option value="none">None</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_from_address">
                                    From Email Address{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="mail_from_address"
                                    type="email"
                                    value={formData.mail_from_address}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'mail_from_address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="noreply@yourdomain.com"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mail_from_name">
                                    From Name
                                </Label>
                                <Input
                                    id="mail_from_name"
                                    value={formData.mail_from_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'mail_from_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Learning Management System"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>
                        </div>

                        {/* Test Email */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="test_email">
                                    Test Email Address
                                </Label>
                                <Input
                                    id="test_email"
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) =>
                                        setTestEmail(e.target.value)
                                    }
                                    placeholder="test@example.com"
                                    disabled={
                                        !formData.email_notifications_enabled
                                    }
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestEmail}
                                disabled={
                                    isTestingEmail ||
                                    !formData.email_notifications_enabled
                                }
                            >
                                {isTestingEmail ? (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                ) : (
                                    <TestTube className="mr-2 h-4 w-4" />
                                )}
                                Test Email
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Email Notification Types */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium">
                            Email Notification Types
                        </h4>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                {
                                    key: 'email_user_registration',
                                    label: 'User Registration',
                                    desc: 'Send welcome emails to new users',
                                },
                                {
                                    key: 'email_course_enrollment',
                                    label: 'Course Enrollment',
                                    desc: 'Notify students when they enroll in courses',
                                },
                                {
                                    key: 'email_payment_confirmation',
                                    label: 'Payment Confirmation',
                                    desc: 'Send payment receipts and confirmations',
                                },
                                {
                                    key: 'email_payment_refund',
                                    label: 'Payment Refund',
                                    desc: 'Notify students when their payment is refunded',
                                },
                                {
                                    key: 'email_course_completion',
                                    label: 'Course Completion',
                                    desc: 'Send certificates and completion notifications',
                                },
                                {
                                    key: 'email_password_reset',
                                    label: 'Password Reset',
                                    desc: 'Send password reset links',
                                },
                                {
                                    key: 'email_instructor_notifications',
                                    label: 'Instructor Notifications',
                                    desc: 'Notify instructors about course activities',
                                },
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">
                                            {item.label}
                                        </Label>
                                        <div className="text-xs text-muted-foreground">
                                            {item.desc}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={
                                            formData[
                                                item.key as keyof typeof formData
                                            ] as boolean
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(item.key, checked)
                                        }
                                        disabled={
                                            !formData.email_notifications_enabled
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Slack Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Slack Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable Slack Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">
                                Enable Slack Notifications
                            </Label>
                            <div className="text-sm text-muted-foreground">
                                Send notifications to your Slack workspace
                            </div>
                        </div>
                        <Switch
                            checked={formData.slack_notifications_enabled}
                            onCheckedChange={(checked) =>
                                handleInputChange(
                                    'slack_notifications_enabled',
                                    checked,
                                )
                            }
                        />
                    </div>

                    <Separator />

                    {/* Slack Configuration */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium">
                            Slack Configuration
                        </h4>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="slack_webhook_url">
                                    Webhook URL{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="slack_webhook_url"
                                        type={
                                            showSlackWebhook
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={formData.slack_webhook_url}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'slack_webhook_url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="https://hooks.slack.com/services/..."
                                        disabled={
                                            !formData.slack_notifications_enabled
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() =>
                                            setShowSlackWebhook(
                                                !showSlackWebhook,
                                            )
                                        }
                                        disabled={
                                            !formData.slack_notifications_enabled
                                        }
                                    >
                                        {showSlackWebhook ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Create a webhook URL in your Slack workspace
                                    settings
                                </div>
                            </div>

                            {/* Test Slack */}
                            <div className="flex justify-start">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestSlack}
                                    disabled={
                                        isTestingSlack ||
                                        !formData.slack_notifications_enabled
                                    }
                                >
                                    {isTestingSlack ? (
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
                                    ) : (
                                        <TestTube className="mr-2 h-4 w-4" />
                                    )}
                                    Test Slack
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Slack Notification Types */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium">
                            Slack Notification Types
                        </h4>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                {
                                    key: 'slack_user_registration',
                                    label: 'User Registration',
                                    desc: 'Notify when new users register',
                                },
                                {
                                    key: 'slack_course_submission',
                                    label: 'Course Submission',
                                    desc: 'Notify when courses are submitted for review',
                                },
                                {
                                    key: 'slack_payment_transactions',
                                    label: 'Payment Transactions',
                                    desc: 'Notify about payment activities',
                                },
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">
                                            {item.label}
                                        </Label>
                                        <div className="text-xs text-muted-foreground">
                                            {item.desc}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={
                                            formData[
                                                item.key as keyof typeof formData
                                            ] as boolean
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(item.key, checked)
                                        }
                                        disabled={
                                            !formData.slack_notifications_enabled
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Save Notification Settings
                </Button>
            </div>
        </form>
    );
}
