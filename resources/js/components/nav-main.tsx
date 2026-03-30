import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

interface NavGroupProps {
    label?: string;
    items: NavItem[];
}

export function NavMain({ label = "Platform", items = [] }: NavGroupProps) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-2">
            {label && <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-4">{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="rounded-xl h-10 px-4 transition-all duration-200 hover:bg-slate-100 active:scale-95 data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-600 data-[active=true]:font-bold"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon className="h-5 w-5" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

