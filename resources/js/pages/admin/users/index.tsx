import { Head, Link, router } from '@inertiajs/react';
import { Edit, Trash2, Plus, X, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { UserUpdatePopper } from '@/components/user-update-popper';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

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
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
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

export default function UsersIndex({ users, filters = {}, roles = [], statuses = [] }: Props) {
    const safeUsers = users || { data: [], total: 0 };
    const userData = safeUsers.data || [];
    const userTotal = safeUsers.total || 0;
    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdatePopper, setShowUpdatePopper] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        phone: '',
        date_of_birth: '',
        status: 'Active',
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [updateErrors, setUpdateErrors] = useState<ValidationErrors>({});
    const userMessages = useActionMessages('User');

    const handleSearch = () => {
        router.get('/admin/users', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(`/admin/users/${userToDelete.id}`, {
                onSuccess: () => {
                    userMessages.success('delete');
                    setUserToDelete(null);
                },
                onError: () => {
                    userMessages.error('delete');
                    setUserToDelete(null);
                }
            });
        }
    };

    const handleToggleStatus = async () => {
        if (!userToToggle) return;
        
        const newStatus = userToToggle.status === 'Active' ? 'Inactive' : 'Active';
        
        try {
            const response = await fetch(`/admin/users/${userToToggle.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                userMessages.success('toggle');
                window.location.reload();
            } else {
                userMessages.error('toggle');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            userMessages.error('toggle');
        } finally {
            setUserToToggle(null);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: '',
            phone: '',
            date_of_birth: '',
            status: 'Active',
        });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetForm();
    };

    const openUpdatePopper = (user: User) => {
        setSelectedUser(user);
        setUpdateErrors({});
        setShowUpdatePopper(true);
    };

    const closeUpdatePopper = () => {
        setShowUpdatePopper(false);
        setSelectedUser(null);
        setUpdateErrors({});
    };

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                userMessages.success('create');
                closeCreateModal();
                window.location.reload();
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    userMessages.error('create');
                }
            }
        } catch (error) {
            console.error('Create user error:', error);
            userMessages.error('create');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (userData: UserFormData) => {
        if (!selectedUser) {
return;
}

        setUpdateLoading(true);
        setUpdateErrors({});

        try {
            const response = await fetch(`/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.success) {
                userMessages.success('update');
                closeUpdatePopper();
                window.location.reload();
            } else {
                if (response.status === 422 && data.errors) {
                    setUpdateErrors(data.errors);
                } else {
                    userMessages.error('update');
                }
            }
        } catch (error) {
            console.error('Update user error:', error);
            userMessages.error('update');
        } finally {
            setUpdateLoading(false);
        }
    };

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (_value: unknown, user: User) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    {!user.email_verified_at && (
                        <div className="text-xs text-red-600">Email not verified</div>
                    )}
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            )
        },
        {
            key: 'role',
            label: 'Role',
            render: (value: string) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value === 'Admin' ? 'bg-red-100 text-red-800' :
                    value === 'Instructor' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_value: unknown, user: User) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant={user.status === 'Active' ? 'success' : 'warning'}
                        icon={user.status === 'Active' ? UserCheck : UserX}
                        onClick={() => setUserToToggle(user)}
                        title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
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
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'User Management', href: '/admin/users' }
        ]}>
            <Head title="User Management" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">Manage system users and their roles</p>
                    </div>
                    <Button onClick={openCreateModal} variant="create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create User
                    </Button>
                </div>

                {/* Search */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => {
                                setSearch('');
                                router.get('/admin/users');
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <DataTable
                    columns={columns}
                    data={userData}
                    title={`Users (${userTotal})`}
                    emptyMessage="No users found"
                    paginationLinks={safeUsers.links}
                    onPageChange={(url) => router.get(url)}
                    emptyAction={
                        <Button onClick={openCreateModal} variant="create">
                            Create First User
                        </Button>
                    }
                />
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                        <form onSubmit={handleCreateSubmit}>
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Enter full name"
                                            className={errors.name ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="Enter email address"
                                            className={errors.email ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="password">Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                placeholder="Enter password"
                                                className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showPasswordConfirmation ? "text" : "password"}
                                                value={formData.password_confirmation}
                                                onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                                placeholder="Confirm password"
                                                className={`pr-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswordConfirmation ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && <p className="text-red-600 text-sm mt-1">{errors.password_confirmation[0]}</p>}
                                    </div>
                                </div>

                                {/* Role and Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="role">Role *</Label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className={`w-full border rounded-md px-3 py-2 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                        >
                                            <option value="">Select role</option>
                                            {roles.map((role: string) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role[0]}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="status">Status *</Label>
                                        <select
                                            id="status"
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className={`w-full border rounded-md px-3 py-2 ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                        {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status[0]}</p>}
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="Enter phone number"
                                            className={errors.phone ? 'border-red-500' : ''}
                                        />
                                        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone[0]}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                            className={errors.date_of_birth ? 'border-red-500' : ''}
                                        />
                                        {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center gap-4 p-6 border-t bg-gray-50">
                                <Button
                                    type="submit"
                                    variant="create"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create User'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeCreateModal}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Update Popper */}
            <UserUpdatePopper
                user={selectedUser}
                roles={roles}
                isOpen={showUpdatePopper}
                onClose={closeUpdatePopper}
                onUpdate={handleUpdateSubmit}
                loading={updateLoading}
                errors={updateErrors}
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
                confirmText={userToToggle?.status === 'Active' ? 'Deactivate' : 'Activate'}
                isDestructive={userToToggle?.status === 'Active'}
            />
        </AppLayout>
    );
}
