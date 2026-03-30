import { useForm } from '@inertiajs/react';
import { Save, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Course {
    id: number;
    title: string;
}

interface QuizCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
}

export function QuizCreateModal({ isOpen, onClose, courses }: QuizCreateModalProps) {
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
                onClose();
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Quiz</DialogTitle>
                    <DialogDescription>
                        Create a quiz for your course. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="modal-title">Quiz Title *</Label>
                                <Input
                                    id="modal-title"
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
                                <Label htmlFor="modal-course_id">Course *</Label>
                                <Select
                                    value={data.course_id}
                                    onValueChange={(value) => setData('course_id', value)}
                                >
                                    <SelectTrigger id="modal-course_id" className={errors.course_id ? 'border-red-500' : ''}>
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
                            <Label htmlFor="modal-description">Description</Label>
                            <Textarea
                                id="modal-description"
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
                    </div>

                    {/* Quiz Settings */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium">Quiz Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="modal-time_limit">Time Limit (min)</Label>
                                <Input
                                    id="modal-time_limit"
                                    type="number"
                                    min="1"
                                    value={data.time_limit}
                                    onChange={(e) => setData('time_limit', e.target.value)}
                                    placeholder="No limit"
                                    className={errors.time_limit ? 'border-red-500' : ''}
                                />
                                {errors.time_limit && (
                                    <p className="text-sm text-red-600">{errors.time_limit}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="modal-passing_score">Pass Score (%) *</Label>
                                <Input
                                    id="modal-passing_score"
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
                                <Label htmlFor="modal-max_attempts">Max Attempts *</Label>
                                <Input
                                    id="modal-max_attempts"
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

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                checked={data.is_final_quiz}
                                onCheckedChange={(checked) => setData('is_final_quiz', checked)}
                            />
                            <Label htmlFor="modal-is_final_quiz" className="text-sm font-medium">
                                Final Quiz
                            </Label>
                            <p className="text-xs text-gray-500 ml-2">
                                Required to complete the course
                            </p>
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
                            {processing || isSubmitting ? 'Creating...' : 'Create Quiz'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
