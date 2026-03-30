import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle, Clock, Download, FileText, Send, User, MessageSquare, Award } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Submission {
    id: number;
    student_name: string;
    submitted_at: string;
    status: string;
    score: number | null;
    max_score: number;
    file_path: string | null;
    submission_text: string | null;
    feedback: string | null;
}

interface Lesson {
    id: number;
    title: string;
    course_title: string;
    assignment_data: {
        instructions: string;
        max_score: number;
    };
}

interface Props {
    lesson: Lesson;
    submissions: Submission[];
}

export default function AssignmentShow({ lesson, submissions }: Props) {
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(
        submissions.length > 0 ? submissions[0] : null
    );

    const assignmentMessages = useActionMessages('Assignment');

    const { data, setData, post, processing, errors, reset } = useForm({
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

        post(`/instructor/submissions/${selectedSubmission.id}/grade`, {
            onSuccess: () => {
                // Update the selected submission in the local list
                const updatedSubmissions = [...submissions];
                const index = updatedSubmissions.findIndex(s => s.id === selectedSubmission.id);
                if (index !== -1) {
                    updatedSubmissions[index] = {
                        ...selectedSubmission,
                        score: parseFloat(data.score),
                        feedback: data.feedback,
                        status: 'Graded'
                    };
                    setSelectedSubmission(updatedSubmissions[index]);
                }
                assignmentMessages.success('submit');
            },
            onError: () => {
                assignmentMessages.error('submit');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/instructor/dashboard' },
            { title: 'Assignments', href: '/instructor/assignments' },
            { title: lesson.title, href: '#' }
        ]}>
            <Head title={`Grading: ${lesson.title}`} />

            <div className="flex flex-col h-[calc(100vh-12rem)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{lesson.title}</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{lesson.course_title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">
                            {submissions.filter(s => s.status === 'Submitted').length} Pending
                        </Badge>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">
                            {submissions.filter(s => s.status === 'Graded').length} Graded
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                    {/* Left Sidebar: Submissions List */}
                    <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
                        <Card className="border-none shadow-xl rounded-3xl flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">Students</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto">
                                {submissions.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {submissions.map((submission) => (
                                            <button
                                                key={submission.id}
                                                onClick={() => handleSelectSubmission(submission)}
                                                className={cn(
                                                    "w-full text-left p-4 transition-all hover:bg-slate-50 flex flex-col gap-1",
                                                    selectedSubmission?.id === submission.id ? "bg-indigo-50/50 border-l-4 border-indigo-600 pl-3" : "pl-4"
                                                )}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{submission.student_name}</span>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0",
                                                        submission.status === 'Graded' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {submission.status}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{submission.submitted_at}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 font-bold italic text-sm">No submissions yet</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: Side-by-Side Grading UI */}
                    <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
                        {selectedSubmission ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full overflow-hidden">
                                {/* Student Submission View */}
                                <Card className="border-none shadow-xl rounded-3xl flex flex-col overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-indigo-600" />
                                            Student Submission
                                        </CardTitle>
                                        {selectedSubmission.file_path && (
                                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-slate-200" asChild>
                                                <a href={`/storage/${selectedSubmission.file_path}`} download>
                                                    <Download className="h-3 w-3 mr-1.5" />
                                                    Download File
                                                </a>
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
                                        {selectedSubmission.submission_text ? (
                                            <div className="prose prose-slate max-w-none">
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {selectedSubmission.submission_text}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <FileText className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="font-bold">No text submission provided</p>
                                                <p className="text-xs uppercase tracking-widest mt-1">Check for attachments above</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment Instructions</h4>
                                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 text-indigo-900/70 text-xs font-medium italic">
                                                {lesson.assignment_data.instructions}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Grading & Feedback View */}
                                <Card className="border-none shadow-xl rounded-3xl flex flex-col overflow-hidden bg-white">
                                    <CardHeader className="bg-indigo-600 text-white py-4">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <Award className="h-4 w-4" />
                                            Grade & Feedback
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1 overflow-y-auto">
                                        <form onSubmit={submitGrade} className="space-y-6 h-full flex flex-col">
                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="score" className="text-xs font-black text-slate-500 uppercase tracking-widest">Score (Out of {lesson.assignment_data.max_score})</Label>
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            id="score"
                                                            type="number"
                                                            step="0.1"
                                                            max={lesson.assignment_data.max_score}
                                                            value={data.score}
                                                            onChange={(e) => setData('score', e.target.value)}
                                                            className="h-12 rounded-xl border-slate-200 font-black text-lg focus:ring-indigo-600"
                                                            placeholder="0.0"
                                                            required
                                                        />
                                                        <span className="text-2xl font-black text-slate-300">/</span>
                                                        <div className="h-12 w-20 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200">
                                                            {lesson.assignment_data.max_score}
                                                        </div>
                                                    </div>
                                                    {errors.score && <p className="text-xs font-bold text-rose-500">{errors.score}</p>}
                                                </div>

                                                <div className="grid gap-2 flex-1">
                                                    <Label htmlFor="feedback" className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                                                        Instructor Feedback
                                                    </Label>
                                                    <Textarea
                                                        id="feedback"
                                                        value={data.feedback}
                                                        onChange={(e) => setData('feedback', e.target.value)}
                                                        className="min-h-[200px] rounded-2xl border-slate-200 focus:ring-indigo-600 p-4 font-medium leading-relaxed"
                                                        placeholder="Provide constructive feedback to the student..."
                                                    />
                                                    {errors.feedback && <p className="text-xs font-bold text-rose-500">{errors.feedback}</p>}
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-6 border-t border-slate-100">
                                                <Button 
                                                    type="submit" 
                                                    disabled={processing}
                                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    {processing ? (
                                                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                    )}
                                                    {selectedSubmission.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                                                </Button>
                                                {selectedSubmission.status === 'Graded' && (
                                                    <p className="text-[10px] font-black text-emerald-600 text-center mt-3 uppercase tracking-widest">
                                                        ✓ Last graded on {new Date().toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl shadow-xl border border-dashed border-slate-200">
                                <User className="h-16 w-16 mb-4 opacity-10" />
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Select a student to grade</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
