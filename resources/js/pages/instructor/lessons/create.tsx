import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import LessonForm from '@/components/lessons/LessonForm';
import React, { useState } from 'react';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Course {
    id: number;
    title: string;
    status: string;
}

interface Props {
    course: Course;
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
    sections: Array<{ id: number; title: string }>;
}

export default function InstructorLessonCreate({
    course,
    lessonTypes,
    quizzes,
    sections,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const messages = useActionMessages('Lesson');

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.post(`/instructor/courses/${course.id}/lessons`, data, {
            onError: (err) => {
                setErrors(err);
            },
            onFinish: () => setProcessing(false),
        });
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
                    title: 'Add Lesson',
                    href: `/instructor/courses/${course.id}/lessons/create`,
                },
            ]}
        >
            <Head title={`Add Lesson - ${course.title}`} />

            <LessonForm
                course={course}
                    lessonTypes={lessonTypes}
                    quizzes={quizzes}
                    sections={sections}
                    onSubmit={handleSubmit}
                    processing={processing}
                    errors={errors}
                    cancelUrl={`/instructor/courses/${course.id}/lessons`}
                />
        </AppLayout>
    );
}
