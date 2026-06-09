import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LessonForm from '@/components/lessons/LessonForm';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Course {
    id: number;
    title: string;
    status: string;
    status_label?: string;
    instructor_name?: string;
}

interface Props {
    courses: Course[];
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
}

export default function AdminLessonCreateStandalone({
    courses,
    lessonTypes,
    quizzes,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const messages = useActionMessages('Lesson');

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.post('/admin/lessons', data, {
            onError: (err) => {
                setErrors(err);
                messages.error('create');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Lesson Management', href: '/admin/lessons' },
                { title: 'Create Lesson', href: '/admin/lessons/create' },
            ]}
        >
            <Head title="Create Lesson" />



            <LessonForm
                courses={courses}
                lessonTypes={lessonTypes}
                quizzes={quizzes}
                onSubmit={handleSubmit}
                processing={processing}
                errors={errors}
                cancelUrl="/admin/lessons"
            />
        </AppLayout>
    );
}
