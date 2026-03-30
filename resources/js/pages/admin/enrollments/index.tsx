import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, Edit, Trash2, Plus, Search, Filter, X, Save, User as UserIcon, BookOpen } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    enrollments: {
        data: Enrollment[];
        links: any[];
        meta: any;
    };
    courses: Array<{ id: number; title: string; price?: number | string | null }>;
    students: Student[];
    statuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
        course_id?: string;
    };
}

export default function Index({ enrollments, courses, students, statuses, paymentStatuses, filters }: Props) {
    const [selectedEnrollments, setSelectedEnrollments] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status || 'all');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || 'all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);
    const [bulkActionToConfirm, setBulkActionToConfirm] = useState<string | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const enrollmentMessages = useActionMessages('Enrollment');

    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors, reset: createReset } = useForm({
        student_id: '',
        course_id: '',
        notes: '',
    });

    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        status: '',
        progress: 0,
        notes: '',
    });

    const handleSearch = () => {
        router.get('/admin/enrollments', {
            search: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter,
            payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
            course_id: courseFilter === 'all' ? undefined : courseFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        setCourseFilter('all');
        router.get('/admin/enrollments');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEnrollments(enrollments.data.map(enrollment => enrollment.id));
        } else {
            setSelectedEnrollments([]);
        }
    };

    const handleSelectEnrollment = (enrollmentId: number, checked: boolean) => {
        if (checked) {
            setSelectedEnrollments([...selectedEnrollments, enrollmentId]);
        } else {
            setSelectedEnrollments(selectedEnrollments.filter(id => id !== enrollmentId));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkActionToConfirm || selectedEnrollments.length === 0) {
            return;
        }

        router.patch('/admin/enrollments/bulk-update', {
            enrollment_ids: selectedEnrollments,
            action: bulkActionToConfirm,
        }, {
            onSuccess: () => {
                enrollmentMessages.success('update');
                setBulkActionToConfirm(null);
                setSelectedEnrollments([]);
            },
            onError: () => {
                enrollmentMessages.error('update');
                setBulkActionToConfirm(null);
            },
        });
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
            progress: Number(enrollment.progress || 0),
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
                enrollmentMessages.success('update');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Enrollment Management', href: '/admin/enrollments' }
        ]}>
            <Head title="Enrollment Management" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Enrollment Management</h1>
                        <p className="text-muted-foreground">Manage student course enrollments</p>
                    </div>
                    <Button variant="create" onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
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
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students or courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
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
                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedEnrollments.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {selectedEnrollments.length} enrollment(s) selected
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBulkActionToConfirm('activate')}
                                    >
                                        Activate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBulkActionToConfirm('deactivate')}
                                    >
                                        Deactivate
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setBulkActionToConfirm('delete')}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Enrollments Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedEnrollments.length === enrollments.data.length && enrollments.data.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Enrollment Date</TableHead>
                                    <TableHead>Payment Status</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.data.map((enrollment) => (
                                    <TableRow key={enrollment.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedEnrollments.includes(enrollment.id)}
                                                onCheckedChange={(checked) => handleSelectEnrollment(enrollment.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{enrollment.student.name}</div>
                                                <div className="text-sm text-muted-foreground">{enrollment.student.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{enrollment.course.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                ${Number(enrollment.course.price || 0).toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{enrollment.course.instructor.name}</TableCell>
                                        <TableCell>
                                            {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{getPaymentStatusBadge(enrollment.payment_status)}</TableCell>
                                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                                        <TableCell>
                                            {enrollment.progress != null && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Number(enrollment.progress || 0)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm">{Number(enrollment.progress || 0).toFixed(1)}%</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <ActionButtonGroup>
                                                <ActionButton
                                                    variant="view"
                                                    icon={Eye}
                                                    href={`/admin/enrollments/${enrollment.id}`}
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {enrollments.links && (
                    <PaginationLinks links={enrollments.links} onPageChange={(url) => router.get(url)} />
                )}

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

                <ConfirmationModal
                    isOpen={!!bulkActionToConfirm}
                    onClose={() => setBulkActionToConfirm(null)}
                    onConfirm={handleBulkAction}
                    title="Bulk Action"
                    description={`Are you sure you want to ${bulkActionToConfirm} selected enrollments?`}
                    confirmText="Confirm"
                    isDestructive={bulkActionToConfirm === 'delete'}
                />

                {/* Create Enrollment Modal */}
                {showCreateModal && (
                    <Dialog.Root open={showCreateModal} onOpenChange={(open) => !open && setShowCreateModal(false)}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col data-[state=open]:animate-content-show focus:outline-none">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-gray-900">Create New Enrollment</Dialog.Title>
                                        <Dialog.Description className="text-sm text-gray-500">Manually enroll a student in a course</Dialog.Description>
                                    </div>
                                    <Dialog.Close asChild>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <X className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Student Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="student_id">Student <span className="text-red-500">*</span></Label>
                                                <Select value={createData.student_id} onValueChange={(val) => setCreateData('student_id', val)}>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select a student" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {students.map((student) => (
                                                            <SelectItem key={student.id} value={student.id.toString()}>
                                                                <div className="flex flex-col items-start py-1">
                                                                    <span className="font-bold text-slate-800">{student.name}</span>
                                                                    <span className="text-xs text-slate-500">{student.email}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {createErrors.student_id && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{createErrors.student_id}</p>}
                                            </div>

                                            {/* Course Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="course_id">Course <span className="text-red-500">*</span></Label>
                                                <Select value={createData.course_id} onValueChange={(val) => setCreateData('course_id', val)}>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select a course" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {courses.map((course) => (
                                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                                <div className="flex flex-col items-start py-1">
                                                                    <span className="font-bold text-slate-800">{course.title}</span>
                                                                    <span className="text-xs text-emerald-600 font-black uppercase">
                                                                        {Number(course.price || 0) > 0 ? `$${Number(course.price || 0).toFixed(2)}` : 'FREE'}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {createErrors.course_id && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{createErrors.course_id}</p>}
                                            </div>

                                            {/* Notes */}
                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Notes (Optional)</Label>
                                                <Textarea
                                                    id="notes"
                                                    placeholder="Add any internal notes about this enrollment..."
                                                    value={createData.notes}
                                                    onChange={(e) => setCreateData('notes', e.target.value)}
                                                    className="min-h-[120px] resize-none"
                                                />
                                                {createErrors.notes && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{createErrors.notes}</p>}
                                            </div>
                                        </div>

                                        {/* Sidebar Info */}
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Enrollment Info</h3>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Payment</span>
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase">FREE</Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                                                        <Badge className="bg-blue-50 text-blue-700 border-none text-[9px] font-black uppercase">ACTIVE</Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Date</span>
                                                        <span className="text-[10px] font-black text-slate-800 uppercase">{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-200">
                                                    <p className="text-[10px] leading-relaxed text-slate-500 italic">
                                                        * Admin enrollments bypass payment gateways and are activated immediately.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Selected Student Summary */}
                                            {createData.student_id && (
                                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <UserIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">Student</p>
                                                        <p className="text-sm font-bold text-indigo-900 truncate">
                                                            {students.find(s => s.id.toString() === createData.student_id)?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selected Course Summary */}
                                            {createData.course_id && (
                                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-tight">Course</p>
                                                        <p className="text-sm font-bold text-blue-900 truncate">
                                                            {courses.find(c => c.id.toString() === createData.course_id)?.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
                                        <Dialog.Close asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-6 rounded-xl font-bold uppercase text-[10px]"
                                            >
                                                Cancel
                                            </Button>
                                        </Dialog.Close>
                                        <Button
                                            type="submit"
                                            variant="create"
                                            disabled={createProcessing}
                                            className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] shadow-lg shadow-indigo-100"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {createProcessing ? 'Enrolling...' : 'Enroll Student'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                )}
                {/* Edit Enrollment Modal */}
                {showEditModal && selectedEnrollment && (
                    <Dialog.Root open={showEditModal} onOpenChange={(open) => !open && setShowEditModal(false)}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col data-[state=open]:animate-content-show focus:outline-none">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-gray-900">Update Enrollment</Dialog.Title>
                                        <Dialog.Description className="text-sm text-gray-500">
                                            {selectedEnrollment.student.name} — {selectedEnrollment.course.title}
                                        </Dialog.Description>
                                    </div>
                                    <Dialog.Close asChild>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <X className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Status Selection */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_status">Enrollment Status <span className="text-red-500">*</span></Label>
                                            <Select value={editData.status} onValueChange={(val) => setEditData('status', val)}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(statuses).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {editErrors.status && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{editErrors.status}</p>}
                                        </div>

                                        {/* Progress Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_progress">Progress (%)</Label>
                                            <Input
                                                id="edit_progress"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editData.progress}
                                                onChange={(e) => setEditData('progress', parseInt(e.target.value) || 0)}
                                                className="h-12"
                                                placeholder="0"
                                            />
                                            {editErrors.progress && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{editErrors.progress}</p>}
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Setting to 100% marks it as completed.</p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit_notes">Notes (Optional)</Label>
                                        <Textarea
                                            id="edit_notes"
                                            placeholder="Update internal notes..."
                                            value={editData.notes}
                                            onChange={(e) => setEditData('notes', e.target.value)}
                                            className="min-h-[120px] resize-none"
                                        />
                                        {editErrors.notes && <p className="text-xs font-bold text-rose-500 uppercase mt-1">{editErrors.notes}</p>}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                                        <Dialog.Close asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-6 rounded-xl font-bold uppercase text-[10px]"
                                            >
                                                Cancel
                                            </Button>
                                        </Dialog.Close>
                                        <Button
                                            type="submit"
                                            variant="create"
                                            disabled={editProcessing}
                                            className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] shadow-lg shadow-indigo-100"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {editProcessing ? 'Updating...' : 'Update Enrollment'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                )}
            </div>
        </AppLayout>
    );
}
