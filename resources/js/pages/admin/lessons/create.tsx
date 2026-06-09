import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LessonForm from '@/components/lessons/LessonForm';
import React, { useEffect, useState } from 'react';
import { useNotification } from '@/contexts/notification-context';

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

export default function AdminLessonCreate({
    course,
    lessonTypes,
    quizzes,
    sections,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const { showError } = useNotification();
    const { props: { flash } } = usePage<any>();

    const handleSubmit = (data: any) => {
        setProcessing(true);
        router.post(`/admin/courses/${course.id}/lessons`, data, {
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
                    title: 'Create Lesson',
                    href: `/admin/courses/${course.id}/lessons/create`,
                },
            ]}
        >
            <Head title="Create New Lesson" />



            <LessonForm
                course={course}
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
