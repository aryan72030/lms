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

interface Props {
    course: Course;
    sections: Array<{ id: number; title: string }>;
    lessonTypes: string[];
}

export default function AdminLessonCreate({ course, sections, lessonTypes }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Management', href: '/admin/courses' },
            { title: course.title, href: `/admin/courses/${course.id}/lessons` },
            { title: 'Create Lesson', href: `/admin/courses/${course.id}/lessons/create` }
        ]}>
            <Head title="Create New Lesson" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create New Lesson</h1>
                        <p className="text-gray-600">
                            Adding a new lesson to "{course.title}"
                        </p>
                    </div>
                </div>

                <AdminLessonForm 
                    mode="create"
                    course={course}
                    sections={sections}
                    lessonTypes={lessonTypes}
                    action={`/admin/courses/${course.id}/lessons`}
                />
            </div>
        </AppLayout>
    );
}
