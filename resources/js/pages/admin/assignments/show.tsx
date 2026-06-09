import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    CheckCircle,
    Clock,
    FileText,
    MessageSquare,
    User,
    ArrowLeft,
    Award,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';
import { cn } from '@/lib/utils';
import ConfirmationModal from '@/components/ui/confirmation-modal';

interface Submission {
    id: number;
    student_name: string;
    student_email: string;
    status: string;
    submission_text: string | null;
    files: Array<{ path: string; original_name: string; url: string; mime_type: string; size: number }> | null;
    has_files: boolean;
    score: number | null;
    percentage: number | null;
    feedback: string | null;
    submitted_at: string | null;
    graded_at: string | null;
    is_passed: boolean | null;
}

interface Assignment {
    id: number;
    title: string;
    course_id: number;
    course_title: string;
    instructor: {
        name: string | null;
        email: string | null;
    };
    instructions: string;
    max_score: number;
    passing_score: number;
}

interface Props {
    assignment: Assignment;
    submissions: Submission[];
}

export default function AdminAssignmentShow({ assignment, submissions }: Props) {
    const [selectedSubmission, setSelectedSubmission] =
        useState<Submission | null>(submissions[0] ?? null);

    const [showGradeModal, setShowGradeModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const actionMessages = useActionMessages();

    const gradeForm = useForm({
        score: selectedSubmission?.score?.toString() || '',
        feedback: selectedSubmission?.feedback || '',
    });

    const rejectForm = useForm({
        feedback: selectedSubmission?.feedback || '',
    });

    const handleSelectSubmission = (submission: Submission) => {
        setSelectedSubmission(submission);
        gradeForm.setData({
            score: submission.score?.toString() || '',
            feedback: submission.status === 'Graded' ? (submission.feedback || '') : '',
        });
        rejectForm.setData({
            feedback: submission.status === 'Rejected' ? (submission.feedback || '') : '',
        });
    };

    const handleGradeSubmission = () => {
        if (!selectedSubmission || !assignment?.id) return;

        gradeForm.post(
            `/admin/assignments/${assignment.id}/submissions/${selectedSubmission.id}/grade`,
            {
                onSuccess: () => {
                    setShowGradeModal(false);
                    router.reload({
                        only: ['submissions'],
                        onSuccess: (page: any) => {
                            const updatedSubmissions = page.props.submissions as Submission[];
                            const updatedSelected = updatedSubmissions.find(s => s.id === selectedSubmission.id);
                            if (updatedSelected) {
                                setSelectedSubmission(updatedSelected);
                                gradeForm.setData({
                                    score: updatedSelected.score?.toString() || '',
                                    feedback: updatedSelected.status === 'Graded' ? (updatedSelected.feedback || '') : '',
                                });
                            }
                        },
                    });
                },
                onError: (errors) => {
                    actionMessages.error('grade', errors.feedback || 'Failed to grade submission');
                },
            },
        );
    };

    const handleRejectSubmission = () => {
        if (!selectedSubmission || !assignment?.id) return;

        rejectForm.post(
            `/admin/assignments/${assignment.id}/submissions/${selectedSubmission.id}/reject`,
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    router.reload({
                        only: ['submissions'],
                        onSuccess: (page: any) => {
                            const updatedSubmissions = page.props.submissions as Submission[];
                            const updatedSelected = updatedSubmissions.find(s => s.id === selectedSubmission.id);
                            if (updatedSelected) {
                                setSelectedSubmission(updatedSelected);
                                rejectForm.setData({
                                    feedback: updatedSelected.status === 'Rejected' ? (updatedSelected.feedback || '') : '',
                                });
                            }
                        },
                    });
                },
                onError: (errors) => {
                    actionMessages.error('reject', errors.feedback || 'Failed to reject submission');
                },
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin/dashboard' },
                { title: 'Assignments', href: '/admin/assignments' },
                {
                    title: assignment.course_title || 'Course',
                    href: `/admin/courses/${assignment.course_id}`,
                },
                { title: assignment.title, href: '#' },
            ]}
        >
            <Head title={`Assignment: ${assignment.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Link
                                href="/admin/assignments"
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300"
                                aria-label="Back to Assignments"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="page-title text-gray-900">
                                {assignment.title}
                            </h1>
                        </div>
                        <p className="text-gray-500">{assignment.course_title}</p>
                        {assignment.instructor.name && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <User className="h-3 w-3" />
                                Instructor: {assignment.instructor.name}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                            {submissions.length} Total Completions
                        </Badge>

                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Left Sidebar: Students List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Students who completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[600px] divide-y overflow-y-auto">
                                {submissions.length > 0 ? (
                                    submissions.map((submission) => (
                                        <button
                                            key={submission.id}
                                            onClick={() =>
                                                handleSelectSubmission(
                                                    submission,
                                                )
                                            }
                                            className={cn(
                                                'w-full p-4 text-left transition-colors hover:bg-gray-50',
                                                selectedSubmission?.id ===
                                                    submission.id
                                                    ? 'border-r-2 border-indigo-600 bg-indigo-50/30'
                                                    : '',
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="truncate text-sm font-medium">
                                                    {submission.student_name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="px-1.5 py-0 text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100"
                                                >
                                                    Completed
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {submission.submitted_at ||
                                                    'Not submitted'}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        No completions yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content: Details */}
                    <div className="space-y-6 lg:col-span-3">
                        {selectedSubmission ? (
                            <div className="space-y-6">
                                <Card className="border-none shadow-md">
                                    <CardHeader className="bg-slate-50/50">
                                        <CardTitle className="text-sm font-medium">
                                            Completion Details
                                        </CardTitle>
                                        <CardDescription></CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">
                                                    {selectedSubmission.student_name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Marked as completed on {selectedSubmission.submitted_at}
                                                </p>
                                                {selectedSubmission.score !== null && selectedSubmission.status === 'Graded' && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-amber-500" />
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            Score: {selectedSubmission.score} / {assignment.max_score}
                                                            {selectedSubmission.percentage !== undefined && (
                                                                <span className="ml-2 text-xs text-gray-500">({selectedSubmission.percentage}%)</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Status:{' '}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'px-1 py-0 text-[10px]',
                                                            selectedSubmission.status === 'Graded' &&
                                                                selectedSubmission.is_passed
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : selectedSubmission.status === 'Graded' &&
                                                                    !selectedSubmission.is_passed
                                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-100',
                                                        )}
                                                    >
                                                        {selectedSubmission.status}
                                                        {selectedSubmission.status === 'Graded' &&
                                                            (selectedSubmission.is_passed
                                                                ? ' (Passed)'
                                                                : ' (Failed)')}
                                                    </Badge>
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Submission Content */}
                                {(selectedSubmission.submission_text ||
                                    selectedSubmission.has_files) && (
                                    <Card className="border-none shadow-md">
                                        <CardHeader className="bg-slate-50/50">
                                            <CardTitle className="text-sm font-medium">
                                                Student Submission
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-6">
                                            {selectedSubmission.submission_text && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase text-slate-500">
                                                        Submission Text
                                                    </Label>
                                                    <div className="prose max-w-none rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 italic whitespace-pre-wrap">
                                                        {selectedSubmission.submission_text}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedSubmission.has_files && selectedSubmission.files && selectedSubmission.files.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold uppercase text-slate-500">
                                                        Submitted Files
                                                    </Label>
                                                    <div className="flex flex-col gap-2">
                                                        {selectedSubmission.files.map((file, index) => (
                                                            <a
                                                                key={index}
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-indigo-600 shadow-sm transition-colors hover:bg-slate-50"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                                <span>{file.original_name || `File ${index + 1}`}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {(selectedSubmission.feedback && selectedSubmission.status === 'Rejected') && (
                                    <Card className="border-none shadow-md">
                                        <CardHeader className="bg-red-50/50">
                                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
                                                <MessageSquare className="h-4 w-4" />
                                                Rejection Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="prose max-w-none rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600 italic whitespace-pre-wrap">
                                                {selectedSubmission.feedback}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Assignment Instructions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose max-w-none">
                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 italic whitespace-pre-wrap">
                                                {assignment.instructions || 'No instructions provided.'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Grading Actions */}
                                <Card className="border-none shadow-md">
                                    <CardHeader className="bg-slate-50/50">
                                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                                            Grading Actions
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => {
                                                        gradeForm.setData({
                                                            score: selectedSubmission.score?.toString() || '',
                                                            feedback: selectedSubmission.status === 'Graded' ? (selectedSubmission.feedback || '') : '',
                                                        });
                                                        setShowGradeModal(true);
                                                    }}
                                                    disabled={gradeForm.processing}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    {selectedSubmission.status === 'Graded' && selectedSubmission.is_passed ? 'Graded' : 'Grade Submission'}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        rejectForm.setData({
                                                            feedback: selectedSubmission.status === 'Rejected' ? (selectedSubmission.feedback || '') : '',
                                                        });
                                                        setShowRejectModal(true);
                                                    }}
                                                    disabled={selectedSubmission.status === 'Rejected'}
                                                >
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    {selectedSubmission.status === 'Rejected' ? 'Rejected' : 'Reject Submission'}
                                                </Button>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed bg-white text-gray-400 shadow-sm">
                                <FileText className="mb-4 h-12 w-12 opacity-10" />
                                <h3 className="text-lg font-medium">
                                    Select a student to view details
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grade Submission Modal */}
            <ConfirmationModal
                isOpen={showGradeModal}
                onClose={() => setShowGradeModal(false)}
                onConfirm={handleGradeSubmission}
                title="Grade Submission"
                description="Enter the score and feedback for this submission. The student will be able to see this feedback."
                confirmText="Submit Grade"
                cancelText="Cancel"
                type="success"
                isLoading={gradeForm.processing}
                confirmButtonDisabled={!gradeForm.data.score || parseFloat(gradeForm.data.score) < 0 || parseFloat(gradeForm.data.score) > assignment.max_score}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="score">Score (Max: {assignment.max_score})</Label>
                        <Input
                            id="score"
                            type="number"
                            value={gradeForm.data.score}
                            onChange={(e) => gradeForm.setData('score', e.target.value)}
                            className={gradeForm.errors.score ? 'border-red-500' : ''}
                            min="0"
                            max={assignment.max_score.toString()}
                        />
                        {gradeForm.errors.score && (
                            <p className="text-sm text-red-500 mt-1">{gradeForm.errors.score}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                            id="feedback"
                            value={gradeForm.data.feedback}
                            onChange={(e) => gradeForm.setData('feedback', e.target.value)}
                            placeholder="Provide feedback to the student (optional)"
                            rows={5}
                            className={gradeForm.errors.feedback ? 'border-red-500' : ''}
                        />
                        {gradeForm.errors.feedback && (
                            <p className="text-sm text-red-500 mt-1">{gradeForm.errors.feedback}</p>
                        )}
                    </div>
                </div>
            </ConfirmationModal>

            {/* Reject Submission Modal */}
            <ConfirmationModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectSubmission}
                title="Reject Submission"
                description="Provide feedback to the student on why their submission is being rejected. They will be able to resubmit."
                confirmText="Reject Submission"
                cancelText="Cancel"
                type="warning"
                isLoading={rejectForm.processing}
                confirmButtonDisabled={!rejectForm.data.feedback}
            >
                <form className="grid gap-4 py-4" onSubmit={handleRejectSubmission}>
                    <div className="grid grid-cols-1 gap-4">
                        <Label htmlFor="feedback" className="text-left">
                            Feedback
                        </Label>
                        <Textarea
                            id="feedback"
                            value={rejectForm.data.feedback}
                            onChange={(e) => rejectForm.setData('feedback', e.target.value)}
                            rows={10}
                            placeholder="Why is this submission being rejected? Provide detailed feedback to the student."
                        />
                        {rejectForm.errors.feedback && (
                            <p className="text-sm text-red-600">
                                {rejectForm.errors.feedback}
                            </p>
                        )}
                    </div>
                </form>
            </ConfirmationModal>
        </AppLayout>
    );
}
