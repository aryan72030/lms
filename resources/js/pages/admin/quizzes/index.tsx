import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit, Trash2, Plus, Search, Filter, X, Save, BarChart3, Clock, HelpCircle, CheckCircle, XCircle, ChevronRight, Eye, Award } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    quizzes: {
        data: Quiz[];
        total: number;
        links?: any[];
    };
    courses: Course[];
    filters: {
        search?: string;
        course_id?: string;
        status?: string;
    };
}

export default function AdminQuizzesIndex({ quizzes, courses, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [loading, setLoading] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const quizMessages = useActionMessages('Quiz');

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        title: '',
        description: '',
        course_id: '',
        time_limit: '',
        passing_score: 70,
        max_attempts: 3,
        is_final_quiz: false,
        is_active: true,
    });

    const handleSearch = () => {
        router.get('/admin/quizzes', {
            search: search || undefined,
            course_id: courseFilter === 'all' ? undefined : courseFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCourseFilter('all');
        setStatusFilter('all');
        router.get('/admin/quizzes');
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingQuiz(null);
        setShowModal(true);
    };

    const openEditModal = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        clearErrors();
        setData({
            title: quiz.title,
            description: quiz.description || '',
            course_id: (quiz.course_id || quiz.course?.id)?.toString() || '',
            time_limit: quiz.time_limit?.toString() || '',
            passing_score: quiz.passing_score,
            max_attempts: quiz.max_attempts,
            is_final_quiz: quiz.is_final_quiz,
            is_active: quiz.is_active,
        });
        setShowModal(true);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        const shouldCreate = params.get('create');

        if (editId) {
            const quizToEdit = quizzes.data.find(q => q.id.toString() === editId);
            if (quizToEdit) {
                openEditModal(quizToEdit);
                // Clear the parameter to avoid re-opening
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        } else if (shouldCreate === 'true') {
            openCreateModal();
            // Clear the parameter to avoid re-opening
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [quizzes.data]);

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingQuiz) {
            patch(`/admin/quizzes/${editingQuiz.id}`, {
                onSuccess: () => {
                    closeModal();
                    quizMessages.success('update');
                },
                onError: () => {
                    quizMessages.error('update');
                }
            });
        } else {
            post('/admin/quizzes', {
                onSuccess: () => {
                    closeModal();
                    quizMessages.success('create');
                },
                onError: () => {
                    quizMessages.error('create');
                }
            });
        }
    };

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
        router.patch(`/admin/quizzes/${quiz.id}/toggle-status`, {}, {
            onSuccess: () => {
                quizMessages.success('toggle');
            },
            onError: () => {
                quizMessages.error('toggle');
            }
        });
    };

    const columns = [
        {
            key: 'title',
            label: 'Quiz',
            render: (value: string, quiz: Quiz) => (
                <div className="max-w-[300px]">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{quiz.title}</span>
                        {quiz.is_final_quiz && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] h-5">
                                Final
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {quiz.questions_count} Questions • {quiz.time_limit ? `${quiz.time_limit} mins` : 'No time limit'}
                    </div>
                </div>
            )
        },
        {
            key: 'course',
            label: 'Course',
            render: (value: any, quiz: Quiz) => (
                <div>
                    <div className="text-sm text-gray-900 truncate max-w-[200px]">{quiz.course.title}</div>
                    <div className="text-xs text-gray-500">{quiz.course.instructor.name}</div>
                </div>
            )
        },
        {
            key: 'stats',
            label: 'Passing / Marks',
            render: (value: any, quiz: Quiz) => (
                <div className="text-sm text-gray-600">
                    {quiz.passing_score}% / {quiz.total_marks} pts
                </div>
            )
        },
        {
            key: 'attempts',
            label: 'Attempts',
            render: (value: any, quiz: Quiz) => (
                <div className="text-sm text-gray-600">
                    {quiz.attempts_count} Taken
                </div>
            )
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (value: boolean, quiz: Quiz) => (
                <button 
                    onClick={() => handleToggleStatus(quiz)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                        value 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </button>
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
                        href={`/admin/quizzes/${quiz.id}`}
                        title="View Details"
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
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Quiz Management', href: '/admin/quizzes' }
        ]}>
            <Head title="Quiz Management" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
                        <p className="text-muted-foreground">Monitor and manage all course quizzes</p>
                    </div>
                    <Button variant="create" onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quiz
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search quiz or course..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="inactive">Inactive Only</SelectItem>
                                    <SelectItem value="final">Final Quizzes</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    Apply
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Reset
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
                            data={quizzes.data} 
                            paginationLinks={quizzes.links}
                            onPageChange={(url) => router.get(url, filters, { preserveState: true, replace: true })}
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

            {/* Create/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
                            <DialogDescription>
                                {editingQuiz ? 'Update the quiz details below.' : 'Fill in the details to create a new quiz.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Quiz Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Final Assessment"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="course_id">Course *</Label>
                                <Select 
                                    value={data.course_id} 
                                    onValueChange={(value) => setData('course_id', value)}
                                    disabled={!!editingQuiz}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((course) => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.title} ({course.instructor_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && <p className="text-sm text-red-600">{errors.course_id}</p>}
                                {editingQuiz && <p className="text-[10px] text-muted-foreground uppercase">Course cannot be changed for existing quizzes</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="What is this quiz about?"
                                    rows={3}
                                />
                                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="time_limit">Time Limit (Mins)</Label>
                                    <Input
                                        id="time_limit"
                                        type="number"
                                        value={data.time_limit}
                                        onChange={(e) => setData('time_limit', e.target.value)}
                                        placeholder="No limit"
                                    />
                                    {errors.time_limit && <p className="text-sm text-red-600">{errors.time_limit}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="passing_score">Passing Score % *</Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        value={data.passing_score}
                                        onChange={(e) => setData('passing_score', parseInt(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.passing_score && <p className="text-sm text-red-600">{errors.passing_score}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max_attempts">Max Attempts *</Label>
                                    <Input
                                        id="max_attempts"
                                        type="number"
                                        value={data.max_attempts}
                                        onChange={(e) => setData('max_attempts', parseInt(e.target.value) || 0)}
                                        required
                                    />
                                    {errors.max_attempts && <p className="text-sm text-red-600">{errors.max_attempts}</p>}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Final Quiz</Label>
                                        <p className="text-[11px] text-muted-foreground">Is this the final assessment?</p>
                                    </div>
                                    <Switch
                                        checked={data.is_final_quiz}
                                        onCheckedChange={(checked) => setData('is_final_quiz', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Active Status</Label>
                                        <p className="text-[11px] text-muted-foreground">Make quiz available to students</p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeModal} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : (editingQuiz ? 'Update Quiz' : 'Create Quiz')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

