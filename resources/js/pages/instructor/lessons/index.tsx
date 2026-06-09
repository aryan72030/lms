import { Head, Link, router } from '@inertiajs/react';

import {
    Edit,
    Trash2,
    Plus,
    Layout,
    GripVertical,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    Circle,
    Save,
    Globe,
    GlobeLock,
    Clock,
    ClipboardList,
    Play,
    HelpCircle,
    FileText,
    BrainCircuit,
    Award,
    Video,
    ChevronUp,
    ListChecks,
} from 'lucide-react';
import React, { useState } from 'react';
import { QuizModal } from '@/components/instructor/quiz-modal';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useNotification } from '@/contexts/notification-context';
import AppLayout from '@/layouts/app-layout';

interface Lesson {
    id: number;
    title: string;
    description: string;
    type: string;
    type_icon: string;
    type_color: string;
    order: number;
    is_published: boolean;
    estimated_duration: number;
    duration_display: string;
    created_at: string;
}

interface Section {
    id: number;
    title: string;
    order: number;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    status: string;
    status_label: string;
}

interface Quiz {
    id: number;
    title: string;
    total_marks: number;
    questions_count: number;
    is_published: boolean;
    created_at: string;
}

interface Props {
    course: Course;
    sections: Section[];
    unsectionedLessons: Lesson[];
    quizzes: Quiz[];
    lessonTypes: string[];
}

export default function InstructorCourseLessonsIndex({
    course,
    sections,
    unsectionedLessons,
    quizzes,
    lessonTypes,
}: Props) {
    const [loading, setLoading] = useState<number | null>(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [sectionTitle, setSectionTitle] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<number[]>([]);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(
        null,
    );
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const { showSuccess, showError } = useNotification();
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

    const handleAddQuiz = () => {
        setEditingQuiz(null);
        setIsQuizModalOpen(true);
    };

    const handleEditQuiz = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        setIsQuizModalOpen(true);
    };

    const toggleSection = (sectionId: number) => {
        setCollapsedSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId],
        );
    };

    const handleTogglePublish = (lesson: Lesson) => {
        setLoading(lesson.id);
        router.patch(
            `/instructor/lessons/${lesson.id}/toggle-publish`,
            {},
            {
                onSuccess: () => {
                    // The flash message will be handled by the useEffect above
                },
                onFinish: () => setLoading(null),
                preserveScroll: true,
            },
        );
    };

    const handleDelete = () => {
        if (!lessonToDelete) return;

        router.delete(
            `/instructor/courses/${course.id}/lessons/${lessonToDelete.id}`,
            {
                onStart: () => setLoading(lessonToDelete.id),
                onSuccess: () => {
                    setLessonToDelete(null);
                },
                onFinish: () => setLoading(null),
            },
        );
    };

    const handleSectionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSection) {
            router.put(
                `/instructor/courses/${course.id}/sections/${editingSection.id}`,
                { title: sectionTitle },
                {
                    onSuccess: () => {
                    setShowSectionModal(false);
                    setSectionTitle('');
                    setEditingSection(null);
                },
                },
            );
        } else {
            router.post(
                `/instructor/courses/${course.id}/sections`,
                { title: sectionTitle },
                {
                    onSuccess: () => {
                    setShowSectionModal(false);
                    setSectionTitle('');
                },
                },
            );
        }
    };

    const handleDeleteSection = () => {
        if (!sectionToDelete) return;

        router.delete(
            `/instructor/courses/${course.id}/sections/${sectionToDelete.id}`,
            {
                onSuccess: () => {
                    setSectionToDelete(null);
                },
            },
        );
    };

    const handleDeleteQuiz = () => {
        if (!quizToDelete) return;

        router.delete(`/instructor/quizzes/${quizToDelete.id}`, {
            onSuccess: () => {
                setQuizToDelete(null);
            },
            onError: (err: any) => {
                showError(err.response?.data?.message || 'Failed to delete quiz.');
            },
        });
    };

    const handleMoveLesson = (lesson: Lesson, direction: 'up' | 'down') => {
        setLoading(lesson.id);
        router.patch(
            `/instructor/courses/${course.id}/lessons/${lesson.id}/move-${direction}`,
            {},
            {
                onFinish: () => setLoading(null),
                preserveScroll: true,
            },
        );
    };

    const renderQuizRow = (quiz: Quiz) => (
        <div
            key={quiz.id}
            className="group mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                    <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">
                        {quiz.title}
                    </h4>
                    <p className="text-[10px] font-medium tracking-tight text-slate-500 uppercase">
                        {quiz.questions_count} Questions • {quiz.total_marks} Marks
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ActionButtonGroup>
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        onClick={() => handleEditQuiz(quiz)}
                        title="Edit Quiz Settings"
                    />
                    <ActionButton
                        variant="view"
                        icon={ListChecks}
                        href={`/instructor/quizzes/${quiz.id}`}
                        title="Edit Quiz Questions"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setQuizToDelete(quiz)}
                        title="Delete Quiz"
                    />
                </ActionButtonGroup>
            </div>
        </div>
    );

    const renderLessonRow = (lesson: Lesson) => (
        <div
            key={lesson.id}
            className="group mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        onClick={() => handleMoveLesson(lesson, 'up')}
                        disabled={loading === lesson.id}
                        className="text-slate-300 hover:text-indigo-600 disabled:opacity-50"
                    >
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => handleMoveLesson(lesson, 'down')}
                        disabled={loading === lesson.id}
                        className="text-slate-300 hover:text-indigo-600 disabled:opacity-50"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: lesson.type_color }}
                >
                    {lesson.type === 'Video' ? (
                        <Video className="h-4 w-4" />
                    ) : lesson.type === 'Assignment' ? (
                        <ClipboardList className="h-4 w-4" />
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">
                        {lesson.title}
                    </h4>
                    <p className="text-[10px] font-medium tracking-tight text-slate-500 uppercase">
                        {lesson.type} • {lesson.duration_display}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Quick Toggle Status */}
                <button
                    onClick={() => handleTogglePublish(lesson)}
                    disabled={loading === lesson.id}
                    className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-black uppercase transition-all ${
                        lesson.is_published
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    {loading === lesson.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    ) : lesson.is_published ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <Circle className="h-3 w-3" />
                    )}
                    {lesson.is_published ? 'Published' : 'Draft'}
                </button>

                <ActionButtonGroup>
                    <ActionButton
                        variant={lesson.is_published ? 'view' : 'toggle'}
                        icon={lesson.is_published ? Globe : GlobeLock}
                        onClick={() => handleTogglePublish(lesson)}
                        disabled={loading === lesson.id}
                        title={lesson.is_published ? 'Unpublish Lesson' : 'Publish Lesson'}
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                        title="Edit Lesson"
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => setLessonToDelete(lesson)}
                        disabled={loading === lesson.id}
                        title="Delete Lesson"
                    />
                </ActionButtonGroup>
            </div>
        </div>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'My Courses', href: '/instructor/courses' },
                {
                    title: course.title,
                    href: `/instructor/courses/${course.id}/lessons`,
                },
            ]}
        >
            <Head title={`Curriculum - ${course.title}`} />

            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="page-title font-black text-slate-900">
                            Course Management
                        </h1>
                        <p className="mt-1 font-medium text-slate-500">
                            Manage learning material and tests for{' '}
                            <span className="font-bold text-indigo-600">
                                "{course.title}"
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingSection(null);
                                setSectionTitle('');
                                setShowSectionModal(true);
                            }}
                            className="h-10 rounded-xl border-slate-200 px-5 text-[10px] font-bold uppercase"
                        >
                            <Layout className="mr-2 h-4 w-4" />
                            New Section
                        </Button>
                        <Button
                            variant="create"
                            asChild
                            className="h-10 rounded-xl px-5 text-[10px] font-bold uppercase"
                        >
                            <Link
                                href={`/instructor/courses/${course.id}/lessons/create`}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Lecture
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Course Overview Card */}
                <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-md">
                    <CardContent className="p-6">
                        <div className="flex flex-wrap items-center gap-8">
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    Status
                                </p>
                                <span
                                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                                        course.status === 'Published'
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                            : 'border-amber-100 bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    {course.status_label}
                                </span>
                            </div>
                            <div className="hidden h-8 w-px bg-slate-100 md:block" />
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    Course Curriculum
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                    {sections.length} Sections • {sections.reduce((acc, s) => acc + s.lessons.length, 0) + unsectionedLessons.length} Lectures
                                </p>
                            </div>
                            <div className="hidden h-8 w-px bg-slate-100 md:block" />
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    Assessments
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                    {quizzes.length} Tests / Quizzes
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <Tabs defaultValue="curriculum" className="space-y-6">
                    <TabsList className="h-12 w-full max-w-md gap-2 rounded-2xl bg-slate-100 p-1.5 shadow-inner">
                        <TabsTrigger 
                            value="curriculum" 
                            className="h-9 flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                        >
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            Learning Material
                        </TabsTrigger>
                        <TabsTrigger 
                            value="assessments"
                            className="h-9 flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm"
                        >
                            <BrainCircuit className="mr-2 h-3.5 w-3.5" />
                            Tests & Quizzes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="curriculum" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Unsectioned Lessons (Warning) */}
                        {unsectionedLessons.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase">
                                        Unsectioned Lectures
                                    </h3>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                                        {unsectionedLessons.length}
                                    </span>
                                </div>
                                <div className="ml-2 border-l-2 border-amber-100 pl-4">
                                    {unsectionedLessons.map(renderLessonRow)}
                                </div>
                            </div>
                        )}

                    {/* Sections */}
                    {sections.length > 0 ? (
                        <div className="space-y-6">
                            {sections.map((section) => (
                                <div key={section.id} className="space-y-3">
                                    {/* Section Header */}
                                    <div className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    toggleSection(section.id)
                                                }
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
                                            >
                                                {collapsedSections.includes(
                                                    section.id,
                                                ) ? (
                                                    <ChevronRight className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                            <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                                                {section.title}
                                            </h3>
                                            <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                                                {section.lessons.length} Lectures
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase text-indigo-600 hover:bg-indigo-50"
                                                asChild
                                            >
                                                <Link href={`/instructor/courses/${course.id}/lessons/create?section_id=${section.id}`}>
                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                    Add Lecture
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-lg p-0"
                                                onClick={() => {
                                                    setEditingSection(section);
                                                    setSectionTitle(
                                                        section.title,
                                                    );
                                                    setShowSectionModal(true);
                                                }}
                                            >
                                                <Edit className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-lg p-0 hover:bg-rose-50 hover:text-rose-600"
                                                onClick={() =>
                                                    setSectionToDelete(section)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Lessons in Section */}
                                    {!collapsedSections.includes(
                                        section.id,
                                    ) && (
                                        <div className="ml-6 space-y-2 border-l-2 border-slate-100 pl-6">
                                            {section.lessons.length > 0 ? (
                                                section.lessons.map(
                                                    renderLessonRow,
                                                )
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                                                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                        No lectures in this
                                                        section
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-2 h-8 rounded-lg px-3 text-[10px] font-bold uppercase text-indigo-600 hover:bg-indigo-50"
                                                        asChild
                                                    >
                                                        <Link href={`/instructor/courses/${course.id}/lessons/create?section_id=${section.id}`}>
                                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                            Add Lecture
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        unsectionedLessons.length === 0 && (
                            <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                                    <Layout className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">
                                    Empty Curriculum
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Start by creating your first section or
                                    adding a lecture.
                                </p>
                                <Button
                                    variant="create"
                                    className="mt-6 h-11 rounded-2xl px-8 text-xs font-black uppercase"
                                    onClick={() => setShowSectionModal(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Section
                                </Button>
                            </div>
                        )
                    )}
                    </TabsContent>

                    <TabsContent value="assessments" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase">
                                    Course Assessments
                                </h3>
                                <p className="text-[10px] font-medium text-slate-500 uppercase mt-0.5">Manage quizzes and exams for this course</p>
                            </div>
                            <Button
                                variant="create"
                                size="sm"
                                className="h-9 rounded-xl px-4 text-[10px] font-bold uppercase"
                                onClick={() => handleAddQuiz()}
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Create Test
                            </Button>
                        </div>

                        {quizzes.length > 0 ? (
                            <div className="space-y-2">
                                {quizzes.map(renderQuizRow)}
                            </div>
                        ) : (
                            <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-amber-300 shadow-sm">
                                    <BrainCircuit className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">
                                    No Assessments
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    You haven't created any tests for this course yet.
                                </p>
                                <Button
                                    variant="create"
                                    className="mt-6 h-11 rounded-2xl px-8 text-xs font-black uppercase bg-amber-500 hover:bg-amber-600"
                                    onClick={() => handleAddQuiz()}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Test
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={showSectionModal} onOpenChange={(open) => !open && setShowSectionModal(false)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSection ? 'Update Section' : 'New Section'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSection ? 'Update the section title.' : 'Create a new section to organize your lessons.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSectionSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="section_title"
                                    className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                                >
                                    Section Title
                                </Label>
                                <Input
                                    id="section_title"
                                    value={sectionTitle}
                                    onChange={(e) => setSectionTitle(e.target.value)}
                                    placeholder="e.g. Introduction to Laravel"
                                    className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-800 transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                                    required
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowSectionModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="create">
                                    <Save className="mr-2 h-4 w-4" />
                                    {editingSection ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <QuizModal
                isOpen={isQuizModalOpen}
                onClose={() => {
                    setIsQuizModalOpen(false);
                    setEditingQuiz(null);
                }}
                quiz={editingQuiz as any}
                courses={[{ id: course.id, title: course.title } as any]}
            />
            </div>

            <ConfirmationModal
                isOpen={!!lessonToDelete}
                onClose={() => setLessonToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Lesson"
                description={`Are you sure you want to delete "${lessonToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
                isLoading={loading === lessonToDelete?.id}
            />

            <ConfirmationModal
                isOpen={!!sectionToDelete}
                onClose={() => setSectionToDelete(null)}
                onConfirm={handleDeleteSection}
                title="Delete Section"
                description={`Are you sure you want to delete section "${sectionToDelete?.title}"? Lessons inside will become unsectioned.`}
                confirmText="Delete"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={!!quizToDelete}
                onClose={() => setQuizToDelete(null)}
                onConfirm={handleDeleteQuiz}
                title="Delete Quiz"
                description={`Are you sure you want to delete "${quizToDelete?.title}"? This will remove all questions and student attempts.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </AppLayout>
    );
}
