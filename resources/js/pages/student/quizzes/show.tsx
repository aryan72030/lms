import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Target, CheckCircle, AlertCircle, Play } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Option {
    key: string;
    text: string;
}

interface Question {
    id: number;
    question: string;
    options: (string | Option)[];
}

interface Attempt {
    id: number;
    score: number;
    max_score: number;
    percentage: number;
    completed_at: string;
    time_spent: number;
    passed: boolean;
}

interface Props {
    lesson: {
        id: number;
        title: string;
        description: string;
        course: {
            id: number;
            title: string;
        };
    };
    questions: Question[];
    attempts: Attempt[];
    settings: {
        shuffle_questions: boolean;
        show_correct_answers: boolean;
        attempts_allowed: number;
    };
    enrollment: {
        id: number;
    };
}

export default function QuizShow({ lesson, questions, attempts, settings, enrollment }: Props) {
    const [isStarted, setIsStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const quizMessages = useActionMessages('Quiz');

    const canTakeQuiz = attempts.length < settings.attempts_allowed;
    const bestAttempt = attempts.length > 0 ? attempts.reduce((best, current) => 
        current.percentage > best.percentage ? current : best
    ) : null;

    const startQuiz = () => {
        setIsStarted(true);
        setStartTime(new Date());
        setCurrentQuestion(0);
        setAnswers({});
        setTimeSpent(0);
        
        // Start timer
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 60000); // Update every minute
        
        // Store timer in component for cleanup
        (window as any).quizTimer = timer;
    };

    const selectAnswer = (questionIndex: number, answerIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: answerIndex
        }));
    };

    const nextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const previousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (!startTime) {
return;
}

        const actualTimeSpent = Math.ceil((new Date().getTime() - startTime.getTime()) / 60000);
        
        setIsSubmitting(true);
        
        try {
            const response = await fetch(`/student/lessons/${lesson.id}/quiz/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    answers: Object.keys(questions).map(i => answers[parseInt(i)] ?? null),
                    time_spent: actualTimeSpent,
                }),
            });

            const data = await response.json();

            if (data.success) {
                quizMessages.success('submit');

                // Clear timer
                if ((window as any).quizTimer) {
                    clearInterval((window as any).quizTimer);
                }

                // Redirect to results
                window.location.href = `/student/quiz-attempts/${data.attempt.id}/results`;
            } else {
                quizMessages.error('submit');
            }
        } catch (error) {
            console.error('Quiz submission error:', error);
            quizMessages.error('submit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAnsweredCount = () => {
        return Object.keys(answers).length;
    };

    if (isStarted) {
        const question = questions[currentQuestion];
        const progress = ((currentQuestion + 1) / questions.length) * 100;

        return (
            <AppLayout>
                <Head title={`Quiz: ${lesson.title}`} />
                
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Quiz Header */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                                <p className="text-gray-600">{lesson.course.title}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {timeSpent} min
                                </div>
                                <div className="flex items-center gap-1">
                                    <Target className="h-4 w-4" />
                                    {getAnsweredCount()}/{questions.length} answered
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>

                    {/* Question */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {currentQuestion + 1}. {question.question}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {question.options.map((option, index) => {
                                const optionKey = typeof option === 'object' ? option.key : index;
                                const optionText = typeof option === 'object' ? option.text : option;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => selectAnswer(currentQuestion, index)}
                                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                            answers[currentQuestion] === index
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                                answers[currentQuestion] === index
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {answers[currentQuestion] === index && (
                                                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                                )}
                                            </div>
                                            {typeof option === 'object' && (
                                                <span className="font-bold text-gray-400">{option.key}.</span>
                                            )}
                                            <span>{optionText}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={previousQuestion}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </Button>
                        
                        <div className="flex gap-2">
                            {currentQuestion < questions.length - 1 ? (
                                <Button onClick={nextQuestion}>
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={submitQuiz}
                                    disabled={isSubmitting || getAnsweredCount() === 0}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`Quiz: ${lesson.title}`} />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/student/enrollments/${enrollment.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Course
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{lesson.title}</h1>
                        <p className="text-gray-600">{lesson.course.title}</p>
                    </div>
                </div>

                {/* Quiz Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Quiz Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lesson.description && (
                            <p className="text-gray-600">{lesson.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                                <div className="text-sm text-gray-600">Questions</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{settings.attempts_allowed}</div>
                                <div className="text-sm text-gray-600">Attempts Allowed</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">70%</div>
                                <div className="text-sm text-gray-600">Passing Score</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Start Button */}
                <div className="text-center">
                    {canTakeQuiz ? (
                        <Button size="lg" onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700">
                            <Play className="h-5 w-5 mr-2" />
                            Start Quiz
                        </Button>
                    ) : (
                        <p className="text-red-600">You have used all your attempts for this quiz.</p>
                    )}
                </div>

                {/* Previous Attempts */}
                {attempts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Previous Attempts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {attempts.map(attempt => (
                                    <li key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">Attempt on {attempt.completed_at}</p>
                                            <p className="text-sm text-gray-600">
                                                Score: {attempt.score}/{attempt.max_score} ({attempt.percentage.toFixed(1)}%)
                                            </p>
                                        </div>
                                        <Badge className={attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                            {attempt.passed ? 'Passed' : 'Failed'}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
