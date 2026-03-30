<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizAttempt;
use App\Models\Course;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = Quiz::with(['course', 'course.instructor']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('course', function ($courseQuery) use ($search) {
                      $courseQuery->where('title', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by course
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->get('course_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'final') {
                $query->where('is_final_quiz', true);
            }
        }

        $quizzes = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course_id' => $quiz->course_id,
                'course' => [
                    'id' => $quiz->course->id,
                    'title' => $quiz->course->title,
                    'instructor' => [
                        'id' => $quiz->course->instructor->id,
                        'name' => $quiz->course->instructor->name,
                    ],
                ],
                'time_limit' => $quiz->time_limit,
                'total_marks' => $quiz->total_marks,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
                'is_final_quiz' => $quiz->is_final_quiz,
                'is_active' => $quiz->is_active,
                'questions_count' => $quiz->questions()->count(),
                'attempts_count' => $quiz->attempts()->count(),
                'created_at' => $quiz->created_at->format('M d, Y'),
            ]);

        // Get courses for filter dropdown
        $courses = Course::with('instructor')
            ->published()
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'instructor_name' => $course->instructor->name,
            ]);

        return Inertia::render('admin/quizzes/index', [
            'quizzes' => $quizzes,
            'courses' => $courses,
            'filters' => $request->only(['search', 'course_id', 'status']),
        ]);
    }

    public function create(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        return redirect()->route('admin.quizzes.index', ['create' => 'true']);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $maxAttemptsSetting = (int) Setting::get('max_quiz_attempts', 10);
        $minPassingScoreSetting = (int) Setting::get('min_quiz_passing_score', 0);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'course_id' => 'required|exists:courses,id',
            'time_limit' => 'nullable|integer|min:1',
            'passing_score' => "required|numeric|min:{$minPassingScoreSetting}|max:100",
            'max_attempts' => "required|integer|min:1|max:{$maxAttemptsSetting}",
            'is_final_quiz' => 'boolean',
            'is_active' => 'boolean',
        ]);

        try {
            $quiz = Quiz::create($validated);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Quiz '{$quiz->title}' created successfully.",
                    'quiz' => [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                    ]
                ]);
            }

            return redirect()->route('admin.quizzes.index')
                ->with('success', "Quiz '{$quiz->title}' created successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create quiz. Please try again.'
                ], 500);
            }
            return redirect()->back()
                ->with('error', 'Failed to create quiz. Please try again.')
                ->withInput();
        }
    }

    public function show(Request $request, Quiz $quiz): Response
    {
        $this->ensureAdmin($request);

        $quiz->load([
            'course.instructor',
            'questions' => function ($query) {
                $query->orderBy('order');
            },
        ]);

        $statistics = $quiz->getAttemptStatistics();

        return Inertia::render('admin/quizzes/show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course' => [
                    'id' => $quiz->course->id,
                    'title' => $quiz->course->title,
                    'instructor' => [
                        'id' => $quiz->course->instructor->id,
                        'name' => $quiz->course->instructor->name,
                    ],
                ],
                'time_limit' => $quiz->time_limit,
                'total_marks' => $quiz->total_marks,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
                'is_final_quiz' => $quiz->is_final_quiz,
                'is_active' => $quiz->is_active,
                'questions' => $quiz->questions->map(fn($question) => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'options' => $question->getFormattedOptions(),
                    'correct_answer' => $question->correct_answer,
                    'explanation' => $question->explanation,
                    'points' => $question->points,
                    'order' => $question->order,
                ]),
                'created_at' => $quiz->created_at->format('M d, Y H:i'),
                'updated_at' => $quiz->updated_at->format('M d, Y H:i'),
            ],
            'statistics' => $statistics,
        ]);
    }

    public function edit(Request $request, Quiz $quiz): RedirectResponse
    {
        $this->ensureAdmin($request);

        return redirect()->route('admin.quizzes.index', ['edit' => $quiz->id]);
    }

    public function update(Request $request, Quiz $quiz): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $maxAttemptsSetting = (int) Setting::get('max_quiz_attempts', 10);
        $minPassingScoreSetting = (int) Setting::get('min_quiz_passing_score', 0);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'time_limit' => 'nullable|integer|min:1',
            'passing_score' => "required|numeric|min:{$minPassingScoreSetting}|max:100",
            'max_attempts' => "required|integer|min:1|max:{$maxAttemptsSetting}",
            'is_final_quiz' => 'boolean',
            'is_active' => 'boolean',
        ]);

        try {
            $quiz->update($validated);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Quiz '{$quiz->title}' updated successfully.",
                    'quiz' => [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                    ]
                ]);
            }

            return redirect()->route('admin.quizzes.index')
                ->with('success', "Quiz '{$quiz->title}' updated successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update quiz. Please try again.'
                ], 500);
            }
            return redirect()->back()
                ->with('error', 'Failed to update quiz. Please try again.')
                ->withInput();
        }
    }

    public function destroy(Request $request, Quiz $quiz): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        try {
            // Check if quiz has attempts
            $attemptsCount = $quiz->attempts()->count();
            if ($attemptsCount > 0) {
                $message = "Cannot delete quiz '{$quiz->title}' because it has {$attemptsCount} student attempt(s). Consider deactivating it instead.";
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message
                    ], 422);
                }
                return redirect()->route('admin.quizzes.index')
                    ->with('error', $message);
            }

            $quizTitle = $quiz->title;
            $quiz->delete();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Quiz '{$quizTitle}' deleted successfully."
                ]);
            }

            return redirect()->route('admin.quizzes.index')
                ->with('success', "Quiz '{$quizTitle}' deleted successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete quiz. Please try again.'
                ], 500);
            }
            return redirect()->route('admin.quizzes.index')
                ->with('error', 'Failed to delete quiz. Please try again.');
        }
    }

    public function toggleStatus(Request $request, Quiz $quiz): JsonResponse
    {
        $this->ensureAdmin($request);

        try {
            $quiz->update([
                'is_active' => !$quiz->is_active
            ]);

            return response()->json([
                'success' => true,
                'message' => "Quiz status updated successfully.",
                'is_active' => $quiz->is_active
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quiz status.'
            ], 500);
        }
    }

    public function attempts(Request $request, Quiz $quiz): Response
    {
        $this->ensureAdmin($request);

        $query = QuizAttempt::with(['student', 'enrollment'])
            ->where('lesson_id', $quiz->id);

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'passed') {
                $query->where('is_passed', true);
            } elseif ($status === 'failed') {
                $query->where('is_passed', false)->where('status', 'completed');
            } elseif ($status === 'in_progress') {
                $query->where('status', 'in_progress');
            }
        }

        $attempts = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($attempt) => [
                'id' => $attempt->id,
                'student' => [
                    'id' => $attempt->student->id,
                    'name' => $attempt->student->name,
                    'email' => $attempt->student->email,
                ],
                'attempt_number' => $attempt->attempt_number,
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'percentage' => $attempt->percentage,
                'is_passed' => $attempt->is_passed,
                'grade_letter' => $attempt->getGradeLetter(),
                'time_spent' => $attempt->time_spent,
                'status' => $attempt->status,
                'started_at' => $attempt->started_at?->format('M d, Y H:i'),
                'completed_at' => $attempt->completed_at?->format('M d, Y H:i'),
            ]);

        return Inertia::render('admin/quizzes/attempts', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'course_title' => $quiz->course->title,
            ],
            'attempts' => $attempts,
            'filters' => $request->only(['status']),
        ]);
    }

    public function attemptDetails(Request $request, QuizAttempt $attempt): Response
    {
        $this->ensureAdmin($request);

        $attempt->load(['quiz.questions', 'student']);
        $results = $attempt->getDetailedResults();

        return Inertia::render('admin/quizzes/attempt-details', [
            'attempt' => [
                'id' => $attempt->id,
                'student' => [
                    'id' => $attempt->student->id,
                    'name' => $attempt->student->name,
                    'email' => $attempt->student->email,
                ],
                'quiz' => [
                    'id' => $attempt->quiz->id,
                    'title' => $attempt->quiz->title,
                ],
                'attempt_number' => $attempt->attempt_number,
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'percentage' => $attempt->percentage,
                'is_passed' => $attempt->is_passed,
                'grade_letter' => $attempt->getGradeLetter(),
                'time_spent' => $attempt->time_spent,
                'started_at' => $attempt->started_at?->format('M d, Y H:i'),
                'completed_at' => $attempt->completed_at?->format('M d, Y H:i'),
            ],
            'results' => $results,
        ]);
    }
}
