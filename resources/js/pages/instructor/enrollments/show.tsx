import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, BookOpen, Calendar, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';

interface LessonProgress {
    lesson_id: number;
    lesson_title: string;
    completed_at: string | null;
    is_completed: boolean;
}

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
        price: number | string | null;
        duration_hours: number;
    };
    enrollment_date: string;
    payment_status: string;
    payment_status_label: string;
    payment_status_color: string;
    status: string;
    status_label: string;
    status_color: string;
    progress: number | string | null;
    completion_date: string | null;
    amount: number | string | null;
    created_at: string;
    updated_at: string;
    lesson_progress: LessonProgress[];
}

interface Props {
    enrollment: Enrollment;
}

export default function Show({ enrollment }: Props) {
    return (
        <AppLayout>
            <Head title={`Enrollment Details - ${enrollment.student.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/instructor/enrollments">
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
                                <div>
                                    <h3 className="text-lg font-semibold">{enrollment.course.title}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Price</label>
                                        <p className="font-medium">
                                            {Number(enrollment.course.price || 0) > 0 
                                                ? `$${Number(enrollment.course.price || 0).toFixed(2)}` 
                                                : 'Free'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Duration</label>
                                        <p className="font-medium">{enrollment.course.duration_hours} Hours</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lesson Progress */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lesson Progress ({enrollment.lesson_progress.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {enrollment.lesson_progress.length > 0 ? (
                                    <div className="space-y-3">
                                        {enrollment.lesson_progress.map((progress, index) => (
                                            <div
                                                key={progress.lesson_id}
                                                className="flex items-center gap-4 p-4 border rounded-lg"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${progress.is_completed ? 'bg-green-100 text-green-700' : 'bg-primary/10'}`}>
                                                        {progress.is_completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{progress.lesson_title}</h4>
                                                    {progress.is_completed && progress.completed_at && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Completed on {progress.completed_at}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Badge variant={progress.is_completed ? 'default' : 'secondary'}>
                                                        {progress.is_completed ? 'Completed' : 'In Progress'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No lesson progress recorded yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Enrollment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Enrollment Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge className={enrollment.status_color}>
                                        {enrollment.status_label}
                                    </Badge>
                                    <Badge className={enrollment.payment_status_color}>
                                        {enrollment.payment_status_label}
                                    </Badge>
                                </div>

                                {enrollment.progress != null && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Progress</span>
                                            <span className="font-medium">{Number(enrollment.progress || 0).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={Number(enrollment.progress || 0)} className="h-2" />
                                        {enrollment.completion_date && (
                                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium mt-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Completed on {enrollment.completion_date}
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
                                                {enrollment.enrollment_date}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {enrollment.amount !== null && (
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <span className="text-muted-foreground">Amount Paid:</span>
                                                <span className="ml-2 font-medium">
                                                    ${Number(enrollment.amount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">Last Updated:</span>
                                            <span className="ml-2 font-medium">{enrollment.updated_at}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href={`/instructor/courses/${enrollment.course.id}/edit`} className="block">
                                    <Button variant="outline" className="w-full">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Edit Course
                                    </Button>
                                </Link>
                                <a href={`mailto:${enrollment.student.email}`} className="block">
                                    <Button variant="outline" className="w-full">
                                        <User className="h-4 w-4 mr-2" />
                                        Contact Student
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
