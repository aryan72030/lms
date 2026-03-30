import { Head, Link } from '@inertiajs/react';
import { BookOpen, Award, Target, PlayCircle, CheckCircle, Star, Search } from 'lucide-react';
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
                return <Badge className="bg-emerald-100 text-emerald-800 border-none">Completed</Badge>;
            case 'In Progress':
                return <Badge className="bg-indigo-100 text-indigo-800 border-none">In Progress</Badge>;
            case 'Not Started':
                return <Badge className="bg-slate-100 text-slate-800 border-none">Not Started</Badge>;
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
                            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1">
                                Student Portal
                            </Badge>
                            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                                Welcome back, {student?.name || 'Student'}! 👋
                            </h1>
                            <p className="text-lg text-indigo-100/90 max-w-lg">
                                You've completed {stats?.total_lessons_completed || 0} lessons so far. 
                                Ready to continue your learning journey and unlock more achievements?
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 border-none font-bold shadow-lg h-12 px-8 transition-transform hover:scale-105">
                                    <Link href="/student/enrollments">
                                        <PlayCircle className="mr-2 h-5 w-5" />
                                        Continue Learning
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 px-8 font-semibold backdrop-blur-sm transition-transform hover:scale-105">
                                    <Link href="/student/courses">
                                        <Search className="mr-2 h-5 w-5" />
                                        Browse New Courses
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Hero Stats Circle */}
                        <div className="hidden lg:flex items-center justify-center">
                            <div className="relative h-48 w-48 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                                <div className="text-center">
                                    <span className="block text-4xl font-black text-white">{stats?.average_score || 0}%</span>
                                    <span className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Avg Score</span>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg transform rotate-12 animate-pulse">
                                    <Star className="h-6 w-6 text-white fill-current" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-white/10 blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl opacity-50"></div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    {stats?.in_progress_courses || 0} Active
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">{stats?.enrolled_courses || 0}</div>
                                <div className="text-sm font-semibold text-slate-500">Enrolled Courses</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                    <Award className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                    New Badge!
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">{stats?.certificates_earned || 0}</div>
                                <div className="text-sm font-semibold text-slate-500">Certificates</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    {stats?.completed_courses || 0} Done
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">{stats?.total_lessons_completed || 0}</div>
                                <div className="text-sm font-semibold text-slate-500">Lessons Completed</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                    <Target className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                                    Top 5%
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="text-3xl font-black text-slate-800">{stats?.average_score || 0}%</div>
                                <div className="text-sm font-semibold text-slate-500">Avg Quiz Score</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* My Enrolled Courses - Taking more space */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-bold text-slate-800">Learning in Progress</h2>
                            <Link href="/student/enrollments" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                View all courses →
                            </Link>
                        </div>
                        
                        {enrolled_courses.length > 0 ? (
                            <div className={clsx(
                                "grid gap-6",
                                enrolled_courses.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                            )}>
                                {enrolled_courses.map((course: any, index: number) => {
                                    const progressVal = Number(course.progress || 0);
                                    return (
                                        <Card key={index} className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                            <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                        {course.title?.charAt(0) || 'C'}
                                                    </div>
                                                    {getCourseStatusBadge(course.status)}
                                                </div>
                                                
                                                <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 mb-6">by {course.instructor_name}</p>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex justify-between text-sm font-bold text-slate-700">
                                                        <span>Course Progress</span>
                                                        <span>{progressVal.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={clsx(
                                                                "h-full transition-all duration-1000 ease-out",
                                                                getProgressColor(progressVal)
                                                            )}
                                                            style={{ width: `${progressVal}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2">
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {course.completed_lessons || 0}/{course.total_lessons || 0} Lessons
                                                        </span>
                                                        <Button asChild size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-none shadow-none font-bold">
                                                            <Link href={`/student/enrollments/${course.id}`}>
                                                                Continue <PlayCircle className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="border-dashed border-2 bg-slate-50/50">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                        <BookOpen className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">No courses enrolled yet</h3>
                                    <p className="text-slate-500 max-w-xs mt-2 mb-8">
                                        Start your learning journey by browsing our high-quality course catalog.
                                    </p>
                                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold shadow-lg shadow-indigo-200">
                                        <Link href="/student/courses">Explore Courses</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar: Activity & Certificates */}
                    <div className="space-y-8">
                        {/* Recent Activity */}
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <PlayCircle className="h-5 w-5 text-indigo-600" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recent_activity.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {recent_activity.map((activity: any, index: number) => (
                                            <div key={index} className="p-4 hover:bg-slate-50 transition-colors group cursor-default">
                                                <div className="flex gap-4">
                                                    <div className={clsx(
                                                        "mt-1 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                        activity.type === 'lesson' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 
                                                        activity.type === 'quiz' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 
                                                        'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                                                    )}>
                                                        {activity.type === 'lesson' && <PlayCircle className="h-4 w-4" />}
                                                        {activity.type === 'quiz' && <Target className="h-4 w-4" />}
                                                        {activity.type === 'assignment' && <CheckCircle className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{activity.title}</p>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-semibold text-slate-500">{activity.course_name}</span>
                                                            <span className="text-[10px] uppercase tracking-tighter font-bold text-slate-400">{activity.completed_at}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">No recent activity</div>
                                )}
                                <div className="p-4 bg-slate-50/50 text-center">
                                    <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-transparent p-0">
                                        View All Activity
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certificates Preview */}
                        <Card className="border-none shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-400" />
                                    My Certificates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {certificates.length > 0 ? (
                                    <div className="space-y-4 pt-2">
                                        {certificates.slice(0, 2).map((cert: any, index: number) => (
                                            <div key={index} className="bg-white/10 rounded-xl p-3 border border-white/5 hover:bg-white/20 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                                        <Award className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold line-clamp-1">{cert.course_title}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{cert.issued_at}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold mt-2 border-none">
                                            View All Certificates
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Award className="h-8 w-8 text-slate-600" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium px-4">
                                            Complete your first course to earn a certificate!
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
