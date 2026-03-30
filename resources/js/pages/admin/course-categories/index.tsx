import * as Dialog from '@radix-ui/react-dialog';
import { Head, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Power, PowerOff, X, FolderOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { PaginationLinks } from '@/components/ui/pagination-links';
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

export default function CourseCategoriesIndex({ categories: initialCategories, filters = {} }: Props) {
    const [categories, setCategories] = useState<Category[]>(initialCategories.data || []);
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: true,
    });
    const [errors, setErrors] = useState<any>({});
    const categoryMessages = useActionMessages('Category');

    useEffect(() => {
        setCategories(initialCategories.data || []);
    }, [initialCategories]);

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search]);

    const handleSearch = () => {
        router.get('/admin/course-categories', {
            search: search || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            status: true,
        });
        setErrors({});
        setEditingCategory(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            status: category.status,
        });
        setEditingCategory(category);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token || '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const url = editingCategory 
                ? `/admin/course-categories/${editingCategory.id}`
                : '/admin/course-categories';
            
            const method = editingCategory ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                if (editingCategory) {
                    setCategories(categories.map(cat => 
                        cat.id === editingCategory.id ? data.category : cat
                    ));
                } else {
                    setCategories([data.category, ...categories]);
                }
                
                categoryMessages.success(editingCategory ? 'update' : 'create');
                closeModal();
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    categoryMessages.error(editingCategory ? 'update' : 'create', undefined, data.message);
                }
            }
        } catch (error: any) {
            console.error('Network error:', error);
            categoryMessages.error(editingCategory ? 'update' : 'create');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        try {
            const response = await fetch(`/admin/course-categories/${categoryToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (data.success) {
                setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
                categoryMessages.success('delete');
            } else {
                categoryMessages.error('delete', undefined, data.message);
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            categoryMessages.error('delete');
        } finally {
            setCategoryToDelete(null);
        }
    };

    const handleToggleStatus = async (category: Category) => {
        try {
            const response = await fetch(`/admin/course-categories/${category.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (data.success) {
                setCategories(categories.map(cat => 
                    cat.id === category.id ? data.category : cat
                ));
                categoryMessages.success('toggle');
            } else {
                categoryMessages.error('toggle', undefined, data.message);
            }
        } catch (error: any) {
            console.error('Toggle error:', error);
            categoryMessages.error('toggle');
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Categories', href: '/admin/course-categories' }
        ]}>
            <Head title="Course Categories" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
                        <p className="text-gray-600">Manage course categories for organizing courses</p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        variant="create"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                    </Button>
                </div>

                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                                router.get('/admin/course-categories');
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Categories Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Categories ({initialCategories.total})</h2>
                    </div>
                    
                    {categories.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.map((category) => (
                                        <tr key={category.id} className={`hover:bg-gray-50 ${category.is_deleted ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {category.description || 'No description'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    category.status 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {category.status_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {category.created_at}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {!category.is_deleted && (
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() => openEditModal(category)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50 transition-colors"
                                                            title="Edit Category"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(category)}
                                                            className={`p-2 rounded transition-colors ${
                                                                category.status 
                                                                    ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            }`}
                                                            title={category.status ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {category.status ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setCategoryToDelete(category)}
                                                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                                                            title="Delete Category"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <FolderOpen className="h-12 w-12 mx-auto" />
                            </div>
                            <p className="text-gray-500 text-lg mb-4">No categories found</p>
                            <Button
                                onClick={openCreateModal}
                                variant="create"
                            >
                                Create First Category
                            </Button>
                        </div>
                    )}
                </div>

                {categories.length > 0 ? (
                    <PaginationLinks
                        links={initialCategories.links}
                        onPageChange={(url) => router.get(url)}
                    />
                ) : null}
            </div>

            {/* Modal */}
            <Dialog.Root open={showModal} onOpenChange={(open) => !open && closeModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlay-show" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-lg data-[state=open]:animate-content-show focus:outline-none max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            {/* Modal header */}
                            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                <Dialog.Title className="text-xl font-bold text-gray-900">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            
                            {/* Modal body */}
                            <div className="p-6 space-y-4">
                                {/* Name field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Enter category name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
                                    )}
                                </div>

                                {/* Description field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={3}
                                        placeholder="Enter category description (optional)"
                                    />
                                    {errors.description && (
                                        <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>
                                    )}
                                </div>

                                {/* Status field */}
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 font-medium">Active</span>
                                    </label>
                                </div>
                            </div>
                            
                            {/* Modal footer */}
                            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    className="rounded-full px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-full px-6"
                                >
                                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                description={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </AppLayout>
    );
}
