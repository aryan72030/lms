import { Head, router } from '@inertiajs/react';
import {
    Eye,
    Search,
    Filter,
    CheckCircle,
    Circle,
    User as UserIcon,
    BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Student {
    id: number;
    name: string;
    email: string;
}

interface Course {
    id: number;
    title: string;
    price: number;
}

interface Enrollment {
    id: number;
    student: Student;
    course: Course;
    enrollment_date: string;
    payment_status: string;
    payment_status_label: string;
    payment_status_color: string;
    status: string;
    status_label: string;
    status_color: string;
    progress: number;
    completion_date: string | null;
    created_at: string;
}

interface Props {
    enrollments: {
        data: Enrollment[];
        links: any[];
        meta: any;
        total?: number;
    };
    enrollments_total?: number;
    courses: Array<{ id: number; title: string }>;
    stats: {
        total_enrollments: number;
        active_enrollments: number;
        completed_enrollments: number;
        total_revenue: number;
    };
    filters: {
        search?: string;
        course_id?: string;
        status?: string;
        payment_status?: string;
    };
    statuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
}

export default function InstructorEnrollmentsIndex({
    enrollments,
    enrollments_total,
    courses,
    stats,
    filters,
    statuses,
    paymentStatuses,
}: Props) {
    const total = enrollments.meta?.total ?? enrollments.total ?? enrollments_total ?? stats.total_enrollments ?? 0;

    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status || 'all');

    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [viewData, setViewData] = useState<any>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const handleSearch = () => {
        router.get(
            '/instructor/enrollments',
            {
                search: search || undefined,
                course_id: courseFilter === 'all' ? undefined : courseFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setCourseFilter('all');
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        router.get('/instructor/enrollments');
    };

    const openViewModal = async (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowViewModal(true);
        setIsFetchingDetails(true);
        setViewData(null);
        setCompletedLessonIds([]);

        try {
            const response = await axios.get(`/instructor/enrollments/${enrollment.id}/details`);
            if (response.data.success) {
                setViewData(response.data.enrollment);
                setCompletedLessonIds(response.data.completed_lesson_ids || []);
            }
        } catch (error) {
            console.error('Error fetching enrollment details:', error);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const getStatusBadge = (enrollment: Enrollment) => {
        const colorMap: Record<string, string> = {
            green: 'bg-emerald-100 text-emerald-800 border-none',
            blue: 'bg-blue-100 text-blue-800 border-none',
            yellow: 'bg-amber-100 text-amber-800 border-none',
            red: 'bg-rose-100 text-rose-800 border-none',
            orange: 'bg-orange-100 text-orange-800 border-none',
            gray: 'bg-slate-100 text-slate-800 border-none',
            purple: 'bg-purple-100 text-purple-800 border-none',
        };
        return (
            <Badge className={colorMap[enrollment.status_color] || 'bg-slate-100 text-slate-800 border-none'}>
                {enrollment.status_label}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (enrollment: Enrollment) => {
        const colorMap: Record<string, string> = {
            green: 'bg-emerald-100 text-emerald-800 border-none',
            blue: 'bg-blue-100 text-blue-800 border-none',
            yellow: 'bg-amber-100 text-amber-800 border-none',
            red: 'bg-rose-100 text-rose-800 border-none',
            gray: 'bg-slate-100 text-slate-800 border-none',
        };
        return (
            <Badge className={colorMap[enrollment.payment_status_color] || 'bg-slate-100 text-slate-800 border-none'}>
                {enrollment.payment_status_label}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (_value: any, enrollment: Enrollment) => (
                <div>
                    <div className="font-bold text-slate-700">{enrollment.student.name}</div>
                    <div className="text-sm text-slate-500">{enrollment.student.email}</div>
                </div>
            ),
        },
        {
            key: 'course',
            label: 'Course',
            render: (_value: any, enrollment: Enrollment) => (
                <div>
                    <div className="font-bold text-slate-700">{enrollment.course.title}</div>
                    <div className="text-sm text-slate-500">${Number(enrollment.course.price || 0).toFixed(2)}</div>
                </div>
            ),
        },
        {
            key: 'enrollment_date',
            label: 'Enrollment Date',
            render: (value: string) => (
                <span className="text-slate-600">{value}</span>
            ),
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (value: number, enrollment: Enrollment) => (
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${value}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-slate-600">{value}%</span>
                    </div>
                    {enrollment.completion_date && (
                        <div className="mt-1 text-xs font-medium text-emerald-600">
                            Completed: {enrollment.completion_date}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'payment_status',
            label: 'Payment Status',
            render: (_value: any, enrollment: Enrollment) => getPaymentStatusBadge(enrollment),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_value: any, enrollment: Enrollment) => getStatusBadge(enrollment),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-center',
            render: (_value: any, enrollment: Enrollment) => (
                <div className="flex w-full justify-center">
                    <ActionButtonGroup>
                        <ActionButton
                            variant="view"
                            icon={Eye}
                            onClick={() => openViewModal(enrollment)}
                            title="View Details"
                        />
                    </ActionButtonGroup>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Student Enrollments', href: '/instructor/enrollments' },
            ]}
        >
            <Head title="Student Enrollments" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">Student Enrollments</h1>
                        <p className="text-muted-foreground">Manage and track your students' progress</p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div className="relative">
                                <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students or courses..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {Object.entries(statuses).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payment Status</SelectItem>
                                    {Object.entries(paymentStatuses).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollments Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={enrollments.data}
                            title={`Student Enrollments (${total})`}
                            emptyMessage="No enrollments found"
                            paginationLinks={enrollments.links}
                            onPageChange={(url) => router.get(url)}
                        />
                    </CardContent>
                </Card>

                {/* View Enrollment Modal */}
                <Dialog open={showViewModal && !!selectedEnrollment} onOpenChange={(open) => {
                    if (!open) {
                        setShowViewModal(false);
                        setViewData(null);
                        setSelectedEnrollment(null);
                        setCompletedLessonIds([]);
                    }
                }}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Enrollment Details</DialogTitle>
                            <DialogDescription>Student and course information</DialogDescription>
                        </DialogHeader>
                        {isFetchingDetails ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                            </div>
                        ) : viewData ? (
                            <div className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500">Student</p>
                                    <p className="font-semibold text-slate-900">{viewData.student.name}</p>
                                    <p className="text-slate-500">{viewData.student.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500">Course</p>
                                    <p className="font-semibold text-slate-900">{viewData.course.title}</p>
                                    <p className="text-slate-500">
                                        {Number(viewData.course.price || 0) > 0
                                            ? `$${Number(viewData.course.price).toFixed(2)}`
                                            : 'FREE'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500">Status</p>
                                        {selectedEnrollment && getStatusBadge(selectedEnrollment)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500">Payment</p>
                                        {selectedEnrollment && getPaymentStatusBadge(selectedEnrollment)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-slate-500">Date</p>
                                        <p className="text-slate-700">
                                            {new Date(viewData.enrollment_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500">Progress</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-500"
                                                style={{ width: `${Math.round(Number(viewData.progress || 0))}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-700">
                                            {Math.round(Number(viewData.progress || 0))}%
                                        </span>
                                        <span className="text-slate-400">
                                            ({completedLessonIds.length}/{viewData.course.lessons.length})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-32 flex-col items-center justify-center gap-2">
                                <p className="text-xs font-semibold text-slate-500">Failed to load details</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => selectedEnrollment && openViewModal(selectedEnrollment)}
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
