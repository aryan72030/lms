import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Clock,
    Target,
    Trophy,
    AlertTriangle,
    CheckCircle,
    Play,
    RotateCcw,
    Star,
    BookOpen,
    Users,
    Timer,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Save,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Quiz {
    id: number;
    title: string;
    description?: string;
    course: {
        id: number;
        title: string;
    };
    time_limit: number | null;
    total_marks?: number;
    passing_score?: number;
    max_attempts?: number;
    is_final_quiz?: boolean;
    questions_count: number;
    is_ready?: boolean;
    student_stats?: {
        attempts_used: number;
        best_score: number | null;
        has_passed: boolean;
        can_attempt: boolean;
        previous_attempts: Array<{
            attempt_number: number;
            score: number;
            percentage: number;
            is_passed: boolean;
            completed_at: string;
        }>;
    };
}

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: Array<{ key: string; text: string }> | null;
    points: number;
    order: number;
}

interface Attempt {
    id: number;
    answers: Record<string, string>;
    started_at: string;
    remaining_time: number | null;
}

interface Props {
    quiz: Quiz;
    enrollment?: {
        id: number;
        progress: number;
    };
    attempt?: Attempt;
    questions?: Question[];
}

export default function StudentQuizShow({
    quiz,
    enrollment,
    attempt,
    questions,
}: Props) {
    const [isStarting, setIsStarting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>(
        attempt?.answers || {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(() => {
        if (
            attempt?.remaining_time !== null &&
            attempt?.remaining_time !== undefined
        ) {
            return Math.floor(attempt.remaining_time);
        }
        if (quiz.time_limit !== null && quiz.time_limit !== undefined) {
            return Math.floor(quiz.time_limit * 60);
        }
        return null;
    });
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isSubmittingRef = useRef(false);

    const quizMessages = useActionMessages('Quiz');

    // Security Features
    useEffect(() => {
        if (!attempt) return;

        // 1. Prevent Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // 2. Prevent Copy/Paste
        const handleCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            return false;
        };

        // 3. Detect Tab Switching
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmittingRef.current) {
                setTabSwitchCount((prev) => prev + 1);
                setShowTabSwitchWarning(true);
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [attempt?.id]);

    const isReady = quiz.is_ready && quiz.questions_count > 0;

    const handleSubmitQuiz = () => {
        if (isSubmittingRef.current || !attempt) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setShowSubmitModal(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        router.post(
            `/student/quiz-attempts/${attempt.id}/submit`,
            { answers },
            { onFinish: () => setIsSubmitting(false) },
        );
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        if (!attempt) return;
        setAnswers((prev) => ({ ...prev, [questionId.toString()]: answer }));
        setSaveState('saving');
        axios
            .patch(`/student/quiz-attempts/${attempt.id}/answer`, {
                question_id: questionId,
                answer,
            })
            .then(() => {
                setSaveState('saved');
            })
            .catch((error) => {
                setSaveState('error');
                console.error('Failed to auto-save answer:', error);
            });
    };

    useEffect(() => {
        if (timeLeft === null || !attempt) return;

        // Already expired on load
        if (timeLeft <= 0) {
            if (!isSubmittingRef.current) {
                isSubmittingRef.current = true;
                setIsSubmitting(true);
                router.post(
                    `/student/quiz-attempts/${attempt.id}/submit`,
                    { answers },
                    { onFinish: () => setIsSubmitting(false) },
                );
            }
            return;
        }

        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    // Auto submit when time runs out
                    if (!isSubmittingRef.current) {
                        isSubmittingRef.current = true;
                        setIsSubmitting(true);
                        router.post(
                            `/student/quiz-attempts/${attempt.id}/submit`,
                            {},
                            { onFinish: () => setIsSubmitting(false) },
                        );
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [attempt?.id]);

    // If we have an active attempt, show the quiz taking interface
    if (attempt && questions && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const answeredCount = questions.filter(
            (question) =>
                (answers[question.id.toString()] || '').toString().trim() !== '',
        ).length;
        const progressPercentage = Math.round(
            (answeredCount / questions.length) * 100,
        );
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        const saveStateLabel =
            saveState === 'saving'
                ? 'Saving answer...'
                : saveState === 'saved'
                  ? 'All answers saved'
                  : saveState === 'error'
                    ? 'Auto-save failed'
                    : 'Ready';

        return (
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/student/dashboard' },
                    { title: 'My Quizzes', href: '/student/quizzes' },
                    { title: quiz.title, href: `/student/quizzes/${quiz.id}` },
                ]}
            >
                <Head title={`Taking Quiz: ${quiz.title}`} />

                <div className="mx-auto max-w-6xl space-y-6 select-none">
                    {/* Tab Switch Warning Alert */}
                    {showTabSwitchWarning && (
                        <Alert className="border-amber-200 bg-amber-50 text-amber-800 animate-in fade-in slide-in-from-top-4 duration-300">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="flex items-center justify-between">
                                <span className="font-medium">
                                    Warning: Tab switching detected ({tabSwitchCount}). Please stay on this page to complete your quiz.
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowTabSwitchWarning(false)}
                                    className="h-7 text-amber-700 hover:bg-amber-100"
                                >
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white shadow-2xl">
                        <CardContent className="space-y-6 p-8">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="border-none bg-white/15 text-white">
                                            Live Attempt
                                        </Badge>
                                        <Badge className="border-none bg-white/10 text-white/80">
                                            {quiz.course.title}
                                        </Badge>
                                    </div>
                                    <h1 className="page-title text-white">
                                        {quiz.title}
                                    </h1>
                                    <p className="text-sm text-white/70">
                                        Question {currentQuestionIndex + 1} of{' '}
                                        {questions.length}. Answer carefully,
                                        your progress is being saved as you go.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                        <div className="text-xs font-bold tracking-widest text-white/60 uppercase">
                                            Answered
                                        </div>
                                        <div className="text-xl font-black">
                                            {answeredCount}/{questions.length}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                        <div className="text-xs font-bold tracking-widest text-white/60 uppercase">
                                            Auto Save
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            {saveState === 'saving' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            <span>{saveStateLabel}</span>
                                        </div>
                                    </div>
                                    <div
                                        className={`rounded-2xl border px-4 py-3 backdrop-blur ${
                                            timeLeft !== null && timeLeft <= 60
                                                ? 'border-red-400/40 bg-red-500/20'
                                                : 'border-white/10 bg-white/10'
                                        }`}
                                    >
                                        <div className="text-xs font-bold tracking-widest text-white/60 uppercase">
                                            Time Left
                                        </div>
                                        <div className="flex items-center gap-2 text-xl font-black">
                                            <Clock className="h-5 w-5" />
                                            <span>
                                                {timeLeft !== null
                                                    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                                                    : 'No limit'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold tracking-widest text-white/60 uppercase">
                                    <span>Attempt Progress</span>
                                    <span>{progressPercentage}% complete</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-white transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-6">
                            <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-8 py-6">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">
                                                Question {currentQuestionIndex + 1}
                                            </div>
                                            <CardTitle className="mt-2 text-2xl font-black text-slate-900">
                                                {currentQuestion.question_text}
                                            </CardTitle>
                                        </div>
                                        <Badge className="w-fit border-none bg-indigo-50 px-3 py-1 text-indigo-700">
                                            {currentQuestion.points} Points
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 px-8 py-8">
                                    {currentQuestion.question_type ===
                                        'multiple_choice' &&
                                        currentQuestion.options?.map((option) => {
                                            const isSelected =
                                                answers[
                                                    currentQuestion.id.toString()
                                                ] === option.key;

                                            return (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() =>
                                                        handleAnswerChange(
                                                            currentQuestion.id,
                                                            option.key,
                                                        )
                                                    }
                                                    className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                                                            isSelected
                                                                ? 'border-indigo-500 bg-indigo-500 text-white'
                                                                : 'border-slate-200 bg-slate-50 text-slate-500'
                                                        }`}
                                                    >
                                                        {option.key}
                                                    </div>
                                                    <div className="pt-1 text-base font-medium text-slate-700">
                                                        {option.text}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-none shadow-lg">
                                <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentQuestionIndex(
                                                (prev) => prev - 1,
                                            )
                                        }
                                        disabled={currentQuestionIndex === 0}
                                        className="h-12 rounded-xl px-6"
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="text-center text-sm font-medium text-slate-500">
                                        {answeredCount === questions.length
                                            ? 'All questions answered'
                                            : `${questions.length - answeredCount} question${questions.length - answeredCount === 1 ? '' : 's'} still unanswered`}
                                    </div>

                                    {isLastQuestion ? (
                                        <Button
                                            variant="create"
                                            onClick={() =>
                                                setShowSubmitModal(true)
                                            }
                                            disabled={isSubmitting}
                                            className="h-12 rounded-xl px-6"
                                        >
                                            {isSubmitting
                                                ? 'Submitting...'
                                                : 'Submit Quiz'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                setCurrentQuestionIndex(
                                                    (prev) => prev + 1,
                                                )
                                            }
                                            className="h-12 rounded-xl px-6"
                                        >
                                            Next
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="sticky top-6 rounded-3xl border-none shadow-xl">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-slate-900">
                                        Question Navigator
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-5 gap-3">
                                        {questions.map((question, idx) => {
                                            const isCurrent =
                                                idx === currentQuestionIndex;
                                            const isAnswered =
                                                (
                                                    answers[
                                                        question.id.toString()
                                                    ] || ''
                                                )
                                                    .toString()
                                                    .trim() !== '';

                                            return (
                                                <button
                                                    key={question.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentQuestionIndex(
                                                            idx,
                                                        )
                                                    }
                                                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black transition-all ${
                                                        isCurrent
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                            : isAnswered
                                                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-500">
                                                Current
                                            </span>
                                            <span className="font-black text-slate-800">
                                                {currentQuestionIndex + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-500">
                                                Answered
                                            </span>
                                            <span className="font-black text-emerald-600">
                                                {answeredCount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-500">
                                                Remaining
                                            </span>
                                            <span className="font-black text-amber-600">
                                                {questions.length - answeredCount}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm text-slate-500">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-indigo-600" />
                                            Current question
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                            Answered question
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                                            Not answered
                                        </div>
                                    </div>

                                    <Button
                                        variant="create"
                                        className="h-12 w-full rounded-xl"
                                        onClick={() => setShowSubmitModal(true)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Submitting...'
                                            : 'Finish & Submit'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={showSubmitModal}
                    onClose={() => setShowSubmitModal(false)}
                    onConfirm={handleSubmitQuiz}
                    title="Submit Quiz"
                    description={`You have answered ${answeredCount} out of ${questions.length} questions. Once submitted, this attempt will be finalized.`}
                    confirmText="Submit Quiz"
                    type="info"
                    isLoading={isSubmitting}
                />
            </AppLayout>
        );
    }

    const handleStartQuiz = async () => {
        if (!isReady) {
            quizMessages.error(
                'create',
                'This quiz is not ready yet (no questions).',
            );
            return;
        }

        setIsStarting(true);
        setShowConfirmModal(false);

        try {
            router.post(
                `/student/quizzes/${quiz.id}/attempt`,
                {},
                {
                    onError: () => {
                        quizMessages.error('create', 'Quiz attempt');
                    },
                    onFinish: () => {
                        setIsStarting(false);
                    },
                },
            );
        } catch (error) {
            quizMessages.error('create', 'Quiz attempt');
            setIsStarting(false);
        }
    };

    const getAttemptInfo = () => {
        const student_stats = quiz.student_stats;
        const max_attempts = quiz.max_attempts || 1;

        if (!student_stats) {
            return {
                type: 'info',
                title: 'First Attempt',
                message: `This is your first attempt. You have ${max_attempts} total attempts available.`,
                icon: Play,
            };
        }

        const remainingAttempts = max_attempts - student_stats.attempts_used;

        if (student_stats.has_passed) {
            return {
                type: 'success',
                title: 'Quiz Completed Successfully!',
                message: `You've already passed this quiz with ${student_stats.best_score}%. You can review your result below.`,
                icon: CheckCircle,
            };
        }

        if (remainingAttempts <= 0) {
            return {
                type: 'error',
                title: 'No Attempts Remaining',
                message: 'You have used all available attempts for this quiz.',
                icon: AlertTriangle,
            };
        }

        if (student_stats.attempts_used > 0) {
            return {
                type: 'warning',
                title: `Attempt ${student_stats.attempts_used + 1} of ${max_attempts}`,
                message: `You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining. Your best score so far is ${student_stats.best_score}%.`,
                icon: RotateCcw,
            };
        }

        return {
            type: 'info',
            title: 'First Attempt',
            message: `This is your first attempt. You have ${max_attempts} total attempts available.`,
            icon: Play,
        };
    };

    const attemptInfo = getAttemptInfo();
    const AttemptIcon = attemptInfo.icon;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Quizzes', href: '/student/quizzes' },
                { title: quiz.title, href: `/student/quizzes/${quiz.id}` },
            ]}
        >
            <Head title={`Quiz: ${quiz.title}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                        <h1 className="page-title text-gray-900">
                            {quiz.title}
                        </h1>
                        {quiz.is_final_quiz && (
                            <Badge className="bg-purple-100 text-purple-800">
                                <Star className="mr-1 h-3 w-3" />
                                Final Quiz
                            </Badge>
                        )}
                    </div>
                    <p className="text-gray-600">{quiz.course.title}</p>
                </div>

                {/* Attempt Status Alert */}
                <Alert
                    className={`border-l-4 ${
                        attemptInfo.type === 'success'
                            ? 'border-green-500 bg-green-50'
                            : attemptInfo.type === 'error'
                              ? 'border-red-500 bg-red-50'
                              : attemptInfo.type === 'warning'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-blue-500 bg-blue-50'
                    }`}
                >
                    <AttemptIcon
                        className={`h-4 w-4 ${
                            attemptInfo.type === 'success'
                                ? 'text-green-600'
                                : attemptInfo.type === 'error'
                                  ? 'text-red-600'
                                  : attemptInfo.type === 'warning'
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'
                        }`}
                    />
                    <AlertDescription>
                        <div className="mb-1 font-medium">
                            {attemptInfo.title}
                        </div>
                        <div>{attemptInfo.message}</div>
                    </AlertDescription>
                </Alert>

                {!isReady && (
                    <Alert className="border-l-4 border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                            <div className="mb-1 font-medium">
                                Quiz Not Ready
                            </div>
                            <div>
                                This quiz has no active questions yet. Please
                                try again later.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Quiz Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Quiz Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quiz.description && (
                                <div>
                                    <h4 className="mb-2 font-medium">
                                        Description
                                    </h4>
                                    <p className="text-gray-600">
                                        {quiz.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            Questions
                                        </div>
                                        <div className="font-medium">
                                            {quiz.questions_count}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            Total Marks
                                        </div>
                                        <div className="font-medium">
                                            {quiz.total_marks}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            Passing Score
                                        </div>
                                        <div className="font-medium">
                                            {quiz.passing_score}%
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            Max Attempts
                                        </div>
                                        <div className="font-medium">
                                            {quiz.max_attempts}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {quiz.time_limit && (
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                    <div className="flex items-center gap-2 text-yellow-800">
                                        <Timer className="h-4 w-4" />
                                        <span className="font-medium">
                                            Time Limit: {quiz.time_limit}{' '}
                                            minutes
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-yellow-700">
                                        The quiz will auto-submit when time
                                        expires.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Instructions & Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Instructions & Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-2 font-medium">
                                    Before You Start
                                </h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>
                                        • Ensure you have a stable internet
                                        connection
                                    </li>
                                    <li>
                                        • Find a quiet place without
                                        distractions
                                    </li>
                                    <li>
                                        • Have any necessary materials ready
                                    </li>
                                    {quiz.time_limit && (
                                        <li>
                                            • Prepare for {quiz.time_limit}{' '}
                                            minutes of focused work
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium">
                                    During the Quiz
                                </h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Read each question carefully</li>
                                    <li>
                                        • Your answers are saved automatically
                                    </li>
                                    <li>
                                        • You can navigate between questions
                                        freely
                                    </li>
                                    <li>
                                        • Review your answers before submitting
                                    </li>
                                </ul>
                            </div>

                            {quiz.is_final_quiz && (
                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                                    <div className="mb-1 flex items-center gap-2 text-purple-800">
                                        <Star className="h-4 w-4" />
                                        <span className="font-medium">
                                            Final Quiz
                                        </span>
                                    </div>
                                    <p className="text-sm text-purple-700">
                                        You must pass this quiz to complete the
                                        course and earn your certificate.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Previous Attempts */}
                {quiz.student_stats &&
                    quiz.student_stats.previous_attempts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Previous Attempts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {quiz.student_stats.previous_attempts.map(
                                        (attempt) => (
                                            <div
                                                key={attempt.attempt_number}
                                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-medium">
                                                        Attempt{' '}
                                                        {attempt.attempt_number}
                                                    </div>
                                                    <Badge
                                                        className={
                                                            attempt.is_passed
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }
                                                    >
                                                        {attempt.is_passed
                                                            ? 'Passed'
                                                            : 'Failed'}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {attempt.percentage}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {attempt.completed_at}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <Link href="/student/quizzes">
                        <Button variant="outline" size="lg">
                            Back to Quizzes
                        </Button>
                    </Link>

                    {quiz.student_stats?.can_attempt ? (
                        <Button
                            size="lg"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isStarting || !isReady}
                            className="min-w-[150px]"
                        >
                            {isStarting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    {quiz.student_stats &&
                                    quiz.student_stats.attempts_used > 0
                                        ? 'Retake Quiz'
                                        : 'Start Quiz'}
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button size="lg" disabled>
                            No Attempts Remaining
                        </Button>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleStartQuiz}
                title="Start Quiz"
                description="Are you ready to start the quiz? The timer will begin immediately once you confirm."
                confirmText="Start Quiz"
                type="info"
                isLoading={isStarting}
            />
        </AppLayout>
    );
}
