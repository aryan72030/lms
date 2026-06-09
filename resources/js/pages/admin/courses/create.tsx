import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import {
    CourseEditorCategory,
    CourseEditorData,
    CourseEditorForm,
    CourseEditorInstructor,
} from '@/components/courses/course-editor-form';
import AppLayout from '@/layouts/app-layout';
import { useNotification } from '@/contexts/notification-context';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface FlashProps {
    success?: string;
    error?: string;
}

interface PageProps extends InertiaPageProps {
    flash: FlashProps;
}

interface Props {
    categories: CourseEditorCategory[];
    instructors: CourseEditorInstructor[];
    difficultyLevels: string[];
}

interface FormData extends CourseEditorData {
    instructor_id: string;
}

export default function AdminCourseCreate({
    categories,
    difficultyLevels,
    instructors,
}: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { showSuccess, showError } = useNotification();
    const { props: { flash } } = usePage<PageProps>();

    React.useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
    }, [flash]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        description: '',
        objectives: '',
        requirements: [''],
        target_audience: [''],
        thumbnail: null,
        language: 'English',
        price: '0',
        access_duration: '0',
        duration_hours: '1',
        difficulty_level: difficultyLevels[0] || 'Beginner',
        category_id: '',
        instructor_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/courses', {
            forceFormData: true,
            onSuccess: () => {
                // Backend provides the success message, handled by useEffect
            },
            onError: (errors) => {
                // The individual field errors are automatically handled by useForm and displayed by CourseEditorForm.
                // No need for a generic error message here.
            },
        });
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('thumbnail', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleClearThumbnail = () => {
        setData('thumbnail', null);
        setPreviewUrl(null);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Course Management', href: '/admin/courses' },
                { title: 'Create', href: '#' },
            ]}
        >
            <Head title="Create Course" />

            <CourseEditorForm
                title="Create New Course"
                description="Create a course with the same setup flow used on the instructor side"
                data={data}
                setData={setData}
                errors={errors}
                categories={categories}
                difficultyLevels={difficultyLevels}
                previewUrl={previewUrl}
                onThumbnailChange={handleThumbnailChange}
                onClearThumbnail={handleClearThumbnail}
                onSubmit={handleSubmit}
                processing={processing}
                submitLabel="Create Course"
                submitLoadingLabel="Creating..."
                cancelHref="/admin/courses"
                showInstructorSelect={true}
                instructors={instructors}
            />
        </AppLayout>
    );
}
