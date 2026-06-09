import { router } from '@inertiajs/react';
import {
    Loader2,
    CreditCard,
    BookOpen,
    CheckCircle,
    Clock,
    AlertCircle,
    PlayCircle,
    RotateCcw,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useActionMessages } from '@/hooks/use-action-messages';
import { cn } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    price: number;
    status: string;
}

interface Enrollment {
    id: number;
    payment_status: string;
    status: string;
    progress: number | string | null;
    completion_date: string | null;
    expiry_date?: string | null;
    is_expired?: boolean;
}

interface Props {
    course: Course;
    user?: {
        id: number;
        role: string;
    };
    className?: string;
    variant?: 'default' | 'simple';
    initialEnrollment?: Enrollment | null;
}

export default function EnrollmentButton({
    course,
    user,
    className = '',
    variant = 'default',
    initialEnrollment = null,
}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(
        initialEnrollment,
    );
    const [canEnroll, setCanEnroll] = useState(!initialEnrollment);
    const [checkingEnrollment, setCheckingEnrollment] =
        useState(!initialEnrollment);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const enrollmentMessages = useActionMessages('Enrollment');

    const checkEnrollmentStatus = useCallback(async () => {
        if (initialEnrollment) return;

        try {
            const response = await fetch('/student/check-enrollment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ course_id: course.id }),
            });

            const data = await response.json();
            setCanEnroll(data.can_enroll);
            setEnrollment(data.enrollment);
        } finally {
            setCheckingEnrollment(false);
        }
    }, [course.id, initialEnrollment]);

    // Check enrollment status on component mount
    useEffect(() => {
        if (user && user.role === 'Student') {
            checkEnrollmentStatus();
        } else {
            setCheckingEnrollment(false);
        }
    }, [user, checkEnrollmentStatus]);

    const handleEnrollment = () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (user.role !== 'Student') {
            enrollmentMessages.error('create', 'Enrollment');
            return;
        }

        setIsLoading(true);

        router.post(
            '/student/enrollments',
            { course_id: course.id },
            {
                onFinish: () => setIsLoading(false),
                onError: (errors) => enrollmentMessages.error('create', 'Enrollment', errors),
            },
        );
    };

    const handleCancelEnrollment = async () => {
        if (!enrollment || enrollment.payment_status !== 'Pending') {
            return;
        }

        setIsLoading(true);
        setShowCancelModal(false);

        router.patch(`/student/enrollments/${enrollment.id}/cancel`, {}, {
            onFinish: () => {
                setIsLoading(false);
                checkEnrollmentStatus();
            },
            onError: (errors) => enrollmentMessages.error('cancel', 'Enrollment', errors),
        });
    };

    const goToCourse = () => {
        if (enrollment) {
            router.visit(`/student/enrollments/${enrollment.id}`);
        }
    };

    const isEnrollmentExpired = Boolean(
        enrollment?.is_expired ||
            (enrollment?.expiry_date &&
                new Date(enrollment.expiry_date).getTime() < Date.now()),
    );

    // Helper to render the main button/content
    const renderContent = () => {
        // Don't show anything if course is not published
        if (course.status !== 'Published') {
            if (variant === 'simple') return null;
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-center">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">
                            This course is not available for enrollment.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        // Show loading state while checking enrollment
        if (checkingEnrollment) {
            if (variant === 'simple') {
                return (
                    <Button className={className} disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </Button>
                );
            }
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-center">
                        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                            Checking enrollment status...
                        </p>
                    </CardContent>
                </Card>
            );
        }

        // Show login prompt for non-authenticated users
        if (!user) {
            if (variant === 'simple') {
                return (
                    <Button onClick={handleEnrollment} className={className}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Enroll Now
                    </Button>
                );
            }
            return (
                <Card className={className}>
                    <CardContent className="space-y-3 p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {Number(course.price) > 0
                                    ? `$${Number(course.price).toFixed(2)}`
                                    : 'Free'}
                            </div>
                        </div>
                        <Button
                            onClick={handleEnrollment}
                            className="w-full"
                            size="lg"
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Enroll Now
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        // Show different states for non-students
        if (user.role !== 'Student') {
            if (variant === 'simple') {
                return (
                    <Button className={className} disabled>
                        Preview Mode
                    </Button>
                );
            }
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-center">
                        <div className="mb-2 text-2xl font-bold">
                            {Number(course.price) > 0
                                ? `$${Number(course.price).toFixed(2)}`
                                : 'Free'}
                        </div>
                        <Badge variant="secondary">Preview Mode</Badge>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Only students can enroll in courses
                        </p>
                    </CardContent>
                </Card>
            );
        }

        // Show enrollment status for students
        if (enrollment) {
            if (variant === 'simple') {
                if (
                    enrollment.status === 'Active' &&
                    enrollment.payment_status !== 'Pending' &&
                    !isEnrollmentExpired
                ) {
                    return (
                        <Button onClick={goToCourse} className={className}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Continue
                        </Button>
                    );
                } else if (isEnrollmentExpired) {
                    return (
                        <Button
                            onClick={handleEnrollment}
                            className={cn(
                                className,
                                'bg-rose-500 hover:bg-rose-600',
                            )}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            Renew Access
                        </Button>
                    );
                } else if (enrollment.payment_status === 'Pending') {
                    return (
                        <Button
                            onClick={handleEnrollment}
                            className={cn(
                                className,
                                'bg-amber-500 hover:bg-amber-600',
                            )}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Resume Payment
                        </Button>
                    );
                } else if (enrollment.status === 'Refund Requested') {
                    return (
                        <Button className={cn(className, 'bg-amber-100 text-amber-800 border-none')} disabled>
                            Refund Pending
                        </Button>
                    );
                } else if (enrollment.status === 'Refunded' || enrollment.status === 'Cancelled') {
                    return (
                        <Button onClick={handleEnrollment} className={className} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : Number(course.price) > 0 ? (
                                <CreditCard className="mr-2 h-4 w-4" />
                            ) : (
                                <BookOpen className="mr-2 h-4 w-4" />
                            )}
                            {Number(course.price) > 0 ? 'Buy Again' : 'Enroll Again'}
                        </Button>
                    );
                } else {
                    return (
                        <Button className={className} disabled>
                            {enrollment.status === 'Inactive' ? 'Inactive' : 'Access Denied'}
                        </Button>
                    );
                }
            }

            return (
                <Card className={className}>
                    <CardContent className="space-y-3 p-4">
                        <div className="text-center">
                            {isEnrollmentExpired ? (
                                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-500" />
                            ) : enrollment.payment_status === 'Pending' ? (
                                <Clock className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                            ) : enrollment.status === 'Refund Requested' ? (
                                <Clock className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                            ) : enrollment.status === 'Refunded' || enrollment.status === 'Cancelled' ? (
                                <RotateCcw className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                            ) : (
                                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                            )}
                            <div className="font-semibold">
                                {isEnrollmentExpired
                                    ? 'Access Expired'
                                    : enrollment.payment_status === 'Pending'
                                    ? 'Payment Pending'
                                    : enrollment.status === 'Refund Requested'
                                    ? 'Refund Pending'
                                    : enrollment.status === 'Refunded'
                                    ? 'Enrollment Refunded'
                                    : enrollment.status === 'Cancelled'
                                    ? 'Enrollment Cancelled'
                                    : 'Already Enrolled'}
                            </div>
                        </div>

                        {/* Enrollment Status */}
                        <div className="flex justify-center gap-2">
                            <Badge
                                variant={
                                    enrollment.status === 'Active'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {enrollment.status}
                            </Badge>
                            <Badge
                                variant={
                                    enrollment.payment_status === 'Completed'
                                        ? 'default'
                                        : enrollment.payment_status ===
                                            'Pending'
                                          ? 'outline'
                                          : enrollment.payment_status ===
                                              'Failed'
                                            ? 'destructive'
                                            : 'secondary'
                                }
                            >
                                {enrollment.payment_status}
                            </Badge>
                        </div>

                        {/* Progress */}
                        {enrollment.status === 'Active' &&
                            enrollment.payment_status !== 'Pending' &&
                            !isEnrollmentExpired &&
                            enrollment.progress != null && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>
                                            {Number(
                                                enrollment.progress || 0,
                                            ).toFixed(1)}
                                            %
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                        <div
                                            className="h-2 rounded-full bg-blue-600 transition-all"
                                            style={{
                                                width: `${Number(enrollment.progress || 0)}%`,
                                            }}
                                        ></div>
                                    </div>
                                    {enrollment.completion_date && (
                                        <div className="text-center text-sm text-green-600">
                                            ✓ Completed on{' '}
                                            {new Date(
                                                enrollment.completion_date,
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {enrollment.status === 'Active' &&
                            enrollment.payment_status !== 'Pending' &&
                            !isEnrollmentExpired ? (
                                <Button
                                    onClick={goToCourse}
                                    className="w-full"
                                    size="lg"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Continue Learning
                                </Button>
                            ) : isEnrollmentExpired ? (
                                <Button
                                    onClick={handleEnrollment}
                                    className="w-full bg-rose-500 text-white hover:bg-rose-600"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    Renew Access
                                </Button>
                            ) : enrollment.payment_status === 'Pending' ? (
                                <>
                                    <Button
                                        onClick={handleEnrollment}
                                        className="w-full bg-amber-500 text-white hover:bg-amber-600"
                                        size="lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="mr-2 h-4 w-4" />
                                        )}
                                        Resume Payment
                                    </Button>
                                    {Number(course.price) === 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-muted-foreground hover:text-destructive"
                                            onClick={() => setShowCancelModal(true)}
                                            disabled={isLoading}
                                        >
                                            Cancel Enrollment
                                        </Button>
                                    )}
                                </>
                            ) : enrollment.status === 'Refund Requested' ? (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    disabled
                                >
                                    Refund Pending
                                </Button>
                            ) : enrollment.status === 'Refunded' || enrollment.status === 'Cancelled' ? (
                                <Button
                                    onClick={handleEnrollment}
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : Number(course.price) > 0 ? (
                                        <CreditCard className="mr-2 h-4 w-4" />
                                    ) : (
                                        <BookOpen className="mr-2 h-4 w-4" />
                                    )}
                                    {Number(course.price) > 0 ? 'Buy Again' : 'Enroll Again'}
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    disabled
                                >
                                    Enrollment Inactive
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // Show enrollment button for students who can enroll
        if (variant === 'simple') {
            return (
                <Button
                    onClick={handleEnrollment}
                    className={className}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : Number(course.price) > 0 ? (
                        <CreditCard className="mr-2 h-4 w-4" />
                    ) : (
                        <BookOpen className="mr-2 h-4 w-4" />
                    )}
                    {Number(course.price) > 0 ? 'Buy Now' : 'Enroll Free'}
                </Button>
            );
        }
        return (
            <Card className={className}>
                <CardContent className="space-y-3 p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {Number(course.price) > 0
                                ? `$${Number(course.price).toFixed(2)}`
                                : 'Free'}
                        </div>
                        {Number(course.price) > 0 && (
                            <p className="text-sm text-muted-foreground">
                                One-time payment
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleEnrollment}
                        className="w-full"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : Number(course.price) > 0 ? (
                            <CreditCard className="mr-2 h-4 w-4" />
                        ) : (
                            <BookOpen className="mr-2 h-4 w-4" />
                        )}
                        {Number(course.price) > 0
                            ? 'Enroll Now'
                            : 'Enroll for Free'}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        {Number(course.price) > 0
                            ? 'Secure payment via PayPal'
                            : 'Instant access to all course content'}
                    </p>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {renderContent()}
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelEnrollment}
                title="Cancel Enrollment"
                description={`Are you sure you want to cancel your enrollment in "${course.title}"?`}
                confirmText="Cancel Enrollment"
                isDestructive={true}
                isLoading={isLoading}
            />
        </>
    );
}
