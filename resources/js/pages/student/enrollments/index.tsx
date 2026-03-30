import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Clock, User, Calendar, Eye, X, Filter, PlayCircle, CheckCircle, Award, Search, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    payment_status: string;
    payment_method: string;
    status: string;
    progress: number | string | null;
    completion_date: string | null;
    amount_paid: number | null;
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
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status || 'all');
    const [enrollmentToCancel, setEnrollmentToCancel] = useState<Enrollment | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const enrollmentMessages = useActionMessages('Enrollment');

    const handleFilter = () => {
        router.get('/student/enrollments', {
            status: statusFilter === 'all' ? undefined : statusFilter,
            payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
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
        router.delete(`/student/enrollments/${enrollmentToCancel.id}/cancel`, {
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
                return <Badge className="bg-emerald-100 text-emerald-800 border-none">Active</Badge>;
            case 'Completed':
                return <Badge className="bg-blue-100 text-blue-800 border-none">Completed</Badge>;
            case 'Inactive':
                return <Badge className="bg-slate-100 text-slate-800 border-none">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const variants: Record<string, string> = {
            'Free': 'bg-slate-100 text-slate-800 border-none',
            'Pending': 'bg-amber-100 text-amber-800 border-none',
            'Completed': 'bg-emerald-100 text-emerald-800 border-none',
            'Failed': 'bg-rose-100 text-rose-800 border-none',
        };

        return (
            <Badge className={variants[paymentStatus] || 'bg-slate-100 text-slate-800 border-none'}>
                {paymentStatus === 'Completed' ? 'Paid' : paymentStatus}
            </Badge>
        );
    };

    return (
        <AppLayout>
            <Head title="My Learning" />

            <div className="space-y-10 pb-12">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white md:p-12 shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="bg-indigo-500 text-white border-none px-3 py-1">
                                Learning Journey
                            </Badge>
                            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Classroom</span>
                            </h1>
                            <p className="text-lg text-slate-300 max-w-md">
                                Track your progress, continue your lessons, and achieve your learning goals.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl border border-white/10 flex items-center justify-center -rotate-6 animate-pulse">
                                <Award className="h-24 w-24 text-indigo-400 opacity-40" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl"></div>
                </div>

                {/* Filters Bar */}
                <div className="sticky top-4 z-40">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row gap-4 items-center">
                                <div className="flex items-center gap-2 text-slate-500 font-bold px-2">
                                    <Filter className="h-5 w-5" />
                                    <span>Filter By:</span>
                                </div>
                                <div className="flex flex-wrap gap-3 flex-1">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="Course Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                                        <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="Payment Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">All Payments</SelectItem>
                                            <SelectItem value="Free">Free</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Completed">Paid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2 ml-auto">
                                        <Button onClick={handleFilter} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-105">
                                            Apply Filters
                                        </Button>
                                        <Button variant="outline" onClick={clearFilters} className="h-12 px-6 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
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
                        <h2 className="text-2xl font-black text-slate-800">
                            {enrollments.meta?.total || 0} Enrolled Courses
                        </h2>
                        <Link href="/student/courses" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                            Browse more courses <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {enrollments.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {enrollments.data.map((enrollment) => (
                                <Card key={enrollment.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white rounded-3xl flex flex-col">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        {enrollment.course.thumbnail ? (
                                            <img
                                                src={enrollment.course.thumbnail}
                                                alt={enrollment.course.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                                <BookOpen className="h-16 w-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                            {getStatusBadge(enrollment.status)}
                                            {getPaymentStatusBadge(enrollment.payment_status)}
                                        </div>
                                        {enrollment.payment_status === 'Pending' && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => setEnrollmentToCancel(enrollment)}
                                                    className="h-8 w-8 rounded-full shadow-lg"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                            {enrollment.status === 'Active' && enrollment.payment_status.toLowerCase() !== 'pending' ? (
                                                <Link href={`/student/enrollments/${enrollment.id}`} className="w-full">
                                                    <Button className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold rounded-xl shadow-xl">
                                                        Continue Learning
                                                    </Button>
                                                </Link>
                                            ) : enrollment.payment_status.toLowerCase() === 'pending' ? (
                                                <Button 
                                                    onClick={() => handleResumePayment(enrollment.course.id)}
                                                    className="w-full bg-amber-500 text-white hover:bg-amber-600 font-bold rounded-xl shadow-xl"
                                                >
                                                    Pay Now
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <CardHeader className="pb-3 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase tracking-wider">
                                                {enrollment.course.category.name}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                                            {enrollment.course.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                                {enrollment.course.instructor.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">
                                                {enrollment.course.instructor.name}
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm font-black text-slate-700">
                                                <span className="flex items-center gap-1.5">
                                                    <PlayCircle className="h-4 w-4 text-indigo-600" />
                                                    Course Progress
                                                </span>
                                                <span className="text-indigo-600">{Number(enrollment.progress || 0).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${Number(enrollment.progress || 0)}%` }}
                                                ></div>
                                            </div>
                                            {enrollment.completion_date && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Completed on {new Date(enrollment.completion_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            {enrollment.status === 'Active' && enrollment.payment_status.toLowerCase() !== 'pending' ? (
                                                <Link href={`/student/enrollments/${enrollment.id}`}>
                                                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                                        {Number(enrollment.progress) > 0 ? 'Resume Course' : 'Start Learning'}
                                                    </Button>
                                                </Link>
                                            ) : enrollment.payment_status.toLowerCase() === 'pending' ? (
                                                <Button 
                                                    onClick={() => handleResumePayment(enrollment.course.id)}
                                                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-100"
                                                >
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Pay Now
                                                </Button>
                                            ) : (
                                                <Button className="w-full h-12 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed" disabled>
                                                    Enrollment Inactive
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-100">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">No enrollments found</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">
                                You haven't enrolled in any courses yet. Start your journey by browsing our catalog.
                            </p>
                            <Link href="/student/courses">
                                <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
                                    Explore Courses
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {enrollments.links && enrollments.data.length > 0 && (
                        <div className="pt-10 flex justify-center">
                            <PaginationLinks links={enrollments.links} onPageChange={(url) => router.get(url)} />
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
        </AppLayout>
    );
}
