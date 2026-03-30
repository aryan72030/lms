import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle, Clock, FileText, MessageSquare, User } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Submission {
    id: number;
    student_name: string;
    submitted_at: string | null;
    status: string;
    score: number | null;
    max_score: number;
    file_path: string | null;
    file_url: string | null;
    submission_text: string | null;
    feedback: string | null;
}

interface Lesson {
    id: number;
    title: string;
    course_title: string;
    instructor: {
        name: string | null;
        email: string | null;
    };
    assignment_data: {
        instructions: string;
        max_score: number;
    };
}

interface Props {
    lesson: Lesson;
    submissions: Submission[];
}

export default function AdminAssignmentShow({ lesson, submissions }: Props) {
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(submissions[0] ?? null);
    const assignmentMessages = useActionMessages('Assignment');

    const pendingCount = useMemo(
        () => submissions.filter((s) => s.status === 'Submitted').length,
        [submissions],
    );

    const { data, setData, post, processing, errors } = useForm({
        score: selectedSubmission?.score?.toString() || '',
        feedback: selectedSubmission?.feedback || '',
    });

    const handleSelectSubmission = (submission: Submission) => {
        setSelectedSubmission(submission);
        setData({
            score: submission.score?.toString() || '',
            feedback: submission.feedback || '',
        });
    };

    const submitGrade = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;

        post(`/admin/submissions/${selectedSubmission.id}/grade`, {
            onSuccess: () => assignmentMessages.success('update'),
            onError: () => assignmentMessages.error('update'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Assignments', href: '/admin/assignments' },
                { title: lesson.title, href: '#' },
            ]}
        >
            <Head title={`Assignment: ${lesson.title}`} />

            <div className="flex flex-col h-[calc(100vh-12rem)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">{lesson.title}</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{lesson.course_title}</p>
                        {(lesson.instructor.name || lesson.instructor.email) && (
                            <p className="text-xs text-slate-400 mt-1">
                                Instructor: {lesson.instructor.name || '—'}
                                {lesson.instructor.email ? ` (${lesson.instructor.email})` : ''}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">
                            {pendingCount} Pending
                        </Badge>
                        <Link href="/admin/assignments">
                            <Button variant="outline">Back</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                    <div className="col-span-4 min-h-0">
                        <Card className="h-full overflow-hidden">
                            <CardHeader className="border-b bg-slate-50">
                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                    Submissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
                                    {submissions.map((s) => {
                                        const isActive = selectedSubmission?.id === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleSelectSubmission(s)}
                                                className={`w-full text-left p-4 border-b transition-colors ${
                                                    isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-slate-800">{s.student_name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {s.submitted_at || 'Not submitted'}
                                                        </div>
                                                    </div>
                                                    <Badge variant={s.status === 'Submitted' ? 'destructive' : 'outline'}>
                                                        {s.status}
                                                    </Badge>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {submissions.length === 0 && (
                                        <div className="p-8 text-center text-slate-400">
                                            <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                            No submissions yet.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-8 min-h-0">
                        {selectedSubmission ? (
                            <div className="h-full min-h-0 flex flex-col gap-6">
                                <Card>
                                    <CardHeader className="border-b bg-slate-50">
                                        <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                            Assignment Instructions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                            {lesson.assignment_data.instructions || '—'}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                                    <Card className="min-h-0 flex flex-col">
                                        <CardHeader className="border-b bg-slate-50">
                                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                Student Submission
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4 overflow-y-auto">
                                            {selectedSubmission.submission_text ? (
                                                <div>
                                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                                        Text
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 whitespace-pre-wrap text-sm">
                                                        {selectedSubmission.submission_text}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400">No text submission.</div>
                                            )}

                                            {selectedSubmission.file_url && (
                                                <div>
                                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                                        File
                                                    </div>
                                                    <a
                                                        href={selectedSubmission.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        {selectedSubmission.file_path?.split('/').pop()}
                                                    </a>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="min-h-0 flex flex-col">
                                        <CardHeader className="border-b bg-slate-50">
                                            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                Grade & Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 flex-1 flex flex-col">
                                            <form onSubmit={submitGrade} className="flex-1 flex flex-col gap-6">
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="score"
                                                        className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                        Score
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id="score"
                                                            type="number"
                                                            min={0}
                                                            step="1"
                                                            value={data.score}
                                                            onChange={(e) => setData('score', e.target.value)}
                                                            className="h-12 w-32 rounded-xl bg-slate-50 border-slate-200 font-black text-slate-700 text-lg text-center"
                                                        />
                                                        <span className="text-2xl font-black text-slate-300">/</span>
                                                        <div className="h-12 w-20 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200">
                                                            {lesson.assignment_data.max_score}
                                                        </div>
                                                    </div>
                                                    {errors.score && (
                                                        <p className="text-xs font-bold text-rose-500">{errors.score}</p>
                                                    )}
                                                </div>

                                                <Separator className="bg-slate-100" />

                                                <div className="grid gap-2 flex-1">
                                                    <Label
                                                        htmlFor="feedback"
                                                        className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                                                        Feedback
                                                    </Label>
                                                    <Textarea
                                                        id="feedback"
                                                        value={data.feedback}
                                                        onChange={(e) => setData('feedback', e.target.value)}
                                                        className="min-h-[200px] rounded-2xl border-slate-200 focus:ring-indigo-600 p-4 font-medium leading-relaxed"
                                                        placeholder="Feedback for the student..."
                                                    />
                                                    {errors.feedback && (
                                                        <p className="text-xs font-bold text-rose-500">{errors.feedback}</p>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-6 border-t border-slate-100">
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all"
                                                    >
                                                        {processing ? (
                                                            <Clock className="h-5 w-5 mr-2 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-5 w-5 mr-2" />
                                                        )}
                                                        {selectedSubmission.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl shadow-xl border border-dashed border-slate-200">
                                <User className="h-16 w-16 mb-4 opacity-10" />
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">
                                    No submissions
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

