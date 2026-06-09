import { Head, Link, router } from '@inertiajs/react';
import { Assignment } from '@/types';
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    BookOpen,
    ClipboardList,
    Users,
    Award,
    CheckCircle,
    Clock,
    ListChecks,
} from 'lucide-react';
import React, { useState } from 'react';
import { AssignmentModal } from '@/components/instructor/assignment-modal';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Props {
    assignments: {
        data: Assignment[];
        links: any[];
        meta: any;
    };
    courses: Array<{
        id: number;
        title: string;
    }>;
    filters: {
        search?: string;
        course_id?: string;
    };
}

export default function InstructorAllAssignments({
    assignments,
    courses,
    filters,
}: Props) {
    const total = assignments.meta?.total ?? assignments.total ?? assignments.data.length ?? 0;
    const getStatusBadge = (assignment: Assignment) => {
        if (assignment.is_published) {
            return <Badge className="bg-green-100 text-green-800">Published</Badge>;
        }
        return <Badge variant="outline">Draft</Badge>;
    };

    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const assignmentMessages = useActionMessages('Assignment');

    const handleSearch = () => {
        router.get(
            '/instructor/assignments',
            {
                search: search || undefined,
                course_id: courseFilter || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleCreate = () => {
        setSelectedAssignment(null);
        setIsAssignmentModalOpen(true);
    };

    const handleEdit = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setIsAssignmentModalOpen(true);
    };

    const handleDelete = async () => {
        if (!assignmentToDelete) return;

        router.delete(`/instructor/assignments/${assignmentToDelete.id}`, {
            onSuccess: () => {
                setAssignmentToDelete(null);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
                assignmentMessages.error('delete', `Cannot delete assignment "${assignmentToDelete.title}". It may have submissions.`);
                setAssignmentToDelete(null);
            },
        });
    };

    const columns = [
        {
            key: 'title',
            label: 'Assignment',
            render: (value: string, assignment: Assignment) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {assignment.title}
                    </div>
                    <div className="text-sm text-gray-500">
                        {assignment.course.title}
                    </div>
                    {assignment.course.instructor_name && (
                        <div className="text-xs text-gray-400">
                            👨‍🏫 {assignment.course.instructor_name}
                        </div>
                    )}
                    <div className="mt-1 flex gap-1">{getStatusBadge(assignment)}</div>
                </div>
            ),
        },
        {
            key: 'details',
            label: 'Assignment Info',
            render: (value: any, assignment: Assignment) => (
                <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Award className="h-3 w-3" />
                        <span className="font-medium">{assignment.max_score} marks total</span>
                        <span className="text-gray-500">• {assignment.passing_score}% to pass</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-3 w-3" />
                        <span>{assignment.submissions_count} students enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">{assignment.submitted_count} submitted</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-600 font-medium">{assignment.graded_count} graded</span>
                        </div>
                        {(assignment.submissions_count - assignment.submitted_count) > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-orange-600" />
                                <span className="text-orange-600 font-medium">{assignment.submissions_count - assignment.submitted_count} pending</span>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status & Timeline',
            render: (value: any, assignment: Assignment) => (
                <div className="space-y-2">
                    <div>{getStatusBadge(assignment)}</div>
                    <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" />
                            <span>Duration: {assignment.due_days} days</span>
                        </div>
                        {assignment.is_published && (
                            <div className="text-green-600 font-medium">
                                ✅ Students can work on this
                            </div>
                        )}
                        {!assignment.is_published && (
                            <div className="text-yellow-600 font-medium">
                                ⏳ Draft - Students can't see yet
                            </div>
                        )}
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
                        href={`/instructor/assignments/${assignment.id}`}
                        title={`Grade Submissions (${assignment.submitted_count} waiting)`}
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        onClick={() => handleEdit(assignment)}
                        title="Edit Assignment Details"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setAssignmentToDelete(assignment)}
                        title="Delete Assignment"
                        disabled={assignment.submitted_count > 0}
                    />
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Assignments', href: '/instructor/assignments' },
            ]}
        >
            <Head title="All Assignments" />

            <div className="space-y-6">
                {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="page-title text-gray-900">
                                Assignment Management
                            </h1>
                            <p className="text-gray-600">
                                Create and manage your assignments • See how students interact with them
                            </p>
                        </div>
                        <Button onClick={handleCreate} variant="create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create New Assignment
                        </Button>
                    </div>

                {/* Search and Filters */}
                <div className="rounded-lg bg-white p-4 shadow">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                        />
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        <Button
                            onClick={handleSearch}
                            className="flex items-center gap-2"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setCourseFilter('');
                                router.get('/instructor/assignments');
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Assignments Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={assignments.data}
                            title={`Assignments (${total})`}
                            emptyMessage="No assignments found"
                            paginationLinks={assignments.links}
                            onPageChange={(url) => router.get(url)}
                            emptyAction={
                                <Button onClick={handleCreate} variant="create">
                                    Create Your First Assignment
                                </Button>
                            }
                        />
                    </CardContent>
                </Card>

                <AssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    courses={courses}
                    assignment={selectedAssignment}
                />

                <ConfirmationModal
                    isOpen={!!assignmentToDelete}
                    onClose={() => setAssignmentToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Assignment"
                    description={`Are you sure you want to delete \"${assignmentToDelete?.title}\"? This action cannot be undone.`}
                    confirmText="Delete"
                    isDestructive={true}
                />
            </div>
        </AppLayout>
    );
}
