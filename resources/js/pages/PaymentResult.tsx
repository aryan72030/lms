import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowLeft,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Props {
    success: boolean;
    message: string;
    course?: {
        id: number;
        title: string;
        slug: string;
    };
    enrollment_id?: number;
    payment_amount?: number;
    cancelled?: boolean;
}

export default function PaymentResult({
    success,
    message,
    course,
    enrollment_id,
    payment_amount,
    cancelled,
}: Props) {
    const getIcon = () => {
        if (success) {
            return <CheckCircle className="h-16 w-16 text-green-500" />;
        } else if (cancelled) {
            return <AlertCircle className="h-16 w-16 text-yellow-500" />;
        } else {
            return <XCircle className="h-16 w-16 text-red-500" />;
        }
    };

    const getTitle = () => {
        if (success) {
            return 'Payment Successful!';
        } else if (cancelled) {
            return 'Payment Cancelled';
        } else {
            return 'Payment Failed';
        }
    };

    const getCardColor = () => {
        if (success) {
            return 'border-green-200 bg-green-50';
        } else if (cancelled) {
            return 'border-yellow-200 bg-yellow-50';
        } else {
            return 'border-red-200 bg-red-50';
        }
    };

    return (
        <AppLayout>
            <Head title={getTitle()} />

            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card className={`text-center ${getCardColor()}`}>
                        <CardHeader className="pb-4">
                            <div className="mb-4 flex justify-center">
                                {getIcon()}
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {getTitle()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-lg text-muted-foreground">
                                {message}
                            </p>

                            {success && course && (
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-white p-4">
                                        <h3 className="mb-2 text-lg font-semibold">
                                            Course Details
                                        </h3>
                                        <p className="mb-2 text-muted-foreground">
                                            {course.title}
                                        </p>
                                        {payment_amount && (
                                            <p className="text-sm text-muted-foreground">
                                                Amount Paid:{' '}
                                                <span className="font-semibold">
                                                    ${payment_amount}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {success && enrollment_id ? (
                                    <>
                                        <Link
                                            href={`/student/enrollments/${enrollment_id}`}
                                        >
                                            <Button
                                                className="w-full"
                                                size="lg"
                                            >
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                Start Learning
                                            </Button>
                                        </Link>
                                        <Link href="/student/enrollments">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                View My Enrollments
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/student/courses">
                                            <Button
                                                className="w-full"
                                                size="lg"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" />
                                                Browse Courses
                                            </Button>
                                        </Link>
                                        {!success && !cancelled && (
                                            <Link href="/student/enrollments">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    View My Enrollments
                                                </Button>
                                            </Link>
                                        )}
                                    </>
                                )}

                                <Link href="/student/dashboard">
                                    <Button variant="ghost" className="w-full">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            </div>

                            {success && (
                                <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                                    <p className="mb-1 font-semibold">
                                        What's Next?
                                    </p>
                                    <ul className="space-y-1 text-left">
                                        <li>
                                            • Access all course lessons
                                            immediately
                                        </li>
                                        <li>
                                            • Track your progress as you learn
                                        </li>
                                        <li>
                                            • Complete quizzes and assignments
                                        </li>
                                        <li>
                                            • Earn your certificate upon
                                            completion
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {!success && !cancelled && (
                                <div className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                                    <p className="mb-1 font-semibold">
                                        Need Help?
                                    </p>
                                    <p>
                                        If you continue to experience issues,
                                        please contact our support team.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
