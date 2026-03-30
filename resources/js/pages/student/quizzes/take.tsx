import { Head, router } from '@inertiajs/react';
import { 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Flag,
    AlertTriangle,
    CheckCircle,
    Circle,
    Star,
    LayoutDashboard,
    ListChecks,
    Timer,
    Check,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Question {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: Array<{ key: string; text: string }>;
    points: number;
    order: number;
}

interface QuizAttempt {
    id: number;
    quiz: {
        id: number;
        title: string;
        is_final_quiz: boolean;
        time_limit: number | null;
        questions_count: number;
    };
    answers: Record<string, string>;
    started_at: string;
    // Remaining time in seconds (null when no time limit)
    remaining_time: number | null;
}

interface Props {
    attempt: QuizAttempt;
    questions: Question[];
    currentQuestionIndex: number;
}

export default function StudentQuizTake({ attempt, questions, currentQuestionIndex = 0 }: Props) {
    const [currentIndex, setCurrentIndex] = useState(currentQuestionIndex);
    const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers || {});
    const [timeRemaining, setTimeRemaining] = useState(attempt.remaining_time);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const autoSubmittedRef = React.useRef(false);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercentage = (answeredCount / totalQuestions) * 100;

    // If the page loads after time expired, auto-submit once.
    useEffect(() => {
        if (timeRemaining !== null && timeRemaining <= 0 && !isSubmitting && !autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            handleAutoSubmit();
        }
    }, [timeRemaining, isSubmitting]);

    // Timer effect (seconds)
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev !== null && prev <= 1) {
                    handleAutoSubmit();

                    return 0;
                }

                return prev !== null ? prev - 1 : null;
            });
        }, 1000); // Update every second

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) {
            return null;
        }

        const totalSeconds = Math.max(0, Math.floor(seconds));

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${pad(minutes)}:${pad(secs)}`;
        }

        return `${minutes}:${pad(secs)}`;
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);

        if (Number.isNaN(date.getTime())) {
            return isoString;
        }

        return date.toLocaleString();
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);

        // Auto-save answer (use fetch, not Inertia request)
        void fetch(`/student/quiz-attempts/${attempt.id}/answer`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                question_id: questionId,
                answer: answer,
            }),
        });
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleQuestionJump = (index: number) => {
        setCurrentIndex(index);
        setShowSidebar(false);
    };

    const handleAutoSubmit = () => {
        setIsSubmitting(true);
        router.post(`/student/quiz-attempts/${attempt.id}/submit`, {
            answers: answers,
            auto_submit: true
        });
    };

    const handleSubmit = () => {
        if (!showSubmitConfirm) {
            setShowSubmitConfirm(true);

            return;
        }

        setIsSubmitting(true);
        router.post(`/student/quiz-attempts/${attempt.id}/submit`, {
            answers: answers
        });
    };

    const renderQuestionOptions = () => {
        if (!currentQuestion) {
            return null;
        }

        switch (currentQuestion.question_type) {
            case 'multiple_choice':
                return (
                    <div className="grid grid-cols-1 gap-4 mt-8">
                        {currentQuestion.options?.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.key;
                            return (
                                <button
                                    key={option.key}
                                    onClick={() => handleAnswerChange(currentQuestion.id, option.key)}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 group",
                                        isSelected 
                                            ? "border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600" 
                                            : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50 shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-colors duration-300",
                                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                    )}>
                                        {option.key}
                                    </div>
                                    <div className="flex-1">
                                        <span className={cn(
                                            "text-lg font-bold transition-colors duration-300",
                                            isSelected ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900"
                                        )}>
                                            {option.text}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'true_false':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                        {['True', 'False'].map((option) => {
                            const isSelected = answers[currentQuestion.id] === option;
                            return (
                                <button
                                    key={option}
                                    onClick={() => handleAnswerChange(currentQuestion.id, option)}
                                    className={cn(
                                        "flex items-center justify-center gap-4 p-8 rounded-2xl border-2 text-left transition-all duration-300 group",
                                        isSelected 
                                            ? "border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600" 
                                            : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50 shadow-sm"
                                    )}
                                >
                                    <span className={cn(
                                        "text-xl font-black transition-colors duration-300 uppercase tracking-widest",
                                        isSelected ? "text-indigo-900" : "text-slate-500 group-hover:text-slate-900"
                                    )}>
                                        {option}
                                    </span>
                                    {isSelected && (
                                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'short_answer':
                return (
                    <div className="mt-8">
                        <textarea
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder="Type your answer clearly here..."
                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl resize-none text-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all min-h-[200px] shadow-inner"
                            rows={6}
                        />
                        <div className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                            { (answers[currentQuestion.id] || '').length } characters
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'Learning Portal', href: '/student/enrollments' },
            { title: attempt.quiz.title, href: '#' }
        ]}>
            <Head title={`Assessment: ${attempt.quiz.title}`} />
            
            <div className="max-w-[1600px] mx-auto pb-12">
                {/* Immersive Header - Exam Mode */}
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm mb-8 px-6 py-4 rounded-b-3xl">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <ListChecks className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 line-clamp-1">{attempt.quiz.title}</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold uppercase text-[10px] tracking-widest">
                                        Question {currentIndex + 1} of {totalQuestions}
                                    </Badge>
                                    {attempt.quiz.is_final_quiz && (
                                        <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px] uppercase tracking-tighter">
                                            <Star className="h-3 w-3 mr-1 fill-current" />
                                            Final Assessment
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile Sidebar Toggle */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="lg:hidden rounded-xl border-slate-200"
                                onClick={() => setShowSidebar(!showSidebar)}
                            >
                                {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>

                            {/* Timer Widget */}
                            {timeRemaining !== null && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-500",
                                                timeRemaining <= 10
                                                    ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse shadow-lg shadow-rose-100"
                                                    : "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm",
                                            )}
                                        >
                                            <Timer className={cn("h-5 w-5", timeRemaining <= 10 && "animate-spin")} />
                                            <div className="flex flex-col leading-none text-left">
                                                <span className="text-xs font-black uppercase tracking-widest opacity-60">Time Left</span>
                                                <span className="text-lg font-black tracking-tighter">{formatTime(timeRemaining)}</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 opacity-60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[340px] p-4 rounded-2xl">
                                        <DropdownMenuLabel className="px-0 py-0 text-sm font-black text-slate-900">
                                            Time Details
                                        </DropdownMenuLabel>
                                        <div className="mt-3 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-bold">Time limit</span>
                                                <span className="text-slate-900 font-black">
                                                    {attempt.quiz.time_limit ? formatTime(attempt.quiz.time_limit * 60) : 'No limit'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-bold">Remaining</span>
                                                <span className={cn("font-black", timeRemaining <= 60 ? "text-rose-600" : "text-slate-900")}>
                                                    {formatTime(timeRemaining)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-bold">Started</span>
                                                <span className="text-slate-900 font-black">{formatDateTime(attempt.started_at)}</span>
                                            </div>
                                        </div>

                                        <DropdownMenuSeparator className="my-4" />

                                        <div className="text-xs font-bold text-slate-500 leading-relaxed">
                                            When time reaches 0, your attempt will be submitted automatically.
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Submit Button in Header */}
                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-12 px-8 shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                ) : (
                                    <>
                                        <Flag className="h-5 w-5 mr-2" />
                                        Finish
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="mt-4 px-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-10 px-6">
                    {/* Main Question Area - Zen Mode */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Time Critical Warning */}
                        {timeRemaining !== null && timeRemaining <= 60 && (
                            <Alert className="border-rose-200 bg-rose-50 rounded-3xl p-6">
                                <AlertTriangle className="h-6 w-6 text-rose-600" />
                                <AlertDescription className="text-rose-900 font-bold ml-2">
                                    Time is almost up! {formatTime(timeRemaining)} remaining. Finish your current question and submit now.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Question Card - Modern & Large */}
                        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 p-8 md:p-16 border border-slate-50 transition-all">
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                                            {currentIndex + 1}
                                        </div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Question Point: {currentQuestion?.points}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                        {currentQuestion?.question_text}
                                    </h2>
                                </div>

                                <div className="min-h-[200px]">
                                    {renderQuestionOptions()}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
                            <Button
                                variant="ghost"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="h-16 px-8 rounded-3xl font-black text-slate-500 hover:text-indigo-600 hover:bg-white transition-all"
                            >
                                <ChevronLeft className="h-6 w-6 mr-2" />
                                Previous
                            </Button>

                            <div className="flex gap-4">
                                {currentIndex < totalQuestions - 1 ? (
                                    <Button 
                                        onClick={handleNext}
                                        className="h-16 px-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl shadow-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        Next Question
                                        <ChevronRight className="h-6 w-6 ml-2" />
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="h-16 px-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl shadow-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        ) : (
                                            <>
                                                <Flag className="h-6 w-6 mr-2" />
                                                Finish Assessment
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Submit Confirmation Overlay-style Alert */}
                        {showSubmitConfirm && (
                            <div className="bg-amber-50 border-2 border-amber-100 rounded-[32px] p-8 mt-12 shadow-inner">
                                <div className="flex items-start gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <AlertTriangle className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black text-amber-900">Are you ready to submit?</h3>
                                            <p className="text-amber-700 font-medium">
                                                You have answered {answeredCount} out of {totalQuestions} questions. 
                                                {answeredCount < totalQuestions && (
                                                    <span className="text-rose-600 font-black block mt-1 uppercase text-xs tracking-widest">
                                                        ⚠️ Important: {totalQuestions - answeredCount} questions are still unanswered!
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setShowSubmitConfirm(false)} 
                                                className="rounded-2xl h-12 px-6 border-amber-200 text-amber-800 font-bold hover:bg-amber-100"
                                            >
                                                Review Answers
                                            </Button>
                                            <Button 
                                                onClick={handleSubmit} 
                                                className="rounded-2xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-100"
                                            >
                                                Yes, Submit Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Navigator Sidebar */}
                    <div className={cn(
                        "lg:col-span-1 lg:block transition-all duration-500",
                        showSidebar ? "fixed inset-0 z-[60] bg-white p-6 pt-20" : "hidden"
                    )}>
                        <div className="sticky top-28 space-y-8">
                            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[32px] overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-lg font-black flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5 text-indigo-400" />
                                        Navigator
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="grid grid-cols-5 gap-3">
                                        {questions.map((question, index) => {
                                            const isAnswered = answers[question.id] !== undefined;
                                            const isCurrent = index === currentIndex;

                                            return (
                                                <button
                                                    key={question.id}
                                                    onClick={() => handleQuestionJump(index)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-xl font-black text-sm transition-all duration-300 relative",
                                                        isCurrent 
                                                            ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/50 ring-2 ring-white" 
                                                            : isAnswered 
                                                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                                                                : "bg-white/10 text-slate-400 hover:bg-white/20"
                                                    )}
                                                >
                                                    {index + 1}
                                                    {isAnswered && !isCurrent && (
                                                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Legend</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded bg-indigo-500 shadow-lg shadow-indigo-500/30"></div>
                                                <span className="text-xs font-bold text-slate-300">Active Question</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                                                <span className="text-xs font-bold text-slate-300">Answered</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 rounded bg-white/10 border border-white/5"></div>
                                                <span className="text-xs font-bold text-slate-300">Not Visited</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-8 bg-white/5 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                                        <span>Completion</span>
                                        <span className="text-indigo-400">{Math.round(progressPercentage)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </Card>

                            {/* Help Box */}
                            <div className="p-6 rounded-[32px] bg-indigo-50 border border-indigo-100 hidden lg:block">
                                <h4 className="font-black text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-current" />
                                    Zen Mode
                                </h4>
                                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                                    Focus on one question at a time. Take your time to read and answer clearly. Your progress is auto-saved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
