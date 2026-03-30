import { router } from '@inertiajs/react';
import { Loader2, CreditCard, BookOpen, CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';
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
    initialEnrollment = null 
}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(initialEnrollment);
    const [canEnroll, setCanEnroll] = useState(!initialEnrollment);
    const [checkingEnrollment, setCheckingEnrollment] = useState(!initialEnrollment);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const enrollmentMessages = useActionMessages('Enrollment');

    const checkEnrollmentStatus = useCallback(async () => {
        if (initialEnrollment) return;
        
        try {
            const response = await fetch('/student/check-enrollment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
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

        router.post('/student/enrollments', { course_id: course.id }, {
            onFinish: () => setIsLoading(false),
            onError: () => enrollmentMessages.error('create'),
        });
    };

    const handleCancelEnrollment = async () => {
        if (!enrollment || enrollment.payment_status !== 'Pending') {
            return;
        }

        setIsLoading(true);
        setShowCancelModal(false);

        router.delete(`/student/enrollments/${enrollment.id}/cancel`, {
            onFinish: () => {
                setIsLoading(false);
                checkEnrollmentStatus();
            },
            onError: () => enrollmentMessages.error('cancel'),
        });
    };

    const goToCourse = () => {
        if (enrollment) {
            router.visit(`/student/enrollments/${enrollment.id}`);
        }
    };

    // Helper to render the main button/content
    const renderContent = () => {
        // Don't show anything if course is not published
        if (course.status !== 'Published') {
            if (variant === 'simple') return null;
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <p className="text-sm text-muted-foreground">This course is not available for enrollment.</p>
                    </CardContent>
                </Card>
            );
        }

        // Show loading state while checking enrollment
        if (checkingEnrollment) {
            if (variant === 'simple') {
                return (
                    <Button className={className} disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                    </Button>
                );
            }
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-center">
                        <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">Checking enrollment status...</p>
                    </CardContent>
                </Card>
            );
        }

        // Show login prompt for non-authenticated users
        if (!user) {
            if (variant === 'simple') {
                return (
                    <Button onClick={handleEnrollment} className={className}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll Now
                    </Button>
                );
            }
            return (
                <Card className={className}>
                    <CardContent className="p-4 space-y-3">
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                            </div>
                        </div>
                        <Button onClick={handleEnrollment} className="w-full" size="lg">
                            <BookOpen className="h-4 w-4 mr-2" />
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
                        <div className="text-2xl font-bold mb-2">
                            {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                        </div>
                        <Badge variant="secondary">Preview Mode</Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                            Only students can enroll in courses
                        </p>
                    </CardContent>
                </Card>
            );
        }

        // Show enrollment status for students
        if (enrollment) {
            if (variant === 'simple') {
                if (enrollment.status === 'Active' && enrollment.payment_status !== 'Pending') {
                    return (
                        <Button onClick={goToCourse} className={className}>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Continue
                        </Button>
                    );
                } else if (enrollment.payment_status === 'Pending') {
                    return (
                        <Button 
                            onClick={handleEnrollment} 
                            className={cn(className, "bg-amber-500 hover:bg-amber-600")}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4 mr-2" />
                            )}
                            Resume Payment
                        </Button>
                    );
                } else {
                    return (
                        <Button className={className} disabled>
                            Inactive
                        </Button>
                    );
                }
            }

            return (
                <Card className={className}>
                    <CardContent className="p-4 space-y-3">
                        <div className="text-center">
                            {enrollment.payment_status === 'Pending' ? (
                                <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                            ) : (
                                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                            )}
                            <div className="font-semibold">
                                {enrollment.payment_status === 'Pending' ? 'Payment Pending' : 'Already Enrolled'}
                            </div>
                        </div>

                        {/* Enrollment Status */}
                        <div className="flex justify-center gap-2">
                            <Badge variant={enrollment.status === 'Active' ? 'default' : 'secondary'}>
                                {enrollment.status}
                            </Badge>
                            <Badge variant={
                                enrollment.payment_status === 'Completed' ? 'default' :
                                enrollment.payment_status === 'Pending' ? 'outline' :
                                enrollment.payment_status === 'Failed' ? 'destructive' : 'secondary'
                            }>
                                {enrollment.payment_status}
                            </Badge>
                        </div>

                        {/* Progress */}
                        {enrollment.status === 'Active' && enrollment.payment_status !== 'Pending' && enrollment.progress != null && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{Number(enrollment.progress || 0).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Number(enrollment.progress || 0)}%` }}
                                    ></div>
                                </div>
                                {enrollment.completion_date && (
                                    <div className="text-sm text-green-600 text-center">
                                        ✓ Completed on {new Date(enrollment.completion_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {enrollment.status === 'Active' && enrollment.payment_status !== 'Pending' ? (
                                <Button onClick={goToCourse} className="w-full" size="lg">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Continue Learning
                                </Button>
                            ) : enrollment.payment_status === 'Pending' ? (
                                <>
                                    <Button 
                                        onClick={handleEnrollment} 
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                                        size="lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CreditCard className="h-4 w-4 mr-2" />
                                        )}
                                        Resume Payment
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-muted-foreground hover:text-destructive"
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={isLoading}
                                    >
                                        Cancel Enrollment
                                    </Button>
                                </>
                            ) : (
                                <Button variant="secondary" className="w-full" disabled>
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
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : Number(course.price) > 0 ? (
                        <CreditCard className="h-4 w-4 mr-2" />
                    ) : (
                        <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    {Number(course.price) > 0 ? 'Buy Now' : 'Enroll Free'}
                </Button>
            );
        }
        return (
            <Card className={className}>
                <CardContent className="p-4 space-y-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                        </div>
                        {Number(course.price) > 0 && (
                            <p className="text-sm text-muted-foreground">One-time payment</p>
                        )}
                    </div>

                    <Button
                        onClick={handleEnrollment}
                        className="w-full"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : Number(course.price) > 0 ? (
                            <CreditCard className="h-4 w-4 mr-2" />
                        ) : (
                            <BookOpen className="h-4 w-4 mr-2" />
                        )}
                        {Number(course.price) > 0 ? 'Enroll Now' : 'Enroll for Free'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        {Number(course.price) > 0
                            ? 'Secure payment via PayPal'
                            : 'Instant access to all course content'
                        }
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
