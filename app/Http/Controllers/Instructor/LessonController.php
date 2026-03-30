<?php

namespace App\Http\Controllers\Instructor;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request, Course $course): Response
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);

        $lessons = $course->lessons()
            ->ordered()
            ->get()
            ->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'type_icon' => $lesson->type_icon,
                'type_color' => $lesson->type_color,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'duration_display' => $lesson->duration_display,
                'created_at' => $lesson->created_at->format('M d, Y'),
            ]);

        return Inertia::render('instructor/lessons/index', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'status_label' => $course->status_label,
            ],
            'lessons' => $lessons,
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function create(Request $request, Course $course): Response
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);

        return Inertia::render('instructor/lessons/create', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
            ],
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);

        $validated = $this->validateLessonData($request);

        $lesson = Lesson::create([
            ...$this->buildLessonPayload($validated, $validated['type']),
            'course_id' => $course->id,
        ]);

        return redirect()->route('instructor.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lesson->title}' created successfully.");
    }

    public function show(Request $request, Course $course, Lesson $lesson): Response
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        return Inertia::render('instructor/lessons/show', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
            ],
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'type_icon' => $lesson->type_icon,
                'type_color' => $lesson->type_color,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'duration_display' => $lesson->duration_display,
                'content' => $lesson->content,
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,
                'quiz_data' => $lesson->quiz_data,
                'assignment_data' => $lesson->assignment_data,
                'resources' => $lesson->resources,
                'created_at' => $lesson->created_at->format('M d, Y H:i'),
                'updated_at' => $lesson->updated_at->format('M d, Y H:i'),
            ],
        ]);
    }

    public function edit(Request $request, Course $course, Lesson $lesson): Response
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        return Inertia::render('instructor/lessons/edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
            ],
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,
                'quiz_data' => $lesson->quiz_data,
                'assignment_data' => $lesson->assignment_data,
            ],
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function update(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        $validated = $this->validateLessonData($request, $lesson);

        $lesson->update($this->buildLessonPayload($validated, $lesson->type, $lesson));

        return redirect()->route('instructor.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lesson->title}' updated successfully.");
    }

    public function destroy(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        // Check for student progress or submissions
        $progressCount = $lesson->progress()->count();
        $submissionCount = $lesson->submissions()->count();

        if ($progressCount > 0 || $submissionCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            if ($submissionCount > 0) $reasons[] = "{$submissionCount} assignment submission(s)";
            
            return redirect()->route('instructor.courses.lessons.index', $course)
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it has " . implode(' and ', $reasons) . ". Consider unpublishing it instead.");
        }

        $lessonTitle = $lesson->title;
        $lesson->delete();

        return redirect()->route('instructor.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lessonTitle}' deleted successfully.");
    }

    public function reorder(Request $request, Course $course): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);

        $validated = $request->validate([
            'lesson_ids' => 'required|array',
            'lesson_ids.*' => 'required|integer|exists:lessons,id',
        ]);

        try {
            // Verify all lessons belong to the course
            $lessons = Lesson::whereIn('id', $validated['lesson_ids'])
                ->where('course_id', $course->id)
                ->get();

            if ($lessons->count() !== count($validated['lesson_ids'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid lesson IDs provided.',
                ], 400);
            }

            Lesson::reorderLessons($course->id, $validated['lesson_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Lessons reordered successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder lessons. Please try again.',
            ], 500);
        }
    }

    public function moveUp(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        try {
            if ($lesson->moveUp()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Lesson moved up successfully.',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Lesson is already at the top.',
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to move lesson. Please try again.',
            ], 500);
        }
    }

    public function moveDown(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        try {
            if ($lesson->moveDown()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Lesson moved down successfully.',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Lesson is already at the bottom.',
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to move lesson. Please try again.',
            ], 500);
        }
    }

    private function ensureCourseOwnership(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only manage lessons for your own courses.');
        }
    }

    private function ensureLessonBelongsToCourse(Lesson $lesson, Course $course): void
    {
        if ($lesson->course_id !== $course->id) {
            abort(404, 'Lesson not found in this course.');
        }
    }

    // Standalone lesson management methods
    public function allLessons(Request $request): Response
    {
        $this->ensureInstructor($request);

        $query = Lesson::with(['course'])
            ->whereHas('course', function ($q) use ($request) {
                $q->where('instructor_id', $request->user()->id);
            });

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('course', function ($courseQuery) use ($search) {
                      $courseQuery->where('title', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by course
        if ($request->filled('course_id')) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('id', $request->get('course_id'));
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $lessons = $query->ordered()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'type_icon' => $lesson->type_icon,
                'type_color' => $lesson->type_color,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'duration_display' => $lesson->duration_display,
                'course' => [
                    'id' => $lesson->course->id,
                    'title' => $lesson->course->title,
                    'status' => $lesson->course->status,
                ],
                'created_at' => $lesson->created_at->format('M d, Y'),
            ]);

        // Get instructor's courses for filter dropdown
        $courses = Course::where('instructor_id', $request->user()->id)
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
            ]);

        return Inertia::render('instructor/lessons/all', [
            'lessons' => $lessons,
            'courses' => $courses,
            'lessonTypes' => Lesson::getTypes(),
            'filters' => $request->only(['search', 'course_id', 'type']),
        ]);
    }

    public function createStandalone(Request $request): Response
    {
        $this->ensureInstructor($request);

        $courses = Course::where('instructor_id', $request->user()->id)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('instructor/lessons/create-standalone', [
            'courses' => $courses,
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function storeStandalone(Request $request): RedirectResponse
    {
        $this->ensureInstructor($request);

        $validated = $this->validateLessonData($request, null, true);

        // Verify instructor owns the course
        $course = Course::findOrFail($validated['course_id']);
        if ($course->instructor_id !== $request->user()->id) {
            return redirect()->back()
                ->with('error', 'You can only create lessons for your own courses.')
                ->withInput();
        }

        $lesson = Lesson::create([
            ...$this->buildLessonPayload($validated, $validated['type']),
            'course_id' => $course->id,
        ]);

        return redirect()->route('instructor.lessons.index')
            ->with('success', "Lesson '{$lesson->title}' created successfully.");
    }

    public function showStandalone(Request $request, Lesson $lesson): Response
    {
        $this->ensureInstructor($request);
        $this->ensureLessonOwnership($request, $lesson);

        $lesson->load(['course']);

        return Inertia::render('instructor/lessons/show-standalone', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'type_icon' => $lesson->type_icon,
                'type_color' => $lesson->type_color,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'duration_display' => $lesson->duration_display,
                'content' => $lesson->content,
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,
                'quiz_data' => $lesson->quiz_data,
                'assignment_data' => $lesson->assignment_data,
                'resources' => $lesson->resources,
                'course' => [
                    'id' => $lesson->course->id,
                    'title' => $lesson->course->title,
                    'status' => $lesson->course->status,
                ],
                'created_at' => $lesson->created_at->format('M d, Y H:i'),
                'updated_at' => $lesson->updated_at->format('M d, Y H:i'),
            ],
        ]);
    }

    public function editStandalone(Request $request, Lesson $lesson): Response
    {
        $this->ensureInstructor($request);
        $this->ensureLessonOwnership($request, $lesson);

        $lesson->load(['course']);
        $courses = Course::where('instructor_id', $request->user()->id)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('instructor/lessons/edit-standalone', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'estimated_duration' => $lesson->estimated_duration,
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,
                'quiz_data' => $lesson->quiz_data,
                'assignment_data' => $lesson->assignment_data,
                'course_id' => $lesson->course_id,
            ],
            'courses' => $courses,
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function updateStandalone(Request $request, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureLessonOwnership($request, $lesson);

        $validated = $this->validateLessonData($request, $lesson, true);

        // Verify instructor owns the new course (if changed)
        $course = Course::findOrFail($validated['course_id']);
        if ($course->instructor_id !== $request->user()->id) {
            return redirect()->back()
                ->with('error', 'You can only assign lessons to your own courses.')
                ->withInput();
        }

        $lesson->update([
            ...$this->buildLessonPayload($validated, $lesson->type, $lesson),
            'course_id' => $validated['course_id'],
        ]);

        return redirect()->route('instructor.lessons.index')
            ->with('success', "Lesson '{$lesson->title}' updated successfully.");
    }

    public function destroyStandalone(Request $request, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureLessonOwnership($request, $lesson);

        // Check for student progress or submissions
        $progressCount = $lesson->progress()->count();
        $submissionCount = $lesson->submissions()->count();

        if ($progressCount > 0 || $submissionCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            if ($submissionCount > 0) $reasons[] = "{$submissionCount} assignment submission(s)";
            
            return redirect()->route('instructor.lessons.index')
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it has " . implode(' and ', $reasons) . ". Consider unpublishing it instead.");
        }

        $lessonTitle = $lesson->title;
        $lesson->delete();

        return redirect()->route('instructor.lessons.index')
            ->with('success', "Lesson '{$lessonTitle}' deleted successfully.");
    }

    private function ensureLessonOwnership(Request $request, Lesson $lesson): void
    {
        if ($lesson->course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only manage lessons for your own courses.');
        }
    }

    private function validateLessonData(Request $request, ?Lesson $lesson = null, bool $includeCourse = false): array
    {
        $lessonType = $lesson?->type ?? $request->input('type');

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => [
                $lesson ? 'nullable' : 'required',
                'string',
                Rule::in(Lesson::getTypes()),
            ],
            'estimated_duration' => 'required|integer|min:1',
            'is_published' => 'boolean',
            'text_content' => $lessonType === Lesson::TYPE_TEXT ? 'required|string' : 'nullable|string',
            'video_url' => $lessonType === Lesson::TYPE_VIDEO ? 'required|url' : 'nullable|url',
            'video_duration' => 'nullable|integer|min:1',
            'quiz_questions' => $lessonType === Lesson::TYPE_QUIZ ? 'required|array|min:1' : 'nullable|array',
            'quiz_questions.*.question' => $lessonType === Lesson::TYPE_QUIZ ? 'required|string' : 'nullable|string',
            'quiz_questions.*.options' => $lessonType === Lesson::TYPE_QUIZ ? 'required|array|min:2' : 'nullable|array',
            'quiz_questions.*.correct_answer' => $lessonType === Lesson::TYPE_QUIZ ? 'required|integer|min:0' : 'nullable|integer|min:0',
            'quiz_passing_score' => 'nullable|integer|min:0|max:100',
            'quiz_attempts_allowed' => 'nullable|integer|min:1|max:10',
            'is_final_quiz' => 'boolean',
            'assignment_instructions' => $lessonType === Lesson::TYPE_ASSIGNMENT ? 'required|string' : 'nullable|string',
            'assignment_max_score' => 'nullable|integer|min:1',
            'assignment_due_days' => 'nullable|integer|min:1',
        ];

        if ($includeCourse) {
            $rules['course_id'] = 'required|exists:courses,id';
        }

        return $request->validate($rules);
    }

    private function buildLessonPayload(array $validated, string $lessonType, ?Lesson $lesson = null): array
    {
        $payload = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'estimated_duration' => $validated['estimated_duration'],
            'is_published' => $validated['is_published'] ?? false,
        ];

        if (!$lesson) {
            $payload['type'] = $lessonType;
        }

        switch ($lessonType) {
            case Lesson::TYPE_TEXT:
                $payload['text_content'] = $validated['text_content'];
                $payload['video_url'] = null;
                $payload['video_duration'] = null;
                $payload['quiz_data'] = null;
                $payload['assignment_data'] = null;
                break;

            case Lesson::TYPE_VIDEO:
                $payload['text_content'] = null;
                $payload['video_url'] = $validated['video_url'];
                $payload['video_duration'] = $validated['video_duration'] ?? null;
                $payload['quiz_data'] = null;
                $payload['assignment_data'] = null;
                break;

            case Lesson::TYPE_QUIZ:
                $payload['text_content'] = null;
                $payload['video_url'] = null;
                $payload['video_duration'] = null;
                $payload['quiz_data'] = [
                    'questions' => $validated['quiz_questions'] ?? [],
                    'settings' => [
                        'shuffle_questions' => $lesson?->quiz_data['settings']['shuffle_questions'] ?? false,
                        'show_correct_answers' => $lesson?->quiz_data['settings']['show_correct_answers'] ?? true,
                        'passing_score' => (int) ($validated['quiz_passing_score'] ?? $lesson?->quiz_data['settings']['passing_score'] ?? Setting::get('min_quiz_passing_score', 70)),
                        'attempts_allowed' => (int) ($validated['quiz_attempts_allowed'] ?? $lesson?->quiz_data['settings']['attempts_allowed'] ?? Setting::get('max_quiz_attempts', 3)),
                        'is_final_quiz' => (bool) ($validated['is_final_quiz'] ?? $lesson?->quiz_data['settings']['is_final_quiz'] ?? false),
                    ],
                ];
                $payload['assignment_data'] = null;
                break;

            case Lesson::TYPE_ASSIGNMENT:
                $payload['text_content'] = null;
                $payload['video_url'] = null;
                $payload['video_duration'] = null;
                $payload['quiz_data'] = null;
                $payload['assignment_data'] = [
                    'instructions' => $validated['assignment_instructions'],
                    'max_score' => (int) ($validated['assignment_max_score'] ?? 100),
                    'due_days' => (int) ($validated['assignment_due_days'] ?? 7),
                    'submission_types' => $lesson?->assignment_data['submission_types'] ?? ['text', 'file'],
                ];
                break;
        }

        return $payload;
    }
}
