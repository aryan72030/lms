import { Head, useForm, Link } from '@inertiajs/react';
import { Plus, Trash2, HelpCircle, Settings, Save, ListChecks } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
}

interface Props {
    courses: Course[];
}

export default function CreateQuiz({ courses }: Props) {
    const quizMessages = useActionMessages('Quiz');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        course_id: '',
        time_limit: '',
        passing_score: 70,
        max_attempts: 3,
        is_final_quiz: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        post('/instructor/quizzes', {
            onSuccess: () => {
                quizMessages.success('create');
                reset();
            },
            onError: () => {
                quizMessages.error('create');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'My Quizzes', href: '/instructor/quizzes' },
            { title: 'Create Quiz', href: '/instructor/quizzes/create' }
        ]}>
            <Head title="Create Quiz" />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
                        <p className="text-gray-600">Create a quiz for your course</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Provide the basic details for your quiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Quiz Title *</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Enter quiz title"
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course_id">Course *</Label>
                                    <Select
                                        value={data.course_id}
                                        onValueChange={(value) => setData('course_id', value)}
                                    >
                                        <SelectTrigger className={errors.course_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem key={course.id} value={course.id.toString()}>
                                                    {course.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.course_id && (
                                        <p className="text-sm text-red-600">{errors.course_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter quiz description (optional)"
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description}</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                                    <Input
                                        id="time_limit"
                                        type="number"
                                        min="1"
                                        value={data.time_limit}
                                        onChange={(e) => setData('time_limit', e.target.value)}
                                        placeholder="No time limit"
                                        className={errors.time_limit ? 'border-red-500' : ''}
                                    />
                                    {errors.time_limit && (
                                        <p className="text-sm text-red-600">{errors.time_limit}</p>
                                    )}
                                    <p className="text-xs text-gray-500">Leave empty for no time limit</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="passing_score">Passing Score (%) *</Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.passing_score}
                                        onChange={(e) => setData('passing_score', parseInt(e.target.value) || 0)}
                                        className={errors.passing_score ? 'border-red-500' : ''}
                                    />
                                    {errors.passing_score && (
                                        <p className="text-sm text-red-600">{errors.passing_score}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_attempts">Max Attempts *</Label>
                                    <Input
                                        id="max_attempts"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={data.max_attempts}
                                        onChange={(e) => setData('max_attempts', parseInt(e.target.value) || 1)}
                                        className={errors.max_attempts ? 'border-red-500' : ''}
                                    />
                                    {errors.max_attempts && (
                                        <p className="text-sm text-red-600">{errors.max_attempts}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                        checked={data.is_final_quiz}
                                        onCheckedChange={(checked) => setData('is_final_quiz', checked)}
                                    />
                                <Label htmlFor="is_final_quiz" className="text-sm font-medium">
                                    Final Quiz
                                </Label>
                                <p className="text-xs text-gray-500 ml-2">
                                    Students must pass this quiz to complete the course
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing || isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || isSubmitting}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing || isSubmitting ? 'Creating...' : 'Create Quiz'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
