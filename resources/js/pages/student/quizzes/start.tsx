import { Head, Link, router } from '@inertiajs/react';
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
    Timer
} from 'lucide-react';
import React, { useState } from 'react';
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
    is_ready: boolean;
    student_stats: {
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

interface Props {
    quiz: Quiz;
    enrollment: {
        id: number;
        progress: number;
    };
}

export default function StudentQuizStart({ quiz, enrollment }: Props) {
    const [isStarting, setIsStarting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const quizMessages = useActionMessages('Quiz');
    const isReady = quiz.is_ready && quiz.questions_count > 0 && quiz.total_marks > 0;

    const handleStartQuiz = async () => {
        if (!isReady) {
            quizMessages.error('create', 'This quiz is not ready yet (no questions).');
            return;
        }

        setIsStarting(true);
        setShowConfirmModal(false);

        try {
            router.post(`/student/quizzes/${quiz.id}/attempt`, {}, {
                onError: () => {
                    quizMessages.error('create', 'Quiz attempt');
                },
                onFinish: () => {
                    setIsStarting(false);
                },
            });
        } catch (error) {
            quizMessages.error('create', 'Quiz attempt');
            setIsStarting(false);
        }
    };

    const getAttemptInfo = () => {
        const { student_stats } = quiz;
        const remainingAttempts = quiz.max_attempts - student_stats.attempts_used;
        
        if (student_stats.has_passed) {
            return {
                type: 'success',
                title: 'Quiz Completed Successfully!',
                message: `You've already passed this quiz with ${student_stats.best_score}%. You can retake it to improve your score.`,
                icon: CheckCircle
            };
        }
        
        if (remainingAttempts === 0) {
            return {
                type: 'error',
                title: 'No Attempts Remaining',
                message: 'You have used all available attempts for this quiz.',
                icon: AlertTriangle
            };
        }
        
        if (student_stats.attempts_used > 0) {
            return {
                type: 'warning',
                title: `Attempt ${student_stats.attempts_used + 1} of ${quiz.max_attempts}`,
                message: `You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining. Your best score so far is ${student_stats.best_score}%.`,
                icon: RotateCcw
            };
        }
        
        return {
            type: 'info',
            title: 'First Attempt',
            message: `This is your first attempt. You have ${quiz.max_attempts} total attempts available.`,
            icon: Play
        };
    };

    const attemptInfo = getAttemptInfo();
    const AttemptIcon = attemptInfo.icon;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'My Quizzes', href: '/student/quizzes' },
            { title: quiz.title, href: `/student/quizzes/${quiz.id}/start` }
        ]}>
            <Head title={`Start Quiz: ${quiz.title}`} />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
                        {quiz.is_final_quiz && (
                            <Badge className="bg-purple-100 text-purple-800">
                                <Star className="h-3 w-3 mr-1" />
                                Final Quiz
                            </Badge>
                        )}
                    </div>
                    <p className="text-gray-600">{quiz.course.title}</p>
                </div>

                {/* Attempt Status Alert */}
                <Alert className={`border-l-4 ${
                    attemptInfo.type === 'success' ? 'border-green-500 bg-green-50' :
                    attemptInfo.type === 'error' ? 'border-red-500 bg-red-50' :
                    attemptInfo.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                }`}>
                    <AttemptIcon className={`h-4 w-4 ${
                        attemptInfo.type === 'success' ? 'text-green-600' :
                        attemptInfo.type === 'error' ? 'text-red-600' :
                        attemptInfo.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                    }`} />
                    <AlertDescription>
                        <div className="font-medium mb-1">{attemptInfo.title}</div>
                        <div>{attemptInfo.message}</div>
                    </AlertDescription>
                </Alert>

                {!isReady && (
                    <Alert className="border-l-4 border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                            <div className="font-medium mb-1">Quiz Not Ready</div>
                            <div>This quiz has no active questions yet. Please try again later.</div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-6">
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
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-gray-600">{quiz.description}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Questions</div>
                                        <div className="font-medium">{quiz.questions_count}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Total Marks</div>
                                        <div className="font-medium">{quiz.total_marks}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Passing Score</div>
                                        <div className="font-medium">{quiz.passing_score}%</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="text-sm text-gray-500">Max Attempts</div>
                                        <div className="font-medium">{quiz.max_attempts}</div>
                                    </div>
                                </div>
                            </div>

                            {quiz.time_limit && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-yellow-800">
                                        <Timer className="h-4 w-4" />
                                        <span className="font-medium">Time Limit: {quiz.time_limit} minutes</span>
                                    </div>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        The quiz will auto-submit when time expires.
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
                                <h4 className="font-medium mb-2">Before You Start</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Ensure you have a stable internet connection</li>
                                    <li>• Find a quiet place without distractions</li>
                                    <li>• Have any necessary materials ready</li>
                                    {quiz.time_limit && (
                                        <li>• Prepare for {quiz.time_limit} minutes of focused work</li>
                                    )}
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">During the Quiz</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Read each question carefully</li>
                                    <li>• Your answers are saved automatically</li>
                                    <li>• You can navigate between questions freely</li>
                                    <li>• Review your answers before submitting</li>
                                </ul>
                            </div>

                            {quiz.is_final_quiz && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-purple-800 mb-1">
                                        <Star className="h-4 w-4" />
                                        <span className="font-medium">Final Quiz</span>
                                    </div>
                                    <p className="text-sm text-purple-700">
                                        You must pass this quiz to complete the course and earn your certificate.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Previous Attempts */}
                {quiz.student_stats.previous_attempts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Previous Attempts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {quiz.student_stats.previous_attempts.map((attempt) => (
                                    <div key={attempt.attempt_number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium">
                                                Attempt {attempt.attempt_number}
                                            </div>
                                            <Badge className={attempt.is_passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {attempt.is_passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{attempt.percentage}%</div>
                                            <div className="text-xs text-gray-500">{attempt.completed_at}</div>
                                        </div>
                                    </div>
                                ))}
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
                    
                    {quiz.student_stats.can_attempt ? (
                        <Button 
                            size="lg" 
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isStarting || !isReady}
                            className="min-w-[150px]"
                        >
                            {isStarting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    {quiz.student_stats.attempts_used > 0 ? 'Retake Quiz' : 'Start Quiz'}
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
                isLoading={isStarting}
            />
        </AppLayout>
    );
}
