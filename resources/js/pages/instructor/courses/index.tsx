import * as Dialog from '@radix-ui/react-dialog';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Search, X, Send } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    price: number;
    duration_hours: number;
    difficulty_level: string;
    status: string;
    status_label: string;
    status_color: string;
    category: {
        id: number;
        name: string;
    };
    rejection_reason?: string | null;
    submitted_at?: string | null;
    published_at?: string | null;
    created_at: string;
    can_be_edited: boolean;
    can_be_submitted: boolean;
}

interface Props {
    courses: {
        data: Course[];
        total: number;
        links: Array<{
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
}

export default function InstructorCoursesIndex({ courses, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [showViewModal, setShowViewModal] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [courseToSubmit, setCourseToSubmit] = useState<Course | null>(null);
    const courseMessages = useActionMessages('Course');

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const handleSubmitForReview = async () => {
        if (!courseToSubmit) return;

        setLoading(courseToSubmit.id);

        try {
            const response = await fetch(`/instructor/courses/${courseToSubmit.id}/submit-for-review`, {
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
            setCourseToSubmit(null);
        }
    };

    const handleDelete = () => {
        if (courseToDelete) {
            router.delete(`/instructor/courses/${courseToDelete.id}`, {
                onSuccess: () => {
                    courseMessages.success('delete');
                    setCourseToDelete(null);
                },
                onError: () => {
                    courseMessages.error('delete');
                    setCourseToDelete(null);
                },
            });
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

    return (
        <AppLayout>
            <Head title="My Courses" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                        <p className="text-gray-600">Create and manage your courses</p>
                    </div>
                    <Link href="/instructor/courses/create">
                        <Button variant="create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Course
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <Link
                            href="/instructor/courses"
                            data={{ search: search || undefined, status: statusFilter || undefined }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Link>
                    </div>
                </div>

                {/* Courses Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Courses ({courses.total})</h2>
                    </div>
                    
                    {courses.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {courses.data.map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                                    <div className="text-sm text-gray-500">{course.difficulty_level} • {course.duration_hours}h</div>
                                                    {course.rejection_reason && (
                                                        <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded">
                                                            <strong>Rejected:</strong> {course.rejection_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {course.category.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getStatusBadgeClass(course.status_color)}>
                                                    {course.status_label}
                                                </span>
                                                {course.submitted_at && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Submitted: {course.submitted_at}
                                                    </div>
                                                )}
                                                {course.published_at && (
                                                    <div className="text-xs text-green-600 mt-1">
                                                        Published: {course.published_at}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                ${course.price}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {course.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <ActionButtonGroup>
                                                    <ActionButton
                                                        variant="view"
                                                        icon={Eye}
                                                        onClick={() => setShowViewModal(course)}
                                                        title="View Course"
                                                    />
                                                    
                                                    {course.can_be_edited && (
                                                        <ActionButton
                                                            variant="edit"
                                                            icon={Edit}
                                                            href={`/instructor/courses/${course.id}/edit`}
                                                            title="Edit Course"
                                                        />
                                                    )}
                                                    
                                                    {course.can_be_submitted && (
                                                        <ActionButton
                                                            variant="approve"
                                                            icon={Send}
                                                            onClick={() => setCourseToSubmit(course)}
                                                            disabled={loading === course.id}
                                                            title="Submit for Review"
                                                        />
                                                    )}
                                                    
                                                    {course.status !== 'Archived' && (
                                                        <ActionButton
                                                            variant="delete"
                                                            icon={Trash2}
                                                            onClick={() => setCourseToDelete(course)}
                                                            title="Delete Course"
                                                        />
                                                    )}
                                                </ActionButtonGroup>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">No courses found</p>
                            <Link href="/instructor/courses/create">
                                <Button variant="create">
                                    Create Your First Course
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {courses.data.length > 0 ? (
                    <PaginationLinks
                        links={courses.links}
                        onPageChange={(url) => router.get(url)}
                    />
                ) : null}
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
                            {showViewModal?.can_be_edited && (
                                <Link href={`/instructor/courses/${showViewModal.id}/edit`}>
                                    <Button variant="outline">
                                        Edit Course
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <ConfirmationModal
                isOpen={!!courseToDelete}
                onClose={() => setCourseToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Course"
                description={`Are you sure you want to delete "${courseToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={!!courseToSubmit}
                onClose={() => setCourseToSubmit(null)}
                onConfirm={handleSubmitForReview}
                title="Submit for Review"
                description={`Are you sure you want to submit "${courseToSubmit?.title}" for review? Once submitted, you won't be able to edit it until the review is complete.`}
                confirmText="Submit"
            />
        </AppLayout>
    );
}
