import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

interface Course {
    id: number;
    title: string;
    instructor_name: string;
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    course_id: number;
    course?: {
        id: number;
        title: string;
    };
    time_limit: number | null;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    is_active: boolean;
}

interface QuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    quiz?: Quiz | null;
}

export function AdminQuizModal({
    isOpen,
    onClose,
    courses,
    quiz = null,
}: QuizModalProps) {
    const isEdit = !!quiz;
    const quizMessages = useActionMessages('Quiz');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultData = {
        title: '',
        description: '',
        course_id: '',
        time_limit: '',
        passing_score: 70,
        max_attempts: 3,
        is_final_quiz: false,
        is_active: true,
        redirect_to: '',
    };

    const {
        data,
        setData,
        post,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm(defaultData);

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            setIsSubmitting(false);
            const currentPath = window.location.pathname;
            const isCoursePage = currentPath.includes('/admin/courses/') && currentPath.includes('/lessons');

            if (quiz) {
                setData({
                    title: quiz.title || '',
                    description: quiz.description || '',
                    course_id:
                        (quiz.course_id || quiz.course?.id)?.toString() || '',
                    time_limit: quiz.time_limit?.toString() || '',
                    passing_score: quiz.passing_score ?? 70,
                    max_attempts: quiz.max_attempts ?? 3,
                    is_final_quiz: quiz.is_final_quiz ?? false,
                    is_active: quiz.is_active ?? true,
                    redirect_to: isCoursePage ? currentPath : '',
                });
            } else {
                reset();
                const initialData = {
                    ...defaultData,
                    redirect_to: isCoursePage ? currentPath : '',
                };

                if (isCoursePage && courses.length === 1) {
                    initialData.course_id = courses[0].id.toString();
                }

                setData(initialData);
            }
        }
    }, [isOpen, quiz]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const options = {
            onSuccess: () => {
                onClose();
                if (!isEdit) reset();
            },
            onError: () => {
                quizMessages.error(isEdit ? 'update' : 'create');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
            preserveScroll: true,
        };

        if (isEdit) {
            patch(`/admin/quizzes/${quiz.id}`, options);
        } else {
            post('/admin/quizzes', options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the details of the quiz.'
                            : 'Fill in the details to create a new quiz for any course.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="admin-modal-title">
                                    Quiz Title{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="admin-modal-title"
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
                                <Label htmlFor="admin-modal-course_id">
                                    Course{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.course_id}
                                    onValueChange={(value) =>
                                        setData('course_id', value)
                                    }
                                    disabled={isEdit}
                                >
                                    <SelectTrigger
                                        id="admin-modal-course_id"
                                        className={
                                            errors.course_id
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((course) => (
                                            <SelectItem
                                                key={course.id}
                                                value={course.id.toString()}
                                            >
                                                {course.title}
                                                {course.instructor_name &&
                                                    ` (${course.instructor_name})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && (
                                    <p className="text-sm text-red-600">
                                        {errors.course_id}
                                    </p>
                                )}
                                {isEdit && (
                                    <p className="mt-1 text-[10px] text-gray-500 uppercase">
                                        Course cannot be changed for existing
                                        quizzes
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-modal-description">
                                Description
                            </Label>
                            <Textarea
                                id="admin-modal-description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Enter quiz description (optional)"
                                rows={3}
                                className={
                                    errors.description ? 'border-red-500' : ''
                                }
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quiz Settings */}
                    <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">Quiz Settings</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="admin-modal-time_limit">
                                    Time (min)
                                </Label>
                                <Input
                                    id="admin-modal-time_limit"
                                    type="number"
                                    min="1"
                                    value={data.time_limit}
                                    onChange={(e) =>
                                        setData('time_limit', e.target.value)
                                    }
                                    placeholder="No limit"
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="admin-modal-passing_score">
                                    Pass %{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="admin-modal-passing_score"
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
                                <Label htmlFor="admin-modal-max_attempts">
                                    Max Att.{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="admin-modal-max_attempts"
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

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="admin-modal-is_final_quiz"
                                        className="text-sm font-medium"
                                    >
                                        Final Quiz
                                    </Label>
                                    <p className="text-[11px] text-gray-500">
                                        Is this the final assessment?
                                    </p>
                                </div>
                                <Switch
                                    id="admin-modal-is_final_quiz"
                                    checked={data.is_final_quiz}
                                    onCheckedChange={(checked) =>
                                        setData('is_final_quiz', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="admin-modal-is_active"
                                        className="text-sm font-medium"
                                    >
                                        Active Status
                                    </Label>
                                    <p className="text-[11px] text-gray-500">
                                        Make quiz available to students
                                    </p>
                                </div>
                                <Switch
                                    id="admin-modal-is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
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
                            {processing || isSubmitting
                                ? isEdit
                                    ? 'Updating...'
                                    : 'Creating...'
                                : isEdit
                                  ? 'Update Quiz'
                                  : 'Create Quiz'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
