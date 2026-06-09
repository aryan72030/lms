import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import LessonForm from '@/components/lessons/LessonForm';
import { useActionMessages } from '@/hooks/use-action-messages';
import React, { useState } from 'react';
import { Course, Lesson } from '@/types';

interface Props {
    course: Course;
    lesson: Lesson;
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
    sections: Array<{ id: number; title: string }>;
}

export default function InstructorLessonEdit({
    course,
    lesson,
    lessonTypes,
    quizzes,
    sections,
}: Props) {
    const lessonMessages = useActionMessages('Lesson');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.put(
            `/instructor/courses/${course.id}/lessons/${lesson.id}`,
            data,
            {
                onError: (err) => {
                    setErrors(err);
                },
                onFinish: () => setProcessing(false),
            },
        );
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
                    title: 'Edit Lesson',
                    href: `/instructor/courses/${course.id}/lessons/${lesson.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Lesson: ${lesson.title}`} />

            <LessonForm
                course={course as any}
                lesson={lesson as any}
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
