import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle,
    XCircle,
    ChevronRight,
    Trophy,
    Clock,
    Target,
    ArrowLeft,
    RotateCcw,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Props {
    attempt: {
        id: number;
        score: number;
        max_score: number;
        percentage: number;
        is_passed: boolean;
        completed_at: string;
        time_spent: number;
        answers: Record<string, string>;
    };
    quiz: {
        id: number;
        title: string;
        passing_score: number;
        course: {
            id: number;
            title: string;
        };
    };
    questions: Array<{
        id: number;
        question_text: string;
        question_type: string;
        options: Array<{ key: string; text: string }>;
        correct_answer: string;
        points: number;
    }>;
    next_lesson_id?: number;
    enrollment_id: number;
}

export default function QuizResults({
    attempt,
    quiz,
    questions,
    next_lesson_id,
    enrollment_id,
}: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Quizzes', href: '/student/quizzes' },
                { title: quiz.title, href: `/student/quizzes/${quiz.id}` },
                { title: 'Results', href: '#' },
            ]}
        >
            <Head title={`Quiz Results: ${quiz.title}`} />

            <div className="mx-auto space-y-4">
                {/* Result Header */}
                <Card
                    className={`overflow-hidden rounded-3xl border-none shadow-2xl ${
                        attempt.is_passed
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-rose-500 to-orange-600'
                    } text-white`}
                >
                    <CardContent className="space-y-6 p-10 text-center">
                        <div className="flex justify-center">
                            {attempt.is_passed ? (
                                <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                                    <Trophy className="h-12 w-12 text-white" />
                                </div>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                                    <XCircle className="h-12 w-12 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="page-title">
                                Quiz Results
                            </h1>
                            <p className="text-lg font-medium text-white/80">
                                {attempt.is_passed
                                    ? `You passed the ${quiz.title} with a score of ${attempt.percentage}%`
                                    : `You didn't reach the passing score of ${quiz.passing_score}% this time.`}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-md">
                                <div className="mb-1 text-xs font-bold tracking-widest text-white/60 uppercase">
                                    Score
                                </div>
                                <div className="text-2xl font-black">
                                    {attempt.score} / {attempt.max_score}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-md">
                                <div className="mb-1 text-xs font-bold tracking-widest text-white/60 uppercase">
                                    Percentage
                                </div>
                                <div className="text-2xl font-black">
                                    {attempt.percentage}%
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-md">
                                <div className="mb-1 text-xs font-bold tracking-widest text-white/60 uppercase">
                                    Time Spent
                                </div>
                                <div className="text-2xl font-black">
                                    {attempt.time_spent} min
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <Link
                                href={`/student/enrollments/${enrollment_id}`}
                            >
                                <Button
                                    variant="outline"
                                    className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-white/20 border-white/20 bg-white/10 text-white backdrop-blur-sm"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>

                            {attempt.is_passed && next_lesson_id ? (
                                <Link
                                    href={`/student/enrollments/${enrollment_id}`}
                                >
                                    <Button className="h-12 rounded-xl bg-white px-10 font-black text-emerald-600 shadow-xl shadow-emerald-900/20 hover:bg-emerald-50">
                                        Continue Learning
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                !attempt.is_passed && (
                                    <Link href={`/student/quizzes/${quiz.id}`}>
                                        <Button className="h-12 rounded-xl bg-white px-10 font-black text-rose-600 shadow-xl shadow-rose-900/20 hover:bg-rose-50">
                                            Try Again
                                            <RotateCcw className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Review Answers */}
                <div className="space-y-6">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-slate-800">
                        <Target className="h-6 w-6 text-indigo-600" />
                        Review Answers
                    </h2>

                    <div className="space-y-4">
                        {questions.map((question, index) => {
                            const studentAnswer =
                                attempt.answers[question.id.toString()];
                            const isCorrect =
                                studentAnswer === question.correct_answer;

                            return (
                                <Card
                                    key={question.id}
                                    className={`overflow-hidden rounded-2xl border-none shadow-md ${
                                        isCorrect
                                            ? 'bg-emerald-50/50'
                                            : 'bg-rose-50/50'
                                    }`}
                                >
                                    <CardContent className="p-6">
                                        <div className="mb-4 flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-400 uppercase">
                                                        Question {index + 1}
                                                    </span>
                                                    {isCorrect ? (
                                                        <Badge className="border-none bg-emerald-500 text-white">
                                                            Correct
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="border-none bg-rose-500 text-white">
                                                            Incorrect
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {question.question_text}
                                                </h3>
                                            </div>
                                            <div className="text-sm font-black text-slate-400">
                                                {question.points} Points
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {question.options.map((option) => {
                                                const isStudentChoice =
                                                    studentAnswer ===
                                                    option.key;
                                                const isCorrectChoice =
                                                    question.correct_answer ===
                                                    option.key;

                                                let bgColor = 'bg-white';
                                                let borderColor =
                                                    'border-slate-200';
                                                let textColor =
                                                    'text-slate-700';

                                                if (isCorrectChoice) {
                                                    bgColor = 'bg-emerald-500';
                                                    borderColor =
                                                        'border-emerald-500';
                                                    textColor = 'text-white';
                                                } else if (
                                                    isStudentChoice &&
                                                    !isCorrect
                                                ) {
                                                    bgColor = 'bg-rose-500';
                                                    borderColor =
                                                        'border-rose-500';
                                                    textColor = 'text-white';
                                                }

                                                return (
                                                    <div
                                                        key={option.key}
                                                        className={`flex items-center gap-3 rounded-xl border p-4 transition-all shadow-sm ${bgColor} ${borderColor} ${textColor}`}
                                                    >
                                                        <div
                                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                                                                isCorrectChoice ||
                                                                (isStudentChoice &&
                                                                    !isCorrect)
                                                                    ? 'border-white/20 bg-white/20'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-500'
                                                            }`}
                                                        >
                                                            {option.key}
                                                        </div>
                                                        <span className="font-bold">
                                                            {option.text}
                                                        </span>
                                                        {isCorrectChoice && (
                                                            <CheckCircle className="ml-auto h-5 w-5 shrink-0" />
                                                        )}
                                                        {isStudentChoice &&
                                                            !isCorrect && (
                                                                <XCircle className="ml-auto h-5 w-5 shrink-0" />
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
