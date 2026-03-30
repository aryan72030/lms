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
    Award
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useActionMessages } from '@/hooks/use-action-messages';
import AppLayout from '@/layouts/app-layout';

interface Assignment {
    instructions: string;
    max_score: number;
    due_days: number;
    submission_types: string[];
}

interface Submission {
    id: number;
    submission_text: string;
    file_path: string | null;
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
    lesson: {
        id: number;
        title: string;
        description: string;
        course: {
            id: number;
            title: string;
        };
    };
    assignment: Assignment;
    submission: Submission | null;
    enrollment: {
        id: number;
    };
}

export default function AssignmentShow({ lesson, assignment, submission, enrollment }: Props) {
    const [submissionText, setSubmissionText] = useState(submission?.submission_text || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const assignmentMessages = useActionMessages('Assignment');

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (!submission?.is_submitted && submissionText.trim()) {
            const timer = setTimeout(() => {
                saveDraft();
            }, 30000);
            
            return () => clearTimeout(timer);
        }
    }, [submissionText]);

    const saveDraft = async () => {
        if (!submissionText.trim() || submission?.is_submitted) {
return;
}
        
        setIsSavingDraft(true);
        
        try {
            const response = await fetch(`/student/lessons/${lesson.id}/assignment/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    submission_text: submissionText,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to save draft:', data.message);
            }
        } catch (error) {
            console.error('Draft save error:', error);
        } finally {
            setIsSavingDraft(false);
        }
    };

    const submitAssignment = async () => {
        if (!submissionText.trim() && !selectedFile) {
            assignmentMessages.error('submit', 'Please provide either text submission or upload a file.');

            return;
        }

        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            formData.append('submission_text', submissionText);

            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch(`/student/lessons/${lesson.id}/assignment/submit`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                assignmentMessages.success('submit');
                window.location.reload();
            } else {
                assignmentMessages.error('submit');
            }
        } catch (error) {
            console.error('Assignment submission error:', error);
            assignmentMessages.error('submit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string, isOverdue: boolean) => {
        if (status === 'Submitted') {
            return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
        }

        if (status === 'Graded') {
            return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
        }

        if (isOverdue) {
            return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
        }

        return <Badge variant="outline">Draft</Badge>;
    };

    const canSubmit = !submission?.is_submitted && (!submission?.is_overdue || submission?.status === 'Draft');

    return (
        <AppLayout>
            <Head title={`Assignment: ${lesson.title}`} />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/student/enrollments/${enrollment.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Course
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{lesson.title}</h1>
                        <p className="text-gray-600">{lesson.course.title}</p>
                    </div>
                </div>

                {/* Assignment Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Assignment Instructions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lesson.description && (
                            <p className="text-gray-600">{lesson.description}</p>
                        )}
                        
                        <div className="prose max-w-none">
                            <div className="whitespace-pre-wrap text-gray-900">
                                {assignment.instructions}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{assignment.max_score}</div>
                                <div className="text-sm text-gray-600">Max Points</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{assignment.due_days}</div>
                                <div className="text-sm text-gray-600">Days to Complete</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {assignment.submission_types.join(' + ')}
                                </div>
                                <div className="text-sm text-gray-600">Submission Types</div>
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
                                    Submission Status
                                </span>
                                {getStatusBadge(submission.status, submission.is_overdue)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        Due: {new Date(submission.due_date).toLocaleDateString()}
                                    </span>
                                </div>
                                {submission.submitted_at && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">
                                            Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {submission.is_graded && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="h-5 w-5 text-blue-600" />
                                        <span className="font-medium text-blue-900">Grade</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 mb-2">
                                        {submission.score}/{submission.max_score} ({submission.percentage?.toFixed(1)}%)
                                    </div>
                                    {submission.feedback && (
                                        <div className="mt-3">
                                            <h4 className="font-medium text-blue-900 mb-1">Feedback:</h4>
                                            <p className="text-blue-800 text-sm">{submission.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {submission.is_overdue && !submission.is_submitted && (
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <span className="font-medium text-red-900">Assignment Overdue</span>
                                    </div>
                                    <p className="text-red-800 text-sm mt-1">
                                        This assignment was due on {new Date(submission.due_date).toLocaleDateString()}.
                                        Late submissions may receive reduced points.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Submission Form */}
                {canSubmit && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                Your Submission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {assignment.submission_types.includes('text') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Text Submission
                                    </label>
                                    <Textarea
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        placeholder="Enter your assignment submission here..."
                                        rows={10}
                                        className="w-full"
                                    />
                                    {isSavingDraft && (
                                        <p className="text-xs text-gray-500 mt-1">Saving draft...</p>
                                    )}
                                </div>
                            )}
                            
                            {assignment.submission_types.includes('file') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File Upload
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <input
                                            type="file"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.doc,.docx,.txt,.zip"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                                        >
                                            Choose file to upload
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PDF, DOC, DOCX, TXT, ZIP (max 10MB)
                                        </p>
                                        {selectedFile && (
                                            <p className="text-sm text-green-600 mt-2">
                                                Selected: {selectedFile.name}
                                            </p>
                                        )}
                                        {submission?.file_path && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                Current file: {submission.file_path.split('/').pop()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={submitAssignment}
                                    disabled={isSubmitting || (!submissionText.trim() && !selectedFile)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                                
                                {assignment.submission_types.includes('text') && (
                                    <Button
                                        variant="outline"
                                        onClick={saveDraft}
                                        disabled={isSavingDraft || !submissionText.trim()}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submitted Assignment View */}
                {submission?.is_submitted && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Your Submission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {submission.submission_text && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Text Submission:</h4>
                                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                                        {submission.submission_text}
                                    </div>
                                </div>
                            )}
                            
                            {submission.file_path && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Uploaded File:</h4>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <a
                                            href={`/storage/${submission.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {submission.file_path.split('/').pop()}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}