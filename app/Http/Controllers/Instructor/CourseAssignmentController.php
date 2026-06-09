<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseAssignmentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseAssignmentController extends Controller
{
    // All assignments across instructor's courses
    public function indexAll(Request $request): Response
    {
        $instructorId = $request->user()->id;
        
        $query = CourseAssignment::with(['course:id,title'])
            ->whereHas('course', fn ($q) => $q->where('instructor_id', $instructorId))
            ->withCount([
                'submissions',
                'submissions as submitted_count' => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_SUBMITTED),
                'submissions as graded_count'    => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_GRADED),
                'submissions as rejected_count'  => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_REJECTED),
            ]);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('course', fn ($cq) => $cq->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('course_id')) {
            $query->whereHas('course', fn ($q) => $q->where('id', $request->get('course_id')));
        }

        $assignments = $query->orderByDesc('created_at')
            ->paginate((int) \App\Models\Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($a) => [
                    'id'              => $a->id,
                    'course_id'       => $a->course_id,
                    'title'           => $a->title,
                    'instructions'    => $a->instructions,
                    'assignment_type' => $a->assignment_type,
                    'allowed_file_types' => $a->allowed_file_types,
                    'max_file_size_mb' => $a->max_file_size_mb,
                    'max_files'       => $a->max_files,
                    'course' => [
                        'id' => $a->course?->id,
                        'title' => $a->course?->title,
                        'instructor_name' => $a->course?->instructor?->name,
                    ],
                    'max_score'       => $a->max_score,
                    'passing_score'   => $a->passing_score,
                    'due_days'        => $a->due_days,
                    'is_published'    => $a->is_published,
                    'submissions_count' => (int) $a->submissions_count,
                    'submitted_count' => (int) $a->submitted_count,
                    'graded_count'    => (int) $a->graded_count,
                    'rejected_count'  => (int) $a->rejected_count,
                    'created_at'      => $a->created_at->toISOString(),
                ]);



        $courses = Course::where('instructor_id', $instructorId)
            ->select('id', 'title')
            ->get();

        return Inertia::render('instructor/assignments/all', [
            'assignments' => $assignments,
            'courses'     => $courses,
            'filters'     => $request->only(['search', 'course_id']),
        ]);
    }
    // Course ના assignments list + create/edit
    public function index(Request $request, Course $course): Response
    {
        $this->ensureCourseOwnership($request, $course);

        $assignments = $course->assignments()
            ->withCount([
                'submissions',
                'submissions as submitted_count' => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_SUBMITTED),
                'submissions as graded_count'    => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_GRADED),
                'submissions as rejected_count'  => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_REJECTED),
            ])
            ->get()
            ->map(fn ($a) => [
                'id'              => $a->id,
                'title'           => $a->title,
                'max_score'       => $a->max_score,
                'passing_score'   => $a->passing_score,
                'due_days'        => $a->due_days,
                'is_published'    => $a->is_published,
                'order'           => $a->order,
                'submissions_count' => (int) $a->submissions_count,
                'submitted_count' => (int) $a->submitted_count,
                'graded_count'    => (int) $a->graded_count,
                'rejected_count'  => (int) $a->rejected_count,
            ]);

        return Inertia::render('instructor/courses/assignments', [
            'course'      => ['id' => $course->id, 'title' => $course->title, 'status' => $course->status],
            'assignments' => $assignments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Validate course_id here, then retrieve the course
        $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
        ]);
        $course = Course::findOrFail($request->course_id);
        $this->ensureCourseOwnership($request, $course);

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'instructions'  => 'required|string',
            'assignment_type' => 'required|in:text,file,mixed',
            'allowed_file_types' => 'nullable|array',
            'allowed_file_types.*' => 'string|in:pdf,doc,docx,txt,jpg,jpeg,png,zip',
            'max_file_size_mb' => 'nullable|integer|min:1|max:100',
            'max_files' => 'nullable|integer|min:1|max:10',
            'max_score'     => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:1|lte:max_score',
            'due_days'      => 'required|integer|min:1',
            'is_published'  => 'boolean',
        ]);

        $course->assignments()->create($validated);

        return redirect()->back()->with('success', "Assignment '{$validated['title']}' created successfully.");
    }

    public function edit(Request $request, Course $course, CourseAssignment $assignment): JsonResponse
    {
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        return response()->json([
            'id' => $assignment->id,
            'title' => $assignment->title,
            'instructions' => $assignment->instructions,
            'assignment_type' => $assignment->assignment_type,
            'allowed_file_types' => $assignment->allowed_file_types,
            'max_file_size_mb' => $assignment->max_file_size_mb,
            'max_files' => $assignment->max_files,
            'max_score' => $assignment->max_score,
            'passing_score' => $assignment->passing_score,
            'due_days' => $assignment->due_days,
            'is_published' => $assignment->is_published,
        ]);
    }

    public function update(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'instructions'  => 'required|string',
            'assignment_type' => 'required|in:text,file,mixed',
            'allowed_file_types' => 'nullable|array',
            'allowed_file_types.*' => 'string|in:pdf,doc,docx,txt,jpg,jpeg,png,zip',
            'max_file_size_mb' => 'nullable|integer|min:1|max:100',
            'max_files' => 'nullable|integer|min:1|max:10',
            'max_score'     => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:1|lte:max_score',
            'due_days'      => 'required|integer|min:1',
            'is_published'  => 'boolean',
        ]);

        $assignment->update($validated);

        return redirect()->back()->with('success', "Assignment '{$assignment->title}' updated successfully.");
    }

    public function destroy(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $submissionsCount = $assignment->submissions()->where('status', '!=', CourseAssignmentSubmission::STATUS_DRAFT)->count();

        if ($submissionsCount > 0) {
            return redirect()->back()->with('error', "Cannot delete assignment '{$assignment->title}' because it has {$submissionsCount} submission(s).");
        }

        $title = $assignment->title;
        $assignment->delete();

        return redirect()->route('instructor.assignments.index')->with('success', "Assignment '{$title}' deleted successfully.");
    }

    public function togglePublish(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $assignment->update(['is_published' => !$assignment->is_published]);

        $status = $assignment->is_published ? 'published' : 'unpublished';
        return redirect()->back()->with('success', "Assignment '{$assignment->title}' {$status} successfully.");
    }

    // Submissions list + grading panel
    public function show(Request $request, CourseAssignment $assignment): Response
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $submissions = $assignment->submissions()
            ->with(['student:id,name,email'])
            ->orderByRaw("FIELD(status, 'Submitted', 'Rejected', 'Draft', 'Graded')")
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'student_name'    => $s->student->name,
                'student_email'   => $s->student->email,
                'status'          => $s->status,
                'submission_text' => $s->submission_text,
                'file_path'       => $s->file_path,
                'file_original_name' => $s->file_original_name,
                'file_url'        => $s->file_path ? route('files.show', ['path' => $s->file_path]) : null,
                'files'           => collect($s->getAllFiles())->map(function ($file) {
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
                })->toArray(),
                'has_files'       => $s->hasFiles(),
                'resubmission_count' => $s->resubmission_count ?? 0,
                'last_reopened_at' => $s->last_reopened_at?->format('M d, Y H:i'),
                'score'           => $s->score,
                'percentage'      => $s->percentage,
                'feedback'        => $s->feedback,
                'submitted_at'    => $s->submitted_at?->format('M d, Y H:i'),
                'graded_at'       => $s->graded_at?->format('M d, Y H:i'),
                'is_passed'       => $s->isGraded() ? $s->isPassed() : null,
            ]);

        return Inertia::render('instructor/assignments/show', [
            'course'     => ['id' => $course->id, 'title' => $course->title],
            'assignment' => [
                'id'            => $assignment->id,
                'title'         => $assignment->title,
                'instructions'  => $assignment->instructions,
                'assignment_type' => $assignment->assignment_type,
                'allowed_file_types' => $assignment->allowed_file_types,
                'max_file_size_mb' => $assignment->max_file_size_mb,
                'max_files'     => $assignment->max_files,
                'max_score'     => $assignment->max_score,
                'passing_score' => $assignment->passing_score,
            ],
            'submissions' => $submissions,
        ]);
    }

    // Grade a submission
    public function grade(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): RedirectResponse
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $validated = $request->validate([
            'score'    => "required|integer|min:0|max:{$assignment->max_score}",
            'feedback' => 'nullable|string|max:2000',
        ]);

        $submission->grade($validated['score'], $validated['feedback'] ?? null);

        return redirect()->back()->with('success', 'Submission graded successfully.');
    }

    // Reject a submission
    public function reject(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): RedirectResponse
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);

        $validated = $request->validate([
            'feedback' => 'required|string|max:2000',
        ]);

        $submission->reject($validated['feedback']);

        return redirect()->back()->with('success', 'Submission rejected. Student can now resubmit.');
    }

    // Show a single submission details
    public function showSubmission(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): Response
    {
        $course = $assignment->course;
        $this->ensureCourseOwnership($request, $course);
        $this->ensureAssignmentBelongsToCourse($assignment, $course);
        $this->ensureSubmissionBelongsToAssignment($submission, $assignment);

        // Load necessary relations for the submission
        $submission->load(['student:id,name,email']);

        $submissionData = [
            'id'                 => $submission->id,
            'student_name'       => $submission->student->name,
            'student_email'      => $submission->student->email,
            'status'             => $submission->status,
            'submission_text'    => $submission->submission_text,
            'file_path'          => $submission->file_path,
            'file_original_name' => $submission->file_original_name,
            'file_url'           => $submission->file_path ? asset('storage/' . $submission->file_path) : null,
            'score'              => $submission->score,
            'percentage'         => $submission->percentage,
            'feedback'           => $submission->feedback,
            'submitted_at'       => $submission->submitted_at?->format('M d, Y H:i'),
            'graded_at'          => $submission->graded_at?->format('M d, Y H:i'),
            'is_passed'          => $submission->isGraded() ? $submission->isPassed() : null,
        ];

        return Inertia::render('instructor/assignments/submission-details', [
            'course'     => ['id' => $course->id, 'title' => $course->title],
            'assignment' => [
                'id'            => $assignment->id,
                'title'         => $assignment->title,
                'instructions'  => $assignment->instructions,
                'max_score'     => $assignment->max_score,
                'passing_score' => $assignment->passing_score,
            ],
            'submission' => $submissionData,
        ]);
    }

    private function ensureCourseOwnership(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only manage assignments for your own courses.');
        }
    }

    private function ensureAssignmentBelongsToCourse(CourseAssignment $assignment, Course $course): void
    {
        if ($assignment->course_id !== $course->id) {
            abort(404, 'Assignment not found in this course.');
        }
    }

    private function ensureSubmissionBelongsToAssignment(CourseAssignmentSubmission $submission, CourseAssignment $assignment): void
    {
        if ($submission->course_assignment_id !== $assignment->id) {
            abort(404, 'Submission not found for this assignment.');
        }
    }
}
