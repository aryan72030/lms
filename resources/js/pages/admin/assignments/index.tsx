import { Head, Link, router } from '@inertiajs/react';
import { Search, Plus, Edit, Trash2, Eye, BookOpen, Users, Award, Calendar, ListChecks } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { DataTable } from '@/components/ui/data-table';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { AssignmentModal } from '@/components/instructor/assignment-modal';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Assignment {
    id: number;
    title: string;
    course_title: string | null;
    instructor_name: string | null;
    submissions_count: number;
    submitted_count: number;
    graded_count: number;
    is_published: boolean;
    created_at: string;
    max_score: number;
    due_days: number;
    course_id: number;
    instructions: string;
    passing_score: number;
    assignment_type: 'text' | 'file' | 'mixed';
    allowed_file_types: string[];
    max_file_size_mb: number;
    max_files: number;
}

interface Course {
    id: number;
    title: string;
    instructor_name: string;
}

interface Props {
    assignments?: {
        data: Assignment[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
        meta?: any;
    };
    courses: Course[];
    filters?: {
        search?: string;
    };
}

export default function AdminAssignmentsIndex({
    assignments,
    courses,
    filters = {},
}: Props) {
    const safeAssignments = {
        data: assignments?.data || [],
        links: assignments?.links || [],
        meta: assignments?.meta || {},
    };

    const [search, setSearch] = useState(filters.search || '');
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const assignmentMessages = useActionMessages('Assignment');

    const handleSearch = () => {
        router.get(
            '/admin/assignments',
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = async () => {
        if (!assignmentToDelete) return;

        router.delete(`/admin/assignments/${assignmentToDelete.id}`, {
            onSuccess: () => {
                setAssignmentToDelete(null);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
                // Check if there's a specific error message from backend
                const errorMessage = errors.delete || `Cannot delete assignment "${assignmentToDelete.title}". It may have submissions.`;
                assignmentMessages.error('delete', errorMessage);
                setAssignmentToDelete(null);
            },
        });
    };

    const handleCreate = () => {
        setSelectedAssignment(null);
        setIsAssignmentModalOpen(true);
    };

    const handleEdit = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setIsAssignmentModalOpen(true);
    };

    const getStatusBadge = (assignment: Assignment) => {
        if (assignment.is_published) {
            return <Badge className="bg-green-100 text-green-800 border-green-100">Published</Badge>;
        }
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Draft</Badge>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return <span className="text-sm text-gray-500">N/A</span>;
        }
        return (
            <span className="text-sm text-gray-500">
                {new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }).format(date)}
            </span>
        );
    };

    const columns = [
        {
            key: 'title',
            label: 'Assignment',
            render: (value: string, assignment: Assignment) => (
                <div>
                    <div className="font-medium text-gray-900 mb-1">
                        {assignment.title}
                    </div>
                    <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        {assignment.course_title || 'No Course'}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {assignment.instructor_name || 'No Instructor'}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Type & Files',
            render: (value: any, assignment: Assignment) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {assignment.assignment_type === 'text' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                📝 Text Only
                            </Badge>
                        )}
                        {assignment.assignment_type === 'file' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                📎 File Upload
                            </Badge>
                        )}
                        {assignment.assignment_type === 'mixed' && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                📝📎 Mixed
                            </Badge>
                        )}
                    </div>
                    {(assignment.assignment_type === 'file' || assignment.assignment_type === 'mixed') && (
                        <div className="text-[10px] text-gray-500 flex flex-wrap gap-1 mt-1">
                            <span className="font-medium uppercase">Max: {assignment.max_file_size_mb}MB</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-medium uppercase">Count: {assignment.max_files}</span>
                            <div className="w-full flex flex-wrap gap-1">
                                {assignment.allowed_file_types?.map((ext) => (
                                    <span key={ext} className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono border border-gray-200">
                                        {ext}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: any, assignment: Assignment) => (
                <div className="space-y-1">
                    {getStatusBadge(assignment)}
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {assignment.due_days} days</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'details',
            label: 'Scoring',
            render: (value: any, assignment: Assignment) => (
                <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <Award className="h-3.5 w-3.5" />
                        <span>{assignment.max_score} marks</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        Pass: {assignment.passing_score}%
                    </div>
                </div>
            ),
        },
        {
            key: 'submissions',
            label: 'Submissions',
            render: (value: any, assignment: Assignment) => (
                <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{assignment.submissions_count}</span>
                        <span className="text-gray-400">total</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{assignment.submitted_count || 0} submitted</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{assignment.graded_count || 0} graded</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, assignment: Assignment) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={ListChecks}
                        href={`/admin/assignments/${assignment.id}`}
                        title="View Details"
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        onClick={() => handleEdit(assignment)}
                        title="Edit Assignment"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setAssignmentToDelete(assignment)}
                        title="Delete Assignment"
                    />
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Assignments', href: '/admin/assignments' },
            ]}
        >
            <Head title="Assignments" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="page-title text-gray-900">
                        Assignment Management
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Total Assignments:</span>
                            <Badge variant="secondary" className="font-bold">
                                {safeAssignments.data.length}
                            </Badge>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Assignment
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search assignments, courses, instructors..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' ? handleSearch() : undefined
                                    }
                                />
                            </div>
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    router.get('/admin/assignments');
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={safeAssignments.data}
                            title={`Assignments (${safeAssignments.meta?.total ?? safeAssignments.data.length})`}
                            emptyMessage="No assignments found"
                            paginationLinks={safeAssignments.links}
                            onPageChange={(url) => router.get(url)}
                            emptyAction={
                                <div className="text-center py-8">
                                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No assignments found
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Get started by creating your first assignment.
                                    </p>
                                    <Button onClick={handleCreate}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Assignment
                                    </Button>
                                </div>
                            }
                        />
                    </CardContent>
                </Card>

                {/* Assignment Modal */}
                <AssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    courses={courses}
                    assignment={selectedAssignment}
                    isAdmin={true}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={!!assignmentToDelete}
                    onClose={() => setAssignmentToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Assignment"
                    description={`Are you sure you want to delete "${assignmentToDelete?.title}"? This action cannot be undone and will remove all associated submissions.`}
                    confirmText="Delete Assignment"
                    isDestructive={true}
                />
            </div>
        </AppLayout>
    );
}
