import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    variant?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    confirmButtonDisabled?: boolean;
    children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    variant,
    isDestructive = false,
    isLoading = false,
    confirmButtonDisabled = false,
    children,
}) => {
    const icons = {
        danger: <XCircle className="h-6 w-6 text-red-600" />,
        warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
        info: <Info className="h-6 w-6 text-blue-600" />,
        success: <CheckCircle className="h-6 w-6 text-green-600" />,
    };

    const effectiveType = isDestructive ? 'danger' : (variant === 'destructive' ? 'danger' : type);

    const buttonVariants = {
        danger: 'destructive' as const,
        warning: 'default' as const,
        info: 'default' as const,
        success: 'default' as const,
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 fade-in duration-300">
                    <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-2 ${
                            effectiveType === 'danger' ? 'bg-red-100' :
                            effectiveType === 'warning' ? 'bg-yellow-100' :
                            effectiveType === 'info' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                            {icons[effectiveType as keyof typeof icons]}
                        </div>
                        <div className="flex-1">
                            <Dialog.Title className="text-xl font-bold text-gray-900">
                                {title}
                            </Dialog.Title>
                            <Dialog.Description className="mt-2 text-gray-600 leading-relaxed">
                                {description || message}
                            </Dialog.Description>
                            {children}
                        </div>
                        <Dialog.Close asChild>
                            <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading || confirmButtonDisabled}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={buttonVariants[effectiveType as keyof typeof buttonVariants]}
                            onClick={onConfirm}
                            disabled={isLoading || confirmButtonDisabled}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ConfirmationModal;
