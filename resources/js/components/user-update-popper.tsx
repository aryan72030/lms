import { X, Save } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { UserForm } from './users/UserForm';

interface UserUpdatePopperProps {
    user: any;
    roles: string[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (userData: any) => void; // Made optional as we use form.put
}

export function UserUpdatePopper({
    user,
    roles,
    isOpen,
    onClose,
}: UserUpdatePopperProps) {
    const form = useForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
        phone: user?.phone || '',
        date_of_birth:
            user?.date_of_birth && user.date_of_birth.includes('T')
                ? user.date_of_birth.split('T')[0]
                : user?.date_of_birth || '',
        status: user?.status || 'Active',
    });

    useEffect(() => {
        if (user) {
            // Ensure date_of_birth is in YYYY-MM-DD format for the date input
            let formattedDate = user.date_of_birth || '';
            if (formattedDate && formattedDate.includes('T')) {
                formattedDate = formattedDate.split('T')[0];
            }

            form.setData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                phone: user.phone || '',
                date_of_birth: formattedDate,
                status: user.status || 'Active',
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        form.put(`/admin/users/${user.id}`, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Update User</DialogTitle>
                    <DialogDescription>
                        Update user account details and role permissions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <UserForm
                        formData={form.data}
                        setFormData={(data) => {
                            if (typeof data === 'function') {
                                // setData can take a function, but UserForm uses it as (newData) => setData({...})
                            }
                            form.setData(data);
                        }}
                        errors={form.errors as any}
                        mode="edit"
                        roles={roles}
                    />

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="create"
                            disabled={form.processing}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {form.processing ? 'Updating...' : 'Update User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
