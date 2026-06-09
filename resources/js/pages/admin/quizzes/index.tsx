import { Head, router } from '@inertiajs/react';
import { Edit, Trash2, Plus, Search, Filter, ListChecks } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AdminQuizModal } from '@/components/admin/quiz-modal';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Quiz {
    id: number;
    title: string;
    description: string | null;
    course_id: number;
    course: {
        id: number;
        title: string;
        instructor: {
            id: number;
            name: string;
        };
    };
    time_limit: number | null;
    total_marks: number;
    passing_score: number;
    max_attempts: number;
    is_final_quiz: boolean;
    is_active: boolean;
    questions_count: number;
    attempts_count: number;
    created_at: string;
}

interface Course {
    id: number;
    title: string;
    instructor_name: string;
}

interface Props {
    quizzes?: {
        data: Quiz[];
        total?: number;
        meta?: any;
        links?: any[];
    };
    quizzes_total?: number;
    courses?: Course[];
    filters?: {
        search?: string;
        course_id?: string;
        status?: string;
    };
}

export default function AdminQuizzesIndex({
    quizzes,
    quizzes_total,
    courses = [],
    filters = {},
}: Props) {
    const safeQuizzes = {
        data: quizzes?.data || [],
        total: quizzes?.meta?.total ?? quizzes?.total ?? quizzes_total ?? 0,
        links: quizzes?.links || [],
    };

    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(
        filters.course_id || 'all',
    );
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [loading, setLoading] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const quizMessages = useActionMessages('Quiz');

    const handleSearch = () => {
        router.get(
            '/admin/quizzes',
            {
                search: search || undefined,
                course_id: courseFilter === 'all' ? undefined : courseFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setCourseFilter('all');
        setStatusFilter('all');
        router.get('/admin/quizzes');
    };

    const openCreateModal = () => {
        setSelectedQuiz(null);
        setShowModal(true);
    };

    const openEditModal = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setShowModal(true);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        const shouldCreate = params.get('create');

        if (editId) {
            const quizToEdit = quizzes?.data?.find(
                (q) => q.id.toString() === editId,
            );
            if (quizToEdit) {
                setSelectedQuiz(quizToEdit);
                setShowModal(true);
                window.history.replaceState({}, '', window.location.pathname);
            }
        } else if (shouldCreate === 'true') {
            setSelectedQuiz(null);
            setShowModal(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleDelete = () => {
        if (!quizToDelete) return;

        setLoading(quizToDelete.id);
        router.delete(`/admin/quizzes/${quizToDelete.id}`, {
            onSuccess: () => {
                quizMessages.success('delete');
                setQuizToDelete(null);
            },
            onError: (err: any) => {
                quizMessages.error('delete', undefined, err.message);
            },
            onFinish: () => {
                setLoading(null);
            },
        });
    };

    const handleToggleStatus = (quiz: Quiz) => {
        router.patch(
            `/admin/quizzes/${quiz.id}/toggle-status`,
            {},
            {
                onSuccess: () => {
                    quizMessages.success('toggle');
                },
                onError: () => {
                    quizMessages.error('toggle');
                },
            },
        );
    };

    const columns = [
        {
            key: 'title',
            label: 'Quiz',
            render: (value: string, quiz: Quiz) => (
                <div className="max-w-[300px]">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                            {quiz.title}
                        </span>
                        {quiz.is_final_quiz && (
                            <Badge
                                variant="outline"
                                className="h-5 border-indigo-100 bg-indigo-50 text-[10px] text-indigo-700"
                            >
                                Final
                            </Badge>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {quiz.questions_count} Questions •{' '}
                        {quiz.time_limit
                            ? `${quiz.time_limit} mins`
                            : 'No time limit'}
                    </div>
                </div>
            ),
        },
        {
            key: 'course',
            label: 'Course',
            render: (value: any, quiz: Quiz) => (
                <div>
                    <div className="max-w-[200px] truncate text-sm text-gray-900">
                        {quiz.course.title}
                    </div>
                    <div className="text-xs text-gray-500">
                        {quiz.course.instructor.name}
                    </div>
                </div>
            ),
        },
        {
            key: 'stats',
            label: 'Passing / Marks',
            render: (value: any, quiz: Quiz) => (
                <div className="text-sm text-gray-600">
                    {quiz.passing_score}% / {quiz.total_marks} pts
                </div>
            ),
        },
        {
            key: 'attempts',
            label: 'Attempts',
            render: (value: any, quiz: Quiz) => (
                <div className="text-sm text-gray-600">
                    {quiz.attempts_count} Taken
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (value: boolean, quiz: Quiz) => (
                <button
                    onClick={() => handleToggleStatus(quiz)}
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                        value
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </button>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, quiz: Quiz) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={ListChecks}
                        href={`/admin/quizzes/${quiz.id}`}
                        title="Manage Quiz"
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        onClick={() => openEditModal(quiz)}
                        title="Edit Quiz"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setQuizToDelete(quiz)}
                        disabled={loading === quiz.id}
                        title="Delete Quiz"
                    />
                </ActionButtonGroup>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Quiz Management', href: '/admin/quizzes' },
            ]}
        >
            <Head title="Quiz Management" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-title">
                            Quiz Management
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor and manage all course quizzes
                        </p>
                    </div>
                    <Button variant="create" onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search quiz or course..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) =>
                                        e.key === 'Enter' && handleSearch()
                                    }
                                />
                            </div>

                            <Select
                                value={courseFilter}
                                onValueChange={setCourseFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Courses
                                    </SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id.toString()}
                                        >
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Active Only
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive Only
                                    </SelectItem>
                                    <SelectItem value="final">
                                        Final Quizzes
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSearch}
                                    className="flex-1"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={safeQuizzes.data}
                            title={`Quizzes (${safeQuizzes.total})`}
                            emptyMessage="No quizzes found"
                            paginationLinks={safeQuizzes.links}
                            onPageChange={(url) =>
                                router.get(url, filters, {
                                    preserveState: true,
                                    replace: true,
                                })
                            }
                        />
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                isOpen={!!quizToDelete}
                onClose={() => setQuizToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Quiz"
                description={`Are you sure you want to delete "${quizToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
                isLoading={loading === quizToDelete?.id}
            />

            <AdminQuizModal
                key={selectedQuiz?.id ?? 'create'}
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedQuiz(null);
                }}
                courses={courses}
                quiz={selectedQuiz}
            />
        </AppLayout>
    );
}
