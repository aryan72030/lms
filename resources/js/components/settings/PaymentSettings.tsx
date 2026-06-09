import { router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    Loader2,
    TestTube,
    CreditCard,
    DollarSign,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Props {
    settings: Record<string, any>;
}

export default function PaymentSettings({ settings }: Props) {
    const [formData, setFormData] = useState({
        paypal_client_id: settings.paypal_client_id || '',
        paypal_client_secret: settings.paypal_client_secret || '',
        paypal_mode: settings.paypal_mode || 'sandbox',
        paypal_webhook_id: settings.paypal_webhook_id || '',
        paypal_currency: settings.paypal_currency || 'USD',
        paypal_enabled: settings.paypal_enabled ?? true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const settingsMessages = useActionMessages('Payment settings');

    const currencies = [
        { value: 'USD', label: 'US Dollar (USD)' },
        { value: 'EUR', label: 'Euro (EUR)' },
        { value: 'GBP', label: 'British Pound (GBP)' },
        { value: 'CAD', label: 'Canadian Dollar (CAD)' },
        { value: 'AUD', label: 'Australian Dollar (AUD)' },
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setTestResult(null);
    };

    const testPayPalConnection = async () => {
        if (!formData.paypal_client_id || !formData.paypal_client_secret) {
            setTestResult({
                success: false,
                message:
                    'Please enter PayPal Client ID and Client Secret first.',
            });

            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/admin/settings/test-paypal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    client_id: formData.paypal_client_id,
                    client_secret: formData.paypal_client_secret,
                    mode: formData.paypal_mode,
                }),
            });

            const data = await response.json();
            setTestResult({
                success: data.success,
                message: data.message,
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Connection test failed. Please try again.',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        router.post('/admin/settings/payment', formData, {
            preserveScroll: true,
            onSuccess: () => {
            },
            onError: () => {
                settingsMessages.error('save');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* PayPal Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        PayPal Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable PayPal Payments</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow students to pay for courses using PayPal
                            </p>
                        </div>
                        <Switch
                            checked={formData.paypal_enabled}
                            onCheckedChange={(checked) =>
                                handleInputChange('paypal_enabled', checked)
                            }
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="paypal_client_id">
                                PayPal Client ID{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="paypal_client_id"
                                type="text"
                                value={formData.paypal_client_id}
                                onChange={(e) =>
                                    handleInputChange(
                                        'paypal_client_id',
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter PayPal Client ID"
                                disabled={!formData.paypal_enabled}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paypal_client_secret">
                                PayPal Client Secret{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="paypal_client_secret"
                                type="password"
                                value={formData.paypal_client_secret}
                                onChange={(e) =>
                                    handleInputChange(
                                        'paypal_client_secret',
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter PayPal Client Secret"
                                disabled={!formData.paypal_enabled}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="paypal_mode">PayPal Mode</Label>
                            <Select
                                value={formData.paypal_mode}
                                onValueChange={(value) =>
                                    handleInputChange('paypal_mode', value)
                                }
                                disabled={!formData.paypal_enabled}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">
                                        Sandbox (Testing)
                                    </SelectItem>
                                    <SelectItem value="live">
                                        Live (Production)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paypal_currency">Currency</Label>
                            <Select
                                value={formData.paypal_currency}
                                onValueChange={(value) =>
                                    handleInputChange('paypal_currency', value)
                                }
                                disabled={!formData.paypal_enabled}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem
                                            key={currency.value}
                                            value={currency.value}
                                        >
                                            {currency.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paypal_webhook_id">
                            PayPal Webhook ID (Optional)
                        </Label>
                        <Input
                            id="paypal_webhook_id"
                            type="text"
                            value={formData.paypal_webhook_id}
                            onChange={(e) =>
                                handleInputChange(
                                    'paypal_webhook_id',
                                    e.target.value,
                                )
                            }
                            placeholder="Enter PayPal Webhook ID"
                            disabled={!formData.paypal_enabled}
                        />
                        <p className="text-sm text-muted-foreground">
                            Used for real-time payment notifications. Configure
                            in your PayPal Developer Dashboard.
                        </p>
                    </div>

                    {/* Test Connection */}
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={testPayPalConnection}
                            disabled={isTesting || !formData.paypal_enabled}
                        >
                            {isTesting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Test Connection
                        </Button>

                        {testResult && (
                            <div
                                className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {testResult.success ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <span className="text-sm">
                                    {testResult.message}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Payment Settings
                </Button>
            </div>
        </form>
    );
}
