import React from 'react';

interface AlertProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function Alert({ children, className = '', variant = 'default' }: AlertProps) {
    const variantClass = variant === 'destructive' ? 'border-red-300 bg-red-50 text-red-900' : '';

    return (
        <div className={`rounded-lg border p-4 ${variantClass} ${className}`}>
            {children}
        </div>
    );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
    return (
        <div className={`text-sm ${className}`}>
            {children}
        </div>
    );
}

export function AlertTitle({ children, className = '' }: AlertTitleProps) {
    return (
        <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
            {children}
        </h5>
    );
}