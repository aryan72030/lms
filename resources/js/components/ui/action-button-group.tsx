import React from 'react';

interface ActionButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function ActionButtonGroup({ children, className = '' }: ActionButtonGroupProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {children}
        </div>
    );
}