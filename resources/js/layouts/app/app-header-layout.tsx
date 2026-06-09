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
            <AppContent variant="header" className="flex min-h-screen flex-col">
                <div className="flex-1 px-4 py-6">{children}</div>
                <footer className="mx-auto w-full max-w-7xl border-t border-gray-50 px-4 py-4 text-xs text-muted-foreground">
                    {footerText}
                </footer>
            </AppContent>
        </AppShell>
    );
}
