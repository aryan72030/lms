import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    User,
    Clock,
    BookOpen,
    PlayCircle,
    FileText,
    HelpCircle,
    Award,
    Users,
    Play,
    Heart,
    CheckCircle,
} from 'lucide-react';
import EnrollmentButton from '@/components/enrollment/enrollment-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDuration } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    objectives: string | null;
    price: number;
    access_duration: number;
    duration_hours: number;
    difficulty_level: string;
    thumbnail: string | null;
    instructor: {
        id: number;
        name: string;
        email: string;
    };
    category: {
        id: number;
        name: string;
    };
    lessons: Array<{
        id: number;
        title: string;
        description: string | null;
        type: string;
        order: number;
        estimated_duration: number;
        duration_display: string;
    }>;
    created_at: string;
}

interface Props {
    course: Course;
    enrollmentStatus: {
        id: number;
        payment_status: string;
        status: string;
        progress: number;
        completion_date: string | null;
        formatted_expiry_date?: string | null;
        days_left?: number | null;
        is_expired?: boolean;
    } | null;
    isWishlisted: boolean;
    stats: {
        total_lessons: number;
        total_enrollments: number;
        lesson_types: Record<string, number>;
    };
    user: {
        id: number;
        role: string;
    } | null;
}

export default function Show({
    course,
    enrollmentStatus,
    isWishlisted,
    stats,
    user,
}: Props) {
    const getDifficultyBadgeColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner':
                return 'bg-green-100 text-green-800';
            case 'Intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'Advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const toggleWishlist = () => {
        router.post(
            '/student/wishlist/toggle',
            {
                course_id: course.id,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'Video':
                return <PlayCircle className="h-4 w-4" />;
            case 'Text':
                return <FileText className="h-4 w-4" />;
            case 'Quiz':
                return <HelpCircle className="h-4 w-4" />;
            case 'Assignment':
                return <Award className="h-4 w-4" />;
            default:
                return <BookOpen className="h-4 w-4" />;
        }
    };

    const getLessonTypeColor = (type: string) => {
        switch (type) {
            case 'Video':
                return 'text-blue-600';
            case 'Text':
                return 'text-gray-600';
            case 'Quiz':
                return 'text-green-600';
            case 'Assignment':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'Courses', href: '/student/courses' },
                { title: course.title, href: '#' },
            ]}
        >
            <Head title={course.title} />

            <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                    <Link href="/student/courses">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>

                    {user && (
                        <Button
                            variant="outline"
                            onClick={toggleWishlist}
                            className={cn(
                                'rounded-xl transition-all duration-300',
                                isWishlisted
                                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                                    : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
                            )}
                        >
                            <Heart
                                className={cn(
                                    'mr-2 h-4 w-4',
                                    isWishlisted && 'fill-current',
                                )}
                            />
                            {isWishlisted
                                ? 'Saved to Wishlist'
                                : 'Save for Later'}
                        </Button>
                    )}
                </div>

                {/* Course Header */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Course Info */}
                        <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
                            <CardContent className="pt-6">
                                {course.thumbnail && (
                                    <div className="mb-6 aspect-video overflow-hidden rounded-2xl bg-gray-100 shadow-inner">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h1 className="page-title mb-2 leading-tight font-black text-slate-900">
                                            {course.title}
                                        </h1>
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            <Badge
                                                variant="outline"
                                                className="border-none bg-indigo-50 text-[10px] font-bold tracking-widest text-indigo-600 uppercase"
                                            >
                                                {course.category.name}
                                            </Badge>
                                            <Badge
                                                className={cn(
                                                    'border-none text-[10px] font-bold tracking-widest uppercase',
                                                    getDifficultyBadgeColor(
                                                        course.difficulty_level,
                                                    ),
                                                )}
                                            >
                                                {course.difficulty_level}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                                                {course.instructor.name.charAt(
                                                    0,
                                                )}
                                            </div>
                                            {course.instructor.name}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {formatDuration(course.duration_hours)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-4 w-4 text-slate-400" />
                                            {stats.total_lessons} lessons
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            {stats.total_enrollments} students
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-50" />

                                    <Tabs defaultValue="overview" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1">
                                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                                                Overview
                                            </TabsTrigger>
                                            <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                                                Curriculum
                                            </TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in duration-500">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-black text-slate-900">
                                                    About this course
                                                </h3>
                                                <div className="prose max-w-none text-slate-600 leading-relaxed">
                                                    {course.description}
                                                </div>
                                            </div>

                                            {course.objectives && (
                                                <div className="rounded-2xl bg-indigo-50/50 p-6 ring-1 ring-indigo-100">
                                                    <h3 className="mb-4 text-lg font-bold text-indigo-900">
                                                        What you'll learn
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        {course.objectives
                                                            .split('\n')
                                                            .filter((o) => o.trim())
                                                            .map((objective, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-start gap-2 text-sm text-slate-700"
                                                                >
                                                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                                                    <span>{objective}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="curriculum" className="mt-6 animate-in fade-in duration-500">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-black text-slate-900">
                                                        Course Content
                                                    </h3>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        {course.lessons.length} Modules
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {course.lessons.map((lesson, index) => (
                                                        <div
                                                            key={lesson.id}
                                                            className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 font-bold text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                                                    {index + 1}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600">
                                                                        {lesson.title}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                                        <span
                                                                            className={cn(
                                                                                'flex items-center gap-1',
                                                                                getLessonTypeColor(
                                                                                    lesson.type,
                                                                                ),
                                                                            )}
                                                                        >
                                                                            {getLessonIcon(
                                                                                lesson.type,
                                                                            )}
                                                                            {lesson.type}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>
                                                                            {
                                                                                lesson.duration_display
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Play className="h-4 w-4 text-slate-200 group-hover:text-indigo-600" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {enrollmentStatus &&
                        enrollmentStatus.status === 'Active' &&
                        enrollmentStatus.payment_status !== 'Pending' ? (
                            <Card className="group relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-colors group-hover:bg-white/20"></div>
                                <CardContent className="relative z-10 space-y-6 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black tracking-[0.2em] text-indigo-100 uppercase">
                                                Your Progress
                                            </div>
                                            <div className="text-4xl font-black tracking-tight">
                                                {Number(
                                                    enrollmentStatus.progress ||
                                                        0,
                                                ).toFixed(0)}
                                                %
                                            </div>
                                        </div>
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                                            <Award className="h-8 w-8 text-white" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                                            <div
                                                className="h-full rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${enrollmentStatus.progress}%`,
                                                }}
                                            ></div>
                                        </div>
                                        {enrollmentStatus.completion_date && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-indigo-100 uppercase">
                                                <CheckCircle className="h-3 w-3" />
                                                Completed on{' '}
                                                {new Date(
                                                    enrollmentStatus.completion_date,
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                        {enrollmentStatus.formatted_expiry_date && (
                                            <div
                                                className={cn(
                                                    'flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase',
                                                    enrollmentStatus.is_expired
                                                        ? 'text-rose-200'
                                                        : 'text-indigo-100',
                                                )}
                                            >
                                                <Clock className="h-3 w-3" />
                                                {enrollmentStatus.is_expired
                                                    ? `Expired on ${enrollmentStatus.formatted_expiry_date}`
                                                    : `Expires on ${enrollmentStatus.formatted_expiry_date} (${enrollmentStatus.days_left} days left)`}
                                            </div>
                                        )}
                                        {!enrollmentStatus.formatted_expiry_date && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-indigo-100 uppercase">
                                                <Clock className="h-3 w-3" />
                                                Lifetime Access
                                            </div>
                                        )}
                                    </div>

                                    {enrollmentStatus.is_expired ? (
                                        <Button
                                            className="h-12 w-full rounded-2xl border-none bg-white/20 font-black text-white shadow-none"
                                            size="lg"
                                            disabled
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Access Expired
                                        </Button>
                                    ) : (
                                        <Link
                                            href={`/student/enrollments/${enrollmentStatus.id}`}
                                            className="block"
                                        >
                                            <Button
                                                className="h-12 w-full rounded-2xl border-none bg-white font-black text-indigo-600 shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] hover:bg-indigo-50 active:scale-[0.98]"
                                                size="lg"
                                            >
                                                <Play className="mr-2 h-4 w-4 fill-current" />
                                                Resume Learning
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            /* Enrollment Card for non-enrolled or pending */
                            <div className="space-y-4">
                                <EnrollmentButton
                                    course={{
                                        id: course.id,
                                        title: course.title,
                                        price: course.price,
                                        status: 'Published',
                                    }}
                                    user={user || undefined}
                                    initialEnrollment={enrollmentStatus}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Course Stats */}
                        <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
                            <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 px-6 py-4">
                                <CardTitle className="text-xs font-black tracking-[0.15em] text-slate-800 uppercase">
                                    Course Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Lessons
                                        </div>
                                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                            {stats.total_lessons}
                                        </div>
                                    </div>
                                    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Students
                                        </div>
                                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                                            <Users className="h-3.5 w-3.5 text-violet-500" />
                                            {stats.total_enrollments}
                                        </div>
                                    </div>
                                    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Duration
                                        </div>
                                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            {formatDuration(course.duration_hours)}
                                        </div>
                                    </div>
                                    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Access
                                        </div>
                                        <div className="truncate text-xs font-black text-slate-800">
                                            {course.access_duration > 0
                                                ? `${course.access_duration} days`
                                                : 'Lifetime'}
                                        </div>
                                    </div>
                                    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Level
                                        </div>
                                        <div className="truncate text-xs font-black text-slate-800">
                                            {course.difficulty_level}
                                        </div>
                                    </div>
                                </div>

                                {Object.keys(stats.lesson_types).length > 0 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Separator className="flex-1 bg-slate-100" />
                                            <span className="text-[9px] font-black tracking-[0.2em] text-slate-300 uppercase">
                                                Breakdown
                                            </span>
                                            <Separator className="flex-1 bg-slate-100" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {Object.entries(
                                                stats.lesson_types,
                                            ).map(([type, count]) => (
                                                <div
                                                    key={type}
                                                    className="group flex items-center justify-between rounded-xl border border-transparent p-2.5 transition-colors hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={cn(
                                                                'h-2 w-2 rounded-full',
                                                                type === 'Video'
                                                                    ? 'bg-blue-400'
                                                                    : type ===
                                                                        'Quiz'
                                                                      ? 'bg-emerald-400'
                                                                      : type ===
                                                                          'Assignment'
                                                                        ? 'bg-purple-400'
                                                                        : 'bg-slate-300',
                                                            )}
                                                        ></div>
                                                        <span className="text-xs font-bold text-slate-600 transition-colors group-hover:text-slate-900">
                                                            {type}
                                                        </span>
                                                    </div>
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Instructor Info */}
                        <Card className="overflow-hidden rounded-3xl border-none shadow-xl">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-sm font-black tracking-widest text-slate-800 uppercase">
                                    Instructor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500">
                                        {course.instructor.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate font-black text-slate-800">
                                            {course.instructor.name}
                                        </p>
                                        <p className="truncate text-xs font-bold text-slate-400">
                                            {course.instructor.email}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
