import { Head, Link, router, usePage } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Eye, Edit, Trash2, Search, X, Send, BookOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import AppLayout from '@/layouts/app-layout';
import { useNotification } from '@/contexts/notification-context';
import { useActionMessages } from '@/hooks/use-action-messages';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface FlashProps {
    success?: string;
    error?: string;
}

interface PageProps extends InertiaPageProps {
    flash: FlashProps;
}

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    objectives?: string;
    requirements?: string[] | string;
    target_audience?: string[] | string;
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
        total?: number;
        meta?: any;
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

export default function InstructorCoursesIndex({
    courses,
    filters,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [showViewModal, setShowViewModal] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [courseToSubmit, setCourseToSubmit] = useState<Course | null>(null);
    const { showSuccess, showError } = useNotification();
    const courseMessages = useActionMessages('Course');
    const { props: { flash } } = usePage<PageProps>();

    React.useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
        if (flash.error) {
            // showError(flash.error);
        }
    }, [flash]);

    const getCsrfToken = () => {
        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        return token || '';
    };

    const handleSubmitForReview = async () => {
        if (!courseToSubmit) return;

        setLoading(courseToSubmit.id);

        try {
            const response = await fetch(
                `/instructor/courses/${courseToSubmit.id}/submit-for-review`,
                {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        Accept: 'application/json',
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                courseMessages.success('submit');
                router.reload();
            } else {
                // courseMessages.error('submit', 'Course', data.message);
                showError(data.message);
            }
        } catch (error) {
            // courseMessages.error('submit');
            showError('Failed to submit course for review. Please try again.');
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
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0] as string | undefined;
                    if (firstError) {
                        courseMessages.error('delete', firstError);
                    }
                    setCourseToDelete(null);
                },
            });
        }
    };

    const getStatusBadgeClass = (color: string) => {
        const baseClass =
            'inline-flex px-2 py-1 text-xs font-semibold rounded-full';

        switch (color) {
            case 'gray':
                return `${baseClass} bg-gray-100 text-gray-800`;
            case 'yellow':
                return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'green':
                return `${baseClass} bg-green-100 text-green-800`;
            case 'red':
                return `${baseClass} bg-red-100 text-red-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const columns = [
        {
            key: 'title',
            label: 'Course',
            render: (value: string, course: Course) => (
                <div>
                    <div className="text-sm font-bold text-slate-700">
                        {course.title}
                    </div>
                    <div className="text-sm text-slate-500">
                        {course.difficulty_level} • {course.duration_hours}h
                    </div>
                    {course.rejection_reason && (
                        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600 border border-red-100">
                            <strong>Rejected:</strong> {course.rejection_reason}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            render: (value: any) => (
                <span className="text-sm text-slate-600">{value.name}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, course: Course) => (
                <div>
                    <span
                        className={getStatusBadgeClass(course.status_color)}
                    >
                        {course.status_label}
                    </span>
                    {course.submitted_at && (
                        <div className="mt-1 text-[10px] text-slate-400 font-medium">
                            Submitted: {course.submitted_at}
                        </div>
                    )}
                    {course.published_at && (
                        <div className="mt-1 text-[10px] text-emerald-600 font-medium">
                            Published: {course.published_at}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'price',
            label: 'Price',
            render: (value: number) => (
                <span className="text-sm font-bold text-slate-700">
                    ${value}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value: string) => (
                <span className="text-sm text-slate-500">{value}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_: any, course: Course) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        onClick={() => setShowViewModal(course)}
                        title="View Details"
                    />
                    <Link href={`/instructor/courses/${course.id}/edit`}>
                        <ActionButton
                            variant="edit"
                            icon={Edit}
                            title="Edit Course"
                        />
                    </Link>
                    {course.can_be_submitted && (
                        <ActionButton
                            variant="approve"
                            icon={Send}
                            onClick={() => setCourseToSubmit(course)}
                            disabled={loading === course.id}
                            title="Submit for Review"
                        />
                    )}
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setCourseToDelete(course)}
                        title="Delete Course"
                    />
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="My Courses" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title text-gray-900">
                            My Courses
                        </h1>
                        <p className="text-gray-600">
                            Create and manage your courses
                        </p>
                    </div>
                    <Link href="/instructor/courses/create">
                        <Button variant="create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Course
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <Link
                            href="/instructor/courses"
                            data={{
                                search: search || undefined,
                                status: statusFilter || undefined,
                            }}
                        >
                            <Button>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Courses Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={courses.data}
                            title={`Courses (${courses.meta?.total ?? courses.total ?? 0})`}
                            emptyMessage="No courses found"
                            paginationLinks={courses.links}
                            onPageChange={(url: string) => router.get(url)}
                            emptyAction={
                                <Link href="/instructor/courses/create">
                                    <Button variant="create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Your First Course
                                    </Button>
                                </Link>
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Course Details Modal */}
            <Dialog.Root
                open={!!showViewModal}
                onOpenChange={(open) => !open && setShowViewModal(null)}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="data-[state=open]:animate-overlay-show fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md" />
                    <Dialog.Content className="data-[state=open]:animate-content-show fixed top-1/2 left-1/2 z-[1001] max-h-[90vh] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-lg focus:outline-none">
                        {showViewModal && (
                            <>
                                <Dialog.Title className="mb-2 text-2xl font-bold text-gray-900">
                                    {showViewModal.title}
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button className="absolute top-4 right-4 rounded-full p-2 transition-colors hover:bg-gray-100">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </Dialog.Close>

                                <div className="mt-6 space-y-6">
                                    <div className="rounded-xl border bg-slate-50 p-4">
                                         <h4 className="mb-2 text-xs font-black tracking-widest text-slate-400 uppercase">
                                             Description
                                         </h4>
                                         <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                                             {showViewModal.description}
                                         </div>
                                     </div>

                                     {showViewModal.objectives && (
                                         <div className="rounded-xl border bg-slate-50 p-4">
                                             <h4 className="mb-2 text-xs font-black tracking-widest text-slate-400 uppercase">
                                                 Objectives
                                             </h4>
                                             <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                                                 {showViewModal.objectives}
                                             </div>
                                         </div>
                                     )}

                                     {showViewModal.requirements && (
                                         <div className="rounded-xl border bg-slate-50 p-4">
                                             <h4 className="mb-2 text-xs font-black tracking-widest text-slate-400 uppercase">
                                                 Requirements
                                             </h4>
                                             <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                                                 {Array.isArray(showViewModal.requirements) 
                                                     ? showViewModal.requirements.join('\n') 
                                                     : showViewModal.requirements}
                                             </div>
                                         </div>
                                     )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                Status
                                            </p>
                                            <span
                                                className={getStatusBadgeClass(
                                                    showViewModal.status_color,
                                                )}
                                            >
                                                {showViewModal.status_label}
                                            </span>
                                        </div>
                                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                Price
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                ${showViewModal.price}
                                            </p>
                                        </div>
                                    </div>

                                    {showViewModal.rejection_reason && (
                                        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                                            <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-red-800">
                                                <X className="h-4 w-4" />
                                                Rejection Reason
                                            </h4>
                                            <p className="text-sm leading-relaxed text-red-700 italic">
                                                "
                                                {showViewModal.rejection_reason}
                                                "
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 border-t pt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setShowViewModal(null)
                                            }
                                        >
                                            Close
                                        </Button>
                                        {showViewModal.can_be_edited && (
                                            <Link
                                                href={`/instructor/courses/${showViewModal.id}/edit`}
                                            >
                                                <Button>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Course
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
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
                description={`Are you sure you want to submit "${courseToSubmit?.title}" for admin review? You won't be able to edit it until it's reviewed.`}
                confirmText="Submit"
                isDestructive={false}
                isLoading={loading === courseToSubmit?.id}
            />
        </AppLayout>
    );
}
