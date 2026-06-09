import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    CheckCircle,
    Clock,
    Download,
    FileText,
    Send,
    User,
    MessageSquare,
    Award,
    ArrowLeft,
    Star,
    Users,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useActionMessages } from '@/hooks/use-action-messages';
import ConfirmationModal from '@/components/ui/confirmation-modal';

interface Submission {
    id: number;
    student_name: string;
    student_email?: string;
    submitted_at: string;
    status: string;
    score: number | null;
    percentage?: number;
    file_path: string | null;
    file_original_name?: string;
    file_url?: string;
    files?: Array<{
        path: string;
        original_name: string;
        url: string;
    }>;
    submission_text: string | null;
    feedback: string | null;
    is_late?: boolean;
    is_passed?: boolean;
    is_graded?: boolean;
    graded_at?: string;
    resubmission_count?: number;
    last_reopened_at?: string;
}

interface Assignment {
    id: number;
    title: string;
    instructions: string;
    max_score: number;
    passing_score: number;
}

interface Course {
    id: number;
    title: string;
}

interface Props {
    course: Course;
    assignment: Assignment;
    submissions: Submission[];
}

export default function AssignmentShow({ course, assignment, submissions }: Props) {
    const assignmentMessages = useActionMessages('Submission');
    
    if (!course || !assignment) {
        return (
            <AppLayout>
                <Head title="Assignment Not Found" />
                <div className="flex h-[400px] flex-col items-center justify-center">
                    <FileText className="mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Assignment not found</h3>
                    <p className="text-gray-500">The assignment you're looking for doesn't exist.</p>
                    <Link
                        href="/instructor/courses"
                        className="mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300"
                        aria-label="Back to Courses"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(
        submissions && submissions.length > 0 ? submissions[0] : null,
    );
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        score: '',
        feedback: '',
    });

    const { data: rejectData, setData: setRejectData, post: postReject, processing: rejectProcessing, errors: rejectErrors, reset: resetReject } = useForm({
        feedback: '',
    });

    const handleSelectSubmission = (submission: Submission) => {
        setSelectedSubmission(submission);
        setData({
            score: submission.score?.toString() || '',
            feedback: submission.status === 'Graded' ? (submission.feedback || '') : '',
        });
        setRejectData({
            feedback: submission.status === 'Rejected' ? (submission.feedback || '') : '',
        });
    };

    const handleRejectSubmission = () => {
        if (!selectedSubmission || !course?.id || !assignment?.id) return;

        postReject(`/instructor/assignments/${assignment.id}/submissions/${selectedSubmission.id}/reject`, {
            onSuccess: () => {
                setShowRejectModal(false);
                resetReject();
            },
            onError: (errors) => {
                assignmentMessages.error('reject', errors.feedback || 'Failed to reject submission');
            },
            onFinish: () => {
                router.reload({
                    only: ['submissions'],
                    onSuccess: (page) => {
                        // After reloading, find the updated submission from the new props
                        const updatedSubmissions = page.props.submissions as Submission[];
                        // Find the submission that was just rejected (using its ID)
                        const updatedSelected = updatedSubmissions.find(s => s.id === selectedSubmission.id);
                        if (updatedSelected) {
                            setSelectedSubmission(updatedSelected);
                            // Also update the form data for score/feedback based on the new state
                            setData({
                                score: updatedSelected.score?.toString() || '',
                                feedback: updatedSelected.status === 'Graded' ? (updatedSelected.feedback || '') : '',
                            });
                            // And for the reject form data (feedback might have changed if instructor rejected with feedback)
                            setRejectData({
                                feedback: updatedSelected.status === 'Rejected' ? (updatedSelected.feedback || '') : '',
                            });
                        }
                    },
                });
            },
        });
    };

    const handleGradeSubmission = () => {
        if (!selectedSubmission || !course?.id || !assignment?.id) return;

        post(`/instructor/assignments/${assignment.id}/submissions/${selectedSubmission.id}/grade`, {
            onSuccess: () => {
                setShowGradeModal(false);
            },
            onError: (errors) => {
                assignmentMessages.error('grade', errors.score || errors.feedback || 'Failed to grade submission');
            },
            onFinish: () => {
                router.reload({
                    only: ['submissions'],
                    onSuccess: (page) => {
                        const updatedSubmissions = page.props.submissions as Submission[];
                        const updatedSelected = updatedSubmissions.find(s => s.id === selectedSubmission?.id);
                        if (updatedSelected) {
                            setSelectedSubmission(updatedSelected);
                            setData({
                                score: updatedSelected.score?.toString() || '',
                                feedback: updatedSelected.status === 'Graded' ? (updatedSelected.feedback || '') : '',
                            });
                        }
                    },
                });
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/instructor/dashboard' },
                { title: 'Assignments', href: '/instructor/assignments' },
                { title: assignment?.title || 'Assignment', href: '#' },
            ]}
        >
            <Head title={`Submissions: ${assignment?.title || 'Assignment'}`} />

            <div className="space-y-6">
                {/* Simple Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Link
                                href="/instructor/assignments"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {assignment?.title || 'Assignment'}
                            </h1>
                        </div>
                        <p className="text-gray-500">{course?.title || 'Course'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1">
                            {submissions?.length || 0} Total Submissions
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Left Sidebar: Students List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Students who submitted
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[600px] divide-y overflow-y-auto">
                                {submissions && submissions.length > 0 ? (
                                    submissions.map((submission) => (
                                        <button
                                            key={submission.id}
                                            onClick={() => handleSelectSubmission(submission)}
                                            className={cn(
                                                'w-full p-4 text-left transition-colors hover:bg-gray-50',
                                                selectedSubmission?.id === submission.id
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
                                                    className={`px-1.5 py-0 text-[10px] ${
                                                        submission.status === 'Graded'
                                                            ? 'bg-green-50 text-green-600 border-green-100'
                                                            : submission.status === 'Submitted'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                            : submission.status === 'Rejected'
                                                            ? 'bg-red-50 text-red-600 border-red-100'
                                                            : 'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}
                                                >
                                                    {submission.status}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {submission.submitted_at}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No submissions yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content: Details */}
                    <div className="space-y-6 lg:col-span-3">
                        {selectedSubmission ? (
                            <div className="space-y-6">
                                {/* Student Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Submission Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {selectedSubmission.student_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Submitted on {selectedSubmission.submitted_at}
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

                                                {selectedSubmission.status === 'Rejected' && (
                                                    <div className="mt-1">
                                                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Rejected - Student can resubmit
                                                        </Badge>
                                                    </div>
                                                )}
                                                {selectedSubmission.resubmission_count && selectedSubmission.resubmission_count > 0 && (
                                                    <div className="mt-1 space-y-1">
                                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                                            Resubmitted {selectedSubmission.resubmission_count} time{selectedSubmission.resubmission_count > 1 ? 's' : ''}
                                                        </Badge>
                                                        {selectedSubmission.last_reopened_at && (
                                                            <div className="text-xs text-gray-500">
                                                                Last reopened: {selectedSubmission.last_reopened_at}
                                                            </div>
                                                        )}
                                                        {selectedSubmission.resubmission_count > 0 && (
                                                            <div className="text-xs text-orange-600 font-medium">
                                                                ⚠️ Previous grade was cleared when student reopened this assignment
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Assignment Instructions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Assignment Instructions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                            {assignment?.instructions || 'No instructions provided'}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Submission Content */}
                                            {(selectedSubmission.submission_text || (selectedSubmission.files && selectedSubmission.files.length > 0) || selectedSubmission.file_path) && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-medium">
                                                Student Submission
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedSubmission.submission_text && (
                                                <div className="mb-4">
                                                    <Label className="text-xs font-medium text-gray-500">Text Submission:</Label>
                                                    <div className="mt-1 rounded-lg border border-gray-200 bg-white p-4 text-sm whitespace-pre-wrap">
                                                        {selectedSubmission.submission_text}
                                                    </div>
                                                </div>
                                            )}
                                            {((selectedSubmission.files && selectedSubmission.files.length > 0) || selectedSubmission.file_path) && (
                                                <div>
                                                    <Label className="text-xs font-medium text-gray-500">File Submission{(selectedSubmission.files && selectedSubmission.files.length > 1) ? 's' : ''}:</Label>
                                                    <div className="mt-2 space-y-2">
                                                        {selectedSubmission.files && selectedSubmission.files.map((file, index) => (
                                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                                                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {file.original_name}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <a
                                                                        href={file.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                                    >
                                                                        <Download className="h-3 w-3" />
                                                                        View
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Grading Section */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                <CardTitle className="text-sm font-medium">
                                                    Grade Submission
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedSubmission.status !== 'Graded' && (
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        onClick={() => {
                                                            setRejectData({
                                                                feedback: selectedSubmission.status === 'Rejected' ? (selectedSubmission.feedback || '') : '',
                                                            });
                                                            setShowRejectModal(true);
                                                        }}
                                                        disabled={processing || rejectProcessing || selectedSubmission.status === 'Rejected'}
                                                        className="ml-2"
                                                        title="Sends the submission back to the student with feedback for improvements. The student can then resubmit."
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        {selectedSubmission.status === 'Rejected' ? 'Re-Request Revision' : 'Request Revision'}
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setData({
                                                            score: selectedSubmission.score?.toString() || '',
                                                            feedback: selectedSubmission.status === 'Graded' ? (selectedSubmission.feedback || '') : '',
                                                        });
                                                        setShowGradeModal(true);
                                                    }}
                                                    disabled={processing}
                                                    className="ml-2"
                                                >
                                                    <Send className="h-4 w-4" />
                                                    {selectedSubmission.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                </Card>
                            </div>
                        ) : (
                            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <Users className="mb-4 h-12 w-12 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900">No submission selected</h3>
                                <p className="text-gray-500">Select a student from the left sidebar to view their submission.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showGradeModal && selectedSubmission && (
                <ConfirmationModal
                    isOpen={showGradeModal}
                    onClose={() => {
                        setShowGradeModal(false);
                        reset();
                    }}
                    onConfirm={handleGradeSubmission}
                    title={selectedSubmission.status === 'Graded' ? 'Update Grade' : 'Grade Submission'}
                    description="Enter the score and feedback for this submission. The student will be able to see this feedback."
                    confirmText={selectedSubmission.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                    isLoading={processing}
                    type="success"
                    confirmButtonDisabled={!data.score || Number(data.score) < 0 || Number(data.score) > assignment.max_score}
                >
                    <div className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="score">Score (Max: {assignment.max_score})</Label>
                            <Input
                                id="score"
                                type="number"
                                value={data.score}
                                onChange={(e) => setData('score', e.target.value)}
                                className={errors.score ? 'border-red-500' : ''}
                                min="0"
                                max={assignment.max_score.toString()}
                            />
                            {errors.score && (
                                <p className="text-sm text-red-500 mt-1">{errors.score}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="feedback">Feedback</Label>
                            <Textarea
                                id="feedback"
                                value={data.feedback}
                                onChange={(e) => setData('feedback', e.target.value)}
                                placeholder="Provide feedback to the student (optional)"
                                rows={5}
                                className={errors.feedback ? 'border-red-500' : ''}
                            />
                            {errors.feedback && (
                                <p className="text-sm text-red-500 mt-1">{errors.feedback}</p>
                            )}
                        </div>
                    </div>
                </ConfirmationModal>
            )}
            {showRejectModal && (
                 <ConfirmationModal
                     isOpen={showRejectModal}
                     onClose={() => {
                         setShowRejectModal(false);
                         resetReject();
                     }}
                     onConfirm={handleRejectSubmission}
                     title="Reject Submission"
                     description="Student will be able to resubmit after rejection"
                     confirmText="Reject Submission"
                     isDestructive
                     isLoading={rejectProcessing}
                     confirmButtonDisabled={!rejectData.feedback.trim()}
                 >
                    {/* Form content for feedback */}
                    <form onSubmit={handleRejectSubmission} className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="reject-feedback" className="sr-only">Feedback</Label>
                            <Textarea
                                id="reject-feedback"
                                value={rejectData.feedback}
                                onChange={(e) => setRejectData('feedback', e.target.value)}
                                placeholder="Provide feedback to the student (required)"
                                rows={4}
                                className={rejectErrors.feedback ? 'border-red-500' : ''}
                            />
                            {rejectErrors.feedback && (
                                <p className="text-sm text-red-500 mt-1">{rejectErrors.feedback}</p>
                            )}
                        </div>
                    </form>
                 </ConfirmationModal>
             )}
        </AppLayout>
    );
}
