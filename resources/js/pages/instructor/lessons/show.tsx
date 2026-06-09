import { Head, Link } from '@inertiajs/react';
import {
    Edit,
    Trash2,
    BookOpen,
    Clock,
    FileText,
    Play,
    HelpCircle,
    ClipboardList,
    Calendar,
    ChevronRight,
    CheckCircle,
    XCircle,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    status: string;
}

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
    content: any;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    assignment_data?: any;
    resources?: any;
    created_at: string;
    updated_at: string;
}

interface Props {
    course: Course;
    lesson: Lesson;
}

export default function InstructorLessonShow({ course, lesson }: Props) {
    const getTypeIcon = (iconName: string) => {
        switch (iconName) {
            case 'FileText':
                return <FileText className="h-5 w-5" />;
            case 'Play':
                return <Play className="h-5 w-5" />;

            case 'ClipboardList':
                return <ClipboardList className="h-5 w-5" />;
            default:
                return <FileText className="h-5 w-5" />;
        }
    };

    const getTypeColorClass = (color: string) => {
        const baseClass =
            'inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full';

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

    const renderLessonContent = () => {
        switch (lesson.type) {
            case 'Text':
                return (
                    <div>
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            Text Content
                        </h3>
                        <div className="rounded-md bg-gray-50 p-6">
                            <div className="whitespace-pre-wrap text-gray-900">
                                {lesson.text_content || 'No content available.'}
                            </div>
                        </div>
                    </div>
                );

            case 'Video':
                return (
                    <div>
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            Video Content
                        </h3>
                        <div className="space-y-4 rounded-md bg-gray-50 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Video URL
                                </label>
                                <a
                                    href={lesson.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    {lesson.video_url}
                                </a>
                            </div>
                            {lesson.video_duration && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Video Duration
                                    </label>
                                    <p className="text-gray-900">
                                        {Math.floor(lesson.video_duration / 60)}
                                        :
                                        {(lesson.video_duration % 60)
                                            .toString()
                                            .padStart(2, '0')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );



            case 'Assignment':
                return (
                    <div>
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            Assignment Content
                        </h3>
                        <div className="space-y-4 rounded-md bg-gray-50 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Instructions
                                </label>
                                <div className="rounded border bg-white p-4 whitespace-pre-wrap text-gray-900">
                                    {lesson.assignment_data?.instructions ||
                                        'No instructions provided.'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Maximum Score
                                    </label>
                                    <p className="text-gray-900">
                                        {lesson.assignment_data?.max_score ||
                                            100}{' '}
                                        points
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Due Days
                                    </label>
                                    <p className="text-gray-900">
                                        {lesson.assignment_data?.due_days || 7}{' '}
                                        days
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Submission Types
                                    </label>
                                    <p className="text-gray-900">
                                        {lesson.assignment_data?.submission_types?.join(
                                            ', ',
                                        ) || 'Text, File'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div>
                        <p className="text-gray-500">Unknown lesson type.</p>
                    </div>
                );
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'My Courses', href: '/instructor/courses' },
                {
                    title: course.title,
                    href: `/instructor/courses/${course.id}/lessons`,
                },
                {
                    title: lesson.title,
                    href: `/instructor/courses/${course.id}/lessons/${lesson.id}`,
                },
            ]}
        >
            <Head title={`Lesson: ${lesson.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="page-title text-gray-900">
                                {lesson.title}
                            </h1>
                            <div className="mt-2 flex items-center gap-4">
                                <span
                                    className={getTypeColorClass(
                                        lesson.type_color,
                                    )}
                                >
                                    {getTypeIcon(lesson.type_icon)}
                                    <span className="ml-2">{lesson.type}</span>
                                </span>
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                    Order: {lesson.order}
                                </span>
                                {lesson.is_published ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                        Published
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                                        Draft
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button asChild>
                        <Link
                            href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                        >
                            <Edit className="h-4 w-4" />
                            Edit Lesson
                        </Link>
                    </Button>
                </div>

                {/* Lesson Details */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Lesson Details
                        </h2>
                    </div>

                    <div className="space-y-6 p-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Course
                                </label>
                                <p className="text-sm text-gray-900">
                                    {course.title}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Estimated Duration
                                </label>
                                <div className="flex items-center text-sm text-gray-900">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {lesson.duration_display}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {lesson.description && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900">
                                    {lesson.description}
                                </div>
                            </div>
                        )}

                        {/* Lesson Content */}
                        {renderLessonContent()}

                        {/* Timeline */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Timeline
                            </label>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>{lesson.created_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Updated:</span>
                                    <span>{lesson.updated_at}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
