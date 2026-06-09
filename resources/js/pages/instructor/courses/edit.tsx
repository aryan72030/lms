import { Head, useForm } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import {
    CourseEditorCategory,
    CourseEditorData,
    CourseEditorForm,
} from '@/components/courses/course-editor-form';
import { normalizeCourseThumbnailUrl } from '@/components/courses/course-thumbnail-utils';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    description: string;
    objectives?: string;
    requirements?: string[];
    target_audience?: string[];
    thumbnail?: string | null;
    language: string;
    price: number;
    access_duration: number;
    duration_hours: number;
    difficulty_level: string;
    category_id: number;
}

interface Props {
    course: Course;
    categories: CourseEditorCategory[];
    difficultyLevels: string[];
}

interface FormData extends CourseEditorData {
    _method: string;
}

export default function InstructorCourseEdit({
    course,
    categories,
    difficultyLevels,
}: Props) {
    const courseMessages = useActionMessages('Course');
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        normalizeCourseThumbnailUrl(course.thumbnail),
    );

    useEffect(() => {
        setPreviewUrl(normalizeCourseThumbnailUrl(course.thumbnail));
    }, [course.id, course.thumbnail]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        _method: 'PUT',
        title: course.title,
        description: course.description,
        objectives: course.objectives || '',
        requirements:
            course.requirements && course.requirements.length > 0
                ? course.requirements
                : [''],
        target_audience:
            course.target_audience && course.target_audience.length > 0
                ? course.target_audience
                : [''],
        thumbnail: null,
        language: course.language || 'English',
        price: course.price.toString(),
        access_duration: (course.access_duration || 0).toString(),
        duration_hours: course.duration_hours.toString(),
        difficulty_level: course.difficulty_level,
        category_id: course.category_id.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/instructor/courses/${course.id}`, {
            forceFormData: true,
            onSuccess: () => courseMessages.success('update'),
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
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit Course: ${course.title}`} />

            <CourseEditorForm
                title={`Edit Course: ${course.title}`}
                description={`Update course details for ${course.title}`}
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
                submitLabel="Update Course"
                submitLoadingLabel="Saving..."
                cancelHref="/instructor/courses"
            />
        </AppLayout>
    );
}
