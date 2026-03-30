import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    BookOpen, 
    Clock, 
    DollarSign, 
    UserCheck, 
    TrendingUp, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface AdminDashboardProps {
    stats: {
        total_users: number;
        total_admins: number;
        total_instructors: number;
        total_students: number;
        total_courses: number;
        published_courses: number;
        pending_courses: number;
        draft_courses: number;
        total_enrollments: number;
        active_enrollments: number;
        completed_enrollments: number;
        total_revenue: number;
        monthly_revenue: number;
        pending_payments: number;
        failed_payments: number;
    };
    recent_users: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        created_at_human: string;
    }>;
    recent_courses: Array<any>;
    recent_enrollments: Array<any>;
    recent_payments: Array<any>;
    pending_approvals: Array<any>;
}

export default function AdminDashboard({
    stats,
    recent_users,
    recent_courses,
    recent_enrollments,
    recent_payments,
    pending_approvals,
}: AdminDashboardProps) {
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Admin':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Instructor':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Student':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }]}>
            <Head title="Admin Dashboard" />
            
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h1>
                        <p className="text-slate-500 font-medium mt-1">System-wide overview and management metrics.</p>
                    </div>
                </div>

                {/* Main Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Users */}
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Users</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">{stats.total_users}</div>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                {stats.total_instructors} Instructors • {stats.total_students} Students
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Courses */}
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Courses</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <BookOpen className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">{stats.total_courses}</div>
                            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">
                                {stats.published_courses} Published • {stats.pending_courses} Pending
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Enrollments */}
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrollments</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">{stats.total_enrollments}</div>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">
                                {stats.active_enrollments} Active • {stats.completed_enrollments} Completed
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Revenue */}
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-800">${stats.total_revenue}</div>
                            <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">
                                ${stats.monthly_revenue} this month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course Approval Queue */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Pending Approvals
                            </CardTitle>
                            <Link href="/admin/courses?status=Review" className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">
                                View All
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pending_approvals.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pending_approvals.map((course: any) => (
                                        <div key={course.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                                                    {course.title.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{course.title}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">by {course.instructor_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{course.submitted_at}</span>
                                                <Link href="/admin/courses">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-100 hover:text-amber-700">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">All caught up!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent User Registrations */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-600" />
                                Recent Users
                            </CardTitle>
                            <Link href="/admin/users" className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">
                                View All
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_users.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recent_users.map((user) => (
                                        <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <Badge className={`text-[9px] font-black uppercase px-2 py-0 border ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </Badge>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{user.created_at_human}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">No recent users</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Enrollments */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                New Enrollments
                            </CardTitle>
                            <Link href="/admin/enrollments" className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">
                                View All
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_enrollments.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recent_enrollments.map((enrollment: any, index: number) => (
                                        <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                    {enrollment.student_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{enrollment.student_name}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{enrollment.course_title}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={`text-[9px] font-black uppercase px-2 py-0 border ${enrollment.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                                    {enrollment.status}
                                                </Badge>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{enrollment.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">No enrollments yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-amber-600" />
                                Recent Sales
                            </CardTitle>
                            <Link href="/admin/payments" className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">
                                View All
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_payments.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recent_payments.map((payment: any, index: number) => (
                                        <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                                                    $
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{payment.student_name}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{payment.course_title}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-800">${payment.amount}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{payment.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">No sales yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}