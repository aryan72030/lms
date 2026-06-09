import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    Save,
    User as UserIcon,
    BookOpen,
    CheckCircle,
    Circle,
    Loader2,
    Info,
    AlertTriangle,
    FileText,
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';
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
        price: number | string | null;
        instructor: {
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
    amount_paid: number | string | null;
}

interface Student {
    id: number;
    name: string;
    email: string;
}

interface Course {
    id: number;
    title: string;
    price: number | string | null;
}

interface Props {
    enrollments?: {
        data: Enrollment[];
        links?: any[];
        meta?: any;
        total?: number;
    };
    enrollments_total?: number;
    courses?: Array<{
        id: number;
        title: string;
        price?: number | string | null;
    }>;
    students?: Student[];
    statuses?: Record<string, string>;
    allStatuses?: Record<string, string>;
    paymentStatuses?: Record<string, string>;
    filters?: {
        search?: string;
        status?: string;
        payment_status?: string;
        course_id?: string;
    };
}

export default function Index({
    enrollments,
    courses = [],
    students = [],
    statuses = {},
    allStatuses = {},
    paymentStatuses = {},
    filters = {},
    enrollments_total,
}: Props) {
    const safeEnrollments = {
        data: enrollments?.data || [],
        total: enrollments?.meta?.total ?? enrollments?.total ?? enrollments_total ?? 0,
        links: enrollments?.links || [],
    };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(
        filters.payment_status || 'all',
    );
    const [courseFilter, setCourseFilter] = useState(
        filters.course_id || 'all',
    );
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewData, setViewData] = useState<any>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isTogglingLesson, setIsTogglingLesson] = useState<number | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedEnrollment, setSelectedEnrollment] =
        useState<Enrollment | null>(null);
    const [enrollmentToDelete, setEnrollmentToDelete] =
        useState<Enrollment | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const enrollmentMessages = useActionMessages('Enrollment');

    const {
        data: createData,
        setData: setCreateData,
        post: createPost,
        processing: createProcessing,
        errors: createErrors,
        reset: createReset,
    } = useForm({
        student_id: '',
        course_id: '',
        notes: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put: editPut,
        processing: editProcessing,
        errors: editErrors,
        reset: editReset,
    } = useForm({
        status: '',
        expiry_date: '',
        notes: '',
    });

    const handleSearch = () => {
        router.get(
            '/admin/enrollments',
            {
                search: searchTerm,
                status: statusFilter === 'all' ? undefined : statusFilter,
                payment_status:
                    paymentStatusFilter === 'all'
                        ? undefined
                        : paymentStatusFilter,
                course_id: courseFilter === 'all' ? undefined : courseFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        setCourseFilter('all');
        router.get('/admin/enrollments');
    };

    const handleDelete = async () => {
        if (!enrollmentToDelete) return;

        setLoading(enrollmentToDelete.id);
        router.delete(`/admin/enrollments/${enrollmentToDelete.id}`, {
            onSuccess: () => {
                enrollmentMessages.success('delete');
                setEnrollmentToDelete(null);
            },
            onError: () => {
                enrollmentMessages.error('delete');
                setEnrollmentToDelete(null);
            },
            onFinish: () => setLoading(null),
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            Active: 'default',
            Inactive: 'secondary',
            Cancelled: 'destructive',
            Refunded: 'outline',
            'Refund Requested': 'warning',
        };

        const badgeClass = status === 'Refund Requested' ? 'bg-amber-500 text-white border-none' : '';

        return <Badge variant={variants[status] || 'secondary'} className={badgeClass}>{status}</Badge>;
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const variants: Record<string, any> = {
            Free: 'secondary',
            Pending: 'outline',
            Completed: 'default',
            Failed: 'destructive',
            Refunded: 'outline',
        };

        const badgeClass = paymentStatus === 'Refunded' ? 'bg-rose-50 text-rose-600 border-rose-200' : '';

        return (
            <Badge variant={variants[paymentStatus] || 'secondary'} className={badgeClass}>
                {paymentStatus}
            </Badge>
        );
    };

    const openViewModal = async (enrollment: Enrollment) => {
        setEnrollmentToDelete(null);
        setSelectedEnrollment(enrollment);
        setViewData(null); // Clear previous data immediately
        setCompletedLessonIds([]);
        setActionReason('');
        setIsFetchingDetails(true); // Indicate loading

        try {
            const response = await axios.get(`/admin/enrollments/${enrollment.id}/details`);
            if (response.data.success) {
                setViewData(response.data.enrollment);
                setCompletedLessonIds(response.data.completed_lesson_ids || []);
                setShowViewModal(true); // Show modal only after data is ready
            }
        } catch (error) {
            console.error('Error fetching enrollment details:', error);
            // Optionally, handle error state or show an error message
        } finally {
            setIsFetchingDetails(false); // Loading finished
        }
    };

    const toggleLessonStatus = async (lessonId: number, currentStatus: boolean) => {
        if (!selectedEnrollment || isTogglingLesson) return;
        
        setIsTogglingLesson(lessonId);
        try {
            const response = await axios.post(`/admin/enrollments/${selectedEnrollment.id}/toggle-lesson`, {
                lesson_id: lessonId,
                is_completed: !currentStatus
            });
            
            if (response.data.success) {
                // Update local state
                if (!currentStatus) {
                    setCompletedLessonIds([...completedLessonIds, lessonId]);
                } else {
                    setCompletedLessonIds(completedLessonIds.filter(id => id !== lessonId));
                }
                
                // Update progress in viewData
                if (viewData) {
                    setViewData({
                        ...viewData,
                        progress: response.data.progress,
                        status: response.data.status
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling lesson status:', error);
            enrollmentMessages.error('update');
        } finally {
            setIsTogglingLesson(null);
        }
    };

    const handleRefund = async () => {
        if (!selectedEnrollment) return;
        setIsProcessingAction(true);
        router.post(`/admin/enrollments/${selectedEnrollment.id}/refund`, {
            reason: actionReason
        }, {
            onSuccess: () => {
                setShowViewModal(false);
            },
            onFinish: () => setIsProcessingAction(false)
        });
    };

    const handleCancel = async () => {
        if (!selectedEnrollment) return;
        setIsProcessingAction(true);
        router.post(`/admin/enrollments/${selectedEnrollment.id}/cancel`, {
            reason: actionReason
        }, {
            onSuccess: () => {
                setShowViewModal(false);
            },
            onFinish: () => setIsProcessingAction(false)
        });
    };

    const handleApproveRefund = () => {
        const enrollmentId = selectedEnrollment?.id || viewData?.id;
        if (!enrollmentId) {
            console.error('No enrollment ID found for refund approval');
            return;
        }
        
        setIsProcessingAction(true);
        router.post(`/admin/enrollments/${enrollmentId}/approve-refund`, {
            admin_notes: adminNotes
        }, {
            onSuccess: () => {
                setShowApproveModal(false);
                setShowViewModal(false);
                setAdminNotes('');
            },
            onFinish: () => setIsProcessingAction(false)
        });
    };

    const handleRejectRefund = () => {
        const enrollmentId = selectedEnrollment?.id || viewData?.id;
        if (!enrollmentId || !rejectionReason.trim()) return;
        
        setIsProcessingAction(true);
        router.post(`/admin/enrollments/${enrollmentId}/reject-refund`, {
            rejection_reason: rejectionReason
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setShowViewModal(false);
                setRejectionReason('');
            },
            onFinish: () => setIsProcessingAction(false)
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPost('/admin/enrollments', {
            onSuccess: () => {
                setShowCreateModal(false);
                createReset();
                enrollmentMessages.success('create');
            },
        });
    };

    const openEditModal = (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setEditData({
            status: enrollment.status,
            expiry_date: (enrollment as any).expiry_date_formatted || '',
            notes: (enrollment as any).notes || '',
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEnrollment) return;

        editPut(`/admin/enrollments/${selectedEnrollment.id}`, {
            onSuccess: () => {
                setShowEditModal(false);
                editReset();
            },
        });
    };

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (_value: unknown, enrollment: Enrollment) => (
                <div>
                    <div className="font-bold text-slate-700">
                        {enrollment.student.name}
                    </div>
                    <div className="text-sm text-slate-500">
                        {enrollment.student.email}
                    </div>
                </div>
            ),
        },
        {
            key: 'course',
            label: 'Course',
            render: (_value: unknown, enrollment: Enrollment) => (
                <div>
                    <div className="font-bold text-slate-700">
                        {enrollment.course.title}
                    </div>
                    <div className="text-sm text-slate-500">
                        ${Number(enrollment.course.price || 0).toFixed(2)}
                    </div>
                </div>
            ),
        },
        {
            key: 'instructor',
            label: 'Instructor',
            render: (_value: unknown, enrollment: Enrollment) => (
                <span className="text-slate-600">
                    {enrollment.course.instructor.name}
                </span>
            ),
        },
        {
            key: 'enrollment_date',
            label: 'Enrollment Date',
            render: (value: string) => (
                <span className="text-slate-600">
                    {new Date(value).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'payment_status',
            label: 'Payment Status',
            render: (value: string) => getPaymentStatusBadge(value),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => getStatusBadge(value),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-center',
            render: (_value: unknown, enrollment: Enrollment) => (
                <div className="flex w-full justify-center">
                    <ActionButtonGroup>
                        <ActionButton
                            variant="view"
                            icon={Eye}
                            onClick={() => openViewModal(enrollment)}
                            title="View Enrollment"
                        />
                        <ActionButton
                            variant="edit"
                            icon={Edit}
                            onClick={() => openEditModal(enrollment)}
                            title="Edit Enrollment"
                        />
                        <ActionButton
                            variant="delete"
                            icon={Trash2}
                            onClick={() => setEnrollmentToDelete(enrollment)}
                            title="Delete Enrollment"
                        />
                    </ActionButtonGroup>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Enrollment Management', href: '/admin/enrollments' },
            ]}
        >
            <Head title="Enrollment Management" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">
                            Enrollment Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage student course enrollments
                        </p>
                    </div>
                    <Button
                        variant="create"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Enrollment
                    </Button>
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
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10"
                                    onKeyPress={(e) =>
                                        e.key === 'Enter' && handleSearch()
                                    }
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    {Object.entries(allStatuses).map(
                                        ([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <Select
                                value={paymentStatusFilter}
                                onValueChange={setPaymentStatusFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Payment Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Payment Status
                                    </SelectItem>
                                    {Object.entries(paymentStatuses).map(
                                        ([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <Select
                                value={courseFilter}
                                onValueChange={setCourseFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Courses
                                    </SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id.toString()}
                                        >
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSearch}
                                    className="flex-1"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                >
                                    Reset Filters
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
                            data={safeEnrollments.data}
                            title={`Enrollments (${safeEnrollments.total})`}
                            emptyMessage="No enrollments found"
                            paginationLinks={safeEnrollments.links}
                            onPageChange={(url) => router.get(url)}
                            emptyAction={
                                <Button
                                    variant="create"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Create First Enrollment
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>

                <ConfirmationModal
                    isOpen={!!enrollmentToDelete}
                    onClose={() => setEnrollmentToDelete(null)}
                    onConfirm={handleDelete}
                    title="Remove Enrollment"
                    description={`Are you sure you want to remove ${enrollmentToDelete?.student.name}'s enrollment in ${enrollmentToDelete?.course.title}?`}
                    confirmText="Remove"
                    isDestructive={true}
                    isLoading={loading === enrollmentToDelete?.id}
                />

                {/* Create Enrollment Modal */}
                <Dialog open={showCreateModal} onOpenChange={(open) => !open && setShowCreateModal(false)}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Create New Enrollment</DialogTitle>
                            <DialogDescription>Manually enroll a student in a course</DialogDescription>
                        </DialogHeader>
                                <form
                                    onSubmit={handleCreateSubmit}
                                    className="flex-1 overflow-y-auto p-1"
                                >
                                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                        <div className="space-y-6 lg:col-span-2">
                                            {/* Student Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="student_id">
                                                    Student{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={
                                                        createData.student_id
                                                    }
                                                    onValueChange={(val) =>
                                                        setCreateData(
                                                            'student_id',
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select a student" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {students.map(
                                                            (student) => (
                                                                <SelectItem
                                                                    key={
                                                                        student.id
                                                                    }
                                                                    value={student.id.toString()}
                                                                >
                                                                    <div className="flex flex-col items-start py-1">
                                                                        <span className="font-bold text-slate-800">
                                                                            {
                                                                                student.name
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-slate-500">
                                                                            {
                                                                                student.email
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {createErrors.student_id && (
                                                    <p className="mt-1 text-xs font-bold text-rose-500 uppercase">
                                                        {
                                                            createErrors.student_id
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Course Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="course_id">
                                                    Course{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={createData.course_id}
                                                    onValueChange={(val) =>
                                                        setCreateData(
                                                            'course_id',
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select a course" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {courses.map(
                                                            (course) => (
                                                                <SelectItem
                                                                    key={
                                                                        course.id
                                                                    }
                                                                    value={course.id.toString()}
                                                                >
                                                                    <div className="flex flex-col items-start py-1">
                                                                        <span className="font-bold text-slate-800">
                                                                            {
                                                                                course.title
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs font-black text-emerald-600 uppercase">
                                                                            {Number(
                                                                                course.price ||
                                                                                    0,
                                                                            ) >
                                                                            0
                                                                                ? `$${Number(course.price || 0).toFixed(2)}`
                                                                                : 'FREE'}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {createErrors.course_id && (
                                                    <p className="mt-1 text-xs font-bold text-rose-500 uppercase">
                                                        {createErrors.course_id}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Notes */}
                                            <div className="space-y-2">
                                                <Label htmlFor="notes">
                                                    Notes (Optional)
                                                </Label>
                                                <Textarea
                                                    id="notes"
                                                    placeholder="Add any internal notes about this enrollment..."
                                                    value={createData.notes}
                                                    onChange={(e) =>
                                                        setCreateData(
                                                            'notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="min-h-[120px] resize-none"
                                                />
                                                {createErrors.notes && (
                                                    <p className="mt-1 text-xs font-bold text-rose-500 uppercase">
                                                        {createErrors.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sidebar Info */}
                                        <div className="space-y-4">
                                            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                                                    Enrollment Info
                                                </h3>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Payment
                                                        </span>
                                                        <Badge className="border-none bg-emerald-50 text-[9px] font-black text-emerald-700 uppercase">
                                                            FREE
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Status
                                                        </span>
                                                        <Badge className="border-none bg-blue-50 text-[9px] font-black text-blue-700 uppercase">
                                                            ACTIVE
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                            Date
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-800 uppercase">
                                                            {new Date().toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-200 pt-4">
                                                    <p className="text-[10px] leading-relaxed text-slate-500 italic">
                                                        * Admin enrollments
                                                        bypass payment gateways
                                                        and are activated
                                                        immediately.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Selected Student Summary */}
                                            {createData.student_id && (
                                                <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                                                        <UserIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black tracking-tight text-indigo-400 uppercase">
                                                            Student
                                                        </p>
                                                        <p className="truncate text-sm font-bold text-indigo-900">
                                                            {
                                                                students.find(
                                                                    (s) =>
                                                                        s.id.toString() ===
                                                                        createData.student_id,
                                                                )?.name
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selected Course Summary */}
                                            {createData.course_id && (
                                                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black tracking-tight text-blue-400 uppercase">
                                                            Course
                                                        </p>
                                                        <p className="truncate text-sm font-bold text-blue-900">
                                                            {
                                                                courses.find(
                                                                    (c) =>
                                                                        c.id.toString() ===
                                                                        createData.course_id,
                                                                )?.title
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="mt-6 flex items-center justify-end gap-3 border-t pt-6">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            variant="create"
                                            disabled={createProcessing}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {createProcessing ? 'Enrolling...' : 'Enroll Student'}
                                        </Button>
                                    </div>
                                </form>
                    </DialogContent>
                </Dialog>
                {/* View Enrollment Modal */}
                <Dialog open={showViewModal && !!selectedEnrollment} onOpenChange={(open) => {
                    if (!open) {
                        setShowViewModal(false);
                        setViewData(null);
                        setSelectedEnrollment(null);
                        setCompletedLessonIds([]);
                        setActionReason('');
                        setAdminNotes('');
                        setRejectionReason('');
                        setIsProcessingAction(false);
                    }
                }}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Enrollment Details</DialogTitle>
                            <DialogDescription>Viewing student progress and enrollment info</DialogDescription>
                        </DialogHeader>
                        {viewData ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {/* Student Details Card */}
                                <Card className="md:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-800 uppercase">
                                            <UserIcon className="h-4 w-4" /> Student Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Name</p>
                                            <p className="text-base font-semibold text-slate-900">{viewData.student.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Email</p>
                                            <p className="text-base font-semibold text-slate-900">{viewData.student.email}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Course Details Card */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-800 uppercase">
                                            <BookOpen className="h-4 w-4" /> Course Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Title</p>
                                            <p className="text-base font-semibold text-slate-900">{viewData.course.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Instructor</p>
                                            <p className="text-base font-semibold text-slate-900">{viewData.course.instructor.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Price Paid</p>
                                            <p className="text-base font-semibold text-slate-900">
                                                {Number(viewData.amount_paid || 0) > 0
                                                    ? `$${Number(viewData.amount_paid).toFixed(2)}`
                                                    : 'FREE'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Enrollment Status Card */}
                                <Card className="md:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black tracking-tight text-slate-800 uppercase">Enrollment Status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Status</span>
                                            {getStatusBadge(viewData.status)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Payment Status</span>
                                            {getPaymentStatusBadge(viewData.payment_status)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Enrollment Date</span>
                                            <span className="text-base font-semibold text-slate-900">{new Date(viewData.enrollment_date).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Curriculum Progress Card */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black tracking-tight text-slate-800 uppercase">Curriculum Progress</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black text-indigo-600">{Math.round(Number(viewData.progress || 0))}%</span>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-500">Completed Lessons</p>
                                                <p className="text-lg font-semibold text-slate-900">{completedLessonIds.length}/{viewData.course.lessons.length}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {viewData.course.lessons.map((lesson: any) => {
                                                const isCompleted = completedLessonIds.includes(lesson.id);
                                                const isToggling = isTogglingLesson === lesson.id;
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                            isCompleted
                                                                ? 'bg-emerald-50 border-emerald-100'
                                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                                                isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                                {lesson.order}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                                    {lesson.title}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase">{lesson.type}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleLessonStatus(lesson.id, isCompleted)}
                                                            disabled={isToggling}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                                                                isCompleted
                                                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                                    : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                                                            }`}
                                                        >
                                                            {isToggling ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : isCompleted ? (
                                                                <CheckCircle className="h-4 w-4" />
                                                            ) : (
                                                                <Circle className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Management Actions Card */}
                                <Card className="md:col-span-3">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black tracking-tight text-slate-800 uppercase">Management Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {viewData.status === 'Refund Requested' ? (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-900">Refund Requested</p>
                                                        <p className="text-xs text-amber-700 mt-1">Student has requested a refund for this enrollment. Please review and take action.</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                        onClick={() => setShowApproveModal(true)}
                                                    >
                                                        Approve Refund
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
                                                        onClick={() => setShowRejectModal(true)}
                                                    >
                                                        Reject Request
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Action Reason / Notes</Label>
                                                    <Textarea
                                                        placeholder="Reason for refund or cancellation..."
                                                        value={actionReason}
                                                        onChange={(e) => setActionReason(e.target.value)}
                                                        className="min-h-[80px] border-slate-100 bg-slate-50 focus:ring-indigo-500/20"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    {viewData.payment_status === 'Completed' ? (
                                                        <div className="flex-1 space-y-1">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full border-purple-100 text-purple-600 hover:bg-purple-50 font-bold"
                                                                onClick={handleRefund}
                                                                disabled={isProcessingAction || viewData.status === 'Refunded'}
                                                            >
                                                                Refund & Revoke Access
                                                            </Button>
                                                            <p className="text-[10px] text-slate-500">
                                                                Returns payment and revokes access.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 space-y-1">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full border-rose-100 text-rose-600 hover:bg-rose-50 font-bold"
                                                                onClick={handleCancel}
                                                                disabled={isProcessingAction || viewData.status === 'Cancelled'}
                                                            >
                                                                Cancel Enrollment
                                                            </Button>
                                                            <p className="text-[10px] text-slate-500">
                                                                Revokes access without refund.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            null
                        )}

                        <div className="mt-6 flex items-center justify-end border-t pt-6">
                            <Button variant="outline" onClick={() => setShowViewModal(false)}>Close Details</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Approve Refund Modal */}
                <Dialog open={showApproveModal} onOpenChange={(open) => !open && setShowApproveModal(false)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-emerald-700">Approve Refund</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this refund? The enrollment will be marked as Refunded and a virtual refund record will be created.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                                <Textarea 
                                    id="admin_notes"
                                    placeholder="Add notes about this refund approval..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleApproveRefund}
                                disabled={isProcessingAction}
                            >
                                {isProcessingAction ? 'Processing...' : 'Approve Refund'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Refund Modal */}
                <Dialog open={showRejectModal} onOpenChange={(open) => !open && setShowRejectModal(false)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-rose-700">Reject Refund Request</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this refund request. The student will see this reason.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="rejection_reason">Rejection Reason <span className="text-red-500">*</span></Label>
                                <Textarea 
                                    id="rejection_reason"
                                    placeholder="Reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                            <Button 
                                variant="destructive"
                                onClick={handleRejectRefund}
                                disabled={isProcessingAction || !rejectionReason.trim()}
                            >
                                {isProcessingAction ? 'Processing...' : 'Reject Refund'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Enrollment Modal */}
                <Dialog open={showEditModal} onOpenChange={(open) => !open && setShowEditModal(false)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Enrollment</DialogTitle>
                            <DialogDescription>Update status and enrollment details</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="edit_status">Status</Label>
                                <Select 
                                    value={editData.status} 
                                    onValueChange={(val) => setEditData('status', val)}
                                >
                                    <SelectTrigger id="edit_status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(allStatuses).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expiry_date">Expiry Date</Label>
                                <Input 
                                    id="expiry_date"
                                    type="date"
                                    value={editData.expiry_date}
                                    onChange={(e) => setEditData('expiry_date', e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400">Leave empty for lifetime access</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_notes">Notes</Label>
                                <Textarea 
                                    id="edit_notes"
                                    value={editData.notes}
                                    onChange={(e) => setEditData('notes', e.target.value)}
                                    placeholder="Enrollment notes..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={editProcessing}>
                                    {editProcessing ? 'Saving...' : 'Update Enrollment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
