import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type PageProps = {
    auth: {
        user?: {
            role?: string;
        };
    };
};

export default function Dashboard() {
    const { props } = usePage<PageProps>();
    const role = props.auth?.user?.role || '';

    const rolePath =
        role === 'Admin'
            ? '/admin/dashboard'
            : role === 'Instructor'
              ? '/instructor/dashboard'
              : '/student/dashboard';

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <Card>
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Open your role-based dashboard.
                    </p>
                    <Button asChild>
                        <Link href={rolePath}>Go to my dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
