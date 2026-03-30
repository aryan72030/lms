import { Link } from '@inertiajs/react';
import { 
    BookOpen, 
    LayoutGrid, 
    Users, 
    FolderOpen, 
    GraduationCap, 
    BookOpenCheck, 
    UserCheck, 
    School, 
    Settings, 
    FileText, 
    HelpCircle, 
    LifeBuoy, 
    ClipboardList,
    Heart,
    Award,
    Compass,
    PieChart,
    Layers
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import type { NavItem } from '@/types';

interface NavGroup {
    label: string;
    items: NavItem[];
}

export function AppSidebar() {
    const { isAdmin, isInstructor, isStudent } = useAuth();
    
    const getDashboardUrl = () => {
        if (isAdmin) return '/admin/dashboard';
        if (isInstructor) return '/instructor/dashboard';
        if (isStudent) return '/student/dashboard';
        return '/';
    };
    
    // Grouped items for Student
    const studentGroups = [
        {
            label: "Main",
            items: [
                { title: 'Dashboard', href: '/student/dashboard', icon: LayoutGrid },
            ]
        },
        {
            label: "Learning",
            items: [
                { title: 'My Learning', href: '/student/enrollments', icon: School },
                { title: 'My Quizzes', href: '/student/quizzes', icon: ClipboardList },
                { title: 'Wishlist', href: '/student/wishlist', icon: Heart },
            ]
        },
        {
            label: "Achievements",
            items: [
                { title: 'Certificates', href: '/student/certificates', icon: Award },
            ]
        },
        {
            label: "Explore",
            items: [
                { title: 'Course Catalog', href: '/student/courses', icon: Compass },
            ]
        }
    ];

    const instructorGroups: NavGroup[] = [
        {
            label: "Overview",
            items: [
                { title: 'Dashboard', href: '/instructor/dashboard', icon: LayoutGrid },
            ]
        },
        {
            label: "Content Management",
            items: [
                { title: 'My Courses', href: '/instructor/courses', icon: GraduationCap },
                { title: 'Lesson Management', href: '/instructor/lessons', icon: FileText },
                { title: 'Quiz Management', href: '/instructor/quizzes', icon: HelpCircle },
                { title: 'Assignments', href: '/instructor/assignments', icon: ClipboardList },
            ]
        },
        {
            label: "Students & Sales",
            items: [
                { title: 'Student Enrollments', href: '/instructor/enrollments', icon: Users },
            ]
        }
    ];

    // Simple list for others (for now)
    const getOtherNavItems = (): NavItem[] => {
        const items: NavItem[] = [
            { title: 'Dashboard', href: getDashboardUrl(), icon: LayoutGrid },
        ];
        
        if (isAdmin) {
            items.push(
                { title: 'User Management', href: '/admin/users', icon: Users },
                { title: 'Course Categories', href: '/admin/course-categories', icon: FolderOpen },
                { title: 'Course Management', href: '/admin/courses', icon: BookOpenCheck },
                { title: 'Lesson Management', href: '/admin/lessons', icon: FileText },
                { title: 'Quiz Management', href: '/admin/quizzes', icon: HelpCircle },
                { title: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
                { title: 'Enrollment Management', href: '/admin/enrollments', icon: UserCheck },
                { title: 'System Settings', href: '/admin/settings', icon: Settings }
            );
        }
        
        return items;
    };

    const getFooterNavItems = (): NavItem[] => {
        if (isStudent) {
            return [
                { title: 'Help Center', href: '/settings/profile', icon: LifeBuoy },
            ];
        }
        return [
            { title: 'Documentation', href: 'https://laravel.com/docs', icon: BookOpen },
        ];
    };

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r-0 shadow-none">
            <SidebarHeader className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href={getDashboardUrl()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                {isStudent ? (
                    studentGroups.map((group) => (
                        <NavMain key={group.label} label={group.label} items={group.items} />
                    ))
                ) : isInstructor ? (
                    instructorGroups.map((group) => (
                        <NavMain key={group.label} label={group.label} items={group.items} />
                    ))
                ) : (
                    <NavMain label="Platform" items={getOtherNavItems()} />
                )}
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-slate-50">
                <NavFooter items={getFooterNavItems()} className="mb-4" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
