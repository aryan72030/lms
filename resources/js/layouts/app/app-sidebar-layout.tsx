import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { props } = usePage<{ appSettings?: { footer_text?: string } }>();
    const footerText = props.appSettings?.footer_text || 'All rights reserved.';

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="flex min-h-screen flex-col overflow-x-hidden"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 px-6 py-6 md:px-4">{children}</div>
                <footer className="border-t border-gray-50 px-6 py-4 text-xs text-muted-foreground md:px-4">
                    {footerText}
                </footer>
            </AppContent>
        </AppShell>
    );
}
