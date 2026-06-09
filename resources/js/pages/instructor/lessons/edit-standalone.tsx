import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import LessonForm from '@/components/lessons/LessonForm';
import { useActionMessages } from '@/hooks/use-action-messages';
import { Course, Lesson } from '@/types';

interface Props {
    lesson: Lesson;
    courses: Course[];
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
}

export default function InstructorLessonEditStandalone({
    lesson,
    courses,
    lessonTypes,
    quizzes,
}: Props) {
    const lessonMessages = useActionMessages('Lesson');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.put(`/instructor/lessons/${lesson.id}`, data, {
            onSuccess: () => {},
            onError: (err) => {
                setErrors(err);
                lessonMessages.error('update');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Lesson Management', href: '/instructor/lessons' },
                {
                    title: 'Edit Lesson',
                    href: `/instructor/lessons/${lesson.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Lesson: ${lesson.title}`} />

            <LessonForm
                lesson={lesson as any}
                courses={courses as any}
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
