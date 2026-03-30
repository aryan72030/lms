import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
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

interface Props {
    courses: Course[];
    lessonTypes: string[];
}

export default function AdminLessonCreateStandalone({ courses, lessonTypes }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Lesson Management', href: '/admin/lessons' },
            { title: 'Create Lesson', href: '/admin/lessons/create' }
        ]}>
            <Head title="Create Lesson" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create New Lesson</h1>
                        <p className="text-gray-600">
                            Create a standalone lesson and assign it to a course
                        </p>
                    </div>
                </div>

                <AdminLessonForm 
                    mode="create"
                    courses={courses}
                    lessonTypes={lessonTypes}
                    action="/admin/lessons"
                    cancelUrl="/admin/lessons"
                />
            </div>
        </AppLayout>
    );
}
