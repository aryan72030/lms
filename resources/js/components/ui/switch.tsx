import React from 'react';

type SwitchButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>;

interface SwitchProps extends SwitchButtonProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

export function Switch({
    checked,
    onCheckedChange,
    disabled = false,
    className = '',
    onClick,
    ...props
}: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={(e) => {
                onClick?.(e);
                if (!disabled) {
                    onCheckedChange(!checked);
                }
            }}
            disabled={disabled}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${checked 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }
                ${disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }
                ${className}
            `}
            {...props}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );
}
