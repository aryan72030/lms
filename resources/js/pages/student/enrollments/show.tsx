import { Head, Link, router } from '@inertiajs/react';
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
    Trash2,
    MessageSquare,
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
import { Textarea } from '@/components/ui/textarea';
import ConfirmationModal from '@/components/ui/confirmation-modal';
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
    expiry_date: string | null;
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
    const isExpired = Boolean(
        enrollment.expiry_date &&
            new Date(enrollment.expiry_date).getTime() < Date.now(),
    );
    const daysLeft = enrollment.expiry_date
        ? Math.ceil(
              (new Date(enrollment.expiry_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
          )
        : null;

    const getVideoEmbedUrl = (url?: string | null) => {
        if (!url) return null;

        try {
            const parsedUrl = new URL(url);
            const host = parsedUrl.hostname.toLowerCase();

            if (host.includes('youtube.com')) {
                const videoId = parsedUrl.searchParams.get('v');
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }

            if (host.includes('youtu.be')) {
                const videoId = parsedUrl.pathname.split('/').filter(Boolean).pop();
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }

            if (host.includes('vimeo.com')) {
                const segments = parsedUrl.pathname.split('/').filter(Boolean);
                const videoId = [...segments].reverse().find((segment) => /^\d+$/.test(segment));
                return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
            }
        } catch {
            return null;
        }

        return null;
    };

    const lessonsWithProgress = useMemo(() => {
        return enrollment.course.lessons.map((lesson) => {
            const progress = lessonProgress.find(
                (entry) => entry.lesson_id === lesson.id,
            );

            return {
                ...lesson,
                is_completed: progress?.is_completed || false,
                completed_at: progress?.completed_at,
                time_spent: progress?.time_spent,
            };
        });
    }, [enrollment.course.lessons, lessonProgress]);

    const firstIncompleteLesson = lessonsWithProgress.find(
        (lesson) => !lesson.is_completed,
    );
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        firstIncompleteLesson?.id || lessonsWithProgress[0]?.id || null,
    );

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancelEnrollment = () => {
        setIsProcessing(true);
        router.patch(`/student/enrollments/${enrollment.id}/cancel`, {}, {
            onFinish: () => {
                setIsProcessing(false);
                setShowCancelModal(false);
            },
        });
    };

    const handleRequestRefund = () => {
        if (!refundReason.trim()) return;

        setIsProcessing(true);
        router.post(
            `/student/enrollments/${enrollment.id}/refund-request`,
            { reason: refundReason },
            {
                onFinish: () => {
                    setIsProcessing(false);
                    setShowRefundModal(false);
                    setRefundReason('');
                },
            },
        );
    };

    useEffect(() => {
        if (!selectedLessonId && lessonsWithProgress[0]) {
            setSelectedLessonId(
                firstIncompleteLesson?.id || lessonsWithProgress[0].id,
            );
        }
    }, [firstIncompleteLesson?.id, lessonsWithProgress, selectedLessonId]);

    const selectedLesson =
        lessonsWithProgress.find((lesson) => lesson.id === selectedLessonId) ||
        lessonsWithProgress[0] ||
        null;
    const selectedLessonIndex = lessonsWithProgress.findIndex(
        (lesson) => lesson.id === selectedLesson?.id,
    );
    const previousLesson =
        selectedLessonIndex > 0
            ? lessonsWithProgress[selectedLessonIndex - 1]
            : null;
    const nextLesson =
        selectedLessonIndex >= 0 &&
        selectedLessonIndex < lessonsWithProgress.length - 1
            ? lessonsWithProgress[selectedLessonIndex + 1]
            : null;

    const handleDownloadCertificate = () => {
        window.open(
            `/enrollments/${enrollment.id}/certificate/download`,
            '_blank',
        );
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
    const completedLessons = lessonsWithProgress.filter(
        (lesson) => lesson.is_completed,
    ).length;

    const getLessonIcon = (type: string, active: boolean) => {
        const baseClass = active ? 'text-white' : 'text-indigo-600';
        switch (type) {
            case 'Video':
                return <Play className={`h-4 w-4 ${baseClass}`} />;
            case 'Text':
                return <FileText className={`h-4 w-4 ${baseClass}`} />;

            case 'Assignment':
                return <Award className={`h-4 w-4 ${baseClass}`} />;
            default:
                return <BookOpen className={`h-4 w-4 ${baseClass}`} />;
        }
    };

    return (
        <AppLayout>
            <Head title={`${enrollment.course.title} - Learning Portal`} />

            <div className="mx-auto max-w-[1600px] space-y-8 pb-12">
                {/* Immersive Header */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Link href="/student/enrollments">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-white/20 border-white/20 bg-white/10 text-white backdrop-blur-sm"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Badge className="border-none bg-indigo-500 px-3 py-1 text-white">
                                    Learning Mode
                                </Badge>
                            </div>
                            <h1 className="page-title font-black">
                                {enrollment.course.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-slate-300">
                                <div className="flex items-center gap-2 font-semibold">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 text-indigo-400">
                                        {enrollment.course.instructor.name.charAt(
                                            0,
                                        )}
                                    </div>
                                    {enrollment.course.instructor.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {completedLessons} /{' '}
                                    {enrollment.course.lessons.length} Lessons
                                    Completed
                                </div>
                                {enrollment.expiry_date && (
                                    <div className={`flex items-center gap-2 font-bold ${new Date(enrollment.expiry_date) < new Date() ? 'text-rose-400' : 'text-indigo-400'}`}>
                                        <Calendar className="h-4 w-4" />
                                        Access Expires: {new Date(enrollment.expiry_date).toLocaleDateString()}
                                    </div>
                                )}
                                {!enrollment.expiry_date && (
                                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                                        <Calendar className="h-4 w-4" />
                                        Lifetime Access
                                    </div>
                                )}
                                {enrollment.status === 'Refund Requested' && (
                                    <Badge className="bg-amber-500 text-white border-none">
                                        Refund Requested
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Course Progress Mini Card */}
                            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner backdrop-blur-xl lg:w-72">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-400">
                                        Total Progress
                                    </span>
                                    <span className="text-lg font-black text-indigo-400">
                                        {Number(enrollment.progress || 0).toFixed(
                                            0,
                                        )}
                                        %
                                    </span>
                                </div>
                                <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${Number(enrollment.progress || 0)}%`,
                                        }}
                                    ></div>
                                </div>
                                {Boolean(enrollment.completion_date) ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="w-full rounded-xl border-none bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-600">
                                                <Award className="mr-2 h-4 w-4" />
                                                Certificate
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-80" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-64 rounded-2xl p-2"
                                        >
                                            <DropdownMenuLabel className="text-sm font-black text-slate-900">
                                                Certificate Actions
                                            </DropdownMenuLabel>
                                            <div className="px-2 pb-2 text-xs font-bold text-slate-500">
                                                {certificateId}
                                            </div>
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
                                        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                            {enrollment.course.lessons.length -
                                                completedLessons}{' '}
                                            Lessons left to finish
                                        </p>
                                        {Number(enrollment.progress) >= 100 && (
                                            <p className="text-[10px] font-black tracking-tighter text-amber-400 uppercase">
                                                ⚠️ Pass final exam to unlock
                                                certificate
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions Card */}
                            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner backdrop-blur-xl lg:w-72">
                                <div className="grid grid-cols-1 gap-2">
                                    {enrollment.status === 'Active' && enrollment.payment_status === 'Completed' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start rounded-xl text-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
                                            onClick={() => setShowRefundModal(true)}
                                        >
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Request Refund
                                        </Button>
                                    )}
                                    
                                    {enrollment.status === 'Active' && Number(enrollment.course.price) === 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start rounded-xl text-rose-400 hover:bg-rose-400/10 hover:text-rose-300"
                                            onClick={() => setShowCancelModal(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Cancel Enrollment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-600/20 opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-600/20 opacity-50 blur-3xl"></div>
                </div>

                {isExpired ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
                        Your access to this course expired on{' '}
                        {new Date(enrollment.expiry_date!).toLocaleDateString()}.
                        Lesson completion and quiz actions may be unavailable.
                    </div>
                ) : enrollment.expiry_date && daysLeft !== null && daysLeft <= 7 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700 shadow-sm">
                        Your access expires in {daysLeft} day{daysLeft === 1 ? '' : 's'} on{' '}
                        {new Date(enrollment.expiry_date).toLocaleDateString()}.
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Main Content Area - Taking more space */}
                    <div className="space-y-8 lg:col-span-3">
                        {/* Current Lesson Content Player */}
                        {selectedLesson ? (
                            <div className="space-y-6">
                                <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
                                    <CardHeader className="border-b border-slate-50 p-8 pb-4">
                                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">
                                                        Lesson{' '}
                                                        {selectedLesson.order}
                                                    </span>
                                                    {selectedLesson.is_completed && (
                                                        <Badge className="border-none bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-2xl font-black text-slate-800">
                                                    {selectedLesson.title}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant="secondary"
                                                    className="border-none bg-slate-100 font-bold text-slate-600"
                                                >
                                                    {selectedLesson.type}
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className="border-none bg-slate-100 font-bold text-slate-600"
                                                >
                                                    {
                                                        selectedLesson.duration_display
                                                    }
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {/* Content Area */}
                                        <div className="min-h-[400px] rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-inner">
                                            {selectedLesson.type ===
                                                'Video' && (
                                                <div className="space-y-6 py-4">
                                                    {getVideoEmbedUrl(
                                                        selectedLesson.video_url,
                                                    ) ? (
                                                        <>
                                                            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner">
                                                                <iframe
                                                                    className="h-full w-full"
                                                                    src={
                                                                        getVideoEmbedUrl(
                                                                            selectedLesson.video_url,
                                                                        ) ?? ''
                                                                    }
                                                                    title={
                                                                        selectedLesson.title
                                                                    }
                                                                    frameBorder="0"
                                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                                    allowFullScreen
                                                                />
                                                            </div>
                                                            <div className="flex justify-center">
                                                                <Button
                                                                    asChild
                                                                    variant="outline"
                                                                    className="rounded-xl"
                                                                >
                                                                    <a
                                                                        href={
                                                                            selectedLesson.video_url ??
                                                                            '#'
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        Open Video
                                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
                                                            <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-indigo-600 shadow-2xl shadow-indigo-200">
                                                                <Play className="h-10 w-10 fill-current text-white" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="text-xl font-bold text-slate-800">
                                                                    Video Lesson Ready
                                                                </h3>
                                                                <p className="max-w-sm text-slate-500">
                                                                    This lesson contains
                                                                    video content. Click
                                                                    the button below to
                                                                    start watching.
                                                                </p>
                                                            </div>
                                                            {selectedLesson.video_url && (
                                                                <Button
                                                                    asChild
                                                                    className="h-12 rounded-xl bg-indigo-600 px-8 font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                                                                >
                                                                    <a
                                                                        href={
                                                                            selectedLesson.video_url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        Watch Lesson
                                                                        Video{' '}
                                                                        <ExternalLink className="ml-2 h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {selectedLesson.type === 'Text' && (
                                                <div className="prose prose-slate prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-900 prose-p:leading-relaxed max-w-none text-lg">
                                                    <div className="leading-relaxed whitespace-pre-wrap">
                                                        {selectedLesson.text_content ||
                                                            'No content provided for this text lesson.'}
                                                    </div>
                                                </div>
                                            )}



                                            {selectedLesson.type ===
                                                'Assignment' && (
                                                <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
                                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 shadow-2xl shadow-purple-200">
                                                        <FileText className="h-10 w-10 text-white" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-slate-800">
                                                            Practical Assignment
                                                        </h3>
                                                        <p className="max-w-sm text-slate-500">
                                                            Apply what you've
                                                            learned through a
                                                            practical task.
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/student/lessons/${selectedLesson.id}/assignment`}
                                                    >
                                                        <Button className="h-12 rounded-xl bg-purple-600 px-8 font-bold shadow-lg shadow-purple-100 hover:bg-purple-700">
                                                            View Assignment{' '}
                                                            <ChevronRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Tracking Integration */}
                                        <div className="mt-8 border-t border-slate-50 pt-8">
                                            <LessonProgressTracker
                                                lessonId={selectedLesson.id}
                                                lessonTitle={
                                                    selectedLesson.title
                                                }
                                                isCompleted={
                                                    selectedLesson.is_completed ||
                                                    false
                                                }
                                                completedAt={
                                                    selectedLesson.completed_at
                                                }
                                                timeSpent={
                                                    selectedLesson.time_spent
                                                }
                                                onProgressUpdate={() => {
                                                    window.location.reload();
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                    <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 p-8 pt-0">
                                        <Button
                                            variant="ghost"
                                            className="h-12 rounded-xl px-6 font-bold text-slate-500 transition-all hover:bg-white hover:text-indigo-600"
                                            disabled={!previousLesson}
                                            onClick={() =>
                                                previousLesson &&
                                                setSelectedLessonId(
                                                    previousLesson.id,
                                                )
                                            }
                                        >
                                            <ChevronLeft className="mr-2 h-5 w-5" />
                                            Previous Lesson
                                        </Button>
                                        <Button
                                            className="h-12 rounded-xl bg-indigo-600 px-8 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95"
                                            disabled={!nextLesson}
                                            onClick={() =>
                                                nextLesson &&
                                                setSelectedLessonId(
                                                    nextLesson.id,
                                                )
                                            }
                                        >
                                            Next Lesson
                                            <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </Card>

                                {/* Lesson Description Card */}
                                {selectedLesson.description && (
                                    <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-lg">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-lg font-bold text-slate-800">
                                                About this lesson
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0">
                                            <p className="leading-relaxed font-medium text-slate-600">
                                                {selectedLesson.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-white py-24 text-center shadow-sm">
                                <BookOpen className="mx-auto mb-6 h-20 w-20 text-slate-200" />
                                <h3 className="text-2xl font-black text-slate-800">
                                    Start your first lesson
                                </h3>
                                <p className="mx-auto mt-2 mb-8 max-w-xs font-medium text-slate-500">
                                    Click on a lesson in the sidebar to begin
                                    your learning journey.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Lesson List */}
                    <div className="space-y-8">
                        <Card className="sticky top-8 overflow-hidden rounded-3xl border-none bg-white shadow-xl">
                            <CardHeader className="border-b border-slate-50 p-6 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-black text-slate-800">
                                        Course Content
                                    </CardTitle>
                                    <Badge className="border-none bg-slate-100 font-bold text-slate-600">
                                        {enrollment.course.lessons.length}{' '}
                                        Modules
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="custom-scrollbar max-h-[700px] space-y-1 overflow-y-auto pr-2">
                                    {lessonsWithProgress.map((lesson) => {
                                        const isActive =
                                            selectedLesson?.id === lesson.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedLessonId(
                                                        lesson.id,
                                                    )
                                                }
                                                className={`group w-full rounded-2xl p-4 text-left transition-all duration-300 ${
                                                    isActive
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                                                    isActive
                                                                        ? 'bg-white/20'
                                                                        : 'bg-slate-100 group-hover:bg-white'
                                                                }`}
                                                            >
                                                                {getLessonIcon(
                                                                    lesson.type,
                                                                    isActive,
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`line-clamp-1 text-sm font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}
                                                            >
                                                                {lesson.order}.{' '}
                                                                {lesson.title}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`pl-10 text-[10px] font-bold tracking-widest uppercase ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}
                                                        >
                                                            {lesson.type} •{' '}
                                                            {
                                                                lesson.duration_display
                                                            }
                                                        </div>
                                                    </div>
                                                    {lesson.is_completed && (
                                                        <div
                                                            className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full ${isActive ? 'bg-white' : 'bg-emerald-50'}`}
                                                        >
                                                            <CheckCircle
                                                                className={`h-3 w-3 ${isActive ? 'text-indigo-600' : 'text-emerald-600'}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                            <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                                <div className="mb-3 flex items-center justify-between text-xs font-black tracking-widest text-slate-400 uppercase">
                                    <span>Completion Status</span>
                                    <span>
                                        {lessonsWithProgress.length > 0
                                            ? (
                                                  (completedLessons /
                                                      lessonsWithProgress.length) *
                                                  100
                                              ).toFixed(0)
                                            : '0'}
                                        %
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{
                                            width: `${lessonsWithProgress.length > 0 ? (completedLessons / lessonsWithProgress.length) * 100 : 0}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelEnrollment}
                title="Cancel Enrollment"
                description="Are you sure you want to cancel your enrollment in this course? This action cannot be undone."
                confirmText="Cancel Enrollment"
                cancelText="Keep Learning"
                isDestructive={true}
                isLoading={isProcessing}
            />

            <ConfirmationModal
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onConfirm={handleRequestRefund}
                title="Request Refund"
                description="Please provide a reason for your refund request. Our administrator will review it manually."
                confirmText="Submit Request"
                cancelText="Cancel"
                isDestructive={false}
                isLoading={isProcessing}
            >
                <div className="mt-4">
                    <Textarea
                        placeholder="Reason for refund..."
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="min-h-[100px] rounded-xl"
                    />
                </div>
            </ConfirmationModal>
        </AppLayout>
    );
}
