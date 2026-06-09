import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Edit,
    Trash2,
    Plus,
    UserCheck,
    UserX,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { UserUpdatePopper } from '@/components/user-update-popper';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';
import { UserForm } from '@/components/users/UserForm';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    date_of_birth: string | null;
    status: string;
    email_verified_at?: string | null;
}

interface PaginatedUsers {
    data: User[];
    total: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface UserFormData {
    [key: string]: any;
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role: string;
    phone: string;
    date_of_birth: string;
    status: string;
}

interface ValidationErrors {
    [key: string]: string[] | undefined;
}

interface Props {
    users?: PaginatedUsers;
    filters?: {
        search?: string;
    };
    roles?: string[];
    statuses?: string[];
}

export default function UsersIndex({
    users,
    filters = {},
    roles = [],
    statuses = [],
}: Props) {
    const safeUsers = users || { data: [], total: 0 };
    const userData = safeUsers.data || [];
    const userTotal = safeUsers.total || 0;
    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdatePopper, setShowUpdatePopper] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);

    const createForm = useForm<UserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        phone: '',
        date_of_birth: '',
        status: 'Active',
    });

    const userMessages = useActionMessages('User');

    const handleSearch = () => {
        router.get(
            '/admin/users',
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(`/admin/users/${userToDelete.id}`, {
                onSuccess: () => {
                    setUserToDelete(null);
                },
                onError: () => {
                    userMessages.error('delete');
                    setUserToDelete(null);
                },
            });
        }
    };

    const handleToggleStatus = () => {
        if (!userToToggle) return;

        const newStatus =
            userToToggle.status === 'Active' ? 'Inactive' : 'Active';

        router.patch(
            `/admin/users/${userToToggle.id}/toggle-status`,
            { status: newStatus },
            {
                onSuccess: () => {
                    setUserToToggle(null);
                },
                onError: () => {
                    userMessages.error('toggle');
                    setUserToToggle(null);
                },
            },
        );
    };

    const resetCreateForm = () => {
        createForm.reset();
        createForm.clearErrors();
    };

    const openCreateModal = () => {
        resetCreateForm();
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetCreateForm();
    };

    const openUpdatePopper = (user: User) => {
        setSelectedUser(user);
        setShowUpdatePopper(true);
    };

    const closeUpdatePopper = () => {
        setShowUpdatePopper(false);
        setSelectedUser(null);
    };

    const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        createForm.post('/admin/users', {
            onSuccess: () => {
                closeCreateModal();
            },
            onError: (errors) => {
                console.error('Create user errors:', errors);
            },
        });
    };


    // Define table columns
    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (_value: unknown, user: User) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {user.name}
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (value: string) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        value === 'Admin'
                            ? 'bg-red-100 text-red-800'
                            : value === 'Instructor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                    }`}
                >
                    {value}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        value === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {value}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_value: unknown, user: User) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant={
                            user.status === 'Active' ? 'success' : 'warning'
                        }
                        icon={user.status === 'Active' ? UserCheck : UserX}
                        onClick={() => setUserToToggle(user)}
                        title={
                            user.status === 'Active'
                                ? 'Deactivate User'
                                : 'Activate User'
                        }
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        onClick={() => openUpdatePopper(user)}
                        title="Edit User"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setUserToDelete(user)}
                        title="Delete User"
                    />
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'User Management', href: '/admin/users' },
            ]}
        >
            <Head title="User Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title text-gray-900">
                            User Management
                        </h1>
                        <p className="text-gray-600">
                            Manage system users and their roles
                        </p>
                    </div>
                    <Button onClick={openCreateModal} variant="create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </div>

                {/* Search */}
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setSearch(e.target.value)}
                            onKeyDown={(
                                e: React.KeyboardEvent<HTMLInputElement>,
                            ) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                        />
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                router.get('/admin/users');
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={userData}
                            title={`Users (${userTotal})`}
                            emptyMessage="No users found"
                            paginationLinks={safeUsers.links}
                            onPageChange={(url: string) => router.get(url)}
                            emptyAction={
                                <Button onClick={openCreateModal} variant="create">
                                    Create First User
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showCreateModal} onOpenChange={(open) => !open && closeCreateModal()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Fill in the details to create a new user account.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                        <UserForm
                            formData={createForm.data}
                            setFormData={(data) => {
                                // setData can take a key/value or an object
                                if (typeof data === 'function') {
                                    // Handle the function case if necessary, but UserForm uses it as (newData) => setData({...})
                                    // Our UserForm.tsx: setFormData({ ...formData, [field]: value });
                                    // So we just pass createForm.setData directly if it matches
                                }
                                createForm.setData(data);
                            }}
                            errors={createForm.errors as any}
                            mode="create"
                            roles={roles.filter((role) => role !== 'Admin')}
                        />

                        <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeCreateModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="create"
                                    disabled={createForm.processing}
                                >
                                    {createForm.processing ? 'Creating...' : 'Create User'}
                                </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* User Update Popper */}
            <UserUpdatePopper
                user={selectedUser}
                roles={roles}
                isOpen={showUpdatePopper}
                onClose={closeUpdatePopper}
            />

            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDelete}
                title="Delete User"
                description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={!!userToToggle}
                onClose={() => setUserToToggle(null)}
                onConfirm={handleToggleStatus}
                title={`${userToToggle?.status === 'Active' ? 'Deactivate' : 'Activate'} User`}
                description={`Are you sure you want to ${userToToggle?.status === 'Active' ? 'deactivate' : 'activate'} ${userToToggle?.name}?`}
                confirmText={
                    userToToggle?.status === 'Active'
                        ? 'Deactivate'
                        : 'Activate'
                }
                isDestructive={userToToggle?.status === 'Active'}
            />
        </AppLayout>
    );
}
