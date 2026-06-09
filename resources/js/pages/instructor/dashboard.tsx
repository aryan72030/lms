import { Head, Link } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Clock,
    FileText,
    GraduationCap,
    TrendingUp,
    Users,
    DollarSign,
    Plus,
    HelpCircle,
    ClipboardList,
    BarChart3,
    AlertCircle,
} from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AssignmentSummaryCard } from '@/components/instructor/assignment-summary-card';
import AppLayout from '@/layouts/app-layout';

interface Props {
    stats: {
        total_courses: number;
        published_courses: number;
        draft_courses: number;
        pending_courses: number;
        total_students: number;
        active_students: number;
        completed_students: number;
        total_earnings: number;
        monthly_earnings: number;
        pending_payments: number;
        failed_payments: number;
        abandoned_carts_count: number;
        total_lessons: number;
        total_quizzes: number;
        total_assignments: number;
    };
    my_courses: Array<any>;
    recent_enrollments: Array<any>;
    recent_activity: Array<any>;
    top_courses: Array<any>;
    recent_payments: Array<any>;
    recent_assignments?: Array<{
        id: number;
        title: string;
        course: {
            title: string;
        };
        max_score: number;
        passing_score: number;
        submissions_count: number;
        submitted_count: number;
        graded_count: number;
        is_published: boolean;
        due_days: number;
        average_score?: number;
        pass_rate?: number;
    }>;
    instructor: {
        id: number;
        name: string;
        email: string;
    };
}

export default function InstructorDashboard({
    stats,
    my_courses,
    recent_enrollments,
    recent_activity,
    top_courses,
    recent_assignments,
    instructor,
}: Props) {
    const getCourseStatusColor = (status: string) => {
        switch (status) {
            case 'Published':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Pending':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Draft':
                return 'bg-slate-50 text-slate-700 border-slate-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
            ]}
        >
            <Head title="Instructor Dashboard" />

            <div className="space-y-8 pb-12">
                {/* Welcome Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="page-title text-slate-900">
                            Instructor Hub
                        </h1>
                        <p className="mt-1 font-medium text-slate-500">
                            Welcome back, {instructor.name}! Here's your
                            teaching overview.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/instructor/courses/create">
                            <Button variant="create">
                                <Plus className="mr-2 h-4 w-4" />
                                New Course
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Earnings Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Monthly Revenue
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                ${stats.monthly_earnings}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-emerald-600 uppercase">
                                Current Month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Pending (Potential)
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                ${stats.pending_payments}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-amber-600 uppercase">
                                {stats.abandoned_carts_count} Unpaid Enrollments
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Failed Revenue
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                ${stats.failed_payments}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-rose-600 uppercase">
                                Lost Opportunities
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Total Students
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.total_students}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-blue-600 uppercase">
                                {stats.active_students} Active Right Now
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Enrollment Stats */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Total Enrollments
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.total_students}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-blue-600 uppercase">
                                All Time
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Active Students
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.active_students}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-emerald-600 uppercase">
                                Currently Learning
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Completed
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                <Award className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.completed_students}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-purple-600 uppercase">
                                Finished Courses
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white shadow-md transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Total Revenue
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">
                                ${stats.total_earnings}
                            </div>
                            <p className="mt-1 text-[10px] font-bold tracking-tighter text-orange-600 uppercase">
                                All Time Earnings
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignment Overview - Only show if there are assignments */}
                {recent_assignments && recent_assignments.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    📝 Assignment Overview
                                </h2>
                                <p className="text-sm text-gray-600">
                                    See how your assignments are performing and what needs attention
                                </p>
                            </div>
                            <Link href="/instructor/assignments">
                                <Button variant="outline" size="sm">
                                    View All Assignments
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recent_assignments.slice(0, 6).map((assignment) => (
                                <AssignmentSummaryCard 
                                    key={assignment.id} 
                                    assignment={assignment} 
                                />
                            ))}
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium text-orange-800">Need Grading</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-600">
                                    {recent_assignments.reduce((sum, a) => sum + (a.submitted_count - a.graded_count), 0)}
                                </div>
                                <div className="text-xs text-orange-600">submissions waiting</div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <ClipboardList className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Published</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {recent_assignments.filter(a => a.is_published).length}
                                </div>
                                <div className="text-xs text-blue-600">assignments live</div>
                            </div>
                            
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">Total Students</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {recent_assignments.reduce((sum, a) => sum + a.submissions_count, 0)}
                                </div>
                                <div className="text-xs text-green-600">across all assignments</div>
                            </div>
                            
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <Award className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-800">Completion</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {recent_assignments.length > 0 ? 
                                        Math.round((recent_assignments.reduce((sum, a) => sum + a.submitted_count, 0) / 
                                        recent_assignments.reduce((sum, a) => sum + a.submissions_count, 0)) * 100) || 0 : 0}%
                                </div>
                                <div className="text-xs text-purple-600">submission rate</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Recent Enrollments */}
                    <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                            <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-800 uppercase">
                                <Users className="h-4 w-4 text-indigo-600" />
                                Recent Enrollments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_enrollments.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {recent_enrollments.map(
                                        (enrollment: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                                                        {enrollment.student_name.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {
                                                                enrollment.student_name
                                                            }
                                                        </p>
                                                        <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                                                            {
                                                                enrollment.course_title
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="border-none bg-emerald-50 text-[10px] font-bold text-emerald-600">
                                                        Active
                                                    </Badge>
                                                    <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                                        {enrollment.enrolled_at || enrollment.date}
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div className="p-12 text-center font-bold text-slate-400 italic">
                                    No recent enrollments
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Performing Courses */}
                    <Card className="overflow-hidden rounded-3xl border-none bg-white shadow-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                            <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-800 uppercase">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            {top_courses.length > 0 ? (
                                top_courses.map(
                                    (course: any, index: number) => (
                                        <div key={index} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="truncate pr-4 text-sm font-bold text-slate-800">
                                                        {course.title}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {course.students_count}{' '}
                                                        Students
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-indigo-600">
                                                    ${course.total_earnings}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                                                    <span>Completion Rate</span>
                                                    <span>
                                                        {course.completion_rate}
                                                        %
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        course.completion_rate
                                                    }
                                                    className="h-1.5 bg-slate-100"
                                                />
                                            </div>
                                        </div>
                                    ),
                                )
                            ) : (
                                <div className="p-6 text-center font-bold text-slate-400 italic">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Content Stats Footer */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-blue-50 p-6">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                                Total Lessons
                            </p>
                            <h4 className="text-2xl font-black text-blue-700">
                                {stats.total_lessons}
                            </h4>
                        </div>
                        <BookOpen className="h-8 w-8 text-blue-200" />
                    </div>
                    <div className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                                Quizzes
                            </p>
                            <h4 className="text-2xl font-black text-emerald-700">
                                {stats.total_quizzes}
                            </h4>
                        </div>
                        <HelpCircle className="h-8 w-8 text-emerald-200" />
                    </div>
                    <div className="flex items-center justify-between rounded-3xl border border-purple-100 bg-purple-50 p-6">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-purple-400 uppercase">
                                Assignments
                            </p>
                            <h4 className="text-2xl font-black text-purple-700">
                                {stats.total_assignments}
                            </h4>
                        </div>
                        <ClipboardList className="h-8 w-8 text-purple-200" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
