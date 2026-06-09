import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import {
    CourseEditorCategory,
    CourseEditorData,
    CourseEditorForm,
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
    difficultyLevels: string[];
}

export default function InstructorCourseCreate({
    categories,
    difficultyLevels,
}: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { showSuccess, showError } = useNotification();
    const { props: { flash } } = usePage<PageProps>();

    React.useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
    }, [flash]);

    const { data, setData, post, processing, errors } = useForm<CourseEditorData>(
        {
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
        },
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/instructor/courses', {
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
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'My Courses', href: '/instructor/courses' },
                { title: 'Create', href: '#' },
            ]}
        >
            <Head title="Create Course" />

            <CourseEditorForm
                title="Create New Course"
                description="Design and launch your professional learning experience"
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
                cancelHref="/instructor/courses"
            />
        </AppLayout>
    );
}
