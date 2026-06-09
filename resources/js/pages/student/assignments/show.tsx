import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    Upload,
    Save,
    Send,
    Clock,
    CheckCircle,
    AlertTriangle,
    Calendar,
    Award,
    XCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Assignment {
    instructions: string;
    max_score: number;
    passing_score: number;
    due_days: number;
    assignment_type: 'text' | 'file' | 'mixed';
    allowed_file_types: string[];
    max_file_size_mb: number;
    max_files: number;
    submission_types: string[];
}

interface Submission {
    id: number;
    submission_text: string;
    file_path: string | null;
    files?: Array<{
        path: string;
        original_name: string;
        url: string;
    }>;
    submitted_at: string | null;
    graded_at: string | null;
    score: number | null;
    max_score: number;
    percentage: number | null;
    feedback: string | null;
    status: string;
    due_date: string;
    is_overdue: boolean;
    is_submitted: boolean;
    is_graded: boolean;
    passed: boolean;
}

interface Props {
    assignment: {
        id: number;
        title: string;
        description: string;
        instructions: string;
        assignment_type: 'text' | 'file' | 'mixed';
        allowed_file_types: string[];
        max_file_size_mb: number;
        max_files: number;
        max_score: number;
        passing_score: number;
        due_days: number;
        submission_types?: string[];
        course: {
            id: number;
            title: string;
        };
    };
    submission: Submission | null;
    enrollment: {
        id: number;
    };
}

export default function AssignmentShow({
    assignment,
    submission,
    enrollment,
}: Props) {
    const [submissionText, setSubmissionText] = useState(
        submission?.submission_text || '',
    );
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isReopening, setIsReopening] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const assignmentMessages = useActionMessages('Assignment');

    // Auto-save draft every 30 seconds - only for text assignments and when not submitted
    useEffect(() => {
        if ((assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed' || !assignment.assignment_type) && 
            !submission?.is_submitted && submissionText.trim()) {
            const timer = setTimeout(() => {
                saveDraft();
            }, 30000);

            return () => clearTimeout(timer);
        }
    }, [submissionText, assignment.assignment_type, submission?.is_submitted]);

    const saveDraft = async () => {
        if (!submissionText.trim() || submission?.is_submitted) {
            return;
        }

        setIsSavingDraft(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            
            if (!csrfToken) {
                console.error('CSRF token not found');
                assignmentMessages.error('save', 'Security token missing. Please refresh the page.');
                return;
            }

            const response = await fetch(
                `/student/assignments/${assignment.id}/draft`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        submission_text: submissionText,
                    }),
                },
            );

            const data = await response.json();

            if (data.success) {
                setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } else {
                console.error('Failed to save draft:', data.message);
                assignmentMessages.error('save', data.message || 'Failed to save draft. Please try again.');
            }
        } catch (error) {
            console.error('Draft save error:', error);
            assignmentMessages.error('save', 'Failed to save draft. Please check your internet connection.');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const submitAssignment = async () => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            
            // Add text submission if assignment allows text
            if (assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed') {
                formData.append('submission_text', submissionText);
            }
            
            // Add files if assignment allows files
            if ((assignment.assignment_type === 'file' || assignment.assignment_type === 'mixed') && selectedFiles.length > 0) {
                selectedFiles.forEach((file, index) => {
                    formData.append(`files[${index}]`, file);
                });
            }

            const response = await fetch(
                `/student/assignments/${assignment.id}/submit`,
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: formData,
                },
            );

            const data = await response.json();

            if (data.success) {
                assignmentMessages.success('submit', 'Assignment submitted successfully!');
                window.location.reload();
            } else {
                assignmentMessages.error('submit', data.message || 'Failed to submit assignment');
            }
        } catch (error) {
            console.error('Assignment submission error:', error);
            assignmentMessages.error('submit', 'Failed to submit assignment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const reopenSubmission = async () => {
        setIsReopening(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            
            if (!csrfToken) {
                console.error('CSRF token not found');
                assignmentMessages.error('reopen', 'Security token missing. Please refresh the page.');
                return;
            }

            const response = await fetch(
                `/student/assignments/${assignment.id}/reopen`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                assignmentMessages.success('reopen', data.message);
                window.location.reload();
            } else {
                assignmentMessages.error('reopen', data.message || 'Failed to reopen assignment');
            }
        } catch (error) {
            console.error('Reopen assignment error:', error);
            assignmentMessages.error('reopen', 'Failed to reopen assignment. Please try again.');
        } finally {
            setIsReopening(false);
        }
    };

    const getStatusBadge = (status: string, isOverdue: boolean) => {
        if (status === 'Graded') {
            return (
                <Badge className="bg-green-100 text-green-800 border-green-200 font-semibold">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>
            );
        }

        if (status === 'Rejected') {
            return (
                <Badge className="bg-red-50 text-red-700 border-red-300 font-semibold px-3 py-1 text-base">
                    <XCircle className="h-4 w-4 mr-1" />
                    Needs Revision
                </Badge>
            );
        }

        if (status === 'Submitted') {
            return (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                    <Clock className="h-3 w-3 mr-1" />
                    Under Review
                </Badge>
            );
        }

        if (isOverdue) {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-200 font-semibold">
                    <XCircle className="h-3 w-3 mr-1" />
                    Overdue
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                <Clock className="h-3 w-3 mr-1" />
                In Progress
            </Badge>
        );
    };

    const canSubmit =
        !submission?.is_submitted &&
        submission?.status !== 'Graded' &&
        (!submission?.is_overdue || submission?.status === 'Draft' || submission?.status === 'Rejected');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDueDateInfo = (submission: Submission) => {
        const dueDate = new Date(submission.due_date);
        const now = new Date();
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        let urgencyColor = 'text-green-600';
        let bgColor = 'bg-green-50 border-green-200';
        
        if (daysLeft < 1) {
            urgencyColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-200';
        } else if (daysLeft <= 3) {
            urgencyColor = 'text-yellow-600';
            bgColor = 'bg-yellow-50 border-yellow-200';
        }
        
        return {
            daysLeft,
            urgencyColor,
            bgColor,
            formattedDate: formatDate(submission.due_date)
        };
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Assignments', href: '/student/assignments' },
                { title: assignment.title, href: '#' },
            ]}
        >
            <Head title={`Assignment: ${assignment.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/student/enrollments/${enrollment.id}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="page-title">{assignment.title}</h1>
                        <p className="text-gray-600">{assignment.course.title}</p>
                    </div>
                </div>

                {/* Assignment Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            What You Need to Do
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Assignment Type & Requirements */}
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                {assignment.assignment_type === 'text' && '📝 Text Assignment'}
                                {assignment.assignment_type === 'file' && '📎 File Upload Assignment'}
                                {assignment.assignment_type === 'mixed' && '📝📎 Mixed Assignment'}
                                {!assignment.assignment_type && '📝 Assignment'}
                            </h3>
                            <p className="text-blue-800 text-sm">
                                {assignment.assignment_type === 'text' && 'Write your response in the text area below.'}
                                {assignment.assignment_type === 'file' && 'Upload your files using the file upload area below.'}
                                {assignment.assignment_type === 'mixed' && 'You can both write text and upload files for this assignment.'}
                                {!assignment.assignment_type && 'Complete the assignment as described in the instructions.'}
                            </p>
                        </div>

                        {/* Step-by-step Instructions */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Instructions:</h3>
                            <div className="prose max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {assignment.instructions}
                                </div>
                            </div>
                        </div>

                        {/* Assignment Details Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center border border-blue-200">
                                <div className="text-2xl font-bold text-blue-700 mb-1">
                                    {assignment.max_score}
                                </div>
                                <div className="text-sm font-medium text-blue-600">
                                    Maximum Points
                                </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center border border-green-200">
                                <div className="text-2xl font-bold text-green-700 mb-1">
                                    {assignment.due_days}
                                </div>
                                <div className="text-sm font-medium text-green-600">
                                    Days to Complete
                                </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center border border-purple-200">
                                <div className="text-2xl font-bold text-purple-700 mb-1">
                                    {assignment.assignment_type === 'text' && 'Text'}
                                    {assignment.assignment_type === 'file' && 'File'}
                                    {assignment.assignment_type === 'mixed' && 'Mixed'}
                                    {!assignment.assignment_type && 'Standard'}
                                </div>
                                <div className="text-sm font-medium text-purple-600">
                                    Assignment Type
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submission Status */}
                {submission && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Assignment Status
                                </span>
                                {getStatusBadge(
                                    submission.status,
                                    submission.is_overdue,
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Due Date with Countdown */}
                            {(() => {
                                const dueDateInfo = getDueDateInfo(submission);
                                return (
                                    <div className={`rounded-lg p-4 border ${dueDateInfo.bgColor}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">Due Date</span>
                                            <span className={`font-bold ${dueDateInfo.urgencyColor}`}>
                                                {dueDateInfo.daysLeft > 0 
                                                    ? `${dueDateInfo.daysLeft} days left`
                                                    : dueDateInfo.daysLeft === 0 
                                                        ? 'Due today'
                                                        : `${Math.abs(dueDateInfo.daysLeft)} days overdue`
                                                }
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {dueDateInfo.formattedDate}
                                        </div>
                                        {/* Progress bar for time remaining */}
                                        {dueDateInfo.daysLeft > 0 && (
                                            <div className="mt-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${
                                                            dueDateInfo.daysLeft > 3 ? 'bg-green-500' :
                                                            dueDateInfo.daysLeft > 1 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                        style={{
                                                            width: `${Math.max(10, Math.min(100, (dueDateInfo.daysLeft / assignment.due_days) * 100))}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {submission.submitted_at && (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Submitted on {formatDate(submission.submitted_at)}
                                    </span>
                                </div>
                            )}

                            {/* Alert for Rejected Submission */}
                            {submission.status === 'Rejected' && submission.feedback && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Your submission needs revision!</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>Your instructor has rejected your submission. Please review the feedback below and make the necessary changes before resubmitting.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructor Feedback Section for Rejected Submissions */}
                            {submission.status === 'Rejected' && submission.feedback && (
                                <Card className="border-red-300 bg-red-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-800">
                                            <FileText className="h-5 w-5" />
                                            Instructor Feedback
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-red-700">
                                        <div className="prose max-w-none">
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {submission.feedback}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {submission.is_graded && (
                                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border border-blue-200">
                                    {/* Pass/Fail Status - Prominent */}
                                    <div className="text-center mb-4">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${
                                            submission.passed 
                                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                                : 'bg-red-100 text-red-800 border-2 border-red-300'
                                        }`}>
                                            {submission.passed ? (
                                                <><CheckCircle className="h-5 w-5" /> PASSED</>
                                            ) : (
                                                <><XCircle className="h-5 w-5" /> NEEDS IMPROVEMENT</>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Grade Display */}
                                    <div className="text-center mb-4">
                                        <div className="text-3xl font-black text-blue-700 mb-1">
                                            {submission.score}/{submission.max_score}
                                        </div>
                                        <div className="text-lg font-semibold text-blue-600">
                                            ({Number(submission.percentage || 0).toFixed(1)}%)
                                        </div>
                                        <div className="text-xs text-indigo-400 mt-1 font-medium uppercase tracking-wider">
                                            Passing Marks: {Math.ceil((submission.max_score * assignment.passing_score) / 100)} ({assignment.passing_score}%)
                                        </div>
                                    </div>

                                    {/* Instructor Feedback */}
                                    {submission.feedback && (
                                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Instructor Feedback
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                {submission.feedback}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="text-center mt-4 text-sm text-blue-600">
                                        Graded on {formatDate(submission.graded_at!)}
                                    </div>
                                </div>
                            )}

                            {submission.is_overdue && !submission.is_submitted && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <span className="font-semibold text-red-900">
                                            Assignment Overdue
                                        </span>
                                    </div>
                                    <p className="text-sm text-red-800">
                                        This assignment was due on {formatDate(submission.due_date)}. 
                                        You can still submit it, but it may receive reduced points.
                                    </p>
                                </div>
                            )}

                            {submission.status === 'Rejected' && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                        <span className="font-semibold text-red-900">
                                            Assignment Needs Revision
                                        </span>
                                    </div>
                                    <p className="text-sm text-red-800 mb-3">
                                        Your instructor has reviewed your submission and requested changes. 
                                        Please review the feedback below and resubmit your improved work.
                                    </p>
                                    {submission.feedback && (
                                        <div className="bg-white p-3 rounded border border-red-200">
                                            <h4 className="font-semibold text-red-900 mb-2 text-sm">
                                                Instructor Feedback:
                                            </h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {submission.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Submission Form */}
                {canSubmit && (
                    <Card className="border-none bg-gradient-to-br from-indigo-50 to-white shadow-xl ring-1 ring-indigo-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-900">
                                <CheckCircle className="h-5 w-5 text-indigo-600" />
                                Ready to Submit?
                            </CardTitle>
                            {/* Auto-save Status - Only for text assignments */}
                            {(assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed' || !assignment.assignment_type) && submissionText.trim() && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {isSavingDraft ? (
                                        <>
                                            <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-blue-600" />
                                            <span>Saving draft...</span>
                                        </>
                                    ) : lastSaved ? (
                                        <>
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                            <span>Last saved at {lastSaved}</span>
                                        </>
                                    ) : (
                                        <span>Changes not saved</span>
                                    )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Text Input - Show for text and mixed assignments */}
                            {(assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed' || !assignment.assignment_type) && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Your Response {assignment.assignment_type === 'mixed' ? '(Optional if uploading files)' : ''}
                                    </label>
                                    <Textarea
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        placeholder="Write your response here..."
                                        rows={8}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* File Upload - Show for file and mixed assignments */}
                            {(assignment.assignment_type === 'file' || assignment.assignment_type === 'mixed') && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Upload Files {assignment.assignment_type === 'mixed' ? '(Optional if writing text)' : ''}
                                    </label>
                                    <FileUpload
                                        allowedTypes={assignment.allowed_file_types || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png']}
                                        maxFileSize={assignment.max_file_size_mb || 10}
                                        maxFiles={assignment.max_files || 1}
                                        onFilesChange={setSelectedFiles}
                                        disabled={false}
                                        existingFiles={submission?.files?.map(f => f.original_name) || []}
                                    />
                                </div>
                            )}

                            {/* Pre-submission Checklist */}
                            <div className="bg-white p-4 rounded-lg border border-indigo-200">
                                <h3 className="font-semibold text-gray-900 mb-3">Before you submit, make sure you have:</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        </div>
                                        <span>Read and understood the assignment instructions</span>
                                    </div>
                                    {(assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed' || !assignment.assignment_type) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            </div>
                                            <span>Written a complete response</span>
                                        </div>
                                    )}
                                    {(assignment.assignment_type === 'file' || assignment.assignment_type === 'mixed') && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            </div>
                                            <span>Uploaded all required files</span>
                                        </div>
                                    )}
                                    {!assignment.assignment_type && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            </div>
                                            <span>Completed all required work</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        </div>
                                        <span>Reviewed your work for quality and completeness</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-blue-800 text-sm mb-3">
                                    <strong>Important:</strong> Once submitted, you cannot make changes to this assignment.
                                </p>
                                {(assignment.assignment_type === 'file' || assignment.assignment_type === 'mixed') && (
                                    <div className="mt-2 text-xs text-blue-700">
                                        <strong>File Requirements:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>Allowed types: {(assignment.allowed_file_types || ['pdf', 'doc', 'docx']).join(', ').toUpperCase()}</li>
                                            <li>Max file size: {assignment.max_file_size_mb || 10}MB per file</li>
                                            <li>Max files: {assignment.max_files || 1} file(s)</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={submitAssignment}
                                    disabled={isSubmitting || (!submissionText.trim() && selectedFiles.length === 0)}
                                    className={`h-12 rounded-xl px-8 text-base font-bold text-white shadow-lg transition-all ${
                                        submission?.status === 'Rejected'
                                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2" />
                                            {submission?.status === 'Rejected' ? 'Resubmitting...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-5 w-5" />
                                            {submission?.status === 'Rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
                                        </>
                                    )}
                                </Button>
                                
                                {/* Save Draft - Only for text assignments */}
                                {(assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed' || !assignment.assignment_type) && (
                                    <Button
                                        variant="outline"
                                        onClick={saveDraft}
                                        disabled={isSavingDraft || !submissionText.trim()}
                                        className="h-12 px-6"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Draft
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submitted Assignment View */}
                {submission?.is_submitted && (
                    <Card className="border-none bg-emerald-50 shadow-xl ring-1 ring-emerald-100">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-900">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    Assignment Completed
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-bold uppercase tracking-wider">
                                    Completed on: {formatDate(submission.submitted_at!)}
                                </span>
                            </div>
                            
                            {/* Show submitted content */}
                            <div className="space-y-4">
                                {submission.submission_text && (
                                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                                        <h4 className="font-semibold text-emerald-900 mb-2">Your Text Response:</h4>
                                        <div className="text-gray-700 whitespace-pre-wrap">
                                            {submission.submission_text}
                                        </div>
                                    </div>
                                )}
                                
                                {submission.files && submission.files.length > 0 && (
                                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                                        <h4 className="font-semibold text-emerald-900 mb-3">Your Uploaded Files:</h4>
                                        <div className="space-y-2">
                                            {submission.files.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {file.original_name}
                                                        </p>
                                                    </div>
                                                    <a 
                                                        href={file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-emerald-800">
                                Great job! You have successfully completed this assignment. 
                                You can now proceed to the next lesson.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
