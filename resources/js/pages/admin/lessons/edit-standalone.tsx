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
    quizzes: Array<{ id: number; title: string }>;
}

export default function AdminLessonEditStandalone({
    lesson,
    courses,
    lessonTypes,
    quizzes,
}: Props) {
    const lessonMessages = useActionMessages('Lesson');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.put(`/admin/lessons/${lesson.id}`, data, {
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
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Lesson Management', href: '/admin/lessons' },
                {
                    title: `Edit ${lesson.title}`,
                    href: `/admin/lessons/${lesson.id}/edit`,
                },
            ]}
        >
            <Head title={`Edit Lesson - ${lesson.title}`} />



            <LessonForm
                lesson={lesson as any}
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
