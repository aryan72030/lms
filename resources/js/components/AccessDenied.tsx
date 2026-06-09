import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AccessDeniedProps {
    message?: string;
    showBackButton?: boolean;
}

export default function AccessDenied({
    message = 'You do not have permission to access this resource.',
    showBackButton = true,
}: AccessDeniedProps) {
    const { user } = useAuth();

    const handleGoBack = () => {
        // Redirect to appropriate dashboard based on role
        if (user?.is_admin) {
            router.visit('/admin/dashboard');
        } else if (user?.is_instructor) {
            router.visit('/instructor/dashboard');
        } else if (user?.is_student) {
            router.visit('/student/dashboard');
        } else {
            router.visit('/');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <h1 className="page-title mt-6 text-gray-900">
                    Access Denied
                </h1>

                <p className="mt-4 text-gray-600">{message}</p>

                {user && (
                    <p className="mt-2 text-sm text-gray-500">
                        You are logged in as:{' '}
                        <span className="font-medium">{user.name}</span> (
                        {user.role})
                    </p>
                )}

                {showBackButton && (
                    <div className="mt-8">
                        <Button
                            onClick={handleGoBack}
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
