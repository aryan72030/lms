import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Award,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Assignment {
    id: number;
    title: string;
    description: string;
    assignment_type: 'text' | 'file' | 'mixed';
    allowed_file_types: string[];
    max_file_size_mb: number;
    max_files: number;
    max_score: number;
    due_days: number;
    passing_score: number;
    course: {
        id: number;
        title: string;
        instructor: {
            id: number;
            name: string;
        };
    };
    submission: {
        id: number;
        status: string;
        score: number | null;
        percentage: number | null;
        submitted_at: string | null;
        graded_at: string | null;
        is_submitted: boolean;
        is_graded: boolean;
    } | null;
}

interface Props {
    assignments: Assignment[];
}

export default function AssignmentIndex({ assignments }: Props) {
    const getStatusBadge = (assignment: Assignment) => {
        if (!assignment.submission) {
            return (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    Not Started
                </Badge>
            );
        }

        const { submission } = assignment;

        if (submission.is_graded) {
            const passed = submission.percentage && submission.percentage >= (assignment.passing_score || 70);
            return (
                <Badge className={`font-semibold ${
                    passed 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                    {passed ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                    ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Needs Work</>
                    )}
                </Badge>
            );
        }

        if (submission.is_submitted) {
            return (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                    <Clock className="h-3 w-3 mr-1" />
                    Under Review
                </Badge>
            );
        }

        return (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
            </Badge>
        );
    };

    const getStatusIcon = (assignment: Assignment) => {
        if (!assignment.submission) {
            return <Clock className="h-4 w-4 text-gray-500" />;
        }

        const { submission } = assignment;

        if (submission.is_graded) {
            const passed = submission.percentage && submission.percentage >= (assignment.passing_score || 70);
            return passed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500" />
            );
        }

        if (submission.is_submitted) {
            return <Clock className="h-4 w-4 text-orange-500" />;
        }

        return <Clock className="h-4 w-4 text-blue-500" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Assignments', href: '#' },
            ]}
        >
            <Head title="Assignments" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="page-title">Assignments</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Total Assignments:</span>
                        <Badge variant="secondary" className="font-bold">
                            {assignments.length}
                        </Badge>
                    </div>
                </div>

                {/* Stats Cards */}

                {/* Assignments List */}
                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    No assignments yet
                                </h3>
                                <p className="mt-2 text-gray-600">
                                    Assignments will appear here when your instructors create them.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        assignments.map((assignment) => (
                            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusIcon(assignment)}
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {assignment.title}
                                                </h3>
                                                {getStatusBadge(assignment)}
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                                    {assignment.assignment_type === 'text' && '📝 Text'}
                                                    {assignment.assignment_type === 'file' && '📎 File Upload'}
                                                    {assignment.assignment_type === 'mixed' && '📝📎 Mixed'}
                                                    {!assignment.assignment_type && '📝 Standard'}
                                                </Badge>
                                            </div>

                                            <p className="text-gray-600 mb-3 line-clamp-2">
                                                {assignment.description}
                                            </p>

                                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="h-4 w-4" />
                                                    <span>{assignment.course.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Award className="h-4 w-4" />
                                                    <span>{assignment.max_score} points</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{assignment.due_days} days to complete</span>
                                                </div>
                                            </div>

                                            {assignment.submission?.is_graded && (
                                                <div className="mt-3 p-3 rounded-lg border">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {assignment.submission.percentage && assignment.submission.percentage >= (assignment.passing_score || 70) ? (
                                                                <div className="flex items-center gap-1 text-green-700">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    <span className="font-semibold">PASSED</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-red-700">
                                                                    <XCircle className="h-4 w-4" />
                                                                    <span className="font-semibold">NEEDS WORK</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-gray-900">
                                                            {assignment.submission.score}/{assignment.max_score} ({assignment.submission.percentage ? Number(assignment.submission.percentage).toFixed(1) : '0.0'}%)
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Graded on {formatDate(assignment.submission.graded_at!)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4">
                                            <Link href={`/student/assignments/${assignment.id}`}>
                                                <Button>
                                                    {assignment.submission?.is_submitted ? 'View' : 'Start'}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}