<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Lesson;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = Lesson::query()
            ->where('type', Lesson::TYPE_ASSIGNMENT)
            ->with([
                'course:id,title,instructor_id',
                'course.instructor:id,name,email',
            ])
            ->withCount([
                'submissions',
                'submissions as pending_count' => fn ($q) => $q->where('status', AssignmentSubmission::STATUS_SUBMITTED),
            ]);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('course', fn ($courseQuery) => $courseQuery->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('course.instructor', fn ($instructorQuery) => $instructorQuery->where('name', 'like', "%{$search}%"));
            });
        }

        $assignments = $query
            ->orderByDesc('id')
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'course_title' => $lesson->course?->title,
                'instructor_name' => $lesson->course?->instructor?->name,
                'submissions_count' => (int) $lesson->submissions_count,
                'pending_count' => (int) ($lesson->pending_count ?? 0),
            ]);

        return Inertia::render('admin/assignments/index', [
            'assignments' => $assignments,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Request $request, Lesson $lesson): Response
    {
        $this->ensureAdmin($request);

        if ($lesson->type !== Lesson::TYPE_ASSIGNMENT) {
            abort(404, 'This lesson is not an assignment.');
        }

        $lesson->load(['course.instructor']);

        $submissions = AssignmentSubmission::with(['student'])
            ->where('lesson_id', $lesson->id)
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn (AssignmentSubmission $submission) => [
                'id' => $submission->id,
                'student_name' => $submission->student?->name,
                'submitted_at' => $submission->submitted_at?->format('M d, Y H:i'),
                'status' => $submission->status,
                'score' => $submission->score,
                'max_score' => $submission->max_score,
                'file_path' => $submission->file_path,
                'file_url' => $submission->file_path ? '/files/' . $submission->file_path : null,
                'submission_text' => $submission->submission_text,
                'feedback' => $submission->feedback,
            ]);

        return Inertia::render('admin/assignments/show', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'course_title' => $lesson->course?->title,
                'instructor' => [
                    'name' => $lesson->course?->instructor?->name,
                    'email' => $lesson->course?->instructor?->email,
                ],
                'assignment_data' => [
                    'instructions' => $lesson->assignment_data['instructions'] ?? '',
                    'max_score' => $lesson->assignment_data['max_score'] ?? 100,
                ],
            ],
            'submissions' => $submissions,
        ]);
    }

    public function grade(Request $request, AssignmentSubmission $submission): RedirectResponse
    {
        $this->ensureAdmin($request);

        $request->validate([
            'score' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        $maxScore = (int) ($submission->lesson?->assignment_data['max_score'] ?? $submission->max_score ?? 100);
        $maxScore = max(1, $maxScore);

        if ((float) $request->score > $maxScore) {
            return back()
                ->withErrors(['score' => "Score cannot be greater than {$maxScore}."])
                ->withInput();
        }

        $percentage = ((float) $request->score / $maxScore) * 100;

        $submission->update([
            'score' => $request->score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
            'feedback' => $request->feedback,
            'status' => AssignmentSubmission::STATUS_GRADED,
            'graded_at' => now(),
        ]);

        return back()->with('success', 'Assignment graded successfully!');
    }
}

