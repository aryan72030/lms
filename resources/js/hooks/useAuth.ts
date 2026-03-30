import { usePage } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Instructor' | 'Student';
    email_verified_at: string | null;
    is_admin: boolean;
    is_instructor: boolean;
    is_student: boolean;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    [key: string]: any;
}

export function useAuth() {
    const { auth } = usePage<PageProps>().props;
    
    return {
        user: auth.user,
        isAuthenticated: !!auth.user,
        isAdmin: auth.user?.is_admin ?? false,
        isInstructor: auth.user?.is_instructor ?? false,
        isStudent: auth.user?.is_student ?? false,
        hasRole: (role: 'Admin' | 'Instructor' | 'Student') => auth.user?.role === role,
        hasAnyRole: (roles: ('Admin' | 'Instructor' | 'Student')[]) => 
            auth.user ? roles.includes(auth.user.role) : false,
    };
}

export function useRoleGuard() {
    const { isAdmin, isInstructor, isStudent, hasRole, hasAnyRole } = useAuth();
    
    return {
        canAccessAdmin: isAdmin,
        canAccessInstructor: isInstructor || isAdmin, // Admin can access instructor features
        canAccessStudent: isStudent || isAdmin, // Admin can access student features
        canManageUsers: isAdmin,
        canManageCourses: isAdmin,
        canCreateCourse: isInstructor || isAdmin,
        canEditOwnCourse: isInstructor || isAdmin,
        canEnrollInCourse: isStudent,
        canViewOwnData: true, // All users can view their own data
        hasRole,
        hasAnyRole,
    };
}