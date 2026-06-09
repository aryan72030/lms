import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { DataTable } from '@/components/ui/data-table';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useNotification } from '@/contexts/notification-context';
import {
    Plus,
    Edit,
    Trash2,
    Power,
    PowerOff,
    FolderOpen,
    Search,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Category {
    id: number;
    name: string;
    description: string;
    status: boolean;
    status_label: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_deleted: boolean;
}

interface Props {
    categories: {
        data: Category[];
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters?: {
        search?: string;
    };
}

export default function CourseCategoriesIndex({
    categories: initialCategories,
    filters = {},
}: Props) {
    const [categories, setCategories] = useState<Category[]>(
        initialCategories.data || [],
    );
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
        null,
    );
    const categoryMessages = useActionMessages('Category');
    const { showSuccess, showError } = useNotification();
    const { props: { flash } } = usePage<any>();

    useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
        if (flash.error) {
            showError(flash.error);
        }
    }, [flash]);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: true,
    });

    useEffect(() => {
        setCategories(initialCategories.data || []);
    }, [initialCategories]);

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const handleSearch = () => {
        router.get(
            '/admin/course-categories',
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetForm = () => {
        reset();
        setEditingCategory(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        reset();
        setData({
            name: category.name,
            description: category.description || '',
            status: category.status,
        });
        setEditingCategory(category);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(`/admin/course-categories/${editingCategory.id}`, {
                onSuccess: () => {
                    closeModal();
                },
                onError: () => {},
            });
        } else {
            post('/admin/course-categories', {
                onSuccess: () => {
                    closeModal();
                },
                onError: () => {},
            });
        }
    };

    const handleDelete = () => {
        if (!categoryToDelete) return;
        destroy(`/admin/course-categories/${categoryToDelete.id}`, {
            onSuccess: () => setCategoryToDelete(null),
        });
    };

    const handleToggleStatus = async (category: Category) => {
        router.patch(
            `/admin/course-categories/${category.id}/toggle-status`,
            {},
            {
                onSuccess: () => {},

                onError: () => {},
            },
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (value: string, category: Category) => (
                <div className="text-sm font-bold text-slate-700">
                    {category.name}
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (value: string, category: Category) => (
                <div className="max-w-xs truncate text-sm text-slate-500">
                    {category.description || 'No description'}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string, category: Category) => (
                <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        category.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {category.status_label}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value: string, category: Category) => (
                <span className="text-sm whitespace-nowrap text-slate-500">
                    {category.created_at}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: string, category: Category) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => openEditModal(category)}
                        className="rounded-lg p-2 text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
                        title="Edit Category"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleToggleStatus(category)}
                        className={`rounded-lg p-2 transition-colors ${
                            category.status
                                ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-900'
                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900'
                        }`}
                        title={category.status ? 'Deactivate' : 'Activate'}
                    >
                        {category.status ? (
                            <PowerOff className="h-4 w-4" />
                        ) : (
                            <Power className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setCategoryToDelete(category)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-900"
                        title="Delete Category"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                {
                    title: 'Course Categories',
                    href: '/admin/course-categories',
                },
            ]}
        >
            <Head title="Course Categories" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title text-gray-900">
                            Course Categories
                        </h1>
                        <p className="text-gray-600">
                            Manage course categories for organizing courses
                        </p>
                    </div>
                    <Button onClick={openCreateModal} variant="create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Category
                    </Button>
                </div>

                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
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
                                router.get('/admin/course-categories');
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Categories Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={categories}
                            title={`Categories (${initialCategories.total})`}
                            emptyMessage="No categories found"
                            paginationLinks={initialCategories.links}
                            onPageChange={(url) => router.get(url)}
                            emptyAction={
                                <Button onClick={openCreateModal} variant="create">
                                    Create First Category
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Create New Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update the category details.' : 'Fill in the details to create a new course category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        {/* Modal body */}
                        <div className="space-y-4 py-2">
                                {/* Name field */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Category Name{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                        placeholder="Enter category name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description field */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                        rows={3}
                                        placeholder="Enter category description (optional)"
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Status field */}
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.status}
                                            onChange={(e) =>
                                                setData(
                                                    'status',
                                                    e.target.checked,
                                                )
                                            }
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            Active
                                        </span>
                                    </label>
                                </div>
                            </div>

                        <DialogFooter className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? (editingCategory ? 'Updating...' : 'Creating...')
                                        : editingCategory
                                          ? 'Update Category'
                                          : 'Create Category'}
                                </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AppLayout>
    );
}
