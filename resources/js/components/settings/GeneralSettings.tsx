import { router } from '@inertiajs/react';
import { Globe, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useActionMessages } from '@/hooks/use-action-messages';
import { Combobox } from '@/components/ui/combobox';

interface Props {
    settings: Record<string, any>;
    timezones: string[];
}

export default function GeneralSettings({ settings, timezones }: Props) {
    const [formData, setFormData] = useState({
        site_name: settings.site_name || '',
        site_description: settings.site_description || '',
        timezone: settings.timezone || 'UTC',
        pagination_limit: settings.pagination_limit || 10,
        footer_text: settings.footer_text || '',
    });

    // Update form data when settings props change (e.g. after a successful save)
    useEffect(() => {
        setFormData({
            site_name: settings.site_name || '',
            site_description: settings.site_description || '',
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

    const handleFileChange = (field: 'site_logo' | 'site_favicon', file: File | null) => {
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
        payload.append('site_description', formData.site_description);
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
                settingsMessages.success('save');
            },
            onError: (errors: any) => {
                setErrors(errors);
                settingsMessages.error('save');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        General Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="site_name">Site Name / Title *</Label>
                            <Input
                                id="site_name"
                                value={formData.site_name}
                                onChange={(e) => handleInputChange('site_name', e.target.value)}
                                placeholder="Enter site title"
                                className={errors.site_name?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                                required
                            />
                            {errors.site_name?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.site_name[0]}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone *</Label>
                            <Combobox
                                options={timezones.map((tz) => ({ label: tz, value: tz }))}
                                value={formData.timezone}
                                onChange={(value) => handleInputChange('timezone', value)}
                                placeholder="Select a timezone"
                                searchPlaceholder="Search timezone..."
                                emptyText="No timezone found."
                                className={errors.timezone?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                            />
                            {errors.timezone?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.timezone[0]}</p> : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="site_description">Site Description</Label>
                        <Input
                            id="site_description"
                            value={formData.site_description}
                            onChange={(e) => handleInputChange('site_description', e.target.value)}
                            placeholder="Short description for your LMS"
                            className={errors.site_description?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                        />
                        {errors.site_description?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.site_description[0]}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="site_logo">Site Logo</Label>
                        {siteLogoPreview ? (
                            <div className="rounded-md border bg-muted/20 p-4">
                                <img
                                    src={siteLogoPreview}
                                    alt="Site logo preview"
                                    className="h-16 w-auto max-w-full object-contain"
                                />
                            </div>
                        ) : null}
                        <Input
                            id="site_logo"
                            type="file"
                            accept=".jpg,.jpeg,.png,.svg,.webp"
                            onChange={(e) => handleFileChange('site_logo', e.target.files?.[0] || null)}
                            className={errors.site_logo?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                        />
                        <p className="text-xs text-muted-foreground">Upload a logo image instead of entering a URL.</p>
                        {errors.site_logo?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.site_logo[0]}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="site_favicon">Favicon Icon</Label>
                        {siteFaviconPreview ? (
                            <div className="rounded-md border bg-muted/20 p-4">
                                <img
                                    src={siteFaviconPreview}
                                    alt="Favicon preview"
                                    className="h-10 w-10 object-contain"
                                />
                            </div>
                        ) : null}
                        <Input
                            id="site_favicon"
                            type="file"
                            accept=".ico,.png,.svg,.webp"
                            onChange={(e) => handleFileChange('site_favicon', e.target.files?.[0] || null)}
                            className={errors.site_favicon?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                        />
                        <p className="text-xs text-muted-foreground">Upload an icon file for the browser tab favicon.</p>
                        {errors.site_favicon?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.site_favicon[0]}</p> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="pagination_limit">Pagination Limit (items per page) *</Label>
                            <Input
                                id="pagination_limit"
                                type="number"
                                min="5"
                                max="200"
                                value={formData.pagination_limit}
                                onChange={(e) => handleInputChange('pagination_limit', parseInt(e.target.value, 10) || 10)}
                                className={errors.pagination_limit?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                                required
                            />
                            {errors.pagination_limit?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.pagination_limit[0]}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="footer_text">Footer Text</Label>
                            <Input
                                id="footer_text"
                                value={formData.footer_text}
                                onChange={(e) => handleInputChange('footer_text', e.target.value)}
                                placeholder="All rights reserved."
                                className={errors.footer_text?.[0] ? 'border-red-500 ring-red-500/20' : ''}
                            />
                            {errors.footer_text?.[0] ? <p className="text-xs text-red-600 font-medium">{errors.footer_text[0]}</p> : null}
                        </div>
                    </div>


                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save General Settings
                </Button>
            </div>
        </form>
    );
}
