import { router } from '@inertiajs/react';
import { Globe, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionMessages } from '@/hooks/use-action-messages';
import { Combobox } from '@/components/ui/combobox';

interface Props {
    settings: Record<string, any>;
    timezones: string[];
}

export default function GeneralSettings({ settings, timezones }: Props) {
    const [formData, setFormData] = useState({
        site_name: settings.site_name || '',
        timezone: settings.timezone || 'UTC',
        pagination_limit: settings.pagination_limit || 10,
        footer_text: settings.footer_text || '',
    });

    // Update form data when settings props change (e.g. after a successful save)
    useEffect(() => {
        setFormData({
            site_name: settings.site_name || '',
            timezone: settings.timezone || 'UTC',
            pagination_limit: settings.pagination_limit || 10,
            footer_text: settings.footer_text || '',
        });
        setSiteLogoFile(null);
        setSiteFaviconFile(null);
    }, [settings]);
    const [siteLogoFile, setSiteLogoFile] = useState<File | null>(null);
    const [siteFaviconFile, setSiteFaviconFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const settingsMessages = useActionMessages('Settings');

    const siteLogoPreview = useMemo(() => {
        if (siteLogoFile) {
            return URL.createObjectURL(siteLogoFile);
        }

        return settings.site_logo || '';
    }, [settings.site_logo, siteLogoFile]);

    const siteFaviconPreview = useMemo(() => {
        if (siteFaviconFile) {
            return URL.createObjectURL(siteFaviconFile);
        }

        return settings.site_favicon || '';
    }, [settings.site_favicon, siteFaviconFile]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: [] }));
    };

    const handleFileChange = (
        field: 'site_logo' | 'site_favicon',
        file: File | null,
    ) => {
        if (field === 'site_logo') {
            setSiteLogoFile(file);
        } else {
            setSiteFaviconFile(file);
        }

        setErrors((prev) => ({ ...prev, [field]: [] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const payload = new FormData();
        payload.append('site_name', formData.site_name);
        payload.append('timezone', formData.timezone);
        payload.append('pagination_limit', String(formData.pagination_limit));
        payload.append('footer_text', formData.footer_text);

        if (siteLogoFile) {
            payload.append('site_logo', siteLogoFile);
        }

        if (siteFaviconFile) {
            payload.append('site_favicon', siteFaviconFile);
        }

        router.post('/admin/settings/general', payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];
                settingsMessages.error('save', 'Settings', typeof firstError === 'string' ? firstError : undefined);
                setErrors(err as any);
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    General Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="site_name">Site Name</Label>
                                <Input
                                    id="site_name"
                                    value={formData.site_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'site_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter site name"
                                />
                                {errors.site_name && (
                                    <p className="text-sm text-red-500">
                                        {errors.site_name[0]}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Combobox
                                    options={timezones.map((tz) => ({
                                        label: tz,
                                        value: tz,
                                    }))}
                                    value={formData.timezone}
                                    onChange={(val) =>
                                        handleInputChange('timezone', val)
                                    }
                                    placeholder="Select timezone"
                                    searchPlaceholder="Search timezone..."
                                />
                                {errors.timezone && (
                                    <p className="text-sm text-red-500">
                                        {errors.timezone[0]}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pagination_limit">
                                    Pagination Limit
                                </Label>
                                <Input
                                    id="pagination_limit"
                                    type="number"
                                    min="5"
                                    max="200"
                                    value={formData.pagination_limit}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'pagination_limit',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.pagination_limit && (
                                    <p className="text-sm text-red-500">
                                        {errors.pagination_limit[0]}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="footer_text">Footer Text</Label>
                                <Input
                                    id="footer_text"
                                    value={formData.footer_text}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'footer_text',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter footer text"
                                />
                                {errors.footer_text && (
                                    <p className="text-sm text-red-500">
                                        {errors.footer_text[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label>Site Logo</Label>
                                <div className="flex flex-col items-center gap-4 rounded-lg border bg-slate-50 p-4">
                                    {siteLogoPreview ? (
                                        <img
                                            src={siteLogoPreview}
                                            alt="Site Logo Preview"
                                            className="max-h-20 object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-full items-center justify-center rounded border border-dashed bg-white p-2 text-center text-xs text-slate-400">
                                            No logo uploaded
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileChange(
                                                'site_logo',
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="bg-white"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Max size: 5MB. Format: JPG, PNG, SVG,
                                        WebP
                                    </p>
                                    {errors.site_logo && (
                                        <p className="text-sm text-red-500">
                                            {errors.site_logo[0]}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Site Favicon</Label>
                                <div className="flex flex-col items-center gap-4 rounded-lg border bg-slate-50 p-4">
                                    {siteFaviconPreview ? (
                                        <img
                                            src={siteFaviconPreview}
                                            alt="Site Favicon Preview"
                                            className="h-10 w-10 object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-full items-center justify-center rounded border border-dashed bg-white text-center text-xs text-slate-400">
                                            No favicon uploaded
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*,.ico"
                                        onChange={(e) =>
                                            handleFileChange(
                                                'site_favicon',
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="bg-white"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Max size: 5MB. Format: ICO, PNG, SVG
                                    </p>
                                    {errors.site_favicon && (
                                        <p className="text-sm text-red-500">
                                            {errors.site_favicon[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Globe className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
