import * as Dialog from '@radix-ui/react-dialog';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Edit, 
    Plus, 
    Clock, 
    Target, 
    Users, 
    CheckCircle, 
    XCircle,
    Eye,
    Trash2,
    BarChart3,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

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
    completion_rate: number;
}

interface Props {
    quiz: Quiz;
    statistics?: Statistics;
    questionTypes: Record<string, string>;
}

export default function ShowQuiz({ quiz, statistics, questionTypes }: Props) {
    const questionMessages = useActionMessages('Question');
    const [deletingQuestion, setDeletingQuestion] = useState<number | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        points: 1
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const optionKeyForIndex = (index: number) => String.fromCharCode(65 + index);

    const extractOptionTexts = (options: (string | Option)[] | null) => {
        if (!options) return [];
        return options.map((opt) => (typeof opt === 'string' ? opt : opt.text));
    };

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const resetQuestionForm = () => {
        setQuestionForm({
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            explanation: '',
            points: 1
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

    const openEditQuestionModal = (question: QuizQuestion) => {
        setFormErrors({});

        const optionTexts = extractOptionTexts(question.options);
        const filledOptions = [...optionTexts];
        while (filledOptions.length < 4) {
            filledOptions.push('');
        }

        let correctAnswer = question.correct_answer ?? '';
        if (question.question_type === 'multiple_choice') {
            const trimmed = correctAnswer.trim();
            const upper = trimmed.toUpperCase();

            if (/^[A-Z]$/.test(upper)) {
                correctAnswer = upper;
            } else {
                const idx = optionTexts.findIndex((t) => t.trim() === trimmed);
                correctAnswer = idx >= 0 ? optionKeyForIndex(idx) : '';
            }
        }

        setQuestionForm({
            question_text: question.question_text ?? '',
            question_type: question.question_type ?? 'multiple_choice',
            options: filledOptions,
            correct_answer: correctAnswer,
            explanation: question.explanation ?? '',
            points: question.points ?? 1,
        });

        setEditingQuestionId(question.id);
        setShowEditQuestionModal(true);
    };

    const closeEditQuestionModal = () => {
        setShowEditQuestionModal(false);
        setEditingQuestionId(null);
        resetQuestionForm();
    };

    const validateMultipleChoiceCorrectAnswer = () => {
        const optionTexts = questionForm.options.filter((opt) => opt.trim() !== '');
        const validKeys = optionTexts.map((_opt, idx) => optionKeyForIndex(idx));

        if (!questionForm.correct_answer || !validKeys.includes(questionForm.correct_answer)) {
            setFormErrors((prev) => ({
                ...prev,
                correct_answer: 'Select a valid correct answer (A, B, C...).',
            }));
            return false;
        }

        return true;
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (questionForm.question_type === 'multiple_choice' && !validateMultipleChoiceCorrectAnswer()) {
            return;
        }

        try {
            const response = await fetch(`/instructor/quizzes/${quiz.id}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...questionForm,
                    options: questionForm.question_type === 'short_answer' ? null : questionForm.options.filter(opt => opt.trim() !== '')
                }),
            });

            const data = await response.json();

            if (data.success) {
                questionMessages.success('create');
                closeAddQuestionModal();
                window.location.reload();
            } else {
                if (response.status === 422 && data.errors) {
                    setFormErrors(data.errors);
                } else {
                    questionMessages.error('create');
                }
            }
        } catch (error) {
            questionMessages.error('create');
        }
    };

    const handleUpdateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        if (!editingQuestionId) {
            return;
        }

        if (questionForm.question_type === 'multiple_choice' && !validateMultipleChoiceCorrectAnswer()) {
            return;
        }

        try {
            const response = await fetch(`/instructor/quizzes/${quiz.id}/questions/${editingQuestionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...questionForm,
                    options: questionForm.question_type === 'short_answer' ? null : questionForm.options.filter(opt => opt.trim() !== ''),
                }),
            });

            const data = await response.json();

            if (data.success) {
                questionMessages.success('update');
                closeEditQuestionModal();
                window.location.reload();
            } else {
                if (response.status === 422 && data.errors) {
                    setFormErrors(data.errors);
                } else {
                    questionMessages.error('update');
                }
            }
        } catch (error) {
            questionMessages.error('update');
        }
    };

    const handleDeleteQuestion = async () => {
        if (!questionToDelete) return;

        setDeletingQuestion(questionToDelete);

        try {
            await router.delete(`/instructor/quizzes/${quiz.id}/questions/${questionToDelete}`);
            questionMessages.success('delete');
        } catch (error) {
            questionMessages.error('delete');
        } finally {
            setDeletingQuestion(null);
            setQuestionToDelete(null);
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        return questionTypes[type] || type;
    };

    const formatOptions = (options: (string | Option)[] | null, type: string) => {
        if (!options || type === 'short_answer') {
return null;
}
        
        if (type === 'true_false') {
            return ['True', 'False'];
        }
        
        return options;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'My Quizzes', href: '/instructor/quizzes' },
            { title: quiz.title, href: `/instructor/quizzes/${quiz.id}` }
        ]}>
            <Head title={`Quiz: ${quiz.title}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
                            <p className="text-gray-600">{quiz.course.title}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/instructor/quizzes/${quiz.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Quiz
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quiz Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Marks</p>
                                    <p className="text-xl font-bold">{quiz.total_marks}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Passing Score</p>
                                    <p className="text-xl font-bold">{quiz.passing_score}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Time Limit</p>
                                    <p className="text-xl font-bold">
                                        {quiz.time_limit ? `${quiz.time_limit}m` : 'No limit'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Max Attempts</p>
                                    <p className="text-xl font-bold">{quiz.max_attempts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quiz Details */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Quiz Details</CardTitle>
                            <div className="flex gap-2">
                                {quiz.is_final_quiz && (
                                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                                        Final Quiz
                                    </Badge>
                                )}
                                <Badge variant={quiz.is_active ? "default" : "secondary"}>
                                    {quiz.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {quiz.description && (
                            <p className="text-gray-700 mb-4">{quiz.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Created:</span> {quiz.created_at}
                            </div>
                            <div>
                                <span className="font-medium">Last Updated:</span> {quiz.updated_at}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Quiz Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{statistics?.total_attempts || 0}</p>
                                <p className="text-sm text-gray-600">Total Attempts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{statistics?.passed_attempts || 0}</p>
                                <p className="text-sm text-gray-600">Passed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{statistics?.failed_attempts || 0}</p>
                                <p className="text-sm text-gray-600">Failed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{(statistics?.average_score || 0).toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">Average Score</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{(statistics?.completion_rate || 0).toFixed(1)}%</p>
                                <p className="text-sm text-gray-600">Completion Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Questions ({quiz.questions.length})</CardTitle>
                                <CardDescription>
                                    Manage the questions for this quiz
                                </CardDescription>
                            </div>
                            <Button onClick={openAddQuestionModal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Question
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {quiz.questions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No questions added yet</p>
                                <Button onClick={openAddQuestionModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Question
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quiz.questions.map((question, index) => (
                                    <div key={question.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-gray-500">
                                                        Question {index + 1}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getQuestionTypeLabel(question.question_type)}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {question.points} points
                                                    </Badge>
                                                    {!question.is_active && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-900 mb-2">
                                                    {question.question_text}
                                                </p>
                                            </div>
                                            <ActionButtonGroup>
                                                <ActionButton
                                                    variant="edit"
                                                    icon={Edit}
                                                    onClick={() => openEditQuestionModal(question)}
                                                    title="Edit Question"
                                                />
                                                <ActionButton
                                                    variant="delete"
                                                    icon={Trash2}
                                                    onClick={() => setQuestionToDelete(question.id)}
                                                    disabled={deletingQuestion === question.id}
                                                    title="Delete Question"
                                                />
                                            </ActionButtonGroup>
                                        </div>

                                        {/* Question Options */}
                                        {formatOptions(question.options, question.question_type) && (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                                                <div className="space-y-1">
                                                    {formatOptions(question.options, question.question_type)!.map((option, optionIndex) => (
                                                        <div key={optionIndex} className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-600">
                                                                {String.fromCharCode(65 + optionIndex)}.
                                                            </span>
                                                            <span className={`text-sm ${
                                                                (typeof option === 'object'
                                                                    ? (option.key === question.correct_answer || option.text === question.correct_answer)
                                                                    : (optionKeyForIndex(optionIndex) === question.correct_answer || option === question.correct_answer))
                                                                    ? 'text-green-700 font-medium' 
                                                                    : 'text-gray-700'
                                                            }`}>
                                                                {typeof option === 'object' && (
                                                                    <span className="font-bold mr-1">{option.key}.</span>
                                                                )}
                                                                {typeof option === 'object' ? option.text : option}
                                                                {(typeof option === 'object'
                                                                    ? (option.key === question.correct_answer || option.text === question.correct_answer)
                                                                    : (optionKeyForIndex(optionIndex) === question.correct_answer || option === question.correct_answer)) && (
                                                                    <CheckCircle className="inline h-4 w-4 ml-1 text-green-600" />
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Correct Answer for short answer */}
                                        {question.question_type === 'short_answer' && (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700">
                                                    Correct Answer: 
                                                    <span className="text-green-700 ml-1">{question.correct_answer}</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {question.explanation && (
                                            <div className="bg-blue-50 p-3 rounded">
                                                <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                                                <p className="text-sm text-blue-800">{question.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Question Modal */}
            <Dialog.Root open={showAddQuestionModal} onOpenChange={(open) => !open && closeAddQuestionModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-lg data-[state=open]:animate-content-show focus:outline-none max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleAddQuestion}>
                            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                <Dialog.Title className="text-xl font-bold text-gray-900">Add New Question</Dialog.Title>
                                <Dialog.Close asChild>
                                    <button type="button" className="text-gray-400 hover:text-gray-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                    <textarea
                                        value={questionForm.question_text}
                                        onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={3}
                                        placeholder="Enter your question..."
                                        required
                                    />
                                    {formErrors.question_text && <p className="text-red-600 text-sm mt-1">{formErrors.question_text}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                                        <select
                                            value={questionForm.question_type}
                                            onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Points *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={questionForm.points}
                                            onChange={(e) => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 1})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {questionForm.question_type === 'multiple_choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                        {questionForm.options.map((option, index) => (
                                            <div key={index} className="mb-2">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options];
                                                        newOptions[index] = e.target.value;
                                                        setQuestionForm({...questionForm, options: newOptions});
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                                    {questionForm.question_type === 'multiple_choice' ? (
                                        <select
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                            required
                                        >
                                            <option value="">Select correct answer</option>
                                            {questionForm.options.map((option, index) => (
                                                option.trim() && (
                                                    <option key={index} value={optionKeyForIndex(index)}>
                                                        {String.fromCharCode(65 + index)}. {option}
                                                    </option>
                                                )
                                            ))}
                                        </select>
                                    ) : questionForm.question_type === 'true_false' ? (
                                        <select
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                            required
                                        >
                                            <option value="">Select correct answer</option>
                                            <option value="True">True</option>
                                            <option value="False">False</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Enter the correct answer"
                                            required
                                        />
                                    )}
                                    {formErrors.correct_answer && <p className="text-red-600 text-sm mt-1">{formErrors.correct_answer}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                                    <textarea
                                        value={questionForm.explanation}
                                        onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={2}
                                        placeholder="Explain why this is the correct answer..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
                                <Button type="submit" variant="create">
                                    Add Question
                                </Button>
                                <Button type="button" variant="outline" onClick={closeAddQuestionModal}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Edit Question Modal */}
            <Dialog.Root open={showEditQuestionModal} onOpenChange={(open) => !open && closeEditQuestionModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-lg data-[state=open]:animate-content-show focus:outline-none max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleUpdateQuestion}>
                            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                <Dialog.Title className="text-xl font-bold text-gray-900">Edit Question</Dialog.Title>
                                <Dialog.Close asChild>
                                    <button type="button" className="text-gray-400 hover:text-gray-600">
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                    <textarea
                                        value={questionForm.question_text}
                                        onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={3}
                                        placeholder="Enter your question..."
                                        required
                                    />
                                    {formErrors.question_text && <p className="text-red-600 text-sm mt-1">{formErrors.question_text}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Type *</label>
                                        <select
                                            value={questionForm.question_type}
                                            onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value, correct_answer: ''})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="true_false">True/False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Points *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={questionForm.points}
                                            onChange={(e) => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 1})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {questionForm.question_type === 'multiple_choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                        {questionForm.options.map((option, index) => (
                                            <div key={index} className="mb-2">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options];
                                                        newOptions[index] = e.target.value;
                                                        setQuestionForm({...questionForm, options: newOptions});
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                                    {questionForm.question_type === 'multiple_choice' ? (
                                        <select
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                            required
                                        >
                                            <option value="">Select correct answer</option>
                                            {questionForm.options.map((option, index) => (
                                                option.trim() && (
                                                    <option key={index} value={optionKeyForIndex(index)}>
                                                        {String.fromCharCode(65 + index)}. {option}
                                                    </option>
                                                )
                                            ))}
                                        </select>
                                    ) : questionForm.question_type === 'true_false' ? (
                                        <select
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                            required
                                        >
                                            <option value="">Select correct answer</option>
                                            <option value="True">True</option>
                                            <option value="False">False</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={questionForm.correct_answer}
                                            onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Enter the correct answer"
                                            required
                                        />
                                    )}
                                    {formErrors.correct_answer && <p className="text-red-600 text-sm mt-1">{formErrors.correct_answer}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                                    <textarea
                                        value={questionForm.explanation}
                                        onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={2}
                                        placeholder="Explain why this is the correct answer..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
                                <Button type="submit" variant="default">
                                    Update Question
                                </Button>
                                <Button type="button" variant="outline" onClick={closeEditQuestionModal}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <ConfirmationModal
                isOpen={!!questionToDelete}
                onClose={() => setQuestionToDelete(null)}
                onConfirm={handleDeleteQuestion}
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
            />
        </AppLayout>
    );
}
