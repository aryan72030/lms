<?php

namespace App\Http\Controllers\Instructor;

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
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureInstructor($request);

        $query = Quiz::with(['course'])
            ->whereHas('course', function ($q) {
                $q->where('instructor_id', Auth::id());
            });

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

        $quizzes = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course' => [
                    'id' => $quiz->course->id,
                    'title' => $quiz->course->title,
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

        // Get instructor's courses for filter dropdown
        $courses = Course::where('instructor_id', Auth::id())
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
            ]);

        return Inertia::render('instructor/quizzes/index', [
            'quizzes' => $quizzes,
            'courses' => $courses,
            'filters' => $request->only(['search', 'course_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureInstructor($request);

        $courses = Course::where('instructor_id', Auth::id())
            ->published()
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
            ]);

        return Inertia::render('instructor/quizzes/create', [
            'courses' => $courses,
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureInstructor($request);

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
        ]);

        // Verify instructor owns the course
        $course = Course::findOrFail($validated['course_id']);
        if ($course->instructor_id !== Auth::id()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only create quizzes for your own courses.',
                ], 403);
            }
            return redirect()->back()
                ->with('error', 'You can only create quizzes for your own courses.')
                ->withInput();
        }

        try {
            $quiz = Quiz::create([
                ...$validated,
                'is_active' => true,
            ]);

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

            return redirect()->route('instructor.quizzes.show', $quiz)
                ->with('success', "Quiz '{$quiz->title}' created successfully. Now add questions to complete the quiz.");
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
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        $quiz->load([
            'course',
            'questions' => function ($query) {
                $query->orderBy('order');
            },
        ]);

        $statistics = $quiz->getAttemptStatistics();

        return Inertia::render('instructor/quizzes/show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course' => [
                    'id' => $quiz->course->id,
                    'title' => $quiz->course->title,
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
                    'is_active' => $question->is_active,
                ]),
                'created_at' => $quiz->created_at->format('M d, Y H:i'),
                'updated_at' => $quiz->updated_at->format('M d, Y H:i'),
            ],
            'statistics' => $statistics,
            'questionTypes' => QuizQuestion::getTypeLabels(),
        ]);
    }

    public function edit(Request $request, Quiz $quiz): Response
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        $courses = Course::where('instructor_id', Auth::id())
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
            ]);

        return Inertia::render('instructor/quizzes/edit', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'course_id' => $quiz->course_id,
                'time_limit' => $quiz->time_limit,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
                'is_final_quiz' => $quiz->is_final_quiz,
                'is_active' => $quiz->is_active,
            ],
            'courses' => $courses,
        ]);
    }

    public function update(Request $request, Quiz $quiz): JsonResponse|RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

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

            return redirect()->route('instructor.quizzes.show', $quiz)
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
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

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
                return redirect()->route('instructor.quizzes.index')
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

            return redirect()->route('instructor.quizzes.index')
                ->with('success', "Quiz '{$quizTitle}' deleted successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete quiz. Please try again.'
                ], 500);
            }
            return redirect()->route('instructor.quizzes.index')
                ->with('error', 'Failed to delete quiz. Please try again.');
        }
    }

    // Question Management
    public function storeQuestion(Request $request, Quiz $quiz): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,true_false,short_answer',
            'options' => 'nullable|array',
            'options.*' => 'nullable|string',
            'correct_answer' => 'required|string',
            'explanation' => 'nullable|string',
            'points' => 'required|integer|min:1',
        ]);

        try {
            $question = QuizQuestion::create([
                ...$validated,
                'quiz_id' => $quiz->id,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question added successfully.',
                'question' => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'options' => $question->getFormattedOptions(),
                    'correct_answer' => $question->correct_answer,
                    'explanation' => $question->explanation,
                    'points' => $question->points,
                    'order' => $question->order,
                    'is_active' => $question->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add question. Please try again.'
            ], 500);
        }
    }

    public function updateQuestion(Request $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        if ($question->quiz_id !== $quiz->id) {
            return response()->json([
                'success' => false,
                'message' => 'Question does not belong to this quiz.'
            ], 403);
        }

        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|in:multiple_choice,true_false,short_answer',
            'options' => 'nullable|array',
            'options.*' => 'nullable|string',
            'correct_answer' => 'required|string',
            'explanation' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'is_active' => 'boolean',
        ]);

        try {
            $question->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully.',
                'question' => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'options' => $question->getFormattedOptions(),
                    'correct_answer' => $question->correct_answer,
                    'explanation' => $question->explanation,
                    'points' => $question->points,
                    'order' => $question->order,
                    'is_active' => $question->is_active,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question. Please try again.'
            ], 500);
        }
    }

    public function destroyQuestion(Request $request, Quiz $quiz, QuizQuestion $question): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        if ($question->quiz_id !== $quiz->id) {
            return response()->json([
                'success' => false,
                'message' => 'Question does not belong to this quiz.'
            ], 403);
        }

        try {
            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question. Please try again.'
            ], 500);
        }
    }

    public function reorderQuestions(Request $request, Quiz $quiz): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnsQuiz($quiz);

        $validated = $request->validate([
            'question_ids' => 'required|array',
            'question_ids.*' => 'required|integer|exists:quiz_questions,id',
        ]);

        try {
            QuizQuestion::reorderQuestions($quiz->id, $validated['question_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder questions. Please try again.'
            ], 500);
        }
    }

    private function ensureOwnsQuiz(Quiz $quiz): void
    {
        if ($quiz->course->instructor_id !== Auth::id()) {
            abort(403, 'You can only manage quizzes for your own courses.');
        }
    }
}