import React from 'react';
import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
    variant: 'view' | 'edit' | 'delete' | 'approve' | 'reject' | 'archive' | 'toggle' | 'submit' | 'move-up' | 'move-down' | 'success' | 'warning';
    icon: LucideIcon;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    loading?: boolean;
    title?: string;
    size?: 'sm' | 'md';
}

const getVariantStyles = (variant: ActionButtonProps['variant']) => {
    const baseStyles = 'inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
        case 'view':
            return `${baseStyles} text-blue-600 hover:text-blue-900 hover:bg-blue-50 focus:ring-blue-500`;
        case 'edit':
            return `${baseStyles} text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 focus:ring-indigo-500`;
        case 'delete':
            return `${baseStyles} text-red-600 hover:text-red-900 hover:bg-red-50 focus:ring-red-500`;
        case 'approve':
            return `${baseStyles} text-green-600 hover:text-green-900 hover:bg-green-50 focus:ring-green-500`;
        case 'reject':
            return `${baseStyles} text-red-600 hover:text-red-900 hover:bg-red-50 focus:ring-red-500`;
        case 'archive':
            return `${baseStyles} text-orange-600 hover:text-orange-900 hover:bg-orange-50 focus:ring-orange-500`;
        case 'toggle':
            return `${baseStyles} text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 focus:ring-yellow-500`;
        case 'submit':
            return `${baseStyles} text-green-600 hover:text-green-900 hover:bg-green-50 focus:ring-green-500`;
        case 'move-up':
        case 'move-down':
            return `${baseStyles} text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500`;
        case 'success':
            return `${baseStyles} text-green-600 hover:text-green-900 hover:bg-green-50 focus:ring-green-500`;
        case 'warning':
            return `${baseStyles} text-orange-600 hover:text-orange-900 hover:bg-orange-50 focus:ring-orange-500`;
        default:
            return `${baseStyles} text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:ring-gray-500`;
    }
};

const getSizeStyles = (size: ActionButtonProps['size']) => {
    switch (size) {
        case 'sm':
            return 'p-1.5 w-8 h-8';
        case 'md':
        default:
            return 'p-2 w-9 h-9';
    }
};

export function ActionButton({
    variant,
    icon: Icon,
    onClick,
    href,
    disabled = false,
    loading = false,
    title,
    size = 'md'
}: ActionButtonProps) {
    const className = `${getVariantStyles(variant)} ${getSizeStyles(size)} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    if (href && !disabled && !loading) {
        return (
            <Link href={href}>
                <button
                    type="button"
                    className={className}
                    title={title}
                >
                    <Icon className={iconSize} />
                </button>
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
            title={title}
        >
            <Icon className={iconSize} />
        </button>
    );
}