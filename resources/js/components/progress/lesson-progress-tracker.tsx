import { CheckCircle, Circle, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { useActionMessages } from '@/hooks/use-action-messages';

interface LessonProgressProps {
    lessonId: number;
    lessonTitle: string;
    isCompleted: boolean;
    completedAt?: string;
    timeSpent?: number;
    onProgressUpdate?: (lessonId: number, isCompleted: boolean) => void;
}

export default function LessonProgressTracker({
    lessonId,
    lessonTitle,
    isCompleted,
    completedAt,
    timeSpent = 0,
    onProgressUpdate
}: LessonProgressProps) {
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(isCompleted);
    const progressMessages = useActionMessages('Lesson progress');

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const toggleCompletion = async () => {
        setLoading(true);
        
        try {
            const endpoint = completed 
                ? `/student/lessons/${lessonId}/incomplete`
                : `/student/lessons/${lessonId}/complete`;
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            
            if (data.success) {
                setCompleted(!completed);
                onProgressUpdate?.(lessonId, !completed);
                progressMessages.success('toggle');
            } else {
                console.error('Failed to update progress:', data.message);
                progressMessages.error('toggle');
            }
        } catch (error) {
            console.error('Error updating lesson progress:', error);
            progressMessages.error('toggle');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeSpent = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}m`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
                <button
                    onClick={toggleCompletion}
                    disabled={loading}
                    className={`flex-shrink-0 transition-colors ${
                        completed 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-green-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    {completed ? (
                        <CheckCircle className="h-6 w-6" />
                    ) : (
                        <Circle className="h-6 w-6" />
                    )}
                </button>
                
                <div className="flex-1">
                    <h4 className={`font-medium ${
                        completed ? 'text-gray-900 line-through' : 'text-gray-900'
                    }`}>
                        {lessonTitle}
                    </h4>
                    
                    {completed && completedAt && (
                        <p className="text-sm text-green-600">
                            Completed {new Date(completedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
            
            {timeSpent > 0 && (
                <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimeSpent(timeSpent)}
                </div>
            )}
        </div>
    );
}
