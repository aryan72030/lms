import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    const { props } = usePage<{ appSettings?: { footer_text?: string } }>();
    const footerText = props.appSettings?.footer_text || 'All rights reserved.';

    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header" className="flex flex-col min-h-screen">
                <div className="px-4 py-6 flex-1">
                    {children}
                </div>
                <footer className="px-4 py-4 text-xs text-muted-foreground border-t border-gray-50 max-w-7xl mx-auto w-full">
                    {footerText}
                </footer>
            </AppContent>
        </AppShell>
    );
}
