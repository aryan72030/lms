import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    User,
    BookOpen,
    Calendar,
    CreditCard,
    Clock,
    CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';

interface Enrollment {
    id: number;
    student: {
        id: number;
        name: string;
        email: string;
    };
    course: {
        id: number;
        title: string;
        description: string;
        price: number | string | null;
        thumbnail: string | null;
        instructor: {
            id: number;
            name: string;
        };
        lessons: Array<{
            id: number;
            title: string;
            description: string;
            order: number;
            duration: number;
        }>;
    };
    enrollment_date: string;
    payment_status: string;
    payment_method: string;
    status: string;
    progress: number | string | null;
    completion_date: string | null;
    amount_paid: number | string | null;
    notes: string | null;
    transaction_id: string | null;
}

interface Props {
    enrollment: Enrollment;
}

export default function Show({ enrollment }: Props) {
    const getStatusBadge = (status: string) => {
        const variant = status === 'Active' ? 'default' : 'secondary';

        return <Badge variant={variant}>{status}</Badge>;
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const variants: Record<string, any> = {
            Free: 'secondary',
            Pending: 'outline',
            Completed: 'default',
            Failed: 'destructive',
        };

        return (
            <Badge variant={variants[paymentStatus] || 'secondary'}>
                {paymentStatus}
            </Badge>
        );
    };

    return (
        <AppLayout>
            <Head title={`Enrollment Details - ${enrollment.student.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/enrollments"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300"
                        aria-label="Back to Enrollments"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="page-title">
                            Enrollment Details
                        </h1>
                        <p className="text-muted-foreground">
                            {enrollment.student.name} enrolled in{' '}
                            {enrollment.course.title}
                        </p>
                    </div>
                    <Link href={`/admin/enrollments/${enrollment.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Enrollment
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Student Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Student Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Name
                                        </label>
                                        <p className="font-medium">
                                            {enrollment.student.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Email
                                        </label>
                                        <p className="font-medium">
                                            {enrollment.student.email}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Course Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {enrollment.course.thumbnail && (
                                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                                        <img
                                            src={enrollment.course.thumbnail}
                                            alt={enrollment.course.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {enrollment.course.title}
                                    </h3>
                                    <p className="mt-2 text-muted-foreground">
                                        {enrollment.course.description}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Instructor
                                        </label>
                                        <p className="font-medium">
                                            {enrollment.course.instructor.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Price
                                        </label>
                                        <p className="font-medium">
                                            {Number(
                                                enrollment.course.price || 0,
                                            ) > 0
                                                ? `$${Number(enrollment.course.price || 0).toFixed(2)}`
                                                : 'Free'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Lessons */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Course Lessons (
                                    {enrollment.course.lessons.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {enrollment.course.lessons.length > 0 ? (
                                    <div className="space-y-3">
                                        {enrollment.course.lessons.map(
                                            (lesson, index) => (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-center gap-4 rounded-lg border p-4"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="truncate font-medium">
                                                            {lesson.title}
                                                        </h4>
                                                        {lesson.description && (
                                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                                {
                                                                    lesson.description
                                                                }
                                                            </p>
                                                        )}
                                                        {lesson.duration && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {
                                                                    lesson.duration
                                                                }{' '}
                                                                minutes
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                        <p>No lessons available yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {enrollment.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {enrollment.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Enrollment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Enrollment Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    {getStatusBadge(enrollment.status)}
                                    {getPaymentStatusBadge(
                                        enrollment.payment_status,
                                    )}
                                </div>

                                {enrollment.progress != null && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Progress</span>
                                            <span className="font-medium">
                                                {Number(
                                                    enrollment.progress || 0,
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </div>
                                        <Progress
                                            value={Number(
                                                enrollment.progress || 0,
                                            )}
                                            className="h-2"
                                        />
                                        {enrollment.completion_date && (
                                            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Completed on{' '}
                                                {new Date(
                                                    enrollment.completion_date,
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Enrollment Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Enrollment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">
                                                Enrolled:
                                            </span>
                                            <span className="ml-2 font-medium">
                                                {new Date(
                                                    enrollment.enrollment_date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">
                                                Payment Method:
                                            </span>
                                            <span className="ml-2 font-medium">
                                                {enrollment.payment_method}
                                            </span>
                                        </div>
                                    </div>

                                    {enrollment.amount_paid && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                💰
                                            </span>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Amount Paid:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    $
                                                    {Number(
                                                        enrollment.amount_paid ||
                                                            0,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {enrollment.transaction_id && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                🔗
                                            </span>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Transaction ID:
                                                </span>
                                                <span className="ml-2 font-mono text-xs font-medium">
                                                    {enrollment.transaction_id}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link
                                    href={`/admin/enrollments/${enrollment.id}/edit`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Enrollment
                                    </Button>
                                </Link>
                                <Link
                                    href={`/admin/users/${enrollment.student.id}`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        View Student Profile
                                    </Button>
                                </Link>
                                <Link
                                    href={`/admin/courses/${enrollment.course.id}`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        View Course Details
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
