import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, Trash2, Clock, Target, Users } from 'lucide-react';
import React, { useState } from 'react';
import { QuizCreateModal } from '@/components/instructor/quiz-create-modal';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { DataTable } from '@/components/ui/data-table';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Quiz {
    id: number;
    title: string;
    description: string;
    course: {
        id: number;
        title: string;
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

interface Props {
    quizzes: {
        data: Quiz[];
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

export default function InstructorQuizzesIndex({ quizzes, courses, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const quizMessages = useActionMessages('Quiz');

    const handleSearch = () => {
        router.get('/instructor/quizzes', {
            search: search || undefined,
            course_id: courseFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = async () => {
        if (!quizToDelete) return;

        try {
            await router.delete(`/instructor/quizzes/${quizToDelete.id}`);
            quizMessages.success('delete');
        } catch (error) {
            quizMessages.error('delete');
        } finally {
            setQuizToDelete(null);
        }
    };

    const getQuizBadges = (quiz: Quiz) => {
        const badges = [];
        
        if (quiz.is_final_quiz) {
            badges.push(
                <Badge key="final" variant="default" className="bg-purple-100 text-purple-800">
                    Final Quiz
                </Badge>
            );
        }
        
        if (!quiz.is_active) {
            badges.push(
                <Badge key="inactive" variant="secondary">
                    Inactive
                </Badge>
            );
        }
        
        return badges;
    };

    const columns = [
        {
            key: 'title',
            label: 'Quiz',
            render: (value: string, quiz: Quiz) => (
                <div>
                    <div className="font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-sm text-gray-500">{quiz.course.title}</div>
                    <div className="flex gap-1 mt-1">
                        {getQuizBadges(quiz)}
                    </div>
                </div>
            )
        },
        {
            key: 'details',
            label: 'Details',
            render: (value: any, quiz: Quiz) => (
                <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                        <Target className="h-3 w-3" />
                        {quiz.total_marks} marks • {quiz.passing_score}% to pass
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" />
                        {quiz.questions_count} questions • {quiz.attempts_count} attempts
                    </div>
                    {quiz.time_limit && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quiz.time_limit} minutes
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, quiz: Quiz) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        href={`/instructor/quizzes/${quiz.id}`}
                        title="View Quiz"
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        href={`/instructor/quizzes/${quiz.id}/edit`}
                        title="Edit Quiz"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setQuizToDelete(quiz)}
                        title="Delete Quiz"
                    />
                </ActionButtonGroup>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'My Quizzes', href: '/instructor/quizzes' }
        ]}>
            <Head title="My Quizzes" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
                        <p className="text-gray-600">Create and manage quizzes for your courses</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quiz
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search quizzes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleSearch} className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>

                {/* Quizzes Table */}
                <DataTable
                    columns={columns}
                    data={quizzes.data}
                    title={`Quizzes (${quizzes.meta?.total || 0})`}
                    emptyMessage="No quizzes found"
                    paginationLinks={quizzes.links}
                    onPageChange={(url) => router.get(url)}
                    emptyAction={
                        <Button onClick={() => setIsCreateModalOpen(true)} variant="create">
                            Create Your First Quiz
                        </Button>
                    }
                />

                <QuizCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    courses={courses}
                />

                <ConfirmationModal
                    isOpen={!!quizToDelete}
                    onClose={() => setQuizToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Quiz"
                    description={`Are you sure you want to delete "${quizToDelete?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    isDestructive={true}
                />

            </div>
        </AppLayout>
    );
}
