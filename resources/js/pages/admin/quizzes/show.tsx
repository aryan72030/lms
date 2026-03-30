import { Head, Link } from '@inertiajs/react';
import { Clock, HelpCircle, CheckCircle, XCircle, Award, Users, BarChart3, ListOrdered, User } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Option {
    key: string;
    text: string;
}

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: (string | Option)[];
    correct_answer: string;
    explanation: string | null;
    points: number;
    order: number;
}

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    course: {
        id: number;
        title: string;
        instructor: {
            id: number;
            name: string;
        };
    };
    time_limit: number | null;
    total_marks: number;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    is_active: boolean;
    questions: Question[];
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
}

interface Props {
    quiz: Quiz;
    statistics: Statistics;
}

export default function AdminQuizShow({ quiz, statistics }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Quiz Management', href: '/admin/quizzes' },
            { title: quiz.title, href: '#' }
        ]}>
            <Head title={`Quiz: ${quiz.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                                {quiz.is_final_quiz && (
                                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
                                        Final Quiz
                                    </Badge>
                                )}
                                <Badge variant={quiz.is_active ? "default" : "secondary"}>
                                    {quiz.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500">{quiz.course.title} • by {quiz.course.instructor.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                                Edit Quiz
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Quiz Info & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Statistics Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                                    Performance Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Pass Rate</div>
                                        <div className="text-xl font-bold text-indigo-600">{statistics.pass_rate}%</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Score</div>
                                        <div className="text-xl font-bold text-gray-900">{statistics.average_score}%</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5" />
                                            Total Attempts
                                        </span>
                                        <span className="font-bold">{statistics.total_attempts}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                            Passed
                                        </span>
                                        <span className="font-bold text-green-600">{statistics.passed_attempts}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                                            Failed
                                        </span>
                                        <span className="font-bold text-red-600">{statistics.failed_attempts}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Highest Score</span>
                                        <span className="font-bold">{statistics.highest_score}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Lowest Score</span>
                                        <span className="font-bold">{statistics.lowest_score}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quiz Settings Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Quiz Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Time Limit</span>
                                        <span className="font-medium">{quiz.time_limit ? `${quiz.time_limit} minutes` : 'Unlimited'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Total Marks</span>
                                        <span className="font-medium">{quiz.total_marks} points</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Passing Score</span>
                                        <span className="font-medium text-indigo-600">{quiz.passing_score}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Max Attempts</span>
                                        <span className="font-medium">{quiz.max_attempts}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-xs text-gray-400 uppercase tracking-wider">
                                        <span>Created</span>
                                        <span>{quiz.created_at}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 uppercase tracking-wider">
                                        <span>Last Updated</span>
                                        <span>{quiz.updated_at}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Questions */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Questions List</CardTitle>
                                    <CardDescription>
                                        Total {quiz.questions.length} questions in this quiz
                                    </CardDescription>
                                </div>
                                <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                    <ListOrdered className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {quiz.questions.length > 0 ? (
                                        quiz.questions.map((question, index) => (
                                            <div key={question.id} className="p-6 space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-3">
                                                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                                            {index + 1}
                                                        </span>
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-semibold text-gray-900 leading-relaxed">
                                                                {question.question_text}
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                                                    {question.question_type.replace('_', ' ')}
                                                                </Badge>
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">
                                                                    {question.points} Points
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                                                    {question.options.map((option, optIndex) => (
                                                        <div 
                                                            key={optIndex}
                                                            className={cn(
                                                                "p-3 rounded-lg border text-sm transition-colors",
                                                                (typeof option === 'object' ? option.key === question.correct_answer : option === question.correct_answer) 
                                                                    ? "bg-green-50 border-green-200 text-green-700 font-medium ring-1 ring-green-200" 
                                                                    : "bg-white border-gray-100 text-gray-600"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "flex items-center gap-2",
                                                                (typeof option === 'object' ? option.key === question.correct_answer : option === question.correct_answer)
                                                                    ? "text-green-700 font-medium" 
                                                                    : "text-gray-600"
                                                            )}>
                                                                <span className="text-xs font-bold text-gray-400">
                                                                    {typeof option === 'object' ? option.key : String.fromCharCode(65 + optIndex)}.
                                                                </span>
                                                                {typeof option === 'object' ? option.text : option}
                                                                {(typeof option === 'object' ? option.key === question.correct_answer : option === question.correct_answer) && (
                                                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {question.explanation && (
                                                    <div className="ml-9 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-800">
                                                        <span className="font-bold mr-1">Explanation:</span>
                                                        {question.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))
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
        </AppLayout>
    );
}
