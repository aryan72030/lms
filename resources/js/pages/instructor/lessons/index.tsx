import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, ChevronUp, ChevronDown, FileText, Play, HelpCircle, ClipboardList, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
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
    created_at: string;
}

interface Course {
    id: number;
    title: string;
    status: string;
    status_label: string;
}

interface Props {
    course: Course;
    lessons: Lesson[];
    lessonTypes: string[];
}

export default function InstructorLessonsIndex({ course, lessons, lessonTypes }: Props) {
    const [loading, setLoading] = useState<number | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const lessonMessages = useActionMessages('Lesson');

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const handleDelete = async () => {
        if (!lessonToDelete) return;

        setLoading(lessonToDelete.id);

        try {
            await router.delete(`/instructor/courses/${course.id}/lessons/${lessonToDelete.id}`, {
                onSuccess: () => lessonMessages.success('delete'),
                onError: () => lessonMessages.error('delete'),
            });
        } catch (error) {
            lessonMessages.error('delete');
        } finally {
            setLoading(null);
            setLessonToDelete(null);
        }
    };

    const handleMoveUp = async (lesson: Lesson) => {
        setLoading(lesson.id);

        try {
            const response = await fetch(`/instructor/courses/${course.id}/lessons/${lesson.id}/move-up`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                lessonMessages.success('move');
                window.location.reload();
            } else {
                lessonMessages.error('move');
            }
        } catch (error) {
            lessonMessages.error('move');
        } finally {
            setLoading(null);
        }
    };

    const handleMoveDown = async (lesson: Lesson) => {
        setLoading(lesson.id);

        try {
            const response = await fetch(`/instructor/courses/${course.id}/lessons/${lesson.id}/move-down`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                lessonMessages.success('move');
                window.location.reload();
            } else {
                lessonMessages.error('move');
            }
        } catch (error) {
            lessonMessages.error('move');
        } finally {
            setLoading(null);
        }
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

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'My Courses', href: '/instructor/courses' },
            { title: course.title, href: `/instructor/courses/${course.id}/lessons` }
        ]}>
            <Head title={`Lessons - ${course.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Course Lessons</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-gray-600">{course.title}</p>
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    {course.status_label}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <Button variant="create" asChild>
                        <Link href={`/instructor/courses/${course.id}/lessons/create`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                        </Link>
                    </Button>
                </div>

                {/* Lessons List */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Lessons ({lessons.length})</h2>
                    </div>
                    
                    {lessons.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {lessons.map((lesson, index) => (
                                <div key={lesson.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {/* Order Number */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                {lesson.order}
                                            </div>
                                            
                                            {/* Lesson Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                                                    <span className={getTypeColorClass(lesson.type_color)}>
                                                        {getTypeIcon(lesson.type_icon)}
                                                        <span className="ml-1">{lesson.type}</span>
                                                    </span>
                                                    {!lesson.is_published && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {lesson.description && (
                                                    <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                                                )}
                                                
                                                <div className="flex items-center text-xs text-gray-500 space-x-4">
                                                    <div className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {lesson.duration_display}
                                                    </div>
                                                    <span>Created {lesson.created_at}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                            {/* Move Up/Down */}
                                            <div className="flex flex-col space-y-1">
                                                <ActionButton
                                                    variant="move-up"
                                                    icon={ChevronUp}
                                                    onClick={() => handleMoveUp(lesson)}
                                                    disabled={index === 0 || loading === lesson.id}
                                                    title="Move Up"
                                                    size="sm"
                                                />
                                                <ActionButton
                                                    variant="move-down"
                                                    icon={ChevronDown}
                                                    onClick={() => handleMoveDown(lesson)}
                                                    disabled={index === lessons.length - 1 || loading === lesson.id}
                                                    title="Move Down"
                                                    size="sm"
                                                />
                                            </div>
                                            
                                            {/* View/Edit/Delete */}
                                            <ActionButtonGroup>
                                                <ActionButton
                                                    variant="view"
                                                    icon={Eye}
                                                    href={`/instructor/courses/${course.id}/lessons/${lesson.id}`}
                                                    title="View Lesson"
                                                />
                                                <ActionButton
                                                    variant="edit"
                                                    icon={Edit}
                                                    href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                                                    title="Edit Lesson"
                                                />
                                                {lesson.type === 'Assignment' && (
                                                    <ActionButton
                                                        variant="view"
                                                        icon={ClipboardList}
                                                        href={`/instructor/assignments/${lesson.id}`}
                                                        title="Grade Submissions"
                                                    />
                                                )}
                                            <ActionButton
                                                variant="delete"
                                                icon={Trash2}
                                                onClick={() => setLessonToDelete(lesson)}
                                                disabled={loading === lesson.id}
                                                title="Delete Lesson"
                                            />
                                            </ActionButtonGroup>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <ClipboardList className="h-12 w-12 mx-auto" />
                            </div>
                            <p className="text-gray-500 text-lg mb-4">No lessons found</p>
                            <p className="text-gray-400 mb-6">Start building your course by adding lessons</p>
                            <Link href={`/instructor/courses/${course.id}/lessons/create`}>
                                <Button variant="create">
                                    Add First Lesson
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

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
