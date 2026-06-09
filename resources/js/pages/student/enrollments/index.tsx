import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    Clock,
    User,
    Calendar,
    Eye,
    X,
    Filter,
    PlayCircle,
    CheckCircle,
    Award,
    Search,
    ArrowRight,
    FileText,
    AlertCircle,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Enrollment {
    id: number;
    course: {
        id: number;
        title: string;
        description: string;
        price: number;
        thumbnail: string | null;
        instructor: {
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
    };
    enrollment_date: string;
    expiry_date: string | null;
    payment_status: string;
    payment_method: string;
    status: string;
    progress: number | string | null;
    completion_date: string | null;
    amount_paid: number | null;
    transaction_id: string | null;
    refund_id: string | null;
    refund_amount: number | string | null;
    refunded_at: string | null;
}

interface Props {
    enrollments: {
        data: Enrollment[];
        links: any[];
        meta: any;
    };
    filters: {
        status?: string;
        payment_status?: string;
    };
}

export default function Index({ enrollments, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(
        filters.payment_status || 'all',
    );
    const [enrollmentToCancel, setEnrollmentToCancel] =
        useState<Enrollment | null>(null);
    const [showReceipt, setShowReceipt] = useState<Enrollment | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const enrollmentMessages = useActionMessages('Enrollment');

    const handleFilter = () => {
        router.get(
            '/student/enrollments',
            {
                status: statusFilter === 'all' ? undefined : statusFilter,
                payment_status:
                    paymentStatusFilter === 'all'
                        ? undefined
                        : paymentStatusFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        router.get('/student/enrollments');
    };

    const handleCancelEnrollment = async () => {
        if (!enrollmentToCancel) return;

        if (enrollmentToCancel.payment_status !== 'Pending') {
            enrollmentMessages.error('cancel');
            setEnrollmentToCancel(null);

            return;
        }

        setLoading(enrollmentToCancel.id);
        router.patch(`/student/enrollments/${enrollmentToCancel.id}/cancel`, {}, {
            onSuccess: () => {
                enrollmentMessages.success('cancel');
                setEnrollmentToCancel(null);
            },
            onError: () => {
                enrollmentMessages.error('cancel');
                setEnrollmentToCancel(null);
            },
            onFinish: () => setLoading(null),
        });
    };

    const handleResumePayment = (courseId: number) => {
        router.post('/student/enrollments', { course_id: courseId });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return (
                    <Badge className="border-none bg-emerald-100 text-emerald-800">
                        Active
                    </Badge>
                );
            case 'Completed':
                return (
                    <Badge className="border-none bg-blue-100 text-blue-800">
                        Completed
                    </Badge>
                );
            case 'Inactive':
                return (
                    <Badge className="border-none bg-slate-100 text-slate-800">
                        Inactive
                    </Badge>
                );
            case 'Refunded':
                return (
                    <Badge className="border-none bg-rose-100 text-rose-800">
                        Refunded
                    </Badge>
                );
            case 'Refund Requested':
                return (
                    <Badge className="border-none bg-amber-100 text-amber-800">
                        Refund Requested
                    </Badge>
                );
            case 'Cancelled':
                return (
                    <Badge className="border-none bg-slate-100 text-slate-600">
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const variants: Record<string, string> = {
            Free: 'bg-slate-100 text-slate-800 border-none',
            Pending: 'bg-amber-100 text-amber-800 border-none',
            Completed: 'bg-emerald-100 text-emerald-800 border-none',
            Failed: 'bg-rose-100 text-rose-800 border-none',
            Refunded: 'bg-rose-100 text-rose-800 border-none',
        };

        return (
            <Badge
                className={
                    variants[paymentStatus] ||
                    'border-none bg-slate-100 text-slate-800'
                }
            >
                {paymentStatus === 'Completed' ? 'Paid' : paymentStatus}
            </Badge>
        );
    };

    const getExpiryMeta = (expiryDate: string | null) => {
        if (!expiryDate) {
            return {
                label: 'Lifetime Access',
                textClass: 'text-emerald-600',
            };
        }

        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffInDays = Math.ceil(
            (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (expiry < now) {
            return {
                label: `Expired on ${expiry.toLocaleDateString()}`,
                textClass: 'text-rose-500',
            };
        }

        if (diffInDays <= 7) {
            return {
                label: `Expires in ${diffInDays} day${diffInDays === 1 ? '' : 's'}`,
                textClass: 'text-amber-500',
            };
        }

        return {
            label: `Expires on ${expiry.toLocaleDateString()}`,
            textClass: 'text-slate-400',
        };
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Learning', href: '#' },
            ]}
        >
            <Head title="My Learning" />

            <div className="space-y-10 pb-12">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="border-none bg-indigo-500 px-3 py-1 text-white">
                                Learning Journey
                            </Badge>
                            <h1 className="page-title">
                                Your{' '}
                                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                    Classroom
                                </span>
                            </h1>
                            <p className="max-w-md text-lg text-slate-300">
                                Track your progress, continue your lessons, and
                                achieve your learning goals.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="flex h-48 w-48 -rotate-6 animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl">
                                <Award className="h-24 w-24 text-indigo-400 opacity-40" />
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl"></div>
                </div>

                {/* Filters Bar */}
                <div className="sticky top-4 z-40">
                    <Card className="border-none bg-white/80 shadow-xl ring-1 ring-slate-200 backdrop-blur-xl">
                        <CardContent className="p-4">
                            <div className="flex flex-row flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 px-2 font-bold text-slate-500">
                                    <Filter className="h-5 w-5" />
                                    <span>Filter By:</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Select
                                        value={statusFilter}
                                        onValueChange={setStatusFilter}
                                    >
                                        <SelectTrigger className="h-12 w-[180px] rounded-xl border-none bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="Course Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">
                                                All Statuses
                                            </SelectItem>
                                            <SelectItem value="Active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="Completed">
                                                Completed
                                            </SelectItem>
                                            <SelectItem value="Inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={paymentStatusFilter}
                                        onValueChange={setPaymentStatusFilter}
                                    >
                                        <SelectTrigger className="h-12 w-[180px] rounded-xl border-none bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="Payment Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">
                                                All Payments
                                            </SelectItem>
                                            <SelectItem value="Free">
                                                Free
                                            </SelectItem>
                                            <SelectItem value="Pending">
                                                Pending
                                            </SelectItem>
                                            <SelectItem value="Completed">
                                                Paid
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleFilter}
                                            className="h-12 rounded-xl bg-indigo-600 px-6 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-105 hover:bg-indigo-700"
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="h-12 rounded-xl border-slate-200 px-6 font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enrollments Grid */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800">
                            Course Enrollments
                        </h2>
                        <Link
                            href="/student/courses"
                            className="flex items-center gap-1 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800"
                        >
                            Browse more courses{' '}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {enrollments.data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {enrollments.data.map((enrollment) => (
                                <Card
                                    key={enrollment.id}
                                    className="group flex flex-col overflow-hidden rounded-3xl border-none bg-white shadow-md transition-all duration-500 hover:shadow-2xl"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        {enrollment.course.thumbnail ? (
                                            <img
                                                src={
                                                    enrollment.course.thumbnail
                                                }
                                                alt={enrollment.course.title}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-200">
                                                <BookOpen className="h-16 w-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                            {getStatusBadge(enrollment.status)}
                                            {getPaymentStatusBadge(
                                                enrollment.payment_status,
                                            )}
                                        </div>
                                        {enrollment.payment_status ===
                                            'Pending' && Number(enrollment.course.price) === 0 && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() =>
                                                        setEnrollmentToCancel(
                                                            enrollment,
                                                        )
                                                    }
                                                    className="h-8 w-8 rounded-full shadow-lg"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            {enrollment.status === 'Active' &&
                                            enrollment.payment_status.toLowerCase() !==
                                                'pending' ? (
                                                <Link
                                                    href={`/student/enrollments/${enrollment.id}`}
                                                    className="w-full"
                                                >
                                                    <Button className="w-full rounded-xl bg-white font-bold text-slate-900 shadow-xl hover:bg-white/90">
                                                        Continue Learning
                                                    </Button>
                                                </Link>
                                            ) : enrollment.payment_status.toLowerCase() ===
                                              'pending' ? (
                                                <Button
                                                    onClick={() =>
                                                        handleResumePayment(
                                                            enrollment.course
                                                                .id,
                                                        )
                                                    }
                                                    className="w-full rounded-xl bg-amber-500 font-bold text-white shadow-xl hover:bg-amber-600"
                                                >
                                                    Pay Now
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <CardHeader className="space-y-3 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="border-none bg-indigo-50 text-[10px] font-bold tracking-wider text-indigo-600 uppercase"
                                            >
                                                {
                                                    enrollment.course.category
                                                        .name
                                                }
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-2 min-h-[3.5rem] text-xl font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                                            {enrollment.course.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500">
                                                {enrollment.course.instructor.name.charAt(
                                                    0,
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">
                                                {
                                                    enrollment.course.instructor
                                                        .name
                                                }
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex flex-grow flex-col justify-between space-y-6">
                                        <div className="space-y-4">
                                            {enrollment.status === 'Refunded' ? (
                                                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                                                    <div className="flex items-center gap-2 text-rose-600">
                                                        <RotateCcw className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-wider">Refund Processed</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Refund ID</p>
                                                        <p className="text-sm font-mono font-bold text-slate-700">{enrollment.refund_id}</p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-9 w-full rounded-xl border-rose-200 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                        onClick={() => setShowReceipt(enrollment)}
                                                    >
                                                        <FileText className="mr-2 h-3.5 w-3.5" />
                                                        View Refund Receipt
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between text-sm font-black text-slate-700">
                                                        <span className="flex items-center gap-1.5">
                                                            <PlayCircle className="h-4 w-4 text-indigo-600" />
                                                            Course Progress
                                                        </span>
                                                        <span className="text-indigo-600">
                                                            {Number(
                                                                enrollment.progress ||
                                                                    0,
                                                            ).toFixed(0)}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                                            style={{
                                                                width: `${Number(enrollment.progress || 0)}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </>
                                            )}
                                            
                                            {enrollment.completion_date && (
                                                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs font-bold text-emerald-600">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Completed on{' '}
                                                    {new Date(
                                                        enrollment.completion_date,
                                                    ).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                Enrolled:{' '}
                                                {new Date(
                                                    enrollment.enrollment_date,
                                                ).toLocaleDateString()}
                                            </div>
                                            {enrollment.expiry_date && (
                                                <div className={`flex items-center gap-1.5 ${getExpiryMeta(enrollment.expiry_date).textClass}`}>
                                                    <Clock className="h-3 w-3" />
                                                    {
                                                        getExpiryMeta(
                                                            enrollment.expiry_date,
                                                        ).label
                                                    }
                                                </div>
                                            )}
                                            {!enrollment.expiry_date && (
                                                <div className="flex items-center gap-1.5 text-emerald-600">
                                                    <Clock className="h-3 w-3" />
                                                    Lifetime Access
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            {new Date(
                                                enrollment.expiry_date || '',
                                            ) < new Date() &&
                                            enrollment.expiry_date ? (
                                                <Button
                                                    onClick={() =>
                                                        handleResumePayment(
                                                            enrollment.course
                                                                .id,
                                                        )
                                                    }
                                                    className="h-12 w-full rounded-xl bg-rose-500 font-bold text-white shadow-lg shadow-rose-100 hover:bg-rose-600"
                                                >
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Renew Access
                                                </Button>
                                            ) : enrollment.status === 'Refunded' ? (
                                                <Button
                                                    onClick={() => handleResumePayment(enrollment.course.id)}
                                                    className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] hover:bg-indigo-700"
                                                >
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    {Number(enrollment.course.price) > 0 ? 'Buy Again' : 'Enroll Again'}
                                                </Button>
                                            ) : enrollment.status === 'Cancelled' ? (
                                                <Button
                                                    onClick={() => handleResumePayment(enrollment.course.id)}
                                                    className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] hover:bg-indigo-700"
                                                >
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                    Enroll Again
                                                </Button>
                                            ) : enrollment.status === 'Active' &&
                                            enrollment.payment_status.toLowerCase() !==
                                                'pending' ? (
                                                <Link
                                                    href={`/student/enrollments/${enrollment.id}`}
                                                >
                                                    <Button className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]">
                                                        {Number(
                                                            enrollment.progress,
                                                        ) > 0
                                                            ? 'Resume Course'
                                                            : 'Start Learning'}
                                                    </Button>
                                                </Link>
                                            ) : enrollment.payment_status.toLowerCase() ===
                                              'pending' ? (
                                                <Button
                                                    onClick={() =>
                                                        handleResumePayment(
                                                            enrollment.course
                                                                .id,
                                                        )
                                                    }
                                                    className="h-12 w-full rounded-xl bg-amber-500 font-bold text-white shadow-lg shadow-amber-100 hover:bg-amber-600"
                                                >
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Pay Now
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="h-12 w-full cursor-not-allowed rounded-xl bg-slate-100 font-bold text-slate-400"
                                                    disabled
                                                >
                                                    Enrollment Inactive
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-white py-24 text-center shadow-sm">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                                <BookOpen className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">
                                No enrollments found
                            </h3>
                            <p className="mx-auto mt-2 mb-8 max-w-xs font-medium text-slate-500">
                                You haven't enrolled in any courses yet. Start
                                your journey by browsing our catalog.
                            </p>
                            <Link href="/student/courses">
                                <Button className="h-12 rounded-xl bg-indigo-600 px-8 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700">
                                    Explore Courses
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {enrollments.links && enrollments.data.length > 0 && (
                        <div className="flex justify-end pt-10">
                            <PaginationLinks
                                links={enrollments.links}
                                onPageChange={(url) => router.get(url)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!enrollmentToCancel}
                onClose={() => setEnrollmentToCancel(null)}
                onConfirm={handleCancelEnrollment}
                title="Cancel Enrollment"
                description={`Are you sure you want to cancel your enrollment in ${enrollmentToCancel?.course.title}?`}
                confirmText="Cancel Enrollment"
                isDestructive={true}
                isLoading={loading === enrollmentToCancel?.id}
            />

            {/* Refund Receipt Modal */}
            <Dialog open={!!showReceipt} onOpenChange={(open) => !open && setShowReceipt(null)}>
                <DialogContent className="max-w-md rounded-3xl border-none p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 text-white text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <CheckCircle className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black">Refund Successful</h2>
                        <p className="mt-1 text-rose-100 font-medium">Virtual Transaction Completed</p>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="space-y-4 border-b border-slate-100 pb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Course</span>
                                <span className="text-sm font-black text-slate-800 text-right max-w-[200px] line-clamp-1">{showReceipt?.course.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Refund Amount</span>
                                <span className="text-lg font-black text-rose-600">${showReceipt?.amount_paid}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Date</span>
                                <span className="text-sm font-bold text-slate-800">{showReceipt?.refunded_at ? new Date(showReceipt.refunded_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Virtual Refund Reference</p>
                                <p className="font-mono text-sm font-black text-slate-700 select-all">{showReceipt?.refund_id}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Transaction</p>
                                <p className="font-mono text-sm font-black text-slate-700">{showReceipt?.transaction_id || 'N/A'}</p>
                            </div>
                        </div>

                        <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
                            This is a virtual refund acknowledgment for learning purposes. No real funds have been transferred to your bank account or PayPal.
                        </p>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 flex-col sm:flex-col gap-2">
                        <Button 
                            className="w-full h-12 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                            onClick={() => window.print()}
                        >
                            Print Receipt
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-12 rounded-xl font-bold text-slate-500"
                            onClick={() => setShowReceipt(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
