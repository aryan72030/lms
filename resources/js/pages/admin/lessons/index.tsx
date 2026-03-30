import { Head, Link, router } from '@inertiajs/react';
import { Edit, Trash2, Plus, Layout, GripVertical, ChevronRight, ChevronDown, CheckCircle2, Circle, MoreVertical, X, Save } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionMessages } from '@/hooks/use-action-messages';
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
    instructor: {
        name: string;
        email: string;
    };
}

interface Props {
    course: Course;
    sections: Section[];
    unsectionedLessons: Lesson[];
}

export default function AdminCourseLessonsIndex({ course, sections, unsectionedLessons }: Props) {
    const [loading, setLoading] = useState<number | null>(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [sectionTitle, setSectionTitle] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<number[]>([]);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
    const lessonMessages = useActionMessages('Lesson');

    const toggleSection = (sectionId: number) => {
        setCollapsedSections(prev => 
            prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
        );
    };

    const handleToggleStatus = (lesson: Lesson) => {
        setLoading(lesson.id);
        router.patch(`/admin/courses/${course.id}/lessons/${lesson.id}/toggle-status`, {}, {
            onSuccess: () => lessonMessages.success('update'),
            onFinish: () => setLoading(null),
        });
    };

    const handleDelete = () => {
        if (!lessonToDelete) return;

        router.delete(`/admin/courses/${course.id}/lessons/${lessonToDelete.id}`, {
            onStart: () => setLoading(lessonToDelete.id),
            onSuccess: () => {
                lessonMessages.success('delete');
                setLessonToDelete(null);
            },
            onFinish: () => setLoading(null),
        });
    };

    const handleSectionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSection) {
            router.put(`/admin/courses/${course.id}/sections/${editingSection.id}`, { title: sectionTitle }, {
                onSuccess: () => {
                    setShowSectionModal(false);
                    setSectionTitle('');
                    setEditingSection(null);
                    lessonMessages.success('update');
                }
            });
        } else {
            router.post(`/admin/courses/${course.id}/sections`, { title: sectionTitle }, {
                onSuccess: () => {
                    setShowSectionModal(false);
                    setSectionTitle('');
                    lessonMessages.success('create');
                }
            });
        }
    };

    const handleDeleteSection = () => {
        if (!sectionToDelete) return;

        router.delete(`/admin/courses/${course.id}/sections/${sectionToDelete.id}`, {
            onSuccess: () => {
                lessonMessages.success('delete');
                setSectionToDelete(null);
            }
        });
    };

    const renderLessonRow = (lesson: Lesson) => (
        <div key={lesson.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all mb-2">
            <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-move group-hover:text-slate-400" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: lesson.type_color }}>
                    {lesson.type_icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">{lesson.title}</h4>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                        {lesson.type} • {lesson.duration_display}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Quick Toggle Status */}
                <button 
                    onClick={() => handleToggleStatus(lesson)}
                    disabled={loading === lesson.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                        lesson.is_published 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    {loading === lesson.id ? (
                        <div className="h-3 w-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : lesson.is_published ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <Circle className="h-3 w-3" />
                    )}
                    {lesson.is_published ? 'Published' : 'Draft'}
                </button>

                <ActionButtonGroup>
                    <ActionButton
                        variant="edit"
                        icon={Edit}
                        href={`/admin/courses/${course.id}/lessons/${lesson.id}/edit`}
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
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Management', href: '/admin/courses' },
            { title: course.title, href: `/admin/courses/${course.id}/lessons` }
        ]}>
            <Head title={`Lessons - ${course.title}`} />
            
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Curriculum Management</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Organizing lessons for <span className="text-indigo-600 font-bold">"{course.title}"</span>
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
                            className="h-10 px-5 rounded-xl font-bold uppercase text-[10px] border-slate-200"
                        >
                            <Layout className="h-4 w-4 mr-2" />
                            New Section
                        </Button>
                        <Button variant="create" asChild className="h-10 px-5 rounded-xl font-bold uppercase text-[10px]">
                            <Link href={`/admin/courses/${course.id}/lessons/create`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lesson
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Course Overview Card */}
                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-wrap items-center gap-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor</p>
                                <p className="text-sm font-bold text-slate-800">{course.instructor.name}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border mt-1 ${
                                    course.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                    {course.status}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-slate-100 hidden md:block" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Curriculum</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {sections.length} Sections • {sections.reduce((acc, s) => acc + s.lessons.length, 0) + unsectionedLessons.length} Lessons
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Curriculum Builder */}
                <div className="space-y-6">
                    {/* Unsectioned Lessons (Warning) */}
                    {unsectionedLessons.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Unsectioned Lessons</h3>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                    {unsectionedLessons.length}
                                </span>
                            </div>
                            <div className="pl-4 border-l-2 border-amber-100 ml-2">
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
                                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => toggleSection(section.id)}
                                                className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                            >
                                                {collapsedSections.includes(section.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{section.title}</h3>
                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 uppercase">
                                                {section.lessons.length} Lessons
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 rounded-lg"
                                                onClick={() => {
                                                    setEditingSection(section);
                                                    setSectionTitle(section.title);
                                                    setShowSectionModal(true);
                                                }}
                                            >
                                                <Edit className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                                                onClick={() => setSectionToDelete(section)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Lessons in Section */}
                                    {!collapsedSections.includes(section.id) && (
                                        <div className="pl-6 border-l-2 border-slate-100 ml-6 space-y-2">
                                            {section.lessons.length > 0 ? (
                                                section.lessons.map(renderLessonRow)
                                            ) : (
                                                <div className="p-4 text-center border border-dashed border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No lessons in this section</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : unsectionedLessons.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="h-16 w-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Layout className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Empty Curriculum</h3>
                            <p className="text-slate-500 text-sm mt-1">Start by creating your first section or adding a lesson.</p>
                            <Button 
                                variant="create" 
                                className="mt-6 h-11 px-8 rounded-2xl font-black uppercase text-xs"
                                onClick={() => setShowSectionModal(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Section
                            </Button>
                        </div>
                    )}
                </div>

                {/* Section Modal */}
                {showSectionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingSection ? 'Update Section' : 'New Section'}
                                    </h2>
                                    <button 
                                        onClick={() => setShowSectionModal(false)}
                                        className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSectionSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="section_title" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Title</Label>
                                        <Input
                                            id="section_title"
                                            value={sectionTitle}
                                            onChange={(e) => setSectionTitle(e.target.value)}
                                            placeholder="e.g. Introduction to Laravel"
                                            className="h-14 rounded-2xl bg-slate-50 border-none text-slate-800 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="flex-1 h-14 rounded-2xl font-black uppercase text-xs border-slate-200"
                                            onClick={() => setShowSectionModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            variant="create" 
                                            className="flex-1 h-14 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {editingSection ? 'Update' : 'Create'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
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
        </AppLayout>
    );
}