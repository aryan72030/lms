<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseAssignmentSubmission;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CourseAssignmentController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        // Debug: Check if we reach here
        \Log::info('Admin assignments index accessed');

        $query = CourseAssignment::with(['course:id,title,instructor_id', 'course.instructor:id,name'])
            ->withCount([
                'submissions',
                'submissions as submitted_count' => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_SUBMITTED),
                'submissions as graded_count'    => fn ($q) => $q->where('status', CourseAssignmentSubmission::STATUS_GRADED),
            ]);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('course', fn ($cq) => $cq->where('title', 'like', "%{$search}%"))
                  ->orWhereHas('course.instructor', fn ($iq) => $iq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->get('course_id'));
        }

        $assignments = $query->orderByDesc('id')
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($a) => [
                'id'               => $a->id,
                'title'            => $a->title,
                'course_title'     => $a->course?->title,
                'instructor_name'  => $a->course?->instructor?->name,
                'is_published'     => $a->is_published,
                'submissions_count' => (int) $a->submissions_count,
                'submitted_count'  => (int) $a->submitted_count,
                'graded_count'     => (int) $a->graded_count,
                'created_at'       => $a->created_at->toISOString(),
                'max_score'        => $a->max_score,
                'due_days'         => $a->due_days,
                'course_id'        => $a->course_id,
                'instructions'     => $a->instructions,
                'passing_score'    => $a->passing_score,
                'assignment_type'  => $a->assignment_type,
                'allowed_file_types' => $a->allowed_file_types,
                'max_file_size_mb' => $a->max_file_size_mb,
                'max_files'        => $a->max_files,
            ]);

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get(['id', 'title', 'instructor_id'])
            ->map(fn ($c) => [
                'id' => $c->id, 
                'title' => $c->title, 
                'instructor_name' => $c->instructor?->name
            ]);

        return Inertia::render('admin/assignments/index', [
            'assignments' => $assignments,
            'courses'     => $courses,
            'filters'     => $request->only(['search', 'course_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureAdmin($request);

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get(['id', 'title', 'instructor_id'])
            ->map(fn ($c) => [
                'id' => $c->id, 
                'title' => $c->title, 
                'instructor_name' => $c->instructor?->name
            ]);

        return Inertia::render('admin/assignments/create', [
            'courses' => $courses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'course_id'     => 'required|exists:courses,id',
            'title'         => 'required|string|max:255',
            'instructions'  => 'required|string',
            'assignment_type' => 'required|in:text,file,mixed',
            'allowed_file_types' => 'nullable|array',
            'allowed_file_types.*' => 'string|in:pdf,doc,docx,txt,jpg,jpeg,png,zip',
            'max_file_size_mb' => 'nullable|integer|min:1|max:100',
            'max_files'     => 'nullable|integer|min:1|max:10',
            'max_score'     => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:1|lte:max_score',
            'due_days'      => 'required|integer|min:1',
            'is_published'  => 'boolean',
        ]);

        CourseAssignment::create($validated);

        return redirect()->route('admin.assignments.index')->with('success', "Assignment '{$validated['title']}' created successfully.");
    }

    public function edit(Request $request, CourseAssignment $assignment): Response
    {
        $this->ensureAdmin($request);

        $assignment->load('course.instructor');

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get(['id', 'title', 'instructor_id'])
            ->map(fn ($c) => [
                'id' => $c->id, 
                'title' => $c->title, 
                'instructor_name' => $c->instructor?->name
            ]);

        return Inertia::render('admin/assignments/edit', [
            'assignment' => [
                'id'            => $assignment->id,
                'course_id'     => $assignment->course_id,
                'title'         => $assignment->title,
                'instructions'  => $assignment->instructions,
                'max_score'     => $assignment->max_score,
                'passing_score' => $assignment->passing_score,
                'due_days'      => $assignment->due_days,
                'is_published'  => $assignment->is_published,
            ],
            'courses' => $courses,
        ]);
    }

    public function update(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'course_id'     => 'required|exists:courses,id',
            'title'         => 'required|string|max:255',
            'instructions'  => 'required|string',
            'assignment_type' => 'required|in:text,file,mixed',
            'allowed_file_types' => 'nullable|array',
            'allowed_file_types.*' => 'string|in:pdf,doc,docx,txt,jpg,jpeg,png,zip',
            'max_file_size_mb' => 'nullable|integer|min:1|max:100',
            'max_files'     => 'nullable|integer|min:1|max:10',
            'max_score'     => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:1|lte:max_score',
            'due_days'      => 'required|integer|min:1',
            'is_published'  => 'boolean',
        ]);

        $assignment->update($validated);

        return redirect()->route('admin.assignments.index')->with('success', "Assignment '{$assignment->title}' updated successfully.");
    }

    public function destroy(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $this->ensureAdmin($request);

        $submissionsCount = $assignment->submissions()->where('status', '!=', CourseAssignmentSubmission::STATUS_DRAFT)->count();

        if ($submissionsCount > 0) {
            return redirect()->back()->withErrors([
                'delete' => "Cannot delete assignment '{$assignment->title}' because it has {$submissionsCount} submission(s)."
            ]);
        }

        $title = $assignment->title;
        $assignment->delete();

        return redirect()->back()->with('success', "Assignment '{$title}' deleted successfully.");
    }

    public function togglePublish(Request $request, CourseAssignment $assignment): RedirectResponse
    {
        $this->ensureAdmin($request);

        $assignment->update(['is_published' => !$assignment->is_published]);

        $status = $assignment->is_published ? 'published' : 'unpublished';
        return redirect()->back()->with('success', "Assignment '{$assignment->title}' {$status} successfully.");
    }

    public function show(Request $request, CourseAssignment $assignment): Response
    {
        $this->ensureAdmin($request);

        $assignment->load(['course.instructor']);

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
                'files'           => collect($s->getAllFiles())->map(function ($file) {
                    try {
                        if (is_array($file) && isset($file['path']) && is_string($file['path'])) {
                            $file['url'] = asset('storage/' . $file['path']);
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
                'score'           => $s->score,
                'percentage'      => $s->percentage,
                'feedback'        => $s->feedback,
                'submitted_at'    => $s->submitted_at?->format('M d, Y H:i'),
                'graded_at'       => $s->graded_at?->format('M d, Y H:i'),
                'is_passed'       => $s->isGraded() ? $s->isPassed() : null,
            ]);

        return Inertia::render('admin/assignments/show', [
            'assignment'  => [
                'id'             => $assignment->id,
                'title'          => $assignment->title,
                'instructions'   => $assignment->instructions,
                'max_score'      => $assignment->max_score,
                'passing_score'  => $assignment->passing_score,
                'course_id'      => $assignment->course_id,
                'course_title'   => $assignment->course?->title,
                'instructor'     => [
                    'name'  => $assignment->course?->instructor?->name,
                    'email' => $assignment->course?->instructor?->email,
                ],
            ],
            'submissions' => $submissions,
        ]);
    }

    public function grade(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'score'    => "required|integer|min:0|max:{$assignment->max_score}",
            'feedback' => 'nullable|string|max:2000',
        ]);

        $submission->grade($validated['score'], $validated['feedback'] ?? null);

        return redirect()->back()->with('success', 'Submission graded successfully.');
    }

    public function reject(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'feedback' => 'nullable|string|max:2000',
        ]);

        $submission->reject($validated['feedback'] ?? null);

        return redirect()->back()->with('success', 'Submission rejected successfully. Student can now resubmit.');
    }

    public function showSubmission(Request $request, CourseAssignment $assignment, CourseAssignmentSubmission $submission): Response
    {
        $this->ensureAdmin($request);

        $submission->load(['student:id,name,email']);

        $submissionData = [
            'id'                 => $submission->id,
            'student_name'       => $submission->student->name,
            'student_email'      => $submission->student->email,
            'status'             => $submission->status,
            'submission_text'    => $submission->submission_text,
            'file_url'           => (!empty($submission->files) && is_array($submission->files) && isset($submission->files[0]['path'])) ? asset('storage/' . $submission->files[0]['path']) : null,
            'file_original_name' => (!empty($submission->files) && is_array($submission->files) && isset($submission->files[0]['original_name'])) ? $submission->files[0]['original_name'] : null,
            'score'              => $submission->score,
            'percentage'         => $submission->percentage,
            'feedback'           => $submission->feedback,
            'submitted_at'       => $submission->submitted_at?->format('M d, Y H:i'),
            'graded_at'          => $submission->graded_at?->format('M d, Y H:i'),
            'is_passed'          => $submission->isGraded() ? $submission->isPassed() : null,
        ];

        return Inertia::render('admin/assignments/submission-details', [
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
}
