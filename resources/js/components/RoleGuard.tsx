import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
    children: ReactNode;
    roles: ('Admin' | 'Instructor' | 'Student')[];
    fallback?: ReactNode;
    requireAll?: boolean; // If true, user must have ALL roles (default: false - user needs ANY role)
}

export default function RoleGuard({
    children,
    roles,
    fallback = null,
    requireAll = false,
}: RoleGuardProps) {
    const { user, hasRole, hasAnyRole } = useAuth();

    // If user is not authenticated, don't render anything
    if (!user) {
        return <>{fallback}</>;
    }

    // Check if user has required role(s)
    const hasAccess = requireAll
        ? roles.every((role) => hasRole(role))
        : hasAnyRole(roles);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <RoleGuard roles={['Admin']} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}

export function InstructorOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <RoleGuard roles={['Instructor']} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}

export function StudentOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <RoleGuard roles={['Student']} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}

export function InstructorOrAdmin({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <RoleGuard roles={['Instructor', 'Admin']} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}

export function StudentOrAdmin({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <RoleGuard roles={['Student', 'Admin']} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}
