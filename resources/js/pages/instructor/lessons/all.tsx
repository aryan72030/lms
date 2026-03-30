import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, Trash2, FileText, Play, HelpCircle, ClipboardList, Clock, Filter } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Lesson {
    id: number;
    title: string;
    description?: string;
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
    };
    created_at: string;
}

interface Props {
    lessons: {
        data: Lesson[];
        links: any[];
        meta: any;
    };
    courses: Array<{
        id: number;
        title: string;
    }>;
    lessonTypes: string[];
    filters: {
        search?: string;
        course_id?: string;
        type?: string;
    };
}

export default function InstructorLessonsAll({ lessons, courses, lessonTypes, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const lessonMessages = useActionMessages('Lesson');

    const handleSearch = () => {
        router.get('/instructor/lessons', {
            search: search || undefined,
            course_id: courseFilter || undefined,
            type: typeFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setCourseFilter('');
        setTypeFilter('');
        router.get('/instructor/lessons');
    };

    const handleDelete = () => {
        if (!lessonToDelete) return;

        setLoading(lessonToDelete.id);
        router.delete(`/instructor/lessons/${lessonToDelete.id}`, {
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

    const getTypeIcon = (iconName: string) => {
        switch (iconName) {
            case 'FileText': return <FileText className="h-4 w-4" />;
            case 'Play': return <Play className="h-4 w-4" />;
            case 'HelpCircle': return <HelpCircle className="h-4 w-4" />;
            case 'ClipboardList': return <ClipboardList className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeColorClass = (color: string) => {
        const baseClass = 'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full';

        switch (color) {
            case 'blue': return `${baseClass} bg-blue-100 text-blue-800`;
            case 'red': return `${baseClass} bg-red-100 text-red-800`;
            case 'green': return `${baseClass} bg-green-100 text-green-800`;
            case 'purple': return `${baseClass} bg-purple-100 text-purple-800`;
            default: return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const getCourseStatusColor = (status: string) => {
        switch (status) {
            case 'Published': return 'text-green-600';
            case 'Review': return 'text-yellow-600';
            case 'Draft': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'Lesson Management', href: '/instructor/lessons' }
        ]}>
            <Head title="Lesson Management" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Lesson Management</h1>
                        <p className="text-gray-600">Create and manage lessons across all your courses</p>
                    </div>
                    <Button variant="create" asChild>
                        <Link href="/instructor/lessons/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lesson
                        </Link>
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search lessons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        </div>
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Types</option>
                            {lessonTypes.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleSearch} className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Lessons Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Lessons ({lessons.meta?.total || 0})
                        </h2>
                    </div>
                    
                    {lessons.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lesson</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {lessons.data.map((lesson) => (
                                        <tr key={lesson.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                                                    {lesson.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {lesson.description}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Order: {lesson.order}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {lesson.course.title}
                                                    </div>
                                                    <div className={`text-xs ${getCourseStatusColor(lesson.course.status)}`}>
                                                        {lesson.course.status}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getTypeColorClass(lesson.type_color)}>
                                                    {getTypeIcon(lesson.type_icon)}
                                                    <span className="ml-1">{lesson.type}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lesson.is_published ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {lesson.duration_display}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {lesson.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <ActionButtonGroup>
                                                    <ActionButton
                                                        variant="view"
                                                        icon={Eye}
                                                        href={`/instructor/lessons/${lesson.id}`}
                                                        title="View Lesson"
                                                    />
                                                    <ActionButton
                                                        variant="edit"
                                                        icon={Edit}
                                                        href={`/instructor/lessons/${lesson.id}/edit`}
                                                        title="Edit Lesson"
                                                    />
                                                    <ActionButton
                                                        variant="delete"
                                                        icon={Trash2}
                                                        onClick={() => setLessonToDelete(lesson)}
                                                        title="Delete Lesson"
                                                    />
                                                </ActionButtonGroup>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <FileText className="h-12 w-12 mx-auto" />
                            </div>
                            <p className="text-gray-500 text-lg mb-4">No lessons found</p>
                            <p className="text-gray-400 mb-6">Create lessons to build your course content</p>
                            <Button variant="create" asChild>
                                <Link href="/instructor/lessons/create">
                                    Create Your First Lesson
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {lessons.links && lessons.data.length > 0 && (
                    <PaginationLinks links={lessons.links} onPageChange={(url) => router.get(url)} />
                )}

                {/* Lesson Types Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Available Lesson Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Text - Written content</span>
                        </div>
                        <div className="flex items-center">
                            <Play className="h-4 w-4 mr-2" />
                            <span>Video - Video lessons</span>
                        </div>
                        <div className="flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            <span>Quiz - Interactive quizzes</span>
                        </div>
                        <div className="flex items-center">
                            <ClipboardList className="h-4 w-4 mr-2" />
                            <span>Assignment - Student tasks</span>
                        </div>
                    </div>
                </div>
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
