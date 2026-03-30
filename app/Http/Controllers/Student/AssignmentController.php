<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function show(Request $request, Lesson $lesson): Response
    {
        $student = $request->user();
        
        // Verify student is enrolled in the course
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $lesson->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();
            
        if (!$enrollment) {
            abort(403, 'You are not enrolled in this course.');
        }

        if ($lesson->type !== Lesson::TYPE_ASSIGNMENT) {
            abort(404, 'This lesson is not an assignment.');
        }

        // Get existing submission
        $submission = AssignmentSubmission::where('student_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        $assignmentData = $lesson->assignment_data ?? [];

        return Inertia::render('student/assignments/show', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'course' => [
                    'id' => $lesson->course->id,
                    'title' => $lesson->course->title,
                ],
            ],
            'assignment' => [
                'instructions' => $assignmentData['instructions'] ?? '',
                'max_score' => $assignmentData['max_score'] ?? 100,
                'due_days' => $assignmentData['due_days'] ?? 7,
                'submission_types' => $assignmentData['submission_types'] ?? ['text', 'file'],
            ],
            'submission' => $submission ? [
                'id' => $submission->id,
                'submission_text' => $submission->submission_text,
                'file_path' => $submission->file_path,
                'submitted_at' => $submission->submitted_at?->format('M d, Y H:i'),
                'graded_at' => $submission->graded_at?->format('M d, Y H:i'),
                'score' => $submission->score,
                'max_score' => $submission->max_score,
                'percentage' => $submission->percentage,
                'feedback' => $submission->feedback,
                'status' => $submission->status,
                'due_date' => $submission->due_date->format('M d, Y H:i'),
                'is_overdue' => $submission->isOverdue(),
                'is_submitted' => $submission->isSubmitted(),
                'is_graded' => $submission->isGraded(),
                'passed' => $submission->isPassed(),
            ] : null,
            'enrollment' => [
                'id' => $enrollment->id,
            ],
        ]);
    }

    public function submit(Request $request, Lesson $lesson): JsonResponse
    {
        $student = $request->user();
        
        // Verify enrollment
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $lesson->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();
            
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        if ($lesson->type !== Lesson::TYPE_ASSIGNMENT) {
            return response()->json([
                'success' => false,
                'message' => 'This lesson is not an assignment.',
            ], 400);
        }

        $assignmentData = $lesson->assignment_data ?? [];
        $submissionTypes = $assignmentData['submission_types'] ?? ['text', 'file'];

        $rules = [];
        if (in_array('text', $submissionTypes)) {
            $rules['submission_text'] = 'nullable|string';
        }
        if (in_array('file', $submissionTypes)) {
            $maxSize = Setting::get('max_file_upload_size', 10) * 1024; // KB
            $allowedTypes = Setting::get('allowed_file_types', 'jpg,jpeg,png,pdf,doc,docx,mp4,mp3');
            $rules['file'] = "nullable|file|max:{$maxSize}|mimes:{$allowedTypes}";
        }

        $request->validate($rules);

        // Get or create submission
        $submission = AssignmentSubmission::firstOrCreate([
            'student_id' => $student->id,
            'lesson_id' => $lesson->id,
            'enrollment_id' => $enrollment->id,
        ], [
            'max_score' => $assignmentData['max_score'] ?? 100,
            'status' => AssignmentSubmission::STATUS_DRAFT,
        ]);

        // Handle file upload
        $filePath = null;
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($submission->file_path) {
                Storage::delete($submission->file_path);
            }
            
            $filePath = $request->file('file')->store('assignments', 'public');
        }

        // Update submission
        $updateData = [
            'submission_text' => $request->submission_text,
            'submitted_at' => now(),
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
        ];

        if ($filePath) {
            $updateData['file_path'] = $filePath;
        }

        $submission->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Assignment submitted successfully!',
            'submission' => [
                'id' => $submission->id,
                'submitted_at' => $submission->submitted_at->format('M d, Y H:i'),
                'status' => $submission->status,
            ],
        ]);
    }

    public function saveDraft(Request $request, Lesson $lesson): JsonResponse
    {
        $student = $request->user();
        
        // Verify enrollment
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $lesson->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();
            
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $assignmentData = $lesson->assignment_data ?? [];

        // Get or create submission
        $submission = AssignmentSubmission::firstOrCreate([
            'student_id' => $student->id,
            'lesson_id' => $lesson->id,
            'enrollment_id' => $enrollment->id,
        ], [
            'max_score' => $assignmentData['max_score'] ?? 100,
            'status' => AssignmentSubmission::STATUS_DRAFT,
        ]);

        // Update draft
        $submission->update([
            'submission_text' => $request->submission_text,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Draft saved successfully!',
        ]);
    }
}