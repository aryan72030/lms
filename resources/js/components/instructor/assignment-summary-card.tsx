import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Users, 
    CheckCircle, 
    Clock, 
    Award, 
    TrendingUp, 
    AlertCircle,
    Eye
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface AssignmentSummaryProps {
    assignment: {
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
    };
}

export function AssignmentSummaryCard({ assignment }: AssignmentSummaryProps) {
    const pendingGrades = assignment.submitted_count - assignment.graded_count;
    const notSubmitted = assignment.submissions_count - assignment.submitted_count;
    
    const getStatusColor = () => {
        if (!assignment.is_published) return 'bg-yellow-50 border-yellow-200';
        if (pendingGrades > 0) return 'bg-orange-50 border-orange-200';
        if (assignment.submitted_count === assignment.submissions_count) return 'bg-green-50 border-green-200';
        return 'bg-blue-50 border-blue-200';
    };

    const getStatusMessage = () => {
        if (!assignment.is_published) return '📝 Draft - Students can\'t see yet';
        if (pendingGrades > 0) return `⏳ ${pendingGrades} submissions need grading`;
        if (notSubmitted > 0) return `📋 ${notSubmitted} students haven't submitted`;
        return '✅ All submissions graded';
    };

    return (
        <Card className={`transition-all hover:shadow-md ${getStatusColor()}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {assignment.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-2">
                            📚 {assignment.course.title}
                        </p>
                        <div className="flex items-center gap-2">
                            <Badge variant={assignment.is_published ? 'default' : 'outline'} className="text-xs">
                                {assignment.is_published ? '🟢 Published' : '🟡 Draft'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {assignment.due_days} days duration
                            </span>
                        </div>
                    </div>
                    <Link href={`/instructor/assignments/${assignment.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Grade
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0">
                {/* Status Message */}
                <div className="mb-4 p-2 rounded-md bg-white/50 border border-white/20">
                    <p className="text-sm font-medium text-gray-700">
                        {getStatusMessage()}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-white/50 rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-gray-600">Total Students</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                            {assignment.submissions_count}
                        </div>
                    </div>
                    
                    <div className="text-center p-2 bg-white/50 rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-gray-600">Submitted</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                            {assignment.submitted_count}
                        </div>
                    </div>
                    
                    <div className="text-center p-2 bg-white/50 rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Award className="h-3 w-3 text-purple-600" />
                            <span className="text-xs text-gray-600">Graded</span>
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                            {assignment.graded_count}
                        </div>
                    </div>
                    
                    <div className="text-center p-2 bg-white/50 rounded-md">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-gray-600">Pending</span>
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                            {pendingGrades}
                        </div>
                    </div>
                </div>

                {/* Assignment Details */}
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                        <span>Max Score:</span>
                        <span className="font-medium">{assignment.max_score} marks</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Passing Score:</span>
                        <span className="font-medium">{assignment.passing_score}% ({Math.round((assignment.max_score * assignment.passing_score) / 100)} marks)</span>
                    </div>
                    {assignment.average_score && (
                        <div className="flex justify-between">
                            <span>Average Score:</span>
                            <span className="font-medium">{assignment.average_score.toFixed(1)}/100</span>
                        </div>
                    )}
                    {assignment.pass_rate !== undefined && (
                        <div className="flex justify-between">
                            <span>Pass Rate:</span>
                            <span className={`font-medium ${assignment.pass_rate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                {assignment.pass_rate.toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Needed Alert */}
                {pendingGrades > 0 && (
                    <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">
                                {pendingGrades} submissions waiting for your grade
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}