import { Head } from '@inertiajs/react';
import { Settings, CreditCard, BookOpen, Bell, Globe } from 'lucide-react';
import { useState } from 'react';
import CourseSettings from '@/components/settings/CourseSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

interface Props {
    settings: {
        general: Record<string, any>;
        course: Record<string, any>;
        payment: Record<string, any>;
        notification: Record<string, any>;
    };
    timezones: string[];
}

export default function Index({ settings, timezones }: Props) {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'System Settings', href: '/admin/settings' },
            ]}
        >
            <Head title="System Settings" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">
                            System Settings
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your LMS system configuration
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="space-y-6"
                        >
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger
                                    value="general"
                                    className="flex items-center gap-2"
                                >
                                    <Globe className="h-4 w-4" />
                                    General
                                </TabsTrigger>
                                <TabsTrigger
                                    value="payment"
                                    className="flex items-center gap-2"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Payment
                                </TabsTrigger>
                                <TabsTrigger
                                    value="course"
                                    className="flex items-center gap-2"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Course
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notification"
                                    className="flex items-center gap-2"
                                >
                                    <Bell className="h-4 w-4" />
                                    Notification
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6">
                                <GeneralSettings
                                    settings={settings.general}
                                    timezones={timezones}
                                />
                            </TabsContent>

                            <TabsContent value="payment" className="space-y-6">
                                <PaymentSettings settings={settings.payment} />
                            </TabsContent>

                            <TabsContent value="course" className="space-y-6">
                                <CourseSettings settings={settings.course} />
                            </TabsContent>

                            <TabsContent
                                value="notification"
                                className="space-y-6"
                            >
                                <NotificationSettings
                                    settings={settings.notification}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
