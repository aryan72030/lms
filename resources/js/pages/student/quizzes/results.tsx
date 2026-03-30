import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, RotateCcw, Target, XCircle } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Option {
    key: string;
    text: string;
}

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: (string | Option)[];
    student_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean;
    explanation?: string | null;
    points?: number;
}

interface Props {
    attempt: {
        id: number;
        score: number;
        max_score: number;
        percentage: number;
        passed: boolean;
        completed_at: string;
        time_spent: number | null;
        grade_letter?: string;
    };
    quiz: {
        id: number;
        title: string;
        passing_score?: number;
        course: {
            id: number;
            title: string;
        };
    };
    questions: Question[];
    settings: {
        show_correct_answers: boolean;
    };
}

export default function QuizResults({ attempt, quiz, questions, settings }: Props) {
    const getScoreColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (passed: boolean) => {
        return passed ? (
            <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Passed
            </Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800">
                <XCircle className="h-3 w-3 mr-1" />
                Failed
            </Badge>
        );
    };

    const renderAnswer = (value: string | null) => {
        if (value === null || value === '') {
            return <span className="text-gray-500">No answer</span>;
        }

        return <span className="font-medium">{value}</span>;
    };

    return (
        <AppLayout>
            <Head title={`Quiz Results: ${quiz.title}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/student/quizzes/${quiz.id}/start`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Quiz
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Quiz Results</h1>
                        <p className="text-gray-600">{quiz.title} - {quiz.course.title}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Your Score
                            </span>
                            {getScoreBadge(attempt.passed)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${getScoreColor(Number(attempt.percentage))}`}>
                                    {Number(attempt.percentage).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">Final Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {attempt.score}/{attempt.max_score}
                                </div>
                                <div className="text-sm text-gray-600">Points Earned</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                                    <Clock className="h-5 w-5" />
                                    {attempt.time_spent ?? '-'}
                                </div>
                                <div className="text-sm text-gray-600">Minutes Taken</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {quiz.passing_score ?? '-'}%
                                </div>
                                <div className="text-sm text-gray-600">Passing Score</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                        {attempt.passed ? (
                            <div className="text-center">
                                <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                                <h3 className="text-xl font-semibold text-green-900 mb-2">Congratulations! You Passed!</h3>
                                <p className="text-green-700">Great job! You've successfully completed this quiz.</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                                <h3 className="text-xl font-semibold text-red-900 mb-2">Keep Trying!</h3>
                                <p className="text-red-700 mb-4">Review the material and try again.</p>
                                <Link href={`/student/quizzes/${quiz.id}/start`}>
                                    <Button>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Retake Quiz
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {settings.show_correct_answers && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Review</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {questions.map((question, index) => (
                                <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {question.is_correct ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-3">{index + 1}. {question.question_text}</h4>

                                            {question.question_type === 'multiple_choice' && question.options.length > 0 ? (
                                                <div className="space-y-2">
                                                    {question.options.map((option: any, optionIndex: number) => {
                                                        const optionText = typeof option === 'string' ? option : option.text;
                                                        const optionKey = typeof option === 'string' ? String(optionIndex) : option.key;
                                                        const isStudentAnswer = question.student_answer === optionKey;
                                                        const isCorrectAnswer = question.correct_answer === optionKey;

                                                        let className = 'p-3 rounded-lg border ';
                                                        if (isCorrectAnswer) className += 'border-green-500 bg-green-50 text-green-900';
                                                        else if (isStudentAnswer && !isCorrectAnswer) className += 'border-red-500 bg-red-50 text-red-900';
                                                        else className += 'border-gray-200 bg-gray-50';

                                                        return (
                                                            <div key={optionIndex} className={className}>
                                                                <div className="flex items-center justify-between">
                                                                    <span>{optionKey}. {optionText}</span>
                                                                    <div className="flex gap-2">
                                                                        {isStudentAnswer && (
                                                                            <Badge variant="outline" className="text-xs">Your answer</Badge>
                                                                        )}
                                                                        {isCorrectAnswer && (
                                                                            <Badge variant="outline" className="text-xs text-green-700">Correct</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                                        <div className="text-xs font-semibold text-gray-600 mb-1">Your answer</div>
                                                        {renderAnswer(question.student_answer)}
                                                    </div>
                                                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                                        <div className="text-xs font-semibold text-gray-600 mb-1">Correct answer</div>
                                                        {renderAnswer(question.correct_answer)}
                                                    </div>
                                                </div>
                                            )}

                                            {question.explanation && (
                                                <div className="mt-3 text-sm text-gray-600">
                                                    <span className="font-semibold">Explanation:</span> {question.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-center gap-4">
                    <Link href={`/student/quizzes/${quiz.id}/start`}>
                        <Button variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retake Quiz
                        </Button>
                    </Link>
                    <Link href="/student/quizzes">
                        <Button>Back to Quizzes</Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
