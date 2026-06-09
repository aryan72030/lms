import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useNotification } from '@/contexts/notification-context';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    const { props: pageProps } = usePage<any>();
    const { showSuccess, showError, showInfo } = useNotification();

    useEffect(() => {
        if (pageProps.flash?.success && pageProps.flash?.success !== pageProps.errors?.[0]) {
            showSuccess(pageProps.flash.success);
            pageProps.flash.success = null;
        }
        if (pageProps.flash?.error) {
            showError(pageProps.flash.error);
            pageProps.flash.error = null;
        }
        if (pageProps.flash?.info) {
            showInfo(pageProps.flash.info);
            pageProps.flash.info = null;
        }
        if (pageProps.flash?.warning) {
            showInfo(pageProps.flash.warning, 'Warning');
            pageProps.flash.warning = null;
        }

        // Show validation errors if any
        if (pageProps.errors && Object.keys(pageProps.errors).length > 0) {
            const firstError = Object.values(pageProps.errors)[0] as string;
            showError(firstError, 'Validation Error');
        }
    }, [pageProps.flash, pageProps.errors]);

    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
