import { Link, useForm } from '@inertiajs/react';
import {
    Plus, Trash2, ChevronDown, ChevronUp,
    CheckCircle2, Circle, Video, FileText,
    HelpCircle, Layout, Save, ArrowLeft,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Course { id: number; title: string; status: string; }
interface Lesson {
    id?: number; title: string; description: string; type: string;
    course_id?: number; section_id?: number | string; estimated_duration: string; is_published: boolean;
    text_content: string; video_url: string; video_duration: string;
    assignment_data?: any;
}
interface Section { id: number; title: string; }
interface Quiz { id: number; title: string; }
interface LessonFormProps {
    course?: Course; courses?: Course[]; lesson?: Lesson;
    lessonTypes: string[]; sections?: Section[];
    quizzes?: Quiz[];
    onSubmit: (data: any) => void; processing: boolean;
    errors: any; cancelUrl?: string;
}

export default function LessonForm(props: LessonFormProps) {
    const { course, courses, lesson, lessonTypes, sections, onSubmit, processing, errors, cancelUrl } = props;

    const { data, setData } = useForm<any>({
        title: lesson?.title || '',
        description: lesson?.description || '',
        type: lesson?.type || lessonTypes[0] || 'Text',
        course_id: lesson?.course_id || course?.id || courses?.[0]?.id,
        section_id: lesson?.section_id || new URLSearchParams(window.location.search).get('section_id') || '',
        estimated_duration: lesson?.estimated_duration || '10',
        is_published: lesson?.is_published || false,
        text_content: lesson?.text_content || '',
        video_url: lesson?.video_url || '',
        video_duration: lesson?.video_duration || '',
        assignment_instructions: lesson?.assignment_data?.instructions || '',
        assignment_max_score: lesson?.assignment_data?.max_score || '100',
        assignment_due_days: lesson?.assignment_data?.due_days || '7',
    });

    const [openQuestions, setOpenQuestions] = useState<number[]>([0]);
    const [pendingType, setPendingType] = useState<string | null>(null);
    const { showError, showInfo } = useNotification();

    const cancelHref = cancelUrl || (course ? `/instructor/courses/${course.id}/lessons` : '/instructor/lessons');

    // Fix 1 — Type switch confirmation
    const handleTypeChange = (newType: string) => {
        if (newType === data.type) return;
        const hasContent =
            (data.type === 'Text' && data.text_content.trim()) ||
            (data.type === 'Video' && data.video_url.trim()) ||
            (data.type === 'Assignment' && data.assignment_instructions.trim());
        if (hasContent) {
            setPendingType(newType);
        } else {
            setData('type', newType);
        }
    };

    // Fix 3 — Quiz submit validation
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    const toggleQuestion = (i: number) =>
        setOpenQuestions(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);



    const getVideoEmbedUrl = (url: string) => {
        if (!url) return null;
        try {
            const u = new URL(url);
            const host = u.hostname.toLowerCase();
            if (host.includes('youtube.com')) {
                const id = u.searchParams.get('v');
                return id ? `https://www.youtube.com/embed/${id}` : null;
            }
            if (host.includes('youtu.be')) {
                const id = u.pathname.split('/').filter(Boolean).pop();
                return id ? `https://www.youtube.com/embed/${id}` : null;
            }
            if (host.includes('vimeo.com')) {
                const id = [...u.pathname.split('/').filter(Boolean)].reverse().find(s => /^\d+$/.test(s));
                return id ? `https://player.vimeo.com/video/${id}` : null;
            }
        } catch { return null; }
        return null;
    };

    const typeIcons: Record<string, React.ReactNode> = {
        Text: <FileText className="h-4 w-4" />,
        Video: <Video className="h-4 w-4" />,
        Assignment: <Layout className="h-4 w-4" />,
    };

    const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={cancelHref}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="page-title text-gray-900">
                            {lesson?.id ? 'Edit Lesson' : 'Add New Lesson'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {lesson?.title || course?.title || (courses && courses.find(c => c.id === data.course_id)?.title)}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Section 1: Basic Info ── */}
            <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
                </div>
                <div className="space-y-5 p-6">

                    {/* Course selector — standalone only */}
                    {courses && courses.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="course_id">Course <span className="text-red-500">*</span></Label>
                            <select
                                id="course_id"
                                value={data.course_id}
                                onChange={(e) => setData('course_id', parseInt(e.target.value))}
                                className={selectClass}
                            >
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Lesson Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Introduction to React Hooks"
                            className={errors.title ? 'border-red-500' : ''}
                            required
                        />
                        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
                    </div>

                    {/* Section Selector */}
                    {sections && sections.length > 0 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="section_id">Course Section</Label>
                            <select
                                id="section_id"
                                value={data.section_id}
                                onChange={(e) => setData('section_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">No Section (Unsectioned)</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                            <p className="text-[10px] font-medium text-gray-400 uppercase">
                                Organize this lesson into a specific course section
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief summary of what students will learn"
                            className="min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Type + Duration */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Content Type <span className="text-red-500">*</span></Label>
                            <div className="grid grid-cols-2 gap-2">
                                {lessonTypes.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleTypeChange(type)}
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                                            data.type === type
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        )}
                                    >
                                        {typeIcons[type]}
                                        {type}
                                    </button>
                                ))}
                            </div>

            {/* Fix 1 — Type switch confirmation */}
            {pendingType && (
                <ConfirmationModal
                    isOpen={!!pendingType}
                    onClose={() => setPendingType(null)}
                    onConfirm={() => { setData('type', pendingType); setPendingType(null); }}
                    title="Switch Content Type?"
                    description={`Switching to "${pendingType}" will clear your current content. This cannot be undone.`}
                    confirmText="Yes, Switch"
                    cancelText="Keep Current"
                    type="warning"
                />
            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="duration">Duration (minutes) <span className="text-red-500">*</span></Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                value={data.estimated_duration}
                                onChange={(e) => setData('estimated_duration', e.target.value)}
                                placeholder="10"
                                required
                            />
                        </div>
                    </div>

                    {/* Publish toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Publish Lesson</p>
                            <p className="text-xs text-gray-500">Make this lesson visible to enrolled students</p>
                        </div>
                        <Switch
                            checked={data.is_published}
                            onCheckedChange={(v) => setData('is_published', v)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 2: Text Content ── */}
            {data.type === 'Text' && (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Lesson Content</h2>
                    </div>
                    <div className="p-6">
                        <Textarea
                            value={data.text_content}
                            onChange={(e) => setData('text_content', e.target.value)}
                            className="min-h-[400px] resize-y text-sm"
                            placeholder="Write your lesson content here..."
                            required
                        />
                        {errors.text_content && <p className="mt-1 text-xs text-red-600">{errors.text_content}</p>}
                    </div>
                </div>
            )}

            {/* ── Section 2: Video ── */}
            {data.type === 'Video' && (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Video</h2>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="video_url">Video URL <span className="text-red-500">*</span></Label>
                            <Input
                                id="video_url"
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                required
                            />
                            {errors.video_url && <p className="text-xs text-red-600">{errors.video_url}</p>}
                            <p className="text-xs text-gray-400">Supports YouTube and Vimeo links</p>
                        </div>
                        {data.video_url && getVideoEmbedUrl(data.video_url) && (
                            <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                <iframe
                                    className="h-full w-full"
                                    src={getVideoEmbedUrl(data.video_url) ?? ''}
                                    title="Video Preview"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* ── Section 2: Assignment ── */}
            {data.type === 'Assignment' && (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Assignment</h2>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="instructions">Instructions <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="instructions"
                                value={data.assignment_instructions}
                                onChange={(e) => setData('assignment_instructions', e.target.value)}
                                className="min-h-[200px] resize-y"
                                placeholder="Describe what students need to do..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="max_score">Max Score</Label>
                                <Input id="max_score" type="number" min="1" value={data.assignment_max_score} onChange={(e) => setData('assignment_max_score', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="due_days">Due (days after enrollment)</Label>
                                <Input id="due_days" type="number" min="1" value={data.assignment_due_days} onChange={(e) => setData('assignment_due_days', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer Buttons ── */}
            <div className="flex justify-end gap-4">
                <Link href={cancelHref}>
                    <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" variant="create" disabled={processing}>
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? 'Saving...' : (lesson ? 'Save Changes' : 'Create Lesson')}
                </Button>
            </div>
        </form>
    </div>
);
}
