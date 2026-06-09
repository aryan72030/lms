<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Mail\CourseCompletion;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\Setting;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user();

        $enrollments = Enrollment::with('course')
            ->where('student_id', $student->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $quizzes = Quiz::with(['course', 'attempts' => function ($query) use ($student) {
            $query->where('student_id', $student->id)->where('status', 'completed');
        }])
            ->whereIn('course_id', $courseIds)
            ->where('is_active', true)
            ->get()
            ->map(function (Quiz $quiz) use ($student) {
                $attempts = $quiz->attempts;

                $bestAttempt = $attempts->sortByDesc('percentage')->first();
                $hasPassed = $attempts->where('is_passed', true)->isNotEmpty();
                $isReady = $quiz->isReadyForStudents();
                $canAttempt = $isReady && $quiz->canStudentAttempt($student->id);

                return [
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
                    'questions_count' => $quiz->activeQuestions()->count(),
                    'is_ready' => $isReady,
                    'student_stats' => [
                        'attempts_used' => $attempts->count(),
                        'best_score' => $bestAttempt ? round((float) $bestAttempt->percentage, 1) : null,
                        'has_passed' => $hasPassed,
                        'can_attempt' => $canAttempt,
                        'last_attempt_date' => $attempts->last()?->created_at?->format('M d, Y'),
                    ],
                ];
            });

        return Inertia::render('student/quizzes/index', [
            'quizzes' => $quizzes,
            'enrollments' => $enrollments->map(function (Enrollment $enrollment) {
                return [
                    'id' => $enrollment->id,
                    'course' => [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                    ],
                    'progress' => $enrollment->progress,
                    'is_completed' => !is_null($enrollment->completion_date),
                ];
            }),
        ]);
    }

    public function show(Request $request, string $quiz): Response|RedirectResponse
    {
        $student = $request->user();

        $quiz = Quiz::with('course')->find($quiz);
        if (!$quiz) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Quiz not found.');
        }

        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $quiz->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment) {
            abort(403, 'You are not enrolled in this course.');
        }

        if ($enrollment->isExpired()) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Your access to this course and its quizzes has expired.');
        }

        if (!$quiz->is_active) {
            abort(404, 'This quiz is not available.');
        }

        $attempts = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'completed')
            ->latest('completed_at')
            ->get();

        $bestAttempt = $attempts->sortByDesc('percentage')->first();
        $hasPassed = $attempts->where('is_passed', true)->isNotEmpty();
        $isReady = $quiz->isReadyForStudents();
        $canAttempt = $isReady && $quiz->canStudentAttempt($student->id);

        return Inertia::render('student/quizzes/show', [
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
                'questions_count' => $quiz->activeQuestions()->count(),
                'is_ready' => $isReady,
                'student_stats' => [
                    'attempts_used' => $attempts->count(),
                    'best_score' => $bestAttempt ? round((float) $bestAttempt->percentage, 1) : null,
                    'has_passed' => $hasPassed,
                    'can_attempt' => $canAttempt,
                    'previous_attempts' => $attempts->map(fn (QuizAttempt $attempt) => [
                        'attempt_number' => $attempt->attempt_number,
                        'score' => $attempt->score,
                        'percentage' => round((float) $attempt->percentage, 1),
                        'is_passed' => (bool) $attempt->is_passed,
                        'completed_at' => $attempt->completed_at?->format('M d, Y H:i'),
                    ])->values(),
                ],
            ],
            'enrollment' => [
                'id' => $enrollment->id,
                'progress' => $enrollment->progress,
            ],
        ]);
    }

    public function attempt(Request $request, string $quiz): RedirectResponse
    {
        $student = $request->user();

        $quiz = Quiz::with('course')->find($quiz);
        if (!$quiz) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Quiz not found.');
        }

        // Never create attempts on GET/HEAD (prefetches, accidental visits, etc.)
        if (!$request->isMethod('post')) {
            return redirect()->route('student.quizzes.show', (string) $quiz->id);
        }

        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $quiz->course_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->first();

        if (!$enrollment) {
            abort(403, 'You are not enrolled in this course.');
        }

        if ($enrollment->isExpired()) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Your access to this course and its quizzes has expired.');
        }

        if (!$quiz->is_active) {
            abort(404, 'This quiz is not available.');
        }

        if (!$quiz->isReadyForStudents()) {
            return redirect()->route('student.quizzes.show', $quiz->id)
                ->with('error', 'This quiz is not ready yet (no questions/marks). Please try later.');
        }

        $existingInProgressAttempt = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->latest('started_at')
            ->first();

        if ($existingInProgressAttempt) {
            return redirect()->route('student.quiz-attempts.show', $existingInProgressAttempt);
        }

        if ($quiz->hasStudentPassed($student->id)) {
            return redirect()->route('student.quizzes.show', $quiz)
                ->with('error', 'You have already passed this quiz.');
        }

        if (!$quiz->canStudentAttempt($student->id)) {
            return redirect()->route('student.quizzes.show', $quiz)
                ->with('error', 'You have reached the maximum number of attempts for this quiz.');
        }

        $nextAttemptNumber = (QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->max('attempt_number') ?? 0) + 1;

        $attempt = QuizAttempt::create([
            'student_id' => $student->id,
            'quiz_id' => $quiz->id,
            'enrollment_id' => $enrollment->id,
            'attempt_number' => $nextAttemptNumber,
            'answers' => [],
            'started_at' => now(),
            'status' => 'in_progress',
        ]);

        return redirect()->route('student.quiz-attempts.show', $attempt);
    }

    public function showAttempt(Request $request, QuizAttempt $attempt): Response|RedirectResponse
    {
        $student = $request->user();

        if ($attempt->student_id !== $student->id) {
            abort(403, 'Unauthorized access to quiz attempt.');
        }

        if ($attempt->status !== 'in_progress') {
            return redirect()->route('student.quizzes.results', $attempt->quiz_id);
        }

        $quiz = $attempt->quiz()->with(['course', 'questions' => function ($q) {
            $q->where('is_active', true);
        }])->firstOrFail();

        // Shuffle questions based on attempt ID as seed so order is fixed per attempt but random for different students
        $questions = $quiz->questions->shuffle($attempt->id);

        $enrollment = $attempt->enrollment()->first();
        if ($enrollment && $enrollment->isExpired()) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Your access to this course and its quizzes has expired.');
        }

        $timeLimitMinutes = $quiz->time_limit;
        $elapsedSeconds = $attempt->started_at ? $attempt->started_at->diffInSeconds(now()) : 0;
        $remainingTime = is_null($timeLimitMinutes) ? null : max((((int) $timeLimitMinutes) * 60) - $elapsedSeconds, 0);

        return Inertia::render('student/quizzes/show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'course' => [
                    'id' => $quiz->course->id,
                    'title' => $quiz->course->title,
                ],
                'time_limit' => $quiz->time_limit,
                'questions_count' => $quiz->questions->count(),
            ],
            'attempt' => [
                'id' => $attempt->id,
                'answers' => $attempt->answers ?? [],
                'started_at' => $attempt->started_at?->toISOString(),
                'remaining_time' => $remainingTime,
            ],
            'questions' => $questions->map(fn (QuizQuestion $question) => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'options' => $question->question_type === QuizQuestion::TYPE_MULTIPLE_CHOICE ? $question->getFormattedOptions() : null,
                'points' => $question->points,
                'order' => $question->order,
            ])->values(),
            'enrollment' => [
                'id' => $enrollment->id,
                'progress' => $enrollment->progress,
            ],
        ]);
    }



    public function answer(Request $request, QuizAttempt $attempt): JsonResponse
    {
        $student = $request->user();

        if ($attempt->student_id !== $student->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($attempt->status !== 'in_progress') {
            return response()->json(['success' => false, 'message' => 'Attempt is not in progress.'], 400);
        }

        $validated = $request->validate([
            'question_id' => 'required|integer|exists:quiz_questions,id',
            'answer' => 'nullable|string',
        ]);

        $question = QuizQuestion::findOrFail($validated['question_id']);
        if ($question->quiz_id !== $attempt->quiz_id) {
            return response()->json(['success' => false, 'message' => 'Question does not belong to this quiz.'], 403);
        }

        $answers = $attempt->answers ?? [];
        $answers[(string) $question->id] = (string) ($validated['answer'] ?? '');
        $attempt->update(['answers' => $answers]);

        return response()->json(['success' => true]);
    }

    public function submit(Request $request, QuizAttempt $attempt, CertificateService $certificateService): RedirectResponse
    {
        $student = $request->user();

        if ($attempt->student_id !== $student->id) {
            abort(403, 'Unauthorized.');
        }

        if ($attempt->status !== 'in_progress') {
            return redirect()->route('student.quiz-attempts.results', $attempt);
        }

        $validated = $request->validate([
            'answers' => 'nullable|array',
        ]);

        $quiz = $attempt->quiz()->first();
        $submittedAnswers = $validated['answers'] ?? [];

        // Validate time limit on backend (with 2 min grace period)
        if ($quiz && $quiz->time_limit) {
            $elapsedMinutes = $attempt->started_at->floatDiffInMinutes(now());
            if ($elapsedMinutes > ($quiz->time_limit + 2)) {
                // Timeout exceeded: ignore submitted answers and keep auto-saved ones
                $submittedAnswers = [];
            }
        }

        // Use valid submitted answers or fall back to previously saved answers
        if (!empty($submittedAnswers)) {
            $attempt->answers = $submittedAnswers;
        } else {
            $attempt->answers = $attempt->answers ?? [];
        }
        $attempt->completed_at = now();
        $attempt->calculateScore();
        $attempt->save();

        if ($attempt->isPassed()) {
            $enrollment = $attempt->enrollment()->first();

            // Update enrollment progress since a key evaluation is done
            if ($enrollment) {
                $progressData = $enrollment->getProgressData();
                $enrollment->updateProgress($progressData['progress_percentage']);
            }

            if ($enrollment && $quiz && $quiz->is_final_quiz) {
                $enrollment->completion_date = now();
                $enrollment->save();

                try {
                    $enrollment->loadMissing(['student', 'course.instructor']);
                    if (!$certificateService->getCertificateUrl($enrollment)) {
                        $certificateService->generateCertificate($enrollment);
                    }
                } catch (\Throwable $certificateException) {
                    Log::error('Failed to auto-generate certificate after course completion.', [
                        'error' => $certificateException->getMessage(),
                        'enrollment_id' => $enrollment->id,
                        'student_id' => $student->id,
                        'attempt_id' => $attempt->id,
                    ]);
                }

                $emailSettings = Setting::getEmailSettings();
                if (($emailSettings['enabled'] ?? false) && ($emailSettings['types']['course_completion'] ?? false)) {
                    try {
                        Mail::to($student->email)->queue(new CourseCompletion($enrollment));
                    } catch (\Exception $mailException) {
                        Log::error('Failed to send course completion email to student: ' . $student->email, [
                            'error' => $mailException->getMessage(),
                            'enrollment_id' => $enrollment->id,
                        ]);
                    }
                }
            }
        }

        return redirect()->route('student.quiz-attempts.results', $attempt);
    }



    public function quizResults(Request $request, string $quiz): RedirectResponse
    {
        $student = $request->user();

        $quiz = Quiz::with('course')->find($quiz);
        if (!$quiz) {
            return redirect()->route('student.quizzes.index')
                ->with('error', 'Quiz not found.');
        }

        $attempt = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'completed')
            ->orderBy('percentage', 'desc')
            ->first();

        if (!$attempt) {
            return redirect()->route('student.quizzes.show', $quiz)
                ->with('error', 'No completed attempts found for this quiz.');
        }

        return redirect()->route('student.quiz-attempts.results', $attempt);
    }

    public function showResults(Request $request, QuizAttempt $attempt): Response
    {
        $student = $request->user();

        if ($attempt->student_id !== $student->id) {
            abort(403, 'Unauthorized access to quiz results.');
        }

        $attempt->load(['quiz.course', 'quiz.questions' => function ($q) {
            $q->where('is_active', true)->orderBy('order');
        }]);



        return Inertia::render('student/quizzes/results', [
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'max_score' => $attempt->max_score,
                'percentage' => round((float) $attempt->percentage, 1),
                'is_passed' => (bool) $attempt->is_passed,
                'completed_at' => $attempt->completed_at?->format('M d, Y H:i'),
                'time_spent' => $attempt->time_spent,
                'answers' => $attempt->answers,
            ],
            'quiz' => [
                'id' => $attempt->quiz->id,
                'title' => $attempt->quiz->title,
                'passing_score' => $attempt->quiz->passing_score,
                'course' => [
                    'id' => $attempt->quiz->course->id,
                    'title' => $attempt->quiz->course->title,
                ],
            ],
            'questions' => $attempt->quiz->questions->map(fn (QuizQuestion $question) => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'options' => $question->getFormattedOptions(),
                'correct_answer' => $question->correct_answer,
                'points' => $question->points,
            ]),
            'enrollment_id' => $attempt->enrollment_id,
        ]);
    }


}
