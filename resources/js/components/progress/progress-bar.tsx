import React from 'react';

interface ProgressBarProps {
    progress: number;
    total?: number;
    completed?: number;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'green' | 'yellow' | 'red';
    className?: string;
}

export default function ProgressBar({
    progress,
    total,
    completed,
    showText = true,
    size = 'md',
    color = 'blue',
    className = ''
}: ProgressBarProps) {
    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-600',
        red: 'bg-red-600'
    };

    const progressPercentage = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={`w-full ${className}`}>
            {showText && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        Progress
                    </span>
                    <div className="text-sm text-gray-600">
                        {total && completed !== undefined ? (
                            <span>{completed}/{total} lessons</span>
                        ) : (
                            <span>{progressPercentage.toFixed(1)}%</span>
                        )}
                    </div>
                </div>
            )}
            
            <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
                <div
                    className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out`}
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
            
            {showText && progressPercentage === 100 && (
                <div className="flex items-center mt-2 text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Course Completed!</span>
                </div>
            )}
        </div>
    );
}