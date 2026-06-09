import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import LessonForm from '@/components/lessons/LessonForm';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Course {
    id: number;
    title: string;
    status: string;
}

interface Props {
    courses: Course[];
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
}

export default function InstructorLessonCreateStandalone({
    courses,
    lessonTypes,
    quizzes,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const messages = useActionMessages('Lesson');

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.post('/instructor/lessons', data, {
            onSuccess: () => {},
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
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Lesson Management', href: '/instructor/lessons' },
                { title: 'Create Lesson', href: '/instructor/lessons/create' },
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
                cancelUrl="/instructor/lessons"
            />
        </AppLayout>
    );
}
