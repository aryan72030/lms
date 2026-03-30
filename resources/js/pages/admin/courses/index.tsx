import * as Dialog from '@radix-ui/react-dialog';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, CheckCircle, XCircle, Archive, RotateCcw, Plus, X, Trash2, Send, Eye, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    objectives?: string;
    price: number;
    duration_hours: number;
    difficulty_level: string;
    status: string;
    status_label: string;
    status_color: string;
    instructor: {
        id: number;
        name: string;
        email: string;
    };
    category: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    } | null;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    approved_at?: string | null;
    published_at?: string | null;
    created_at: string;
    can_be_approved: boolean;
    can_be_republished: boolean;
}

interface Props {
    courses: {
        data: Course[];
        total: number;
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
        status?: string;
    };
    statuses: string[];
    categories: Array<{ id: number; name: string }>;
    instructors: Array<{ id: number; name: string; email: string }>;
    difficultyLevels: string[];
}

interface CourseFormData {
    title: string;
    description: string;
    objectives: string;
    price: string;
    duration_hours: string;
    difficulty_level: string;
    instructor_id: string;
    category_id: string;
}

interface ValidationErrors {
    [key: string]: string[] | undefined;
}

export default function AdminCoursesIndex({ courses, filters, statuses, categories, instructors, difficultyLevels }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [showRejectModal, setShowRejectModal] = useState<Course | null>(null);
    const [showViewModal, setShowViewModal] = useState<Course | null>(null);
    const [courseToApprove, setCourseToApprove] = useState<Course | null>(null);
    const [courseToArchive, setCourseToArchive] = useState<Course | null>(null);
    const [courseToRepublish, setCourseToRepublish] = useState<Course | null>(null);
    const [courseToForceSubmit, setCourseToForceSubmit] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const courseMessages = useActionMessages('Course');

    const handleSearch = () => {
        router.get('/admin/courses', {
            search: search || undefined,
            status: statusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const handleApprove = async () => {
        if (!courseToApprove) return;

        setLoading(courseToApprove.id);

        try {
            const response = await fetch(`/admin/courses/${courseToApprove.id}/approve`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('approve');
                window.location.reload();
            } else {
                courseMessages.error('approve', 'Course', data.message);
            }
        } catch (error) {
            courseMessages.error('approve');
        } finally {
            setLoading(null);
            setCourseToApprove(null);
        }
    };

    const handleReject = async () => {
        if (!showRejectModal || !rejectionReason.trim()) {
return;
}

        setLoading(showRejectModal.id);

        try {
            const response = await fetch(`/admin/courses/${showRejectModal.id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ reason: rejectionReason }),
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('reject');
                setShowRejectModal(null);
                setRejectionReason('');
                window.location.reload();
            } else {
                courseMessages.error('reject', 'Course', data.message);
            }
        } catch (error) {
            courseMessages.error('reject');
        } finally {
            setLoading(null);
        }
    };

    const handleArchive = async () => {
        if (!courseToArchive) return;

        setLoading(courseToArchive.id);

        try {
            const response = await fetch(`/admin/courses/${courseToArchive.id}/archive`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('archive');
                window.location.reload();
            } else {
                courseMessages.error('archive', 'Course', data.message);
            }
        } catch (error) {
            courseMessages.error('archive');
        } finally {
            setLoading(null);
            setCourseToArchive(null);
        }
    };

    const handleRepublish = async () => {
        if (!courseToRepublish) return;

        setLoading(courseToRepublish.id);

        try {
            const response = await fetch(`/admin/courses/${courseToRepublish.id}/republish`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('republish');
                window.location.reload();
            } else {
                courseMessages.error('republish', 'Course', data.message);
            }
        } catch (error) {
            courseMessages.error('republish');
        } finally {
            setLoading(null);
            setCourseToRepublish(null);
        }
    };

    const handleForceSubmit = async () => {
        if (!courseToForceSubmit) return;

        setLoading(courseToForceSubmit.id);

        try {
            const response = await fetch(`/admin/courses/${courseToForceSubmit.id}/force-submit`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('submit');
                window.location.reload();
            } else {
                courseMessages.error('submit', 'Course', data.message);
            }
        } catch (error) {
            courseMessages.error('submit');
        } finally {
            setLoading(null);
            setCourseToForceSubmit(null);
        }
    };

    const handleDelete = async () => {
        if (!courseToDelete) return;

        setLoading(courseToDelete.id);

        try {
            const response = await fetch(`/admin/courses/${courseToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                courseMessages.success('delete');
                window.location.reload();
            } else {
                courseMessages.error('delete');
            }
        } catch (error) {
            courseMessages.error('delete');
        } finally {
            setLoading(null);
            setCourseToDelete(null);
        }
    };

    const getStatusBadgeClass = (color: string) => {
        const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';

        switch (color) {
            case 'gray': return `${baseClass} bg-gray-100 text-gray-800`;
            case 'yellow': return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'green': return `${baseClass} bg-green-100 text-green-800`;
            case 'red': return `${baseClass} bg-red-100 text-red-800`;
            default: return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    // Define table columns
    const columns = [
        {
            key: 'title',
            label: 'Course',
            render: (value: string, course: Course) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{course.title}</div>
                    <div className="text-sm text-gray-500">{course.difficulty_level} • {course.duration_hours}h</div>
                    {course.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1">
                            Rejected: {course.rejection_reason}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'instructor',
            label: 'Instructor',
            render: (value: any, course: Course) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{course.instructor.name}</div>
                    <div className="text-xs text-gray-500">{course.instructor.email}</div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (value: any, course: Course) => (
                <span className="text-sm text-gray-500">{course.category.name}</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string, course: Course) => (
                <div>
                    <span className={getStatusBadgeClass(course.status_color)}>
                        {course.status_label}
                    </span>
                    {course.submitted_at && (
                        <div className="text-xs text-gray-500 mt-1">
                            Submitted: {course.submitted_at}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'price',
            label: 'Price',
            render: (value: number) => (
                <span className="text-sm text-gray-500">${value}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, course: Course) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={FileText}
                        href={`/admin/courses/${course.id}/lessons`}
                        title="Manage Lessons"
                    />
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        onClick={() => setShowViewModal(course)}
                        title="View Course Details"
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        href={`/admin/courses/${course.id}/edit`}
                        title="Edit Course"
                    />
                    {course.status === 'Draft' && (
                        <ActionButton
                            variant="approve"
                            icon={Send}
                            onClick={() => setCourseToForceSubmit(course)}
                            disabled={loading === course.id}
                            title="Submit for Review"
                        />
                    )}
                    
                    {course.can_be_approved && (
                        <>
                            <ActionButton
                                variant="approve"
                                icon={CheckCircle}
                                onClick={() => setCourseToApprove(course)}
                                disabled={loading === course.id}
                                title="Approve Course"
                            />
                            <ActionButton
                                variant="reject"
                                icon={XCircle}
                                onClick={() => setShowRejectModal(course)}
                                disabled={loading === course.id}
                                title="Reject Course"
                            />
                        </>
                    )}
                    
                    {course.status === 'Published' && (
                        <ActionButton
                            variant="archive"
                            icon={Archive}
                            onClick={() => setCourseToArchive(course)}
                            disabled={loading === course.id}
                            title="Archive Course"
                        />
                    )}
                    
                    {course.can_be_republished && (
                        <ActionButton
                            variant="approve"
                            icon={RotateCcw}
                            onClick={() => setCourseToRepublish(course)}
                            disabled={loading === course.id}
                            title="Republish Course"
                        />
                    )}
                    
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setCourseToDelete(course)}
                        disabled={loading === course.id}
                        title="Delete Course"
                    />
                </ActionButtonGroup>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Management', href: '/admin/courses' }
        ]}>
            <Head title="Course Management" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                        <p className="text-gray-600">Review and manage courses across the platform</p>
                    </div>
                    <Link href="/admin/courses/create">
                        <Button variant="create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Course
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((status: string) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSearch}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                                router.get('/admin/courses');
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Courses Table */}
                <DataTable
                    columns={columns}
                    data={courses.data}
                    title={`Courses (${courses.total})`}
                    emptyMessage="No courses found"
                    paginationLinks={courses.links}
                    onPageChange={(url) => router.get(url)}
                    emptyAction={
                        <Link href="/admin/courses/create">
                            <Button variant="create">
                                Create First Course
                            </Button>
                        </Link>
                    }
                />
            </div>

            {/* Simple Course Details Modal */}
            <Dialog.Root open={!!showViewModal} onOpenChange={() => setShowViewModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-lg data-[state=open]:animate-content-show focus:outline-none max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <Dialog.Title className="text-lg font-semibold text-gray-900">Course Details</Dialog.Title>
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-lg font-medium text-gray-900">{showViewModal?.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">{showViewModal?.category.name}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Instructor:</span>
                                    <p className="text-sm text-gray-900">{showViewModal?.instructor.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Price:</span>
                                    <p className="text-sm text-gray-900">${showViewModal?.price}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                                    <p className="text-sm text-gray-900">{showViewModal?.duration_hours} hours</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                                    <p className="text-sm text-gray-900">{showViewModal?.difficulty_level}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                    <span className={getStatusBadgeClass(showViewModal?.status_color || 'gray')}>
                                        {showViewModal?.status_label}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-sm font-medium text-gray-700">Description:</span>
                                <p className="text-sm text-gray-900 mt-1">{showViewModal?.description}</p>
                            </div>
                            
                            {showViewModal?.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <span className="text-sm font-medium text-red-700">Rejection Reason:</span>
                                    <p className="text-sm text-red-900 mt-1">{showViewModal.rejection_reason}</p>
                                </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                                Created: {showViewModal?.created_at}
                                {showViewModal?.submitted_at && (
                                    <span className="ml-4">Submitted: {showViewModal.submitted_at}</span>
                                )}
                                {showViewModal?.approved_at && (
                                    <span className="ml-4">Approved: {showViewModal.approved_at}</span>
                                )}
                                {showViewModal?.published_at && (
                                    <span className="ml-4">Published: {showViewModal.published_at}</span>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowViewModal(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Reject Modal */}
            <Dialog.Root open={!!showRejectModal} onOpenChange={() => {
                setShowRejectModal(null);
                setRejectionReason('');
            }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg data-[state=open]:animate-content-show focus:outline-none">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                            Reject Course: {showRejectModal?.title}
                        </Dialog.Title>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={4}
                                placeholder="Please provide a reason for rejection..."
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectionReason('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || loading === showRejectModal?.id}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading === showRejectModal?.id ? 'Rejecting...' : 'Reject Course'}
                            </button>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:text-gray-800"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <ConfirmationModal
                isOpen={!!courseToApprove}
                onClose={() => setCourseToApprove(null)}
                onConfirm={handleApprove}
                title="Approve Course"
                description={`Are you sure you want to approve "${courseToApprove?.title}"?`}
                confirmText="Approve"
            />

            <ConfirmationModal
                isOpen={!!courseToArchive}
                onClose={() => setCourseToArchive(null)}
                onConfirm={handleArchive}
                title="Archive Course"
                description={`Are you sure you want to archive "${courseToArchive?.title}"?`}
                confirmText="Archive"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={!!courseToRepublish}
                onClose={() => setCourseToRepublish(null)}
                onConfirm={handleRepublish}
                title="Republish Course"
                description={`Are you sure you want to republish "${courseToRepublish?.title}"?`}
                confirmText="Republish"
            />

            <ConfirmationModal
                isOpen={!!courseToForceSubmit}
                onClose={() => setCourseToForceSubmit(null)}
                onConfirm={handleForceSubmit}
                title="Submit for Review"
                description={`Are you sure you want to submit "${courseToForceSubmit?.title}" for review?`}
                confirmText="Submit"
            />

            <ConfirmationModal
                isOpen={!!courseToDelete}
                onClose={() => setCourseToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Course"
                description={`Are you sure you want to delete "${courseToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </AppLayout>
    );
}
