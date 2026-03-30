import { Head, Link, router } from '@inertiajs/react';
import { Edit, Trash2, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Lesson {
    id: number;
    title: string;
    description: string;
    type: string;
    type_icon: string;
    type_color: string;
    order: number;
    is_published: boolean;
    estimated_duration: number;
    duration_display: string;
    course: {
        id: number;
        title: string;
        status: string;
        instructor_name: string;
    };
    created_at: string;
}

interface Course {
    id: number;
    title: string;
    instructor_name: string;
}

interface Props {
    lessons: {
        data: Lesson[];
        total?: number;
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    courses: Course[];
    lessonTypes: string[];
    filters: {
        search?: string;
        course_id?: string;
        type?: string;
    };
}

export default function AdminLessonsAll({ lessons, courses, lessonTypes, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const lessonMessages = useActionMessages('Lesson');

    const handleSearch = () => {
        router.get('/admin/lessons', {
            search: search || undefined,
            course_id: courseFilter || undefined,
            type: typeFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (!lessonToDelete) return;

        setLoading(lessonToDelete.id);
        router.delete(`/admin/lessons/${lessonToDelete.id}`, {
            onSuccess: () => {
                lessonMessages.success('delete');
                setLessonToDelete(null);
            },
            onError: () => {
                lessonMessages.error('delete');
            },
            onFinish: () => {
                setLoading(null);
            },
        });
    };

    // Define table columns
    const columns = [
        {
            key: 'title',
            label: 'Lesson',
            render: (value: string, lesson: Lesson) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium text-white`} 
                              style={{ backgroundColor: lesson.type_color }}>
                            {lesson.type_icon}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        {lesson.type} • {lesson.duration_display}
                        {!lesson.is_published && <span className="ml-2 text-orange-600">(Draft)</span>}
                    </div>
                </div>
            )
        },
        {
            key: 'course',
            label: 'Course',
            render: (value: any, lesson: Lesson) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{lesson.course.title}</div>
                    <div className="text-sm text-gray-500">{lesson.course.instructor_name}</div>
                </div>
            )
        },
        {
            key: 'order',
            label: 'Order',
            render: (value: number) => (
                <span className="text-sm text-gray-500">#{value}</span>
            )
        },
        {
            key: 'is_published',
            label: 'Status',
            render: (value: boolean) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                }`}>
                    {value ? 'Published' : 'Draft'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, lesson: Lesson) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        href={`/admin/lessons/${lesson.id}/edit`}
                        title="Edit Lesson"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setLessonToDelete(lesson)}
                        disabled={loading === lesson.id}
                        title="Delete Lesson"
                    />
                </ActionButtonGroup>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Lesson Management', href: '/admin/lessons' }
        ]}>
            <Head title="Lesson Management" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Lesson Management</h1>
                        <p className="text-gray-600">Manage all lessons across courses</p>
                    </div>
                    <Button variant="create" asChild>
                        <Link href="/admin/lessons/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lesson
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search lessons..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title} ({course.instructor_name})
                                </option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Types</option>
                            {lessonTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
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
                                setCourseFilter('');
                                setTypeFilter('');
                                router.get('/admin/lessons');
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Lessons Table */}
                <DataTable
                    columns={columns}
                    data={lessons.data}
                    title={`Lessons (${lessons.data.length})`}
                    emptyMessage="No lessons found"
                    paginationLinks={lessons.links}
                    onPageChange={(url) => router.get(url)}
                    emptyAction={
                        <Button variant="create" asChild>
                            <Link href="/admin/lessons/create">
                                Create First Lesson
                            </Link>
                        </Button>
                    }
                />
            </div>

            <ConfirmationModal
                isOpen={!!lessonToDelete}
                onClose={() => setLessonToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Lesson"
                description={`Are you sure you want to delete "${lessonToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
                isLoading={loading === lessonToDelete?.id}
            />
        </AppLayout>
    );
}
