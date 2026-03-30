import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Users, BookOpen, CheckCircle, DollarSign } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';

interface Student {
    id: number;
    name: string;
    email: string;
}

interface Course {
    id: number;
    title: string;
    price: number;
}

interface Enrollment {
    id: number;
    student: Student;
    course: Course;
    enrollment_date: string;
    payment_status: string;
    payment_status_label: string;
    payment_status_color: string;
    status: string;
    status_label: string;
    status_color: string;
    progress: number;
    completion_date: string | null;
    created_at: string;
}

interface Props {
    enrollments: {
        data: Enrollment[];
        links: any[];
        meta: any;
    };
    courses: Array<{
        id: number;
        title: string;
    }>;
    stats: {
        total_enrollments: number;
        active_enrollments: number;
        completed_enrollments: number;
        total_revenue: number;
    };
    filters: {
        search?: string;
        course_id?: string;
        status?: string;
        payment_status?: string;
    };
    statuses: Record<string, string>;
    paymentStatuses: Record<string, string>;
}

export default function InstructorEnrollmentsIndex({ 
    enrollments, 
    courses, 
    stats, 
    filters, 
    statuses, 
    paymentStatuses 
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [courseFilter, setCourseFilter] = useState(filters.course_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status || '');

    const handleSearch = () => {
        router.get('/instructor/enrollments', {
            search: search || undefined,
            course_id: courseFilter || undefined,
            status: statusFilter || undefined,
            payment_status: paymentStatusFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getStatusBadgeClass = (color: string) => {
        const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';

        switch (color) {
            case 'green': return `${baseClass} bg-green-100 text-green-800`;
            case 'blue': return `${baseClass} bg-blue-100 text-blue-800`;
            case 'yellow': return `${baseClass} bg-yellow-100 text-yellow-800`;
            case 'red': return `${baseClass} bg-red-100 text-red-800`;
            case 'orange': return `${baseClass} bg-orange-100 text-orange-800`;
            default: return `${baseClass} bg-gray-100 text-gray-800`;
        }
    };

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (value: any, enrollment: Enrollment) => (
                <div>
                    <div className="font-medium text-gray-900">{enrollment.student.name}</div>
                    <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                </div>
            )
        },
        {
            key: 'course',
            label: 'Course',
            render: (value: any, enrollment: Enrollment) => (
                <div>
                    <div className="font-medium text-gray-900">{enrollment.course.title}</div>
                    <div className="text-sm text-gray-500">${enrollment.course.price}</div>
                </div>
            )
        },
        {
            key: 'enrollment_date',
            label: 'Enrolled',
            render: (value: string) => (
                <span className="text-sm text-gray-500">{value}</span>
            )
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (value: number, enrollment: Enrollment) => (
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${value}%` }}
                            ></div>
                        </div>
                        <span className="text-sm text-gray-600">{value}%</span>
                    </div>
                    {enrollment.completion_date && (
                        <div className="text-xs text-green-600 mt-1">
                            Completed: {enrollment.completion_date}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (value: string, enrollment: Enrollment) => (
                <div className="space-y-1">
                    <span className={getStatusBadgeClass(enrollment.status_color)}>
                        {enrollment.status_label}
                    </span>
                    <div>
                        <span className={getStatusBadgeClass(enrollment.payment_status_color)}>
                            {enrollment.payment_status_label}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (value: any, enrollment: Enrollment) => (
                <ActionButtonGroup>
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        href={`/instructor/enrollments/${enrollment.id}`}
                        title="View Details"
                    />
                </ActionButtonGroup>
            )
        }
    ];

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'Student Enrollments', href: '/instructor/enrollments' }
        ]}>
            <Head title="Student Enrollments" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Enrollments</h1>
                        <p className="text-gray-600">Manage and track your students' progress</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Enrollments</p>
                                    <p className="text-xl font-bold">{stats.total_enrollments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Active Students</p>
                                    <p className="text-xl font-bold">{stats.active_enrollments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="text-xl font-bold">{stats.completed_enrollments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Revenue</p>
                                    <p className="text-xl font-bold">${(stats.total_revenue || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Search students or courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        />
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(statuses).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">All Payment Status</option>
                            {Object.entries(paymentStatuses).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <Button onClick={handleSearch} className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>

                {/* Enrollments Table */}
                <DataTable
                    columns={columns}
                    data={enrollments.data}
                    title={`Student Enrollments (${enrollments.meta?.total || 0})`}
                    emptyMessage="No enrollments found"
                    paginationLinks={enrollments.links}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </AppLayout>
    );
}
