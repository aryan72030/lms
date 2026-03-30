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
    XCircle
} from 'lucide-react';
import React, { useState } from 'react';
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
    content: any;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    quiz_data?: any;
    assignment_data?: any;
    resources?: any;
    course: {
        id: number;
        title: string;
        status: string;
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    lesson: Lesson;
}

export default function InstructorLessonShowStandalone({ lesson }: Props) {
    const getTypeIcon = (iconName: string) => {
        switch (iconName) {
            case 'FileText': return <FileText className="h-5 w-5" />;
            case 'Play': return <Play className="h-5 w-5" />;
            case 'HelpCircle': return <HelpCircle className="h-5 w-5" />;
            case 'ClipboardList': return <ClipboardList className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    const getTypeColorClass = (color: string) => {
        const baseClass = 'inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full';

        switch (color) {
            case 'blue': return `${baseClass} bg-blue-100 text-blue-800`;
            case 'red': return `${baseClass} bg-red-100 text-red-800`;
            case 'green': return `${baseClass} bg-green-100 text-green-800`;
            case 'purple': return `${baseClass} bg-purple-100 text-purple-800`;
            default: return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const renderLessonContent = () => {
        switch (lesson.type) {
            case 'Text':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Text Content</h3>
                        <div className="bg-gray-50 p-6 rounded-md">
                            <div className="text-gray-900 whitespace-pre-wrap">
                                {lesson.text_content || 'No content available.'}
                            </div>
                        </div>
                    </div>
                );

            case 'Video':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Video Content</h3>
                        <div className="bg-gray-50 p-6 rounded-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                                <a 
                                    href={lesson.video_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                >
                                    {lesson.video_url}
                                </a>
                            </div>
                            {lesson.video_duration && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Duration</label>
                                    <p className="text-gray-900">{Math.floor(lesson.video_duration / 60)}:{(lesson.video_duration % 60).toString().padStart(2, '0')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'Quiz':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Content</h3>
                        <div className="bg-gray-50 p-6 rounded-md">
                            {lesson.quiz_data?.questions ? (
                                <div className="space-y-6">
                                    {lesson.quiz_data.questions.map((question: any, index: number) => (
                                        <div key={index} className="border border-gray-200 bg-white p-4 rounded-md">
                                            <h4 className="font-medium text-gray-900 mb-3">
                                                Question {index + 1}: {question.question}
                                            </h4>
                                            <div className="space-y-2">
                                                {question.options?.map((option: string, optionIndex: number) => (
                                                    <div key={optionIndex} className="flex items-center space-x-2">
                                                        {question.correct_answer === optionIndex ? (
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-gray-400" />
                                                        )}
                                                        <span className={question.correct_answer === optionIndex ? 'text-green-700 font-medium' : 'text-gray-700'}>
                                                            {option}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {lesson.quiz_data.settings && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-md">
                                            <h4 className="font-medium text-blue-900 mb-2">Quiz Settings</h4>
                                            <div className="text-sm text-blue-800 space-y-1">
                                                <p>Attempts allowed: {lesson.quiz_data.settings.attempts_allowed || 'Unlimited'}</p>
                                                <p>Show correct answers: {lesson.quiz_data.settings.show_correct_answers ? 'Yes' : 'No'}</p>
                                                <p>Shuffle questions: {lesson.quiz_data.settings.shuffle_questions ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">No quiz questions available.</p>
                            )}
                        </div>
                    </div>
                );

            case 'Assignment':
                return (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Content</h3>
                        <div className="bg-gray-50 p-6 rounded-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                                <div className="bg-white p-4 rounded border text-gray-900 whitespace-pre-wrap">
                                    {lesson.assignment_data?.instructions || 'No instructions provided.'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Score</label>
                                    <p className="text-gray-900">{lesson.assignment_data?.max_score || 100} points</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Days</label>
                                    <p className="text-gray-900">{lesson.assignment_data?.due_days || 7} days</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Submission Types</label>
                                    <p className="text-gray-900">
                                        {lesson.assignment_data?.submission_types?.join(', ') || 'Text, File'}
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
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'Lesson Management', href: '/instructor/lessons' },
            { title: lesson.title, href: `/instructor/lessons/${lesson.id}` }
        ]}>
            <Head title={`Lesson: ${lesson.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className={getTypeColorClass(lesson.type_color)}>
                                    {getTypeIcon(lesson.type_icon)}
                                    <span className="ml-2">{lesson.type}</span>
                                </span>
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Order: {lesson.order}
                                </span>
                                {lesson.is_published ? (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        Published
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Draft
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Link href={`/instructor/lessons/${lesson.id}/edit`}>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Lesson
                        </button>
                    </Link>
                </div>

                {/* Course Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            Course: {lesson.course.title}
                        </span>
                        <span className="text-sm text-blue-600">
                            ({lesson.course.status})
                        </span>
                    </div>
                </div>

                {/* Lesson Details */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Lesson Details</h2>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                <p className="text-sm text-gray-900">{lesson.course.title}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                                <div className="flex items-center text-sm text-gray-900">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {lesson.duration_display}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {lesson.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                                    {lesson.description}
                                </div>
                            </div>
                        )}

                        {/* Lesson Content */}
                        {renderLessonContent()}

                        {/* Timeline */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
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