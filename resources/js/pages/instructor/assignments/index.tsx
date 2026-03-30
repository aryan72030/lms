import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, Clock, ArrowRight, CheckCircle, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface Assignment {
    id: number;
    title: string;
    course_title: string;
    submissions_count: number;
    pending_count: number;
}

interface Props {
    assignments: Assignment[];
}

export default function AssignmentsIndex({ assignments }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAssignments = assignments.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/instructor/dashboard' }, { title: 'Assignments', href: '#' }]}>
            <Head title="Assignment Management" />

            <div className="space-y-6">
                {/* Simple Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Total Pending:</span>
                        <Badge variant="secondary" className="font-bold">
                            {assignments.reduce((acc, curr) => acc + curr.pending_count, 0)}
                        </Badge>
                    </div>
                </div>

                {/* Simple Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search assignments..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Simple Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.length > 0 ? (
                        filteredAssignments.map((assignment) => (
                            <Card key={assignment.id} className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={assignment.pending_count > 0 ? "destructive" : "outline"}>
                                            {assignment.pending_count > 0 ? `${assignment.pending_count} Needs Grading` : 'All Graded'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-semibold">{assignment.title}</CardTitle>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {assignment.course_title}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm text-gray-600 border-t pt-4">
                                        <span>Submissions: <strong>{assignment.submissions_count}</strong></span>
                                        <span>Pending: <strong>{assignment.pending_count}</strong></span>
                                    </div>
                                    <Link href={`/instructor/assignments/${assignment.id}`} className="block">
                                        <Button className="w-full" variant="outline">
                                            View Submissions
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            No assignments found.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
