import { Head, Link } from '@inertiajs/react';
import React from 'react';
import AdminLessonForm from '@/components/admin/admin-lesson-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    status: string;
    status_label: string;
}

interface Lesson {
    id: number;
    title: string;
    description: string;
    type: string;
    order: number;
    is_published: boolean;
    section_id?: number | null;
    estimated_duration: number;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    quiz_data?: any;
    assignment_data?: any;
    course_id?: number;
}

interface Props {
    course: Course;
    lesson: Lesson;
    sections: Array<{ id: number; title: string }>;
    lessonTypes: string[];
}

export default function AdminLessonEdit({ course, lesson, sections, lessonTypes }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Management', href: '/admin/courses' },
            { title: course.title, href: `/admin/courses/${course.id}/lessons` },
            { title: 'Edit Lesson', href: `/admin/courses/${course.id}/lessons/${lesson.id}/edit` }
        ]}>
            <Head title={`Edit Lesson - ${lesson.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
                        <p className="text-gray-600">
                            Updating "{lesson.title}" in "{course.title}"
                        </p>
                    </div>
                </div>

                <AdminLessonForm 
                    mode="edit"
                    course={course}
                    lesson={lesson}
                    sections={sections}
                    lessonTypes={lessonTypes}
                    action={`/admin/courses/${course.id}/lessons/${lesson.id}`}
                />
            </div>
        </AppLayout>
    );
}
