import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    BookOpen, 
    Clock, 
    User, 
    Calendar, 
    Play, 
    CheckCircle, 
    FileText, 
    HelpCircle, 
    Award, 
    Download,
    ShieldCheck,
    ChevronDown,
    ChevronLeft, 
    ChevronRight, 
    ExternalLink,
    Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LessonProgressTracker from '@/components/progress/lesson-progress-tracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';

interface Lesson {
    id: number;
    title: string;
    description: string | null;
    type: string;
    order: number;
    estimated_duration: number;
    duration_display: string;
    text_content?: string | null;
    video_url?: string | null;
    video_duration?: number | null;
    quiz_data?: {
        questions?: Array<{
            question?: string;
            question_text?: string;
            options?: string[];
        }>;
    } | null;
    assignment_data?: {
        instructions?: string;
        max_score?: number;
        due_days?: number;
    } | null;
    is_completed?: boolean;
    completed_at?: string;
    time_spent?: number;
}

interface Enrollment {
    id: number;
    course: {
        id: number;
        title: string;
        description: string;
        price: number;
        thumbnail: string | null;
        instructor: {
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
        lessons: Lesson[];
    };
    enrollment_date: string;
    payment_status: string;
    status: string;
    progress: number | null;
    completion_date: string | null;
    amount_paid: number | null;
}

interface Props {
    enrollment: Enrollment;
    lessonProgress?: {
        lesson_id: number;
        is_completed: boolean;
        completed_at?: string;
        time_spent?: number;
    }[];
}

export default function Show({ enrollment, lessonProgress = [] }: Props) {
    const certificateId = `CERT-${String(enrollment.id).padStart(6, '0')}`;

    const lessonsWithProgress = useMemo(() => {
        return enrollment.course.lessons.map((lesson) => {
            const progress = lessonProgress.find((entry) => entry.lesson_id === lesson.id);

            return {
                ...lesson,
                is_completed: progress?.is_completed || false,
                completed_at: progress?.completed_at,
                time_spent: progress?.time_spent,
            };
        });
    }, [enrollment.course.lessons, lessonProgress]);

    const firstIncompleteLesson = lessonsWithProgress.find((lesson) => !lesson.is_completed);
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        firstIncompleteLesson?.id || lessonsWithProgress[0]?.id || null
    );

    useEffect(() => {
        if (!selectedLessonId && lessonsWithProgress[0]) {
            setSelectedLessonId(firstIncompleteLesson?.id || lessonsWithProgress[0].id);
        }
    }, [firstIncompleteLesson?.id, lessonsWithProgress, selectedLessonId]);

    const selectedLesson =
        lessonsWithProgress.find((lesson) => lesson.id === selectedLessonId) || lessonsWithProgress[0] || null;
    const selectedLessonIndex = lessonsWithProgress.findIndex((lesson) => lesson.id === selectedLesson?.id);
    const previousLesson = selectedLessonIndex > 0 ? lessonsWithProgress[selectedLessonIndex - 1] : null;
    const nextLesson =
        selectedLessonIndex >= 0 && selectedLessonIndex < lessonsWithProgress.length - 1
            ? lessonsWithProgress[selectedLessonIndex + 1]
            : null;

    const handleDownloadCertificate = () => {
        window.open(`/enrollments/${enrollment.id}/certificate/download`, '_blank');
    };

    const handleViewCertificate = () => {
        window.open(`/enrollments/${enrollment.id}/certificate/view`, '_blank');
    };

    const handleVerifyCertificate = () => {
        window.open(`/verify/${certificateId}`, '_blank');
    };

    const getStatusBadge = (status: string) => {
        const variant = status === 'Active' ? 'default' : 'secondary';

        return <Badge variant={variant}>{status}</Badge>;
    };
    const completedLessons = lessonsWithProgress.filter((lesson) => lesson.is_completed).length;

    const getLessonIcon = (type: string, active: boolean) => {
        const baseClass = active ? "text-white" : "text-indigo-600";
        switch (type) {
            case 'Video':
                return <Play className={`h-4 w-4 ${baseClass}`} />;
            case 'Text':
                return <FileText className={`h-4 w-4 ${baseClass}`} />;
            case 'Quiz':
                return <HelpCircle className={`h-4 w-4 ${baseClass}`} />;
            case 'Assignment':
                return <Award className={`h-4 w-4 ${baseClass}`} />;
            default:
                return <BookOpen className={`h-4 w-4 ${baseClass}`} />;
        }
    };

    return (
        <AppLayout>
            <Head title={`${enrollment.course.title} - Learning Portal`} />

            <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
                {/* Immersive Header */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 lg:items-center">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Link href="/student/enrollments">
                                    <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-full backdrop-blur-sm">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Courses
                                    </Button>
                                </Link>
                                <Badge className="bg-indigo-500 text-white border-none px-3 py-1">
                                    Learning Mode
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {enrollment.course.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-slate-300">
                                <div className="flex items-center gap-2 font-semibold">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                        {enrollment.course.instructor.name.charAt(0)}
                                    </div>
                                    {enrollment.course.instructor.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {completedLessons} / {enrollment.course.lessons.length} Lessons Completed
                                </div>
                            </div>
                        </div>
                        
                        {/* Course Progress Mini Card */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 w-full lg:w-72 shadow-inner">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-400">Total Progress</span>
                                <span className="text-lg font-black text-indigo-400">{Number(enrollment.progress || 0).toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${Number(enrollment.progress || 0)}%` }}
                                ></div>
                            </div>
                            {Boolean(enrollment.completion_date) ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border-none shadow-lg shadow-emerald-900/20">
                                            <Award className="h-4 w-4 mr-2" />
                                            Certificate
                                            <ChevronDown className="h-4 w-4 ml-2 opacity-80" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl">
                                        <DropdownMenuLabel className="text-sm font-black text-slate-900">
                                            Certificate Actions
                                        </DropdownMenuLabel>
                                        <div className="px-2 pb-2 text-xs font-bold text-slate-500">{certificateId}</div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleViewCertificate();
                                            }}
                                            className="rounded-xl"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View (PDF)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleDownloadCertificate();
                                            }}
                                            className="rounded-xl"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleVerifyCertificate();
                                            }}
                                            className="rounded-xl"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Public Verification
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="space-y-2 text-center">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        {enrollment.course.lessons.length - completedLessons} Lessons left to finish
                                    </p>
                                    {Number(enrollment.progress) >= 100 && (
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">
                                            ⚠️ Pass final exam to unlock certificate
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl opacity-50"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content Area - Taking more space */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Current Lesson Content Player */}
                        {selectedLesson ? (
                            <div className="space-y-6">
                                <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                                    <CardHeader className="p-8 pb-4 border-b border-slate-50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                                        Lesson {selectedLesson.order}
                                                    </span>
                                                    {selectedLesson.is_completed && (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-2xl font-black text-slate-800">
                                                    {selectedLesson.title}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                                    {selectedLesson.type}
                                                </Badge>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                                    {selectedLesson.duration_display}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {/* Content Area */}
                                        <div className="min-h-[400px] rounded-2xl bg-slate-50 border border-slate-100 p-8 shadow-inner">
                                            {selectedLesson.type === 'Video' && (
                                                <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
                                                    <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 animate-pulse">
                                                        <Play className="h-10 w-10 text-white fill-current" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-800">Video Lesson Ready</h3>
                                                        <p className="text-slate-500 max-w-sm">
                                                            This lesson contains video content. Click the button below to start watching.
                                                        </p>
                                                    </div>
                                                    {selectedLesson.video_url && (
                                                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold rounded-xl shadow-lg shadow-indigo-100">
                                                            <a href={selectedLesson.video_url} target="_blank" rel="noreferrer">
                                                                Watch Lesson Video <ExternalLink className="ml-2 h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {selectedLesson.type === 'Text' && (
                                                <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-900 prose-p:leading-relaxed text-lg">
                                                    <div className="whitespace-pre-wrap leading-relaxed">
                                                        {selectedLesson.text_content || 'No content provided for this text lesson.'}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedLesson.type === 'Quiz' && (
                                                <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
                                                    <div className="h-24 w-24 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-200">
                                                        <Target className="h-10 w-10 text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-800">Quiz Available</h3>
                                                        <p className="text-slate-500 max-w-sm">
                                                            Test your knowledge of the topics covered in this module.
                                                        </p>
                                                    </div>
                                                    <Link href={`/student/lessons/${selectedLesson.id}/quiz`}>
                                                        <Button className="bg-amber-500 hover:bg-amber-600 h-12 px-8 font-bold rounded-xl shadow-lg shadow-amber-100">
                                                            Take the Quiz <ChevronRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {selectedLesson.type === 'Assignment' && (
                                                <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
                                                    <div className="h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-200">
                                                        <FileText className="h-10 w-10 text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-800">Practical Assignment</h3>
                                                        <p className="text-slate-500 max-w-sm">
                                                            Apply what you've learned through a practical task.
                                                        </p>
                                                    </div>
                                                    <Link href={`/student/lessons/${selectedLesson.id}/assignment`}>
                                                        <Button className="bg-purple-600 hover:bg-purple-700 h-12 px-8 font-bold rounded-xl shadow-lg shadow-purple-100">
                                                            View Assignment <ChevronRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Tracking Integration */}
                                        <div className="mt-8 border-t border-slate-50 pt-8">
                                            <LessonProgressTracker
                                                lessonId={selectedLesson.id}
                                                lessonTitle={selectedLesson.title}
                                                isCompleted={selectedLesson.is_completed || false}
                                                completedAt={selectedLesson.completed_at}
                                                timeSpent={selectedLesson.time_spent}
                                                onProgressUpdate={() => {
                                                    window.location.reload();
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                    <div className="p-8 pt-0 flex items-center justify-between border-t border-slate-50 bg-slate-50/50">
                                        <Button
                                            variant="ghost"
                                            className="font-bold text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl h-12 px-6 transition-all"
                                            disabled={!previousLesson}
                                            onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
                                        >
                                            <ChevronLeft className="h-5 w-5 mr-2" />
                                            Previous Lesson
                                        </Button>
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                                            disabled={!nextLesson}
                                            onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                                        >
                                            Next Lesson
                                            <ChevronRight className="h-5 w-5 ml-2" />
                                        </Button>
                                    </div>
                                </Card>

                                {/* Lesson Description Card */}
                                {selectedLesson.description && (
                                    <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-lg font-bold text-slate-800">About this lesson</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0">
                                            <p className="text-slate-600 leading-relaxed font-medium">
                                                {selectedLesson.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-100">
                                <BookOpen className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-800">Start your first lesson</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">
                                    Click on a lesson in the sidebar to begin your learning journey.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Lesson List */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden sticky top-8">
                            <CardHeader className="p-6 pb-4 border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-black text-slate-800">Course Content</CardTitle>
                                    <Badge className="bg-slate-100 text-slate-600 border-none font-bold">
                                        {enrollment.course.lessons.length} Modules
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="space-y-1 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                    {lessonsWithProgress.map((lesson) => {
                                        const isActive = selectedLesson?.id === lesson.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                type="button"
                                                onClick={() => setSelectedLessonId(lesson.id)}
                                                className={`w-full group rounded-2xl p-4 text-left transition-all duration-300 ${
                                                    isActive
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                                                                isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'
                                                            }`}>
                                                                {getLessonIcon(lesson.type, isActive)}
                                                            </div>
                                                            <span className={`font-bold text-sm line-clamp-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                                {lesson.order}. {lesson.title}
                                                            </span>
                                                        </div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest pl-10 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                            {lesson.type} • {lesson.duration_display}
                                                        </div>
                                                    </div>
                                                    {lesson.is_completed && (
                                                        <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center ${isActive ? 'bg-white' : 'bg-emerald-50'}`}>
                                                            <CheckCircle className={`h-3 w-3 ${isActive ? 'text-indigo-600' : 'text-emerald-600'}`} />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    <span>Completion Status</span>
                                    <span>{lessonsWithProgress.length > 0 ? ((completedLessons / lessonsWithProgress.length) * 100).toFixed(0) : '0'}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${lessonsWithProgress.length > 0 ? (completedLessons / lessonsWithProgress.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
