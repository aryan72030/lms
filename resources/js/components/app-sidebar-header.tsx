import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { isMobile, state } = useSidebar();
    const { props } = usePage();
    const { auth, appSettings } = props as any;
    const siteName = appSettings?.site_name || 'LMS';

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />

                    {/* Branding shown on mobile or when sidebar is collapsed/icon-only */}
                    {(isMobile || state === 'collapsed') && (
                        <Link href="/" className="mr-2 flex items-center gap-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                            </div>
                            <span className="hidden truncate text-sm font-semibold sm:inline-block">
                                {siteName}
                            </span>
                        </Link>
                    )}

                    <div className="mx-1 hidden h-4 w-px bg-sidebar-border/50 sm:block" />

                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>

                {/* User Profile Menu in Header */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="h-10 px-2 text-sidebar-accent-foreground hover:bg-sidebar-accent focus-visible:ring-0"
                            >
                                <UserInfo user={auth.user} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 rounded-lg"
                            align="end"
                            sideOffset={4}
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
