import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, User, BookOpen, Calendar, CreditCard, Clock, CheckCircle } from 'lucide-react';
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
            'Free': 'secondary',
            'Pending': 'outline',
            'Completed': 'default',
            'Failed': 'destructive',
        };

        return <Badge variant={variants[paymentStatus] || 'secondary'}>{paymentStatus}</Badge>;
    };

    return (
        <AppLayout>
            <Head title={`Enrollment Details - ${enrollment.student.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/enrollments">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Enrollments
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Enrollment Details</h1>
                        <p className="text-muted-foreground">
                            {enrollment.student.name} enrolled in {enrollment.course.title}
                        </p>
                    </div>
                    <Link href={`/admin/enrollments/${enrollment.id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Enrollment
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Student Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Student Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                                        <p className="font-medium">{enrollment.student.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                                        <p className="font-medium">{enrollment.student.email}</p>
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
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={enrollment.course.thumbnail}
                                            alt={enrollment.course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">{enrollment.course.title}</h3>
                                    <p className="text-muted-foreground mt-2">{enrollment.course.description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Instructor</label>
                                        <p className="font-medium">{enrollment.course.instructor.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Price</label>
                                        <p className="font-medium">
                                            {Number(enrollment.course.price || 0) > 0 
                                                ? `$${Number(enrollment.course.price || 0).toFixed(2)}` 
                                                : 'Free'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Lessons */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Lessons ({enrollment.course.lessons.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {enrollment.course.lessons.length > 0 ? (
                                    <div className="space-y-3">
                                        {enrollment.course.lessons.map((lesson, index) => (
                                            <div
                                                key={lesson.id}
                                                className="flex items-center gap-4 p-4 border rounded-lg"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{lesson.title}</h4>
                                                    {lesson.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {lesson.description}
                                                        </p>
                                                    )}
                                                    {lesson.duration && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            {lesson.duration} minutes
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                                    <p className="text-muted-foreground">{enrollment.notes}</p>
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
                                    {getPaymentStatusBadge(enrollment.payment_status)}
                                </div>

                                {enrollment.progress != null && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Progress</span>
                                            <span className="font-medium">{Number(enrollment.progress || 0).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={Number(enrollment.progress || 0)} className="h-2" />
                                        {enrollment.completion_date && (
                                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                                <CheckCircle className="h-4 w-4" />
                                                Completed on {new Date(enrollment.completion_date).toLocaleDateString()}
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
                                            <span className="text-muted-foreground">Enrolled:</span>
                                            <span className="ml-2 font-medium">
                                                {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">Payment Method:</span>
                                            <span className="ml-2 font-medium">{enrollment.payment_method}</span>
                                        </div>
                                    </div>

                                    {enrollment.amount_paid && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">💰</span>
                                            <div>
                                                <span className="text-muted-foreground">Amount Paid:</span>
                                                <span className="ml-2 font-medium">
                                                    ${Number(enrollment.amount_paid || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {enrollment.transaction_id && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">🔗</span>
                                            <div>
                                                <span className="text-muted-foreground">Transaction ID:</span>
                                                <span className="ml-2 font-medium font-mono text-xs">
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
                                <Link href={`/admin/enrollments/${enrollment.id}/edit`} className="block">
                                    <Button variant="outline" className="w-full">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Enrollment
                                    </Button>
                                </Link>
                                <Link href={`/admin/users/${enrollment.student.id}`} className="block">
                                    <Button variant="outline" className="w-full">
                                        <User className="h-4 w-4 mr-2" />
                                        View Student Profile
                                    </Button>
                                </Link>
                                <Link href={`/admin/courses/${enrollment.course.id}`} className="block">
                                    <Button variant="outline" className="w-full">
                                        <BookOpen className="h-4 w-4 mr-2" />
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