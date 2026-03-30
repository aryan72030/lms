import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    isLoading = false,
}: ConfirmationModalProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg data-[state=open]:animate-content-show focus:outline-none">
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                        {title}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-gray-600">
                        {description}
                    </Dialog.Description>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="rounded-lg"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`rounded-lg ${
                                isDestructive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-900 hover:bg-gray-800'
                            }`}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </Button>
                    </div>

                    <Dialog.Close asChild>
                        <button
                            className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:text-gray-800"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
