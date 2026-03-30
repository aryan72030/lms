import { Head, useForm, Link } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Course {
    id: number;
    title: string;
    status: string;
}

interface Props {
    course: Course;
    lessonTypes: string[];
}

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: number;
}

interface FormData {
    title: string;
    description: string;
    type: string;
    estimated_duration: string;
    is_published: boolean;
    text_content: string;
    video_url: string;
    video_duration: string;
    quiz_questions: QuizQuestion[];
    quiz_passing_score: string;
    quiz_attempts_allowed: string;
    is_final_quiz: boolean;
    assignment_instructions: string;
    assignment_max_score: string;
    assignment_due_days: string;
}

export default function InstructorLessonCreate({ course, lessonTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: '',
        description: '',
        type: lessonTypes[0] || 'Text',
        estimated_duration: '10',
        is_published: false,
        text_content: '',
        video_url: '',
        video_duration: '',
        quiz_questions: [{ question: '', options: ['', ''], correct_answer: 0 }],
        quiz_passing_score: '70',
        quiz_attempts_allowed: '3',
        is_final_quiz: false,
        assignment_instructions: '',
        assignment_max_score: '100',
        assignment_due_days: '7',
    });

    const getFieldError = (field: string) => errors[field as keyof typeof errors];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/instructor/courses/${course.id}/lessons`);
    };

    const addQuizQuestion = () => {
        setData('quiz_questions', [
            ...data.quiz_questions,
            { question: '', options: ['', ''], correct_answer: 0 }
        ]);
    };

    const removeQuizQuestion = (index: number) => {
        const questions = data.quiz_questions.filter((_, i) => i !== index);
        setData('quiz_questions', questions);
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

        // Adjust correct answer if needed
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

    const renderTypeSpecificFields = () => {
        switch (data.type) {
            case 'Text':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.text_content}
                            onChange={(e) => setData('text_content', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={10}
                            placeholder="Enter the lesson content..."
                            required
                        />
                        {errors.text_content && (
                            <p className="text-red-600 text-sm mt-1">{errors.text_content}</p>
                        )}
                    </div>
                );

            case 'Video':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://youtube.com/watch?v=..."
                                required
                            />
                            {errors.video_url && (
                                <p className="text-red-600 text-sm mt-1">{errors.video_url}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video Duration (seconds)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.video_duration}
                                onChange={(e) => setData('video_duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="300"
                            />
                            {errors.video_duration && (
                                <p className="text-red-600 text-sm mt-1">{errors.video_duration}</p>
                            )}
                        </div>
                    </div>
                );

            case 'Quiz':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={data.quiz_passing_score}
                                    onChange={(e) => setData('quiz_passing_score', e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                                    Attempts Allowed
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.quiz_attempts_allowed}
                                    onChange={(e) => setData('quiz_attempts_allowed', e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_final_quiz}
                                        onChange={(e) => setData('is_final_quiz', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-blue-700">Final Exam</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Quiz Questions <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addQuizQuestion}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" />
                                Add Question
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {data.quiz_questions.map((question, qIndex) => (
                                <div key={qIndex} className="border border-gray-200 rounded-md p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-700">Question {qIndex + 1}</h4>
                                        {data.quiz_questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuizQuestion(qIndex)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={question.question}
                                            onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your question..."
                                            required
                                        />
                                        {getFieldError(`quiz_questions.${qIndex}.question`) && (
                                            <p className="text-red-600 text-sm mt-1">{getFieldError(`quiz_questions.${qIndex}.question`)}</p>
                                        )}
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-gray-600">Answer Options</label>
                                                <button
                                                    type="button"
                                                    onClick={() => addQuizOption(qIndex)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                            
                                            {question.options.map((option, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct_${qIndex}`}
                                                        checked={question.correct_answer === oIndex}
                                                        onChange={() => updateQuizQuestion(qIndex, 'correct_answer', oIndex)}
                                                        className="text-blue-600"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        required
                                                    />
                                                    {getFieldError(`quiz_questions.${qIndex}.options.${oIndex}`) && (
                                                        <p className="text-red-600 text-xs">{getFieldError(`quiz_questions.${qIndex}.options.${oIndex}`)}</p>
                                                    )}
                                                    {question.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuizOption(qIndex, oIndex)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {getFieldError(`quiz_questions.${qIndex}.options`) && (
                                                <p className="text-red-600 text-sm mt-1">{getFieldError(`quiz_questions.${qIndex}.options`)}</p>
                                            )}
                                            {getFieldError(`quiz_questions.${qIndex}.correct_answer`) && (
                                                <p className="text-red-600 text-sm mt-1">{getFieldError(`quiz_questions.${qIndex}.correct_answer`)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {errors.quiz_questions && (
                            <p className="text-red-600 text-sm mt-1">{errors.quiz_questions}</p>
                        )}
                    </div>
                );

            case 'Assignment':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assignment Instructions <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.assignment_instructions}
                                onChange={(e) => setData('assignment_instructions', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={6}
                                placeholder="Provide detailed instructions for the assignment..."
                                required
                            />
                            {errors.assignment_instructions && (
                                <p className="text-red-600 text-sm mt-1">{errors.assignment_instructions}</p>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Score
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.assignment_max_score}
                                    onChange={(e) => setData('assignment_max_score', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="100"
                                />
                                {errors.assignment_max_score && (
                                    <p className="text-red-600 text-sm mt-1">{errors.assignment_max_score}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Due Days
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.assignment_due_days}
                                    onChange={(e) => setData('assignment_due_days', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="7"
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
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'My Courses', href: '/instructor/courses' },
            { title: course.title, href: `/instructor/courses/${course.id}/lessons` },
            { title: 'Add Lesson', href: `/instructor/courses/${course.id}/lessons/create` }
        ]}>
            <Head title={`Add Lesson - ${course.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Lesson</h1>
                        <p className="text-gray-600">{course.title}</p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white shadow rounded-lg">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lesson Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter lesson title"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lesson Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {lessonTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.type && (
                                    <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Brief description of the lesson (optional)"
                            />
                            {errors.description && (
                                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>

                        {/* Estimated Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estimated Duration (minutes) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.estimated_duration}
                                onChange={(e) => setData('estimated_duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="10"
                                required
                            />
                            {errors.estimated_duration && (
                                <p className="text-red-600 text-sm mt-1">{errors.estimated_duration}</p>
                            )}
                        </div>

                        {/* Type-specific content */}
                        {renderTypeSpecificFields()}

                        {/* Publish Status */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.is_published}
                                    onChange={(e) => setData('is_published', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">Publish lesson immediately</span>
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <Link
                                href={`/instructor/courses/${course.id}/lessons`}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <Button
                                type="submit"
                                variant="create"
                                disabled={processing}
                            >
                                {processing ? 'Creating...' : 'Create Lesson'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
