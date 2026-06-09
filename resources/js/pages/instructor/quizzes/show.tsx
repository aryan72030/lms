import { Head, Link, router } from '@inertiajs/react';
import {
    Clock,
    CheckCircle,
    XCircle,
    Users,
    BarChart3,
    ListOrdered,
    Plus,
    Edit,
    Trash2,
    Target,
    ArrowLeft,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Option {
    key: string;
    text: string;
}

interface QuizQuestion {
    id: number;
    question_text: string;
    question_type: string;
    options: (string | Option)[] | null;
    correct_answer: string;
    explanation: string | null;
    points: number;
    order: number;
    is_active: boolean;
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    course: {
        id: number;
        title: string;
    };
    time_limit: number | null;
    total_marks: number;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    is_active: boolean;
    questions: QuizQuestion[];
    created_at: string;
    updated_at: string;
}

interface Statistics {
    total_attempts: number;
    passed_attempts: number;
    failed_attempts: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    pass_rate: number;
    completion_rate: number;
}

interface Props {
    quiz: Quiz;
    statistics: Statistics;
}

const questionTypes: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    short_answer: 'Short Answer',
    true_false: 'True/False',
};

export default function ShowQuiz({ quiz, statistics }: Props) {
    const questionMessages = useActionMessages('Question');
    const [deletingQuestion, setDeletingQuestion] = useState<number | null>(
        null,
    );
    const [questionToDelete, setQuestionToDelete] = useState<number | null>(
        null,
    );
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
        null,
    );
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        points: 1,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const optionKeyForIndex = (index: number) =>
        String.fromCharCode(65 + index);

    const extractOptionTexts = (options: (string | Option)[] | null) => {
        if (!options) return [];
        return options.map((opt) => (typeof opt === 'string' ? opt : opt.text));
    };

    const resetQuestionForm = () => {
        setQuestionForm({
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            explanation: '',
            points: 1,
        });
        setFormErrors({});
    };

    const openAddQuestionModal = () => {
        resetQuestionForm();
        setShowAddQuestionModal(true);
    };

    const closeAddQuestionModal = () => {
        setShowAddQuestionModal(false);
        resetQuestionForm();
    };

    const closeEditQuestionModal = () => {
        setShowEditQuestionModal(false);
        setEditingQuestionId(null);
        resetQuestionForm();
    };

    const openEditQuestionModal = (question: QuizQuestion) => {
        setFormErrors({});
        const optionTexts = extractOptionTexts(question.options);
        const filledOptions = [...optionTexts];
        while (filledOptions.length < 4) filledOptions.push('');

        setQuestionForm({
            question_text: question.question_text || '',
            question_type: question.question_type || 'multiple_choice',
            options: filledOptions,
            correct_answer: question.correct_answer || '',
            explanation: question.explanation || '',
            points: question.points || 1,
        });
        setEditingQuestionId(question.id);
        setShowEditQuestionModal(true);
    };

    const handleAddQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/instructor/quizzes/${quiz.id}/questions`,
            {
                ...questionForm,
                options:
                    questionForm.question_type === 'short_answer'
                        ? null
                        : questionForm.options.filter(
                              (opt) => opt.trim() !== '',
                          ),
            },
            {
                onSuccess: () => {
                    closeAddQuestionModal();
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    questionMessages.error('create');
                },
            },
        );
    };

    const handleUpdateQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuestionId) return;

        router.put(
            `/instructor/quizzes/${quiz.id}/questions/${editingQuestionId}`,
            {
                ...questionForm,
                options:
                    questionForm.question_type === 'short_answer'
                        ? null
                        : questionForm.options.filter(
                              (opt) => opt.trim() !== '',
                          ),
            },
            {
                onSuccess: () => {
                    setShowEditQuestionModal(false);
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    questionMessages.error('update');
                },
            },
        );
    };

    const handleDeleteQuestion = async () => {
        if (!questionToDelete) return;
        setDeletingQuestion(questionToDelete);
        try {
            await router.delete(
                `/instructor/quizzes/${quiz.id}/questions/${questionToDelete}`,
            );
            questionMessages.success('delete');
        } catch (error) {
            questionMessages.error('delete');
        } finally {
            setDeletingQuestion(null);
            setQuestionToDelete(null);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Quiz Management', href: '/instructor/quizzes' },
                { title: quiz.title, href: `/instructor/quizzes/${quiz.id}` },
            ]}
        >
            <Head title={`Quiz: ${quiz.title}`} />

            <div className="mb-4">
                <Link
                    href="/instructor/quizzes"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300"
                    aria-label="Back to Quizzes"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </div>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="page-title text-gray-900">
                                    {quiz.title}
                                </h1>
                                {quiz.is_final_quiz && (
                                    <Badge className="border-none bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                                        Final Quiz
                                    </Badge>
                                )}
                                <Badge
                                    variant={
                                        quiz.is_active ? 'default' : 'secondary'
                                    }
                                >
                                    {quiz.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                                {quiz.course?.title || 'Course'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/instructor/quizzes/${quiz.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Quiz
                            </Link>
                        </Button>
                        <Button onClick={openAddQuestionModal} variant="create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Question
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column: Quiz Info & Stats */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Statistics Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                                    Performance Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Pass Rate
                                        </div>
                                        <div className="text-xl font-bold text-indigo-600">
                                            {statistics?.pass_rate || 0}%
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Avg Score
                                        </div>
                                        <div className="text-xl font-bold text-gray-900">
                                            {statistics?.average_score || 0}%
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-gray-500">
                                            <Users className="h-3.5 w-3.5" />
                                            Total Attempts
                                        </span>
                                        <span className="font-bold">
                                            {statistics?.total_attempts || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-gray-500">
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                            Passed
                                        </span>
                                        <span className="font-bold text-green-600">
                                            {statistics?.passed_attempts || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-gray-500">
                                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                                            Failed
                                        </span>
                                        <span className="font-bold text-red-600">
                                            {statistics?.failed_attempts || 0}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Highest Score
                                        </span>
                                        <span className="font-bold">
                                            {statistics?.highest_score || 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Lowest Score
                                        </span>
                                        <span className="font-bold">
                                            {statistics?.lowest_score || 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quiz Settings Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">
                                    Quiz Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Time Limit
                                        </span>
                                        <span className="font-medium">
                                            {quiz.time_limit
                                                ? `${quiz.time_limit} minutes`
                                                : 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Total Marks
                                        </span>
                                        <span className="font-medium">
                                            {quiz.total_marks} points
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Passing Score
                                        </span>
                                        <span className="font-medium text-indigo-600">
                                            {quiz.passing_score}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            Max Attempts
                                        </span>
                                        <span className="font-medium">
                                            {quiz.max_attempts}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between text-xs tracking-wider text-gray-400 uppercase">
                                        <span>Created</span>
                                        <span>{quiz.created_at}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs tracking-wider text-gray-400 uppercase">
                                        <span>Last Updated</span>
                                        <span>{quiz.updated_at}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Questions */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Questions List</CardTitle>
                                    <CardDescription>
                                        Total {quiz.questions.length} questions
                                        in this quiz
                                    </CardDescription>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                    <ListOrdered className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {quiz.questions.length > 0 ? (
                                        quiz.questions.map(
                                            (question, index) => (
                                                <div
                                                    key={question.id}
                                                    className="space-y-4 p-6"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex gap-3">
                                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                                                {index + 1}
                                                            </span>
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm leading-relaxed font-semibold text-gray-900">
                                                                    {
                                                                        question.question_text
                                                                    }
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="h-5 text-[10px] capitalize"
                                                                    >
                                                                        {questionTypes[question.question_type] || question.question_type.replace('_', ' ')}
                                                                    </Badge>
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                                        {
                                                                            question.points
                                                                        }{' '}
                                                                        Points
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditQuestionModal(
                                                                        question,
                                                                    )
                                                                }
                                                            >
                                                                <Edit className="h-4 w-4 text-gray-400" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    setQuestionToDelete(
                                                                        question.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-400" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 pl-9 md:grid-cols-2">
                                                        {extractOptionTexts(question.options).map(
                                                            (
                                                                option,
                                                                optIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        optIndex
                                                                    }
                                                                    className={cn(
                                                                        'rounded-lg border p-3 text-sm transition-colors',
                                                                        optionKeyForIndex(optIndex) === question.correct_answer
                                                                            ? 'border-green-200 bg-green-50 font-medium text-green-700 ring-1 ring-green-200'
                                                                            : 'border-gray-100 bg-white text-gray-600',
                                                                    )}
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            'flex items-center gap-2',
                                                                            optionKeyForIndex(optIndex) === question.correct_answer
                                                                                ? 'font-medium text-green-700'
                                                                                : 'text-gray-600',
                                                                        )}
                                                                    >
                                                                        <span className="text-xs font-bold text-gray-400">
                                                                            {optionKeyForIndex(optIndex)}.
                                                                        </span>
                                                                        {option}
                                                                        {optionKeyForIndex(optIndex) === question.correct_answer && (
                                                                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>

                                                    {question.explanation && (
                                                        <div className="ml-9 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-800">
                                                            <span className="mr-1 font-bold">
                                                                Explanation:
                                                            </span>
                                                            {
                                                                question.explanation
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className="py-12 text-center text-gray-500 italic">
                                            No questions found for this quiz.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Question Modals (Add/Edit) */}
            <Dialog
                open={showAddQuestionModal || showEditQuestionModal}
                onOpenChange={(open) =>
                    !open &&
                    (showAddQuestionModal
                        ? closeAddQuestionModal()
                        : closeEditQuestionModal())
                }
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {showAddQuestionModal ? 'Add New Question' : 'Edit Question'}
                        </DialogTitle>
                        <DialogDescription>{quiz.title}</DialogDescription>
                    </DialogHeader>

                        <form
                            onSubmit={
                                showAddQuestionModal
                                    ? handleAddQuestion
                                    : handleUpdateQuestion
                            }
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm text-[10px] font-bold tracking-wider text-gray-700 uppercase">
                                        Question Text
                                    </label>
                                    <textarea
                                        value={questionForm.question_text}
                                        onChange={(e) =>
                                            setQuestionForm({
                                                ...questionForm,
                                                question_text: e.target.value,
                                            })
                                        }
                                        className="min-h-[100px] w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Enter your question here..."
                                        required
                                    />
                                    {formErrors.question_text && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {formErrors.question_text}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm text-[10px] font-bold tracking-wider text-gray-700 uppercase">
                                            Points
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={questionForm.points}
                                            onChange={(e) =>
                                                setQuestionForm({
                                                    ...questionForm,
                                                    points: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm text-[10px] font-bold tracking-wider text-gray-700 uppercase">
                                            Options & Correct Answer
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuestionForm({
                                                    ...questionForm,
                                                    options: [...questionForm.options, ''],
                                                });
                                            }}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {questionForm.options.map(
                                            (opt, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <input
                                                            type="radio"
                                                            name="correct_answer"
                                                            checked={
                                                                questionForm.correct_answer ===
                                                                optionKeyForIndex(
                                                                    idx,
                                                                )
                                                            }
                                                            onChange={() =>
                                                                setQuestionForm(
                                                                    {
                                                                        ...questionForm,
                                                                        correct_answer:
                                                                            optionKeyForIndex(
                                                                                idx,
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            className="h-5 w-5 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="relative flex-1 flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOptions = [...questionForm.options];
                                                                newOptions[idx] = e.target.value;
                                                                setQuestionForm({
                                                                    ...questionForm,
                                                                    options: newOptions,
                                                                });
                                                            }}
                                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            placeholder={`Option ${optionKeyForIndex(idx)}`}
                                                            required
                                                        />
                                                        {questionForm.options.length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newOptions = questionForm.options.filter((_, i) => i !== idx);
                                                                    setQuestionForm({
                                                                        ...questionForm,
                                                                        options: newOptions,
                                                                        // Reset correct answer if it was deleted or index changed
                                                                        correct_answer: '',
                                                                    });
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    {formErrors.options && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {formErrors.options}
                                        </p>
                                    )}
                                    {formErrors.correct_answer && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {formErrors.correct_answer}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm text-[10px] font-bold tracking-wider text-gray-700 uppercase">
                                        Explanation (Optional)
                                    </label>
                                    <textarea
                                        value={questionForm.explanation}
                                        onChange={(e) =>
                                            setQuestionForm({
                                                ...questionForm,
                                                explanation: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Why is this the correct answer?"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={
                                        showAddQuestionModal
                                            ? closeAddQuestionModal
                                            : closeEditQuestionModal
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="create">
                                    {showAddQuestionModal
                                        ? 'Add Question'
                                        : 'Update Question'}
                                </Button>
                            </div>
                        </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={questionToDelete !== null}
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                onConfirm={handleDeleteQuestion}
                onCancel={() => setQuestionToDelete(null)}
                variant="destructive"
                loading={deletingQuestion !== null}
            />
        </AppLayout>
    );
}
