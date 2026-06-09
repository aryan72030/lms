import { Head, Link, router } from '@inertiajs/react';
import {
    PlusCircle,
    Search,
    Eye,
    Edit,
    Trash2,
    FileText,
    Play,
    HelpCircle,
    ClipboardList,
    Clock,
    X,
    Globe,
    GlobeLock,
} from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';
import * as Dialog from '@radix-ui/react-dialog';


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
    assignment_data?: any;
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
        meta: { total: number };
    };
    lessons_total: number;
    courses: Array<{
        id: number;
        title: string;
    }>;
    lessonTypes: string[];
    filters: {
        search: string;
        course: string;
        type: string;
    };
}

export default function InstructorLessonsAll({
    lessons,
    lessons_total,
    courses,
    lessonTypes,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [loading, setLoading] = useState<number | null>(null);
    const [togglingPublish, setTogglingPublish] = useState<number | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [showViewModal, setShowViewModal] = useState<Lesson | null>(null);

    const lessonMessages = useActionMessages('Lesson');

    const handleSearch = () => {
        router.get(
            '/instructor/lessons',
            {
                search: search || undefined,
                course: courseFilter || undefined,
                type: typeFilter || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setCourseFilter('');
        setTypeFilter('');
        router.get(
            '/instructor/lessons',
            { search: undefined, course: undefined, type: undefined },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

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


    const handleDelete = () => {
        if (!lessonToDelete) return;

        setLoading(lessonToDelete.id);
        router.delete(`/instructor/lessons/${lessonToDelete.id}`, {
            onSuccess: () => {
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

    const togglePublish = (lesson: Lesson) => {
        setTogglingPublish(lesson.id);
        router.patch(
            `/instructor/lessons/${lesson.id}/toggle-publish`,
            {},
            {
                onError: () => {
                    lessonMessages.error('toggle');
                },
                onFinish: () => {
                    setTogglingPublish(null);
                },
                preserveScroll: true,
            },
        );
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

    const renderLessonContent = (lesson: Lesson) => {
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
            case 'Assignment':
                return (
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">
                            Assignment Details
                        </h3>
                        {lesson.assignment_data?.description ? (
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: lesson.assignment_data.description,
                                }}
                            />
                        ) : (
                            <p>No assignment description available.</p>
                        )}
                        {lesson.assignment_data?.deadline && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                <Clock className="mr-1 h-4 w-4" />
                                Deadline: {' '}
                                {new Date(
                                    lesson.assignment_data.deadline,
                                ).toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            case 'Quiz':
                return (
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">
                            Quiz Details
                        </h3>
                        {lesson.assignment_data?.questions_count ? (
                            <p>
                                Number of questions: {' '}
                                {lesson.assignment_data.questions_count}
                            </p>
                        ) : (
                            <p>No quiz details available.</p>
                        )}
                    </div>
                );
            default:
                return <p>Unsupported lesson type.</p>;
        }
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
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Lesson Management', href: '/instructor/lessons' },
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
                            Create and manage lessons across all your courses
                        </p>
                    </div>
                    <Button variant="create" asChild>
                        <Link href="/instructor/lessons/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Lesson
                        </Link>
                    </Button>
                </div>

                <div className="mt-6 rounded-md bg-white p-6 shadow-sm">
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
                            <Button variant="outline" onClick={handleReset}>
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
                                title={`Lessons (${lessons.meta?.total ?? lessons_total ?? 0})`}
                                emptyMessage="No lessons found"
                                paginationLinks={lessons.links}
                                onPageChange={(url) => router.get(url)}
                                emptyAction={
                                    <Button variant="create" asChild>
                                        <Link href="/instructor/lessons/create">
                                            Create Your First Lesson
                                        </Link>
                                    </Button>
                                }
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* View Lesson Modal */}
            <Dialog.Root
                open={!!showViewModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowViewModal(null);
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay className="bg-black/60 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
                    <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-[50%] top-[50%] z-50 h-[90vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none md:h-auto">
                        {showViewModal && (
                            <>
                                <Dialog.Title className="text-xl font-semibold text-gray-900">
                                    {showViewModal.title}
                                </Dialog.Title>
                                <div className="mt-4 text-sm text-gray-600">
                                    <p>
                                        <strong>Course:</strong>{' '}
                                        {showViewModal.course.title}
                                    </p>
                                    <p>
                                        <strong>Type:</strong> {showViewModal.type}
                                    </p>
                                    <p>
                                        <strong>Status:</strong>{' '}
                                        {showViewModal.is_published
                                            ? 'Published'
                                            : 'Draft'}
                                    </p>
                                    <div className="mt-4">
                                        {renderLessonContent(showViewModal)}
                                    </div>
                                </div>
                            </>
                        )}
                        <Dialog.Close asChild>
                            <button
                                className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute right-[10px] top-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                                aria-label="Close"
                            >
                                <X />
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Confirmation Modal for Delete */}
            <ConfirmationModal
                isOpen={!!lessonToDelete}
                onClose={() => setLessonToDelete(null)}
                title="Delete Lesson"
                description={`Are you sure you want to delete the lesson "${lessonToDelete?.title}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={loading === lessonToDelete?.id}
            />
        </AppLayout>
    );
}
