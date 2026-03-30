import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Course {
    id: number;
    title: string;
    status_label?: string;
    instructor_name?: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: number;
}

interface Lesson {
    id: number;
    title: string;
    description?: string;
    type: string;
    order: number;
    is_published: boolean;
    section_id?: number | null;
    estimated_duration: number;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    quiz_data?: {
        questions?: QuizQuestion[];
    };
    assignment_data?: {
        instructions?: string;
        max_score?: number;
        due_days?: number;
    };
    course_id?: number;
}

interface FormData {
    course_id: string;
    section_id: string;
    title: string;
    description: string;
    type: string;
    estimated_duration: number | '';
    is_published: boolean;
    text_content: string;
    video_url: string;
    video_duration: number | '';
    quiz_questions: QuizQuestion[];
    assignment_instructions: string;
    assignment_max_score: number | '';
    assignment_due_days: number | '';
}

interface Props {
    mode: 'create' | 'edit';
    course?: Course;
    sections?: Array<{ id: number; title: string }>;
    lessonTypes: string[];
    action: string;
    lesson?: Lesson;
    courses?: Course[];
    cancelUrl?: string;
}

export default function AdminLessonForm({ mode, course, sections, lessonTypes, action, lesson, courses, cancelUrl }: Props) {
    const lessonMessages = useActionMessages('Lesson');
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        course_id: lesson?.course_id?.toString() || course?.id?.toString() || '',
        section_id: lesson?.section_id?.toString() || '',
        title: lesson?.title || '',
        description: lesson?.description || '',
        type: lesson?.type || (lessonTypes.length > 0 ? lessonTypes[0] : 'Text'),
        estimated_duration: (lesson?.estimated_duration || 10) as number | '',
        is_published: lesson?.is_published || false,
        text_content: lesson?.text_content || '',
        video_url: lesson?.video_url || '',
        video_duration: (lesson?.video_duration || '') as number | '',
        quiz_questions: lesson?.quiz_data?.questions || [{ question: '', options: ['', ''], correct_answer: 0 }],
        assignment_instructions: lesson?.assignment_data?.instructions || '',
        assignment_max_score: (lesson?.assignment_data?.max_score || 100) as number | '',
        assignment_due_days: (lesson?.assignment_data?.due_days || 7) as number | '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            post(action, {
                onSuccess: () => lessonMessages.success('create'),
                onError: () => lessonMessages.error('create'),
            });

            return;
        }

        put(action, {
            onSuccess: () => lessonMessages.success('update'),
            onError: () => lessonMessages.error('update'),
        });
    };

    const addQuizQuestion = () => {
        setData('quiz_questions', [
            ...data.quiz_questions,
            { question: '', options: ['', ''], correct_answer: 0 },
        ]);
    };

    const removeQuizQuestion = (index: number) => {
        setData('quiz_questions', data.quiz_questions.filter((_, i) => i !== index));
    };

    const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const questions = [...data.quiz_questions];
        questions[index] = { ...questions[index], [field]: value };
        setData('quiz_questions', questions);
    };

    const addQuizOption = (questionIndex: number) => {
        const questions = [...data.quiz_questions];
        questions[questionIndex].options.push('');
        setData('quiz_questions', questions);
    };

    const removeQuizOption = (questionIndex: number, optionIndex: number) => {
        const questions = [...data.quiz_questions];
        questions[questionIndex].options = questions[questionIndex].options.filter((_, i) => i !== optionIndex);

        if (questions[questionIndex].correct_answer >= questions[questionIndex].options.length) {
            questions[questionIndex].correct_answer = Math.max(0, questions[questionIndex].options.length - 1);
        }

        setData('quiz_questions', questions);
    };

    const updateQuizOption = (questionIndex: number, optionIndex: number, value: string) => {
        const questions = [...data.quiz_questions];
        questions[questionIndex].options[optionIndex] = value;
        setData('quiz_questions', questions);
    };

    const lessonType = data.type;

    const renderTypeSpecificFields = () => {
        switch (lessonType) {
            case 'Text':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="text_content">Text Content *</Label>
                        <Textarea
                            id="text_content"
                            value={data.text_content}
                            onChange={(e) => setData('text_content', e.target.value)}
                            rows={10}
                            placeholder="Enter the lesson content..."
                            className={errors.text_content ? 'border-red-500' : ''}
                            required
                        />
                        {errors.text_content && <p className="text-red-600 text-sm mt-1">{errors.text_content}</p>}
                    </div>
                );

            case 'Video':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="video_url">Video URL *</Label>
                            <Input
                                id="video_url"
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className={errors.video_url ? 'border-red-500' : ''}
                                required
                            />
                            {errors.video_url && <p className="text-red-600 text-sm mt-1">{errors.video_url}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="video_duration">Video Duration (seconds)</Label>
                            <Input
                                id="video_duration"
                                type="number"
                                min="1"
                                value={data.video_duration}
                                onChange={(e) => setData('video_duration', e.target.value === '' ? '' : parseInt(e.target.value))}
                                placeholder="300"
                                className={errors.video_duration ? 'border-red-500' : ''}
                            />
                            {errors.video_duration && <p className="text-red-600 text-sm mt-1">{errors.video_duration}</p>}
                        </div>
                    </div>
                );

            case 'Quiz':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Quiz Questions *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addQuizQuestion}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Question
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {data.quiz_questions.map((question, qIndex) => (
                                <div key={qIndex} className="border border-gray-200 rounded-md p-4 bg-gray-50/50 space-y-4 relative">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">Question {qIndex + 1}</h4>
                                        {data.quiz_questions.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeQuizQuestion(qIndex)}
                                                className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Input
                                            type="text"
                                            value={question.question}
                                            onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                            placeholder="Enter your question..."
                                            required
                                        />

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Answer Options</Label>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => addQuizOption(qIndex)}
                                                    className="h-auto p-0 text-xs"
                                                >
                                                    + Add Option
                                                </Button>
                                            </div>

                                            {question.options.map((option, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct_${qIndex}`}
                                                        checked={question.correct_answer === oIndex}
                                                        onChange={() => updateQuizQuestion(qIndex, 'correct_answer', oIndex)}
                                                        className="h-4 w-4 text-primary focus:ring-primary"
                                                        required
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                                                        className="flex-1"
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        required
                                                    />
                                                    {question.options.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeQuizOption(qIndex, oIndex)}
                                                            className="text-red-600 h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {errors.quiz_questions && <p className="text-red-600 text-sm mt-1">{errors.quiz_questions}</p>}
                    </div>
                );

            case 'Assignment':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignment_instructions">Assignment Instructions *</Label>
                            <Textarea
                                id="assignment_instructions"
                                value={data.assignment_instructions}
                                onChange={(e) => setData('assignment_instructions', e.target.value)}
                                rows={6}
                                placeholder="Enter assignment instructions..."
                                className={errors.assignment_instructions ? 'border-red-500' : ''}
                                required
                            />
                            {errors.assignment_instructions && (
                                <p className="text-red-600 text-sm mt-1">{errors.assignment_instructions}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="assignment_max_score">Maximum Score</Label>
                                <Input
                                    id="assignment_max_score"
                                    type="number"
                                    min="1"
                                    value={data.assignment_max_score}
                                    onChange={(e) => setData('assignment_max_score', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className={errors.assignment_max_score ? 'border-red-500' : ''}
                                />
                                {errors.assignment_max_score && (
                                    <p className="text-red-600 text-sm mt-1">{errors.assignment_max_score}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assignment_due_days">Due Days</Label>
                                <Input
                                    id="assignment_due_days"
                                    type="number"
                                    min="1"
                                    value={data.assignment_due_days}
                                    onChange={(e) => setData('assignment_due_days', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className={errors.assignment_due_days ? 'border-red-500' : ''}
                                />
                                {errors.assignment_due_days && (
                                    <p className="text-red-600 text-sm mt-1">{errors.assignment_due_days}</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

                        {courses && (
                            <div className="space-y-2">
                                <Label htmlFor="course_id">Select Course *</Label>
                                <Select 
                                    onValueChange={(value) => setData('course_id', value)} 
                                    value={data.course_id}
                                >
                                    <SelectTrigger className={errors.course_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.title} {c.instructor_name ? `(${c.instructor_name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && <p className="text-red-600 text-sm mt-1">{errors.course_id}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Lesson Title *</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Enter lesson title"
                                className={errors.title ? 'border-red-500' : ''}
                                required
                            />
                            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                        </div>

                        {sections && sections.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="section_id">Course Section</Label>
                                <Select 
                                    onValueChange={(value) => setData('section_id', value)} 
                                    value={data.section_id}
                                >
                                    <SelectTrigger className={errors.section_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select a section (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Section</SelectItem>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.section_id && <p className="text-red-600 text-sm mt-1">{errors.section_id}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter short description..."
                                rows={3}
                            />
                            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="estimated_duration">Duration (minutes) *</Label>
                                <Input
                                    id="estimated_duration"
                                    type="number"
                                    min="1"
                                    value={data.estimated_duration}
                                    onChange={(e) => setData('estimated_duration', e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className={errors.estimated_duration ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.estimated_duration && <p className="text-red-600 text-sm mt-1">{errors.estimated_duration}</p>}
                            </div>

                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    checked={data.is_published}
                                    onCheckedChange={(checked) => setData('is_published', checked)}
                                />
                                <Label htmlFor="is_published">Published</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Lesson Type *</Label>
                            <Select 
                                onValueChange={(value) => setData('type', value)} 
                                value={data.type}
                                disabled={mode === 'edit'}
                            >
                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lessonTypes.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Lesson Content</h3>
                        {renderTypeSpecificFields()}
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4 mr-2" />
                        {processing ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Lesson' : 'Save Changes')}
                    </Button>
                    <Link href={cancelUrl || (course ? `/admin/courses/${course.id}/lessons` : '/admin/lessons')}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
