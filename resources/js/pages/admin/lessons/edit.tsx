import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LessonForm from '@/components/lessons/LessonForm';
import { useActionMessages } from '@/hooks/use-action-messages';
import React, { useState } from 'react';

interface Course {
    id: number;
    title: string;
    status: string;
}

interface Lesson {
    id: number;
    title: string;
    description?: string;
    type: string;
    order: number;
    is_published: boolean;
    estimated_duration: number;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    quiz_data?: any;
    assignment_data?: any;
}

interface Props {
    course: Course;
    lesson: Lesson;
    lessonTypes: string[];
    quizzes: Array<{ id: number; title: string }>;
    sections: Array<{ id: number; title: string }>;
}

export default function AdminLessonEdit({
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
        router.put(`/admin/courses/${course.id}/lessons/${lesson.id}`, data, {
            onError: (err) => {
                setErrors(err);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Course Management', href: '/admin/courses' },
                {
                    title: course.title,
                    href: `/admin/courses/${course.id}/lessons`,
                },
                {
                    title: 'Edit Lesson',
                    href: `/admin/courses/${course.id}/lessons/${lesson.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Lesson - ${lesson.title}`} />



            <LessonForm
                course={course}
                lesson={lesson as any}
                lessonTypes={lessonTypes}
                quizzes={quizzes}
                sections={sections}
                onSubmit={handleSubmit}
                processing={processing}
                errors={errors}
                cancelUrl={`/admin/courses/${course.id}/lessons`}
            />
        </AppLayout>
    );
}
