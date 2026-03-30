import React from 'react';

interface ProgressProps {
    value: number;
    className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
    const clampedValue = Math.min(Math.max(value, 0), 100);
    
    return (
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
            <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
                style={{ width: `${clampedValue}%` }}
            />
        </div>
    );
}