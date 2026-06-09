import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useRef } from 'react';
import { useNotification } from '@/contexts/notification-context';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { props: pageProps } = usePage<any>();
    const { showSuccess, showError, showInfo } = useNotification();
    const lastSuccessMessageRef = useRef<string | null>(null);

    useEffect(() => {
        console.log('AppLayout useEffect triggered. pageProps.flash:', pageProps.flash);
        if (pageProps.flash?.success && pageProps.flash?.success !== pageProps.errors?.[0]) {
            console.log('Flash success detected:', pageProps.flash.success);
            if (lastSuccessMessageRef.current !== pageProps.flash.success) {
                console.log('Calling showSuccess for:', pageProps.flash.success);
                showSuccess(pageProps.flash.success);
                lastSuccessMessageRef.current = pageProps.flash.success;
                pageProps.flash.success = null; // Clear flash to prevent double showing on next render
                console.log('Flash success cleared:', pageProps.flash.success);
            } else {
                console.log('Duplicate success message prevented:', pageProps.flash.success);
            }
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
        // if (pageProps.errors && Object.keys(pageProps.errors).length > 0) {
        //     const firstError = Object.values(pageProps.errors)[0] as string;
        //     showError(firstError, 'Validation Error');
        // }
    }, [pageProps.flash, pageProps.errors]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
};
