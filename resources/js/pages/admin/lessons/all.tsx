import { Head, Link, router } from '@inertiajs/react';
import { Edit, Trash2, Plus, Globe, GlobeLock, Search, Eye, X, FileText, Play, Clock, HelpCircle, ClipboardList } from 'lucide-react';
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useNotification } from '@/contexts/notification-context';

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
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    course: {
        id: number;
        title: string;
        status: string;
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

export default function AdminLessonsAll({
    lessons,
    courses,
    lessonTypes,
    filters,
}: Props) {
    console.log('Dialog.Close:', Dialog.Close);
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [togglingPublish, setTogglingPublish] = useState<number | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [showViewModal, setShowViewModal] = useState<Lesson | null>(null);
    const { showError } = useNotification();

    const getVideoEmbedUrl = (url: string): string | null => {
        if (!url) return null;

        const youtubeMatch = url.match(
            /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|)([\s\S]+))|(?:https?:\/\/(?:www\.)?youtu\.be\/([\s\S]+))/
        );
        if (youtubeMatch) {
            const videoId = youtubeMatch[1] || youtubeMatch[2];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        const vimeoMatch = url.match(
            /(?:https?:\/\/(?:www\.)?vimeo\.com\/(?:video\/|)([0-9]+))/i
        );
        if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            return `https://player.vimeo.com/video/${videoId}`;
        }

        return null;
    };

    const renderLessonContent = (lesson: Lesson) => {
        if (!lesson) return null;

        switch (lesson.type) {
            case 'Text':
                return (
                    <div className="prose max-w-none">
                        {lesson.text_content ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: lesson.text_content,
                                }}
                            />
                        ) : (
                            <p>No text content available.</p>
                        )}
                    </div>
                );
            case 'Video':
                const embedUrl = lesson.video_url
                    ? getVideoEmbedUrl(lesson.video_url)
                    : null;
                return (
                    <div>
                        {embedUrl ? (
                            <div className="relative aspect-video w-full">
                                <iframe
                                    className="absolute left-0 top-0 h-full w-full rounded-md"
                                    src={embedUrl}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={lesson.title}
                                ></iframe>
                            </div>
                        ) : (
                            <p>No valid video URL provided or supported.</p>
                        )}
                        {lesson.video_duration && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                <Clock className="mr-1 h-4 w-4" />
                                {lesson.video_duration} minutes
                            </div>
                        )}
                    </div>
                );
            default:
                return <p>Unsupported lesson type.</p>;
        }
    };

    const getTypeIcon = (iconName: string) => {
        switch (iconName) {
            case 'FileText':
                return <FileText className="h-4 w-4" />;
            case 'Play':
                return <Play className="h-4 w-4" />;
            case 'HelpCircle':
                return <HelpCircle className="h-4 w-4" />;
            case 'ClipboardList':
                return <ClipboardList className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeColorClass = (color: string) => {
        const baseClass =
            'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full';

        switch (color) {
            case 'blue':
                return `${baseClass} bg-blue-100 text-blue-800`;
            case 'red':
                return `${baseClass} bg-red-100 text-red-800`;
            case 'green':
                return `${baseClass} bg-green-100 text-green-800`;
            case 'purple':
                return `${baseClass} bg-purple-100 text-purple-800`;
            default:
                return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const getCourseStatusColor = (status: string) => {
        switch (status) {
            case 'Published':
                return 'text-green-600';
            case 'Review':
                return 'text-yellow-600';
            case 'Draft':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const handleSearch = () => {
        router.get(
            '/admin/lessons',
            {
                search: search || undefined,
                course_id: courseFilter || undefined,
                type: typeFilter || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const togglePublish = (lesson: Lesson) => {
        setTogglingPublish(lesson.id);
        router.patch(
            `/admin/lessons/${lesson.id}/toggle-publish`,
            {},
            {
                onSuccess: () => {
                    // Backend provides the success message
                },
                onError: (err: any) => {
                    showError(err.response?.data?.message || 'Failed to update lesson status.');
                },
                onFinish: () => {
                    setTogglingPublish(null);
                },
                preserveScroll: true,
            },
        );
    };

    const handleDelete = () => {
        if (!lessonToDelete) return;

        setLoading(lessonToDelete.id);
        router.delete(`/admin/lessons/${lessonToDelete.id}`, {
            onSuccess: () => {
                setLessonToDelete(null);
            },
            onError: (err: any) => {
                showError(err.response?.data?.message || 'Failed to delete lesson.');
            },
            onFinish: () => {
                setLoading(null);
            },
        });
    };

    const columns = [
        {
            key: 'lesson',
            label: 'Lesson',
            render: (_: any, lesson: Lesson) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {lesson.title}
                    </div>
                    {lesson.description && (
                        <div className="max-w-xs truncate text-sm text-gray-500">
                            {lesson.description}
                        </div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                        Order: {lesson.order}
                    </div>
                </div>
            ),
        },
        {
            key: 'course',
            label: 'Course',
            render: (_: any, lesson: Lesson) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {lesson.course.title}
                    </div>
                    <div
                        className={`text-xs ${getCourseStatusColor(lesson.course.status)}`}
                    >
                        {lesson.course.status}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            render: (_: any, lesson: Lesson) => (
                <span className={getTypeColorClass(lesson.type_color)}>
                    {getTypeIcon(lesson.type_icon)}
                    <span className="ml-1">{lesson.type}</span>
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, lesson: Lesson) =>
                lesson.is_published ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Published
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                        Draft
                    </span>
                ),
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (_: any, lesson: Lesson) => (
                <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    {lesson.duration_display}
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (_: any, lesson: Lesson) => (
                <span className="text-sm text-gray-500">{lesson.created_at}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, lesson: Lesson) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant={lesson.is_published ? 'view' : 'toggle'}
                        icon={lesson.is_published ? Globe : GlobeLock}
                        onClick={() => togglePublish(lesson)}
                        disabled={togglingPublish === lesson.id}
                        title={lesson.is_published ? 'Unpublish Lesson' : 'Publish Lesson'}
                    />
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        onClick={() => setShowViewModal(lesson)}
                        title="View Lesson"
                    />
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
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Lesson Management', href: '/admin/lessons' },
            ]}
        >
            <Head title="Lesson Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title text-gray-900">
                            Lesson Management
                        </h1>
                        <p className="text-gray-600">
                            Manage all lessons across courses
                        </p>
                    </div>
                    <Button variant="create" asChild>
                        <Link href="/admin/lessons/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Lesson
                        </Link>
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="rounded-lg bg-white p-4 shadow mb-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Search lessons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && handleSearch()
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pl-9"
                            />
                        </div>
                        <Select
                            value={courseFilter}
                            onValueChange={(value) =>
                                setCourseFilter(value === "all" ? "" : value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={String(course.id)}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={typeFilter}
                            onValueChange={(value) =>
                                setTypeFilter(value === "all" ? "" : value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {lessonTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSearch}
                            className="flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={() => {
                                setSearch('');
                                setCourseFilter('');
                                setTypeFilter('');
                                router.get('/admin/lessons');
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Lessons Table */}
                <Card className="!mt-0">
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={lessons.data}
                            title={`Lessons (${lessons.total || 0})`}
                            emptyMessage="No lessons found"
                            paginationLinks={lessons.links}
                            onPageChange={(url) => router.get(url)}
                            emptyAction={
                                <Button variant="create" asChild>
                                    <Link href="/admin/lessons/create">
                                        Create Your First Lesson
                                    </Link>
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
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

            {/* Lesson View Modal */}
            <Dialog.Root open={!!showViewModal} onOpenChange={() => setShowViewModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="bg-black/60 fixed inset-0 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 h-[90vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none md:h-auto">
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <Dialog.Title className="text-xl font-semibold leading-none tracking-tight">
                                {showViewModal?.title}
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500">
                                {showViewModal?.description}
                            </Dialog.Description>
                        </div>
                        <div className="grid gap-4 py-4">
                            {showViewModal ? (
                                renderLessonContent(showViewModal)
                            ) : (
                                <p>Select a lesson to view its content.</p>
                            )}
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Dialog.Close asChild>
                                <Button type="button" variant="secondary">
                                    Close
                                </Button>
                            </Dialog.Close>
                        </div>
                        <Dialog.Close className="absolute right-4 top-4 p-0 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 bg-transparent border-0">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </AppLayout>
    );
}
