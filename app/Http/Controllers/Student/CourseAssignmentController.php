<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CourseAssignment;
use App\Models\CourseAssignmentSubmission;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CourseAssignmentController extends Controller
{
    // List all assignments for student
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get all assignments from enrolled courses
        $assignments = CourseAssignment::whereHas('course.enrollments', function ($query) use ($user) {
            $query->where('student_id', $user->id)
                  ->where('status', Enrollment::STATUS_ACTIVE);
        })
        ->with([
            'course:id,title,instructor_id',
            'course.instructor:id,name',
            'submissions' => function ($query) use ($user) {
                $query->where('student_id', $user->id);
            }
        ])
        ->where('is_published', true)
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($assignment) {
            $submission = $assignment->submissions->first();
            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'assignment_type' => $assignment->assignment_type,
                'allowed_file_types' => $assignment->allowed_file_types,
                'max_file_size_mb' => $assignment->max_file_size_mb,
                'max_files' => $assignment->max_files,
                'max_score' => $assignment->max_score,
                'passing_score' => $assignment->passing_score,
                'due_days' => $assignment->due_days,
                'course' => $assignment->course,
                'submission' => $submission ? [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'percentage' => $submission->percentage,
                    'submitted_at' => $submission->submitted_at,
                    'graded_at' => $submission->graded_at,
                    'is_submitted' => $submission->isSubmitted(),
                    'is_graded' => $submission->isGraded(),
                ] : null,
            ];
        });

        return Inertia::render('student/assignments/index', [
            'assignments' => $assignments,
        ]);
    }

    // Show specific assignment
    public function show(Request $request, CourseAssignment $assignment)
    {
        $user = $request->user();
        
        // Check if student is enrolled in the course
        $enrollment = $this->getActiveEnrollment($request, $assignment);
        if (!$enrollment) {
            abort(403, 'You do not have access to this assignment.');
        }

        if (!$assignment->is_published) {
            abort(404, 'Assignment not found.');
        }

        // Get or create submission
        $submission = CourseAssignmentSubmission::where('course_assignment_id', $assignment->id)
            ->where('student_id', $user->id)
            ->first();

        $submissionData = null;
        if ($submission) {
            $files = collect($submission->getAllFiles())->map(function ($file) {
                try {
                    if (is_array($file) && isset($file['path']) && is_string($file['path'])) {
                        $file['url'] = route('files.show', ['path' => $file['path']]);
                    } else {
                        $file['url'] = '#'; // Fallback URL
                    }
                    return $file;
                } catch (\Exception $e) {
                    \Log::error('Error generating file URL: ' . $e->getMessage(), ['file' => $file]);
                    $file['url'] = '#'; // Fallback URL
                    return $file;
                }
            })->toArray();
            
            $submissionData = [
                'id' => $submission->id,
                'submission_text' => $submission->submission_text,
                'file_path' => $submission->file_path,
                'file_original_name' => $submission->file_original_name,
                'files' => $files,
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'score' => $submission->score,
                'max_score' => $submission->max_score,
                'percentage' => $submission->percentage,
                'feedback' => $submission->feedback,
                'status' => $submission->status,
                'due_date' => $submission->due_date,
                'is_overdue' => $submission->isOverdue(),
                'is_submitted' => $submission->isSubmitted(),
                'is_graded' => $submission->isGraded(),
                'passed' => $submission->passed(),
            ];
        }

        return Inertia::render('student/assignments/show', [
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->instructions, // Using instructions as description
                'instructions' => $assignment->instructions,
                'assignment_type' => $assignment->assignment_type,
                'allowed_file_types' => $assignment->allowed_file_types,
                'max_file_size_mb' => $assignment->max_file_size_mb,
                'max_files' => $assignment->max_files,
                'max_score' => $assignment->max_score,
                'passing_score' => $assignment->passing_score,
                'due_days' => $assignment->due_days,
                'course' => [
                    'id' => $assignment->course->id,
                    'title' => $assignment->course->title,
                ],
            ],
            'submission' => $submissionData,
            'enrollment' => [
                'id' => $enrollment->id,
            ],
        ]);
    }
    // Draft save (auto-save)
    public function saveDraft(Request $request, CourseAssignment $assignment): JsonResponse
    {
        $enrollment = $this->getActiveEnrollment($request, $assignment);

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'You do not have access to this course.'], 403);
        }

        $validated = $request->validate([
            'submission_text' => 'nullable|string',
        ]);

        $submission = CourseAssignmentSubmission::firstOrNew([
            'course_assignment_id' => $assignment->id,
            'student_id'           => $request->user()->id,
        ]);

        if ($submission->isSubmitted() || $submission->isGraded()) {
            return response()->json(['success' => false, 'message' => 'Already submitted.'], 422);
        }

        $submission->fill([
            'enrollment_id'   => $enrollment->id,
            'submission_text' => $validated['submission_text'] ?? $submission->submission_text,
            'status'          => CourseAssignmentSubmission::STATUS_DRAFT,
        ])->save();

        return response()->json(['success' => true, 'message' => 'Draft saved.']);
    }

    // Final submit
    public function submit(Request $request, CourseAssignment $assignment): JsonResponse
    {
        $enrollment = $this->getActiveEnrollment($request, $assignment);

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'You do not have access to this course.'], 403);
        }

        if (!$assignment->is_published) {
            return response()->json(['success' => false, 'message' => 'This assignment is not available.'], 403);
        }

        // Dynamic validation based on assignment type
        $rules = [];
        if ($assignment->allowsText()) {
            $rules['submission_text'] = 'nullable|string';
        }
        if ($assignment->allowsFiles()) {
            $allowedTypes = implode(',', $assignment->allowed_file_types);
            $maxSize = $assignment->max_file_size_mb * 1024; // Convert MB to KB
            $rules['files'] = 'nullable|array|max:' . $assignment->max_files;
            $rules['files.*'] = "file|max:{$maxSize}|mimes:{$allowedTypes}";
        }

        $validated = $request->validate($rules);

        $submission = CourseAssignmentSubmission::firstOrNew([
            'course_assignment_id' => $assignment->id,
            'student_id'           => $request->user()->id,
        ]);

        if ($submission->exists && $submission->isGraded()) {
            return response()->json(['success' => false, 'message' => 'Cannot resubmit a graded assignment.'], 422);
        }

        // Allow resubmission if rejected
        if ($submission->exists && $submission->isSubmitted() && !$submission->isRejected()) {
            return response()->json(['success' => false, 'message' => 'Assignment already submitted. Contact instructor if changes are needed.'], 422);
        }

        // Handle multiple file uploads
        if ($request->hasFile('files')) {
            // Delete old files if exists
            if ($submission->files) {
                foreach ($submission->files as $oldFile) {
                    Storage::disk('public')->delete($oldFile['path']);
                }
            }
            // Also delete legacy single file
            if ($submission->file_path && !is_array(json_decode($submission->file_path, true))) {
                Storage::disk('public')->delete($submission->file_path);
            }

            $uploadedFiles = [];
            
            foreach ($request->file('files') as $file) {
                $path = $file->store('assignments', 'public');
                $uploadedFiles[] = [
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'url' => route('files.show', ['path' => $path]),
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ];
            }
            
            $submission->files = $uploadedFiles;
            // Clear legacy fields when using new structure
            $submission->file_path = null;
            $submission->file_original_name = null;
        }

        $submission->fill([
            'enrollment_id'   => $enrollment->id,
            'submission_text' => $validated['submission_text'] ?? $submission->submission_text,
        ])->save();

        $submission->submit();

        return response()->json([
            'success'    => true,
            'message'    => 'Assignment submitted successfully!',
            'submission' => [
                'id'           => $submission->id,
                'status'       => $submission->status,
                'submitted_at' => $submission->submitted_at->format('M d, Y H:i'),
            ],
        ]);
    }

    private function getActiveEnrollment(Request $request, CourseAssignment $assignment): ?Enrollment
    {
        $enrollment = Enrollment::where('student_id', $request->user()->id)
            ->where('course_id', $assignment->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment || $enrollment->isExpired()) {
            return null;
        }

        return $enrollment;
    }
}
