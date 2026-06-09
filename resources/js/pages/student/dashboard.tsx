import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Award,
    Target,
    PlayCircle,
    CheckCircle,
    Star,
    Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn as clsx } from '../../lib/utils';

interface StudentDashboardProps {
    stats: {
        enrolled_courses: number;
        completed_courses: number;
        in_progress_courses: number;
        certificates_earned: number;
        total_lessons_completed: number;
        total_quizzes_taken: number;
        total_assignments_submitted: number;
        average_score: number;
    };
    enrolled_courses: Array<any>;
    recent_activity: Array<any>;
    certificates: Array<any>;
    recommended_courses: Array<any>;
    learning_progress: Array<any>;
    student: {
        id: number;
        name: string;
        email: string;
    };
}

export default function StudentDashboard({
    stats,
    enrolled_courses = [],
    recent_activity = [],
    certificates = [],
    recommended_courses = [],
    learning_progress = [],
    student,
}: StudentDashboardProps) {
    const getProgressColor = (progress: number) => {
        const val = Number(progress);
        if (val >= 80) return 'bg-emerald-500';
        if (val >= 50) return 'bg-indigo-500';
        if (val >= 25) return 'bg-amber-500';
        return 'bg-slate-300';
    };

    const getCourseStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return (
                    <Badge className="border-none bg-emerald-100 text-emerald-800">
                        Completed
                    </Badge>
                );
            case 'In Progress':
                return (
                    <Badge className="border-none bg-indigo-100 text-indigo-800">
                        In Progress
                    </Badge>
                );
            case 'Not Started':
                return (
                    <Badge className="border-none bg-slate-100 text-slate-800">
                        Not Started
                    </Badge>
                );
            case 'Refunded':
                return (
                    <Badge className="border-none bg-rose-100 text-rose-800">
                        Refunded
                    </Badge>
                );
            case 'Refund Requested':
                return (
                    <Badge className="border-none bg-amber-100 text-amber-800">
                        Refund Requested
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Student Dashboard" />

            <div className="space-y-10 pb-12">
                {/* Hero / Welcome Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white shadow-xl md:p-12">
                    <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                        <div className="max-w-2xl space-y-4">
                            <Badge className="border-none bg-white/20 px-3 py-1 text-white hover:bg-white/30">
                                Student Portal
                            </Badge>
                            <h1 className="page-title">
                                Welcome back, {student?.name || 'Student'}! 👋
                            </h1>
                            <p className="max-w-lg text-lg text-indigo-100/90">
                                You've completed{' '}
                                {stats?.total_lessons_completed || 0} lessons so
                                far. Ready to continue your learning journey and
                                unlock more achievements?
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button
                                    asChild
                                    className="h-12 border-none bg-white px-8 font-bold text-indigo-600 shadow-lg transition-transform hover:scale-105 hover:bg-indigo-50"
                                >
                                    <Link href="/student/enrollments">
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        Continue Learning
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-12 border-white/30 bg-white/10 px-8 font-semibold text-white backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white/20"
                                >
                                    <Link href="/student/courses">
                                        <Search className="mr-2 h-5 w-5" />
                                        Browse New Courses
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Hero Stats Circle */}
                        <div className="hidden items-center justify-center lg:flex">
                            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-inner backdrop-blur-md">
                                <div className="text-center">
                                    <span className="block text-4xl font-black text-white">
                                        {stats?.average_score || 0}%
                                    </span>
                                    <span className="text-xs font-bold tracking-widest text-indigo-200 uppercase">
                                        Avg Score
                                    </span>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-2 -right-2 flex h-12 w-12 rotate-12 transform animate-pulse items-center justify-center rounded-full bg-yellow-400 shadow-lg">
                                    <Star className="h-6 w-6 fill-current text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-white/10 opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/30 opacity-50 blur-3xl"></div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    <Card className="group border-none bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
                                    {stats?.in_progress_courses || 0} Active
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">
                                    {stats?.enrolled_courses || 0}
                                </div>
                                <div className="text-sm font-semibold text-slate-500">
                                    Enrolled Courses
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group border-none bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 transition-colors duration-300 group-hover:bg-amber-600 group-hover:text-white">
                                    <Award className="h-6 w-6" />
                                </div>
                                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600">
                                    New Badge!
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">
                                    {stats?.certificates_earned || 0}
                                </div>
                                <div className="text-sm font-semibold text-slate-500">
                                    Certificates
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group border-none bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                                    {stats?.completed_courses || 0} Done
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">
                                    {stats?.total_lessons_completed || 0}
                                </div>
                                <div className="text-sm font-semibold text-slate-500">
                                    Lessons Completed
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group border-none bg-white shadow-md transition-all duration-300 hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 transition-colors duration-300 group-hover:bg-rose-600 group-hover:text-white">
                                    <Target className="h-6 w-6" />
                                </div>
                                <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">
                                    Top 5%
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">
                                    {stats?.average_score || 0}%
                                </div>
                                <div className="text-sm font-semibold text-slate-500">
                                    Avg Quiz Score
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
                    {/* My Enrolled Courses - Taking more space */}
                    <div className="space-y-6 xl:col-span-3">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-slate-800">
                                My Learning Path
                            </h2>
                            <Link
                                href="/student/enrollments"
                                className="text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800"
                            >
                                View all courses →
                            </Link>
                        </div>

                        {enrolled_courses.length > 0 ? (
                            <div
                                className={clsx(
                                    'grid gap-6',
                                    enrolled_courses.length === 1
                                        ? 'grid-cols-1'
                                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2',
                                )}
                            >
                                {enrolled_courses.map(
                                    (course: any, index: number) => {
                                        const progressVal = Number(
                                            course.progress || 0,
                                        );
                                        return (
                                            <Card
                                                key={index}
                                                className="group overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-xl"
                                            >
                                                <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                                <CardContent className="p-6">
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-bold text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                                                            {course.title?.charAt(
                                                                0,
                                                            ) || 'C'}
                                                        </div>
                                                        {getCourseStatusBadge(
                                                            course.status,
                                                        )}
                                                    </div>

                                                    <h3 className="line-clamp-1 text-lg font-bold text-slate-800 transition-colors duration-300 group-hover:text-indigo-600">
                                                        {course.title}
                                                    </h3>
                                                    <p className="mb-6 text-sm text-slate-500">
                                                        by{' '}
                                                        {course.instructor_name}
                                                    </p>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between text-sm font-bold text-slate-700">
                                                            <span>
                                                                Course Progress
                                                            </span>
                                                            <span>
                                                                {progressVal.toFixed(
                                                                    0,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className={clsx(
                                                                    'h-full transition-all duration-1000 ease-out',
                                                                    getProgressColor(
                                                                        progressVal,
                                                                    ),
                                                                )}
                                                                style={{
                                                                    width: `${progressVal}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2">
                                                            <span className="text-xs font-semibold text-slate-500">
                                                                {course.completed_lessons ||
                                                                    0}
                                                                /
                                                                {course.total_lessons ||
                                                                    0}{' '}
                                                                Lessons
                                                            </span>
                                                            {course.status === 'Refunded' ? (
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    className="border-none bg-rose-50 font-bold text-rose-600 shadow-none hover:bg-rose-100 hover:text-rose-700"
                                                                >
                                                                    <Link href="/student/courses">
                                                                        Re-enroll{' '}
                                                                        <RotateCcw className="ml-2 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            ) : course.status === 'Refund Requested' ? (
                                                                <Button
                                                                    size="sm"
                                                                    disabled
                                                                    className="border-none bg-amber-50 font-bold text-amber-600 shadow-none"
                                                                >
                                                                    Refund Pending{' '}
                                                                    <Clock className="ml-2 h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    className="border-none bg-indigo-50 font-bold text-indigo-600 shadow-none hover:bg-indigo-600 hover:text-white"
                                                                >
                                                                    <Link
                                                                        href={`/student/enrollments/${course.enrollment_id}`}
                                                                    >
                                                                        Continue{' '}
                                                                        <PlayCircle className="ml-2 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    },
                                )}
                            </div>
                        ) : (
                            <Card className="border-2 border-dashed bg-slate-50/50">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                                        <BookOpen className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        No courses enrolled yet
                                    </h3>
                                    <p className="mt-2 mb-8 max-w-xs text-slate-500">
                                        Start your learning journey by browsing
                                        our high-quality course catalog.
                                    </p>
                                    <Button
                                        asChild
                                        className="h-12 bg-indigo-600 px-8 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                                    >
                                        <Link href="/student/courses">
                                            Explore Courses
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar: Activity & Certificates */}
                    <div className="space-y-8">
                        {/* Recent Activity */}
                        <Card className="overflow-hidden border-none shadow-md">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                    <PlayCircle className="h-5 w-5 text-indigo-600" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recent_activity.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {recent_activity.map(
                                            (activity: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="group cursor-default p-4 transition-colors hover:bg-slate-50"
                                                >
                                                    <div className="flex gap-4">
                                                        <div
                                                            className={clsx(
                                                                'mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                                                                activity.type ===
                                                                    'lesson'
                                                                    ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                                                                    : activity.type ===
                                                                        'quiz'
                                                                      ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                                                                      : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
                                                            )}
                                                        >
                                                            {activity.type ===
                                                                'lesson' && (
                                                                <PlayCircle className="h-4 w-4" />
                                                            )}
                                                            {activity.type ===
                                                                'quiz' && (
                                                                <Target className="h-4 w-4" />
                                                            )}
                                                            {activity.type ===
                                                                'assignment' && (
                                                                <CheckCircle className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="line-clamp-1 text-sm font-bold text-slate-800">
                                                                {activity.title}
                                                            </p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-semibold text-slate-500">
                                                                    {
                                                                        activity.course_name
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                                                                    {
                                                                        activity.completed_at
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-slate-400 italic">
                                        No recent activity
                                    </div>
                                )}
                                <div className="bg-slate-50/50 p-4 text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-0 text-xs font-bold text-indigo-600 hover:bg-transparent hover:text-indigo-800"
                                    >
                                        View All Activity
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certificates Preview */}
                        <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                    <Award className="h-5 w-5 text-amber-400" />
                                    My Certificates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {certificates.length > 0 ? (
                                    <div className="space-y-4 pt-2">
                                        {certificates
                                            .slice(0, 2)
                                            .map((cert: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="group cursor-pointer rounded-xl border border-white/5 bg-white/10 p-3 transition-all hover:bg-white/20"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400 transition-transform group-hover:scale-110">
                                                            <Award className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="line-clamp-1 text-xs font-bold">
                                                                {
                                                                    cert.course_title
                                                                }
                                                            </p>
                                                            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                                {cert.issued_at}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        <Button className="mt-2 w-full border-none bg-amber-400 font-bold text-slate-900 hover:bg-amber-500">
                                            View All Certificates
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                            <Award className="h-8 w-8 text-slate-600" />
                                        </div>
                                        <p className="px-4 text-xs font-medium text-slate-400">
                                            Complete your first course to earn a
                                            certificate!
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
