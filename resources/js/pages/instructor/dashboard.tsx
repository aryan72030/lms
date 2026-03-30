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
    BarChart3
} from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
    instructor 
}: Props) {
    const getCourseStatusColor = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Draft': return 'bg-slate-50 text-slate-700 border-slate-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/instructor/dashboard' }]}>
            <Head title="Instructor Dashboard" />

            <div className="space-y-8 pb-12">
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Instructor Hub</h1>
                        <p className="text-slate-500 font-medium mt-1">Welcome back, {instructor.name}! Here's your teaching overview.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/instructor/courses/create">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]">
                                <Plus className="h-4 w-4 mr-2" />
                                New Course
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Earnings Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Revenue</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">${stats.monthly_earnings}</div>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Current Month</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending (Potential)</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">${stats.pending_payments}</div>
                            <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">{stats.abandoned_carts_count} Unpaid Enrollments</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Failed Revenue</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">${stats.failed_payments}</div>
                            <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-tighter">Lost Opportunities</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">{stats.total_students}</div>
                            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">{stats.active_students} Active Right Now</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Enrollments */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-600" />
                                Recent Enrollments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_enrollments.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {recent_enrollments.map((enrollment: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {enrollment.student_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{enrollment.student_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{enrollment.course_title}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">Active</Badge>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{enrollment.enrolled_at}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400 font-bold italic">No recent enrollments</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Performing Courses */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {top_courses.length > 0 ? (
                                top_courses.map((course: any, index: number) => (
                                    <div key={index} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 truncate pr-4">{course.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{course.students_count} Students</p>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600">${course.total_earnings}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                                <span>Completion Rate</span>
                                                <span>{course.completion_rate}%</span>
                                            </div>
                                            <Progress value={course.completion_rate} className="h-1.5 bg-slate-100" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-400 font-bold italic">No data available</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Content Stats Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Lessons</p>
                            <h4 className="text-2xl font-black text-blue-700">{stats.total_lessons}</h4>
                        </div>
                        <BookOpen className="h-8 w-8 text-blue-200" />
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Quizzes</p>
                            <h4 className="text-2xl font-black text-emerald-700">{stats.total_quizzes}</h4>
                        </div>
                        <HelpCircle className="h-8 w-8 text-emerald-200" />
                    </div>
                    <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Assignments</p>
                            <h4 className="text-2xl font-black text-purple-700">{stats.total_assignments}</h4>
                        </div>
                        <ClipboardList className="h-8 w-8 text-purple-200" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
