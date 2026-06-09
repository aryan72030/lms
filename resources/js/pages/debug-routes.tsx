import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import adminUsers from '@/routes/admin/users';

export default function DebugRoutes() {
    return (
        <AppLayout>
            <Head title="Debug Routes" />

            <div className="space-y-6">
                <h1 className="page-title">Debug Routes</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin User Routes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>
                                <strong>Index:</strong> {adminUsers.index.url()}
                            </p>
                            <p>
                                <strong>Create:</strong>{' '}
                                {adminUsers.create.url()}
                            </p>
                            <p>
                                <strong>Show (ID 1):</strong>{' '}
                                {adminUsers.show.url(1)}
                            </p>
                            <p>
                                <strong>Edit (ID 1):</strong>{' '}
                                {adminUsers.edit.url(1)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
