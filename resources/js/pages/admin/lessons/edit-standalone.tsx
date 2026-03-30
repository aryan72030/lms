import { Head, Link } from '@inertiajs/react';
import React from 'react';
import AdminLessonForm from '@/components/admin/admin-lesson-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    status_label: string;
    instructor_name: string;
}

interface Lesson {
    id: number;
    title: string;
    description: string;
    type: string;
    order: number;
    is_published: boolean;
    estimated_duration: number;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    quiz_data?: any;
    assignment_data?: any;
    course_id?: number;
}

interface Props {
    lesson: Lesson;
    courses: Course[];
    lessonTypes: string[];
}

export default function AdminLessonEditStandalone({ lesson, courses, lessonTypes }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Lesson Management', href: '/admin/lessons' },
            { title: `Edit ${lesson.title}`, href: `/admin/lessons/${lesson.id}/edit` }
        ]}>
            <Head title={`Edit Lesson - ${lesson.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
                        <p className="text-gray-600">
                            Updating standalone lesson "{lesson.title}"
                        </p>
                    </div>
                </div>

                <AdminLessonForm 
                    mode="edit"
                    lesson={lesson}
                    courses={courses}
                    lessonTypes={lessonTypes}
                    action={`/admin/lessons/${lesson.id}`}
                    cancelUrl="/admin/lessons"
                />
            </div>
        </AppLayout>
    );
}
