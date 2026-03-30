import { Head, Link } from '@inertiajs/react';
import { 
    Clock, 
    Target, 
    Trophy, 
    AlertCircle, 
    CheckCircle, 
    XCircle, 
    Play,
    RotateCcw,
    BookOpen,
    Star
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';

interface Quiz {
    id: number;
    title: string;
    description: string;
    course: {
        id: number;
        title: string;
    };
    time_limit: number | null;
    total_marks: number;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    questions_count: number;
    student_stats: {
        attempts_used: number;
        best_score: number | null;
        has_passed: boolean;
        can_attempt: boolean;
        last_attempt_date: string | null;
    };
}

interface Props {
    quizzes: Quiz[];
    enrollments: Array<{
        id: number;
        course: {
            id: number;
            title: string;
        };
        progress: number;
        is_completed: boolean;
    }>;
}

export default function StudentQuizzesIndex({ quizzes, enrollments }: Props) {
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    const filteredQuizzes = selectedCourse 
        ? quizzes.filter(quiz => quiz.course.id.toString() === selectedCourse)
        : quizzes;

    const getQuizStatus = (quiz: Quiz) => {
        const { student_stats } = quiz;
        
        if (student_stats.has_passed) {
            return {
                status: 'passed',
                label: 'Passed',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircle
            };
        }
        
        if (student_stats.attempts_used >= quiz.max_attempts) {
            return {
                status: 'failed',
                label: 'Failed',
                color: 'bg-red-100 text-red-800',
                icon: XCircle
            };
        }
        
        if (student_stats.attempts_used > 0) {
            return {
                status: 'in_progress',
                label: 'In Progress',
                color: 'bg-yellow-100 text-yellow-800',
                icon: AlertCircle
            };
        }
        
        return {
            status: 'not_started',
            label: 'Not Started',
            color: 'bg-gray-100 text-gray-800',
            icon: Play
        };
    };

    const getActionButton = (quiz: Quiz) => {
        const { student_stats } = quiz;
        const status = getQuizStatus(quiz);
        
        if (!student_stats.can_attempt) {
            return (
                <Button disabled variant="outline" className="w-full">
                    No More Attempts
                </Button>
            );
        }
        
        if (student_stats.has_passed) {
            return (
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`/student/quizzes/${quiz.id}/results`}>
                        <Trophy className="h-4 w-4 mr-2" />
                        View Results
                    </Link>
                </Button>
            );
        }
        
        if (student_stats.attempts_used > 0) {
            return (
                <Button className="w-full" asChild>
                    <Link href={`/student/quizzes/${quiz.id}/start`}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake Quiz
                    </Link>
                </Button>
            );
        }
        
        return (
            <Button className="w-full" asChild>
                <Link href={`/student/quizzes/${quiz.id}/start`}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                </Link>
            </Button>
        );
    };

    const getScoreDisplay = (quiz: Quiz) => {
        const { student_stats } = quiz;
        
        if (student_stats.best_score === null) {
            return <span className="text-gray-500">Not attempted</span>;
        }
        
        const percentage = student_stats.best_score;
        const isPassing = percentage >= quiz.passing_score;
        
        return (
            <div className="flex items-center gap-2">
                <span className={`font-semibold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage}%
                </span>
                {isPassing ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'My Quizzes', href: '/student/quizzes' }
        ]}>
            <Head title="My Quizzes" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quizzes</h1>
                    <p className="text-gray-600">Test your knowledge and track your progress</p>
                </div>

                {/* Course Filter */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {enrollments.map(enrollment => (
                                <option key={enrollment.id} value={enrollment.course.id}>
                                    {enrollment.course.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quiz Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuizzes.map(quiz => {
                        const status = getQuizStatus(quiz);
                        const StatusIcon = status.icon;
                        
                        return (
                            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                                            <p className="text-sm text-gray-600 mb-2">{quiz.course.title}</p>
                                        </div>
                                        <StatusIcon className={`h-5 w-5 ${
                                            status.status === 'passed' ? 'text-green-600' :
                                            status.status === 'failed' ? 'text-red-600' :
                                            status.status === 'in_progress' ? 'text-yellow-600' :
                                            'text-gray-600'
                                        }`} />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Badge className={status.color}>
                                            {status.label}
                                        </Badge>
                                        {quiz.is_final_quiz && (
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                <Star className="h-3 w-3 mr-1" />
                                                Final Quiz
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-4">
                                    {/* Quiz Info */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-gray-500" />
                                            <span>{quiz.questions_count} questions</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-gray-500" />
                                            <span>{quiz.passing_score}% to pass</span>
                                        </div>
                                        {quiz.time_limit && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span>{quiz.time_limit} minutes</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <RotateCcw className="h-4 w-4 text-gray-500" />
                                            <span>{quiz.student_stats.attempts_used}/{quiz.max_attempts} attempts</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar for Attempts */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Attempts Used</span>
                                            <span>{quiz.student_stats.attempts_used}/{quiz.max_attempts}</span>
                                        </div>
                                        <Progress 
                                            value={(quiz.student_stats.attempts_used / quiz.max_attempts) * 100} 
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Best Score */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Best Score:</span>
                                        {getScoreDisplay(quiz)}
                                    </div>

                                    {/* Description */}
                                    {quiz.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {quiz.description}
                                        </p>
                                    )}

                                    {/* Action Button */}
                                    {getActionButton(quiz)}

                                    {/* Last Attempt Info */}
                                    {quiz.student_stats.last_attempt_date && (
                                        <p className="text-xs text-gray-500 text-center">
                                            Last attempt: {quiz.student_stats.last_attempt_date}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredQuizzes.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
                        <p className="text-gray-600 mb-4">
                            {selectedCourse 
                                ? "No quizzes found for the selected course." 
                                : "You don't have any quizzes available yet."
                            }
                        </p>
                        <Link href="/student/courses">
                            <Button variant="outline">
                                Browse Courses
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">Quiz Tips</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Final quizzes must be passed to complete the course</li>
                                <li>• You can retake quizzes until you reach the attempt limit</li>
                                <li>• Your best score is always kept as your final grade</li>
                                <li>• Time limits are enforced - prepare before starting</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}