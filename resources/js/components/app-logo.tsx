import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { props } = usePage<{ appSettings?: { site_name?: string; site_logo?: string | null } }>();
    const siteName = props.appSettings?.site_name || 'Laravel Starter Kit';
    const siteLogo = props.appSettings?.site_logo;

    return (
        <>
            {siteLogo ? (
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <img src={siteLogo} alt={siteName} className="size-8 object-cover" />
                </div>
            ) : (
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                </div>
            )}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {siteName}
                </span>
            </div>
        </>
    );
}
