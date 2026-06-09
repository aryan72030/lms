import { Head, useForm, Link } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    HelpCircle,
    Settings,
    Save,
    Eye,
    ListChecks,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    course_id: number;
    course_title?: string;
    time_limit: number | null;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    is_active: boolean;
}

interface Props {
    quiz: Quiz;
    courses: Course[];
}

export default function EditQuiz({ quiz, courses }: Props) {
    const quizMessages = useActionMessages('Quiz');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        title: quiz.title,
        description: quiz.description || '',
        time_limit: quiz.time_limit?.toString() || '',
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts,
        is_final_quiz: quiz.is_final_quiz,
        is_active: quiz.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        put(`/instructor/quizzes/${quiz.id}`, {
            onSuccess: () => {
                quizMessages.success('update');
            },
            onError: () => {
                quizMessages.error('update');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Quiz Management', href: '/instructor/quizzes' },
                {
                    title: quiz.course_title || 'Course',
                    href: quiz.course_id
                        ? `/instructor/courses/${quiz.course_id}/lessons`
                        : '/instructor/courses',
                },
                { title: quiz.title, href: `/instructor/quizzes/${quiz.id}` },
                { title: 'Edit', href: `/instructor/quizzes/${quiz.id}/edit` },
            ]}
        >
            <Head title={`Edit Quiz: ${quiz.title}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="page-title text-gray-900">
                                Edit Quiz
                            </h1>
                            <p className="text-gray-600">
                                Update quiz details and settings
                            </p>
                        </div>
                    </div>
                    <Link href={`/instructor/quizzes/${quiz.id}`}>
                        <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Quiz
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the basic details for your quiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        Quiz Title{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="Enter quiz title"
                                        className={
                                            errors.title ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Select
                                        value={quiz.course_id.toString()}
                                        disabled
                                    >
                                        <SelectTrigger className="bg-gray-50">
                                            <SelectValue>
                                                {courses.find(
                                                    (c) =>
                                                        c.id === quiz.course_id,
                                                )?.title || 'Unknown Course'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem
                                                    key={course.id}
                                                    value={course.id.toString()}
                                                >
                                                    {course.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Course cannot be changed after quiz
                                        creation
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Enter quiz description (optional)"
                                    rows={3}
                                    className={
                                        errors.description
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quiz Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Settings</CardTitle>
                            <CardDescription>
                                Configure the quiz parameters and rules
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="time_limit">
                                        Time Limit (minutes)
                                    </Label>
                                    <Input
                                        id="time_limit"
                                        type="number"
                                        min="1"
                                        value={data.time_limit}
                                        onChange={(e) =>
                                            setData(
                                                'time_limit',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="No time limit"
                                        className={
                                            errors.time_limit
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.time_limit && (
                                        <p className="text-sm text-red-600">
                                            {errors.time_limit}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Leave empty for no time limit
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="passing_score">
                                        Passing Score (%) *
                                    </Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.passing_score}
                                        onChange={(e) =>
                                            setData(
                                                'passing_score',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        className={
                                            errors.passing_score
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.passing_score && (
                                        <p className="text-sm text-red-600">
                                            {errors.passing_score}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_attempts">
                                        Maximum Attempts *
                                    </Label>
                                    <Input
                                        id="max_attempts"
                                        type="number"
                                        min="1"
                                        value={data.max_attempts}
                                        onChange={(e) =>
                                            setData(
                                                'max_attempts',
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        className={
                                            errors.max_attempts
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.max_attempts && (
                                        <p className="text-sm text-red-600">
                                            {errors.max_attempts}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_final_quiz"
                                        checked={data.is_final_quiz}
                                        onCheckedChange={(checked) =>
                                            setData('is_final_quiz', checked)
                                        }
                                    />
                                    <Label
                                        htmlFor="is_final_quiz"
                                        className="text-sm font-medium"
                                    >
                                        Final Quiz
                                    </Label>
                                    <p className="ml-2 text-xs text-gray-500">
                                        Students must pass this quiz to complete
                                        the course
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData('is_active', checked)
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="text-sm font-medium"
                                    >
                                        Active
                                    </Label>
                                    <p className="ml-2 text-xs text-gray-500">
                                        Students can only take active quizzes
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Link href={`/instructor/quizzes/${quiz.id}`}>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing || isSubmitting}
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || isSubmitting}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing || isSubmitting
                                ? 'Updating...'
                                : 'Update Quiz'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
