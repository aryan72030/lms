import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course, Assignment } from '@/types'; // Adjust types as needed
import { Save } from 'lucide-react';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    assignment: Assignment | null;
    isAdmin?: boolean;
}

interface AssignmentFormData {
    course_id: string;
    title: string;
    instructions: string;
    assignment_type: 'text' | 'file' | 'mixed';
    allowed_file_types: string[];
    max_file_size_mb: number;
    max_files: number;
    max_score: number;
    passing_score: number;
    due_days: number;
    is_published: boolean;
}

export function AssignmentModal({
    isOpen,
    onClose,
    courses,
    assignment,
    isAdmin = false,
}: AssignmentModalProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm<AssignmentFormData>({
        course_id: assignment?.course_id?.toString() || '',
        title: assignment?.title || '',
        instructions: assignment?.instructions || '',
        assignment_type: assignment?.assignment_type || 'text',
        allowed_file_types: assignment?.allowed_file_types || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
        max_file_size_mb: assignment?.max_file_size_mb || 10,
        max_files: assignment?.max_files || 1,
        max_score: assignment?.max_score || 100,
        passing_score: assignment?.passing_score || 70,
        due_days: assignment?.due_days || 7,
        is_published: assignment?.is_published || false,
    });

    useEffect(() => {
        if (assignment) {
            setData({
                course_id: assignment.course_id?.toString() || '',
                title: assignment.title,
                instructions: assignment.instructions,
                assignment_type: assignment.assignment_type || 'text',
                allowed_file_types: assignment.allowed_file_types || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
                max_file_size_mb: assignment.max_file_size_mb || 10,
                max_files: assignment.max_files || 1,
                max_score: assignment.max_score,
                passing_score: assignment.passing_score,
                due_days: assignment.due_days,
                is_published: assignment.is_published,
            });
        } else {
            reset();
            if (courses.length > 0) {
                setData('course_id', courses[0].id.toString());
            }
        }
    }, [assignment, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            course_id: parseInt(data.course_id.toString()),
        };

        if (assignment) {
            put(
                isAdmin ? `/admin/assignments/${assignment.id}` : `/instructor/assignments/${assignment.id}`,
                {
                    onSuccess: () => {
                        onClose();
                    },
                    onError: (err) => {
                        console.error(err);
                    },
                },
            );
        } else {
            post(
                isAdmin ? `/admin/assignments` : `/instructor/assignments`,
                {
                    onSuccess: () => {
                        onClose();
                        reset();
                    },
                    onError: (err) => {
                        console.error(err);
                    },
                },
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{assignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
                    <DialogDescription>
                        {assignment
                            ? 'Update the details of your assignment.'
                            : 'Create a new assignment for your course. Fill in the details below.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="course_id">
                                    Course{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    onValueChange={(value) => setData('course_id', value)}
                                    value={data.course_id.toString()}
                                    disabled={!!assignment && !isAdmin} // Cannot change course for existing assignment (except admin)
                                >
                                    <SelectTrigger
                                        id="course_id"
                                        className={
                                            errors.course_id ? 'border-red-500' : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((course) => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.title} {isAdmin && course.instructor_name && `(Instructor: ${course.instructor_name})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && (
                                    <p className="text-sm text-red-600">
                                        {errors.course_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Title{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter assignment title"
                                    className={
                                        errors.title ? 'border-red-500' : ''
                                    }
                                    required
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instructions">
                                Assignment Instructions{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="instructions"
                                value={data.instructions}
                                onChange={(e) => setData('instructions', e.target.value)}
                                placeholder="Enter assignment instructions..."
                                rows={6}
                                className={
                                    errors.instructions ? 'border-red-500' : ''
                                }
                                required
                            />
                            {errors.instructions && (
                                <p className="text-sm text-red-600">
                                    {errors.instructions}
                                </p>
                            )}
                        </div>

                        {/* Assignment Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="assignment_type">
                                Assignment Type{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value: 'text' | 'file' | 'mixed') => setData('assignment_type', value)}
                                value={data.assignment_type}
                            >
                                <SelectTrigger
                                    id="assignment_type"
                                    className={
                                        errors.assignment_type ? 'border-red-500' : ''
                                    }
                                >
                                    <SelectValue placeholder="Select assignment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">
                                        📝 Text Only - Students write text responses
                                    </SelectItem>
                                    <SelectItem value="file">
                                        📎 File Upload Only - Students upload files
                                    </SelectItem>
                                    <SelectItem value="mixed">
                                        📝📎 Mixed - Both text and file upload
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.assignment_type && (
                                <p className="text-sm text-red-600">
                                    {errors.assignment_type}
                                </p>
                            )}
                            
                            {/* Type Description */}
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                {data.assignment_type === 'text' && (
                                    <span>Students will write their responses in a text area. Good for essays, reports, or written assignments.</span>
                                )}
                                {data.assignment_type === 'file' && (
                                    <span>Students will upload files only. Good for projects, presentations, or practical work submissions.</span>
                                )}
                                {data.assignment_type === 'mixed' && (
                                    <span>Students can both write text and upload files. Good for comprehensive assignments requiring both written work and file attachments.</span>
                                )}
                            </div>
                        </div>

                        {/* File Upload Settings - Show only for file and mixed types */}
                        {(data.assignment_type === 'file' || data.assignment_type === 'mixed') && (
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="text-sm font-semibold text-blue-900">File Upload Settings</h5>
                                
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_file_size_mb">
                                            Max File Size (MB)
                                        </Label>
                                        <Input
                                            id="max_file_size_mb"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={data.max_file_size_mb}
                                            onChange={(e) => setData('max_file_size_mb', parseInt(e.target.value))}
                                            className={
                                                errors.max_file_size_mb ? 'border-red-500' : ''
                                            }
                                        />
                                        {errors.max_file_size_mb && (
                                            <p className="text-sm text-red-600">
                                                {errors.max_file_size_mb}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_files">
                                            Max Number of Files
                                        </Label>
                                        <Input
                                            id="max_files"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={data.max_files}
                                            onChange={(e) => setData('max_files', parseInt(e.target.value))}
                                            className={
                                                errors.max_files ? 'border-red-500' : ''
                                            }
                                        />
                                        {errors.max_files && (
                                            <p className="text-sm text-red-600">
                                                {errors.max_files}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Allowed File Types</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip'].map((type) => (
                                            <label key={type} className="flex items-center space-x-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={data.allowed_file_types.includes(type)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setData('allowed_file_types', [...data.allowed_file_types, type]);
                                                        } else {
                                                            setData('allowed_file_types', data.allowed_file_types.filter(t => t !== type));
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="uppercase">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.allowed_file_types && (
                                        <p className="text-sm text-red-600">
                                            {errors.allowed_file_types}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assignment Settings */}
                    <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">Assignment Settings</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="max_score">
                                    Max Score{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="max_score"
                                    type="number"
                                    min="1"
                                    value={data.max_score}
                                    onChange={(e) => setData('max_score', parseInt(e.target.value))}
                                    className={
                                        errors.max_score ? 'border-red-500' : ''
                                    }
                                    required
                                />
                                {errors.max_score && (
                                    <p className="text-sm text-red-600">
                                        {errors.max_score}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passing_score">
                                    Passing Score (%){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="passing_score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={data.passing_score}
                                    onChange={(e) => setData('passing_score', parseInt(e.target.value))}
                                    className={
                                        errors.passing_score ? 'border-red-500' : ''
                                    }
                                    required
                                />
                                {errors.passing_score && (
                                    <p className="text-sm text-red-600">
                                        {errors.passing_score}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="due_days">
                                    Assignment Duration (Days){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="due_days"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={data.due_days}
                                    onChange={(e) => setData('due_days', parseInt(e.target.value))}
                                    className={
                                        errors.due_days ? 'border-red-500' : ''
                                    }
                                    required
                                />
                                {errors.due_days && (
                                    <p className="text-sm text-red-600">
                                        {errors.due_days}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(checked) => setData('is_published', checked)}
                                />
                                <Label
                                    htmlFor="is_published"
                                    className="text-sm font-medium"
                                >
                                    Publish Assignment
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {processing
                                ? assignment
                                    ? 'Updating...'
                                    : 'Creating...'
                                : assignment
                                  ? 'Update Assignment'
                                  : 'Create Assignment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
