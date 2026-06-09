<?php

namespace App\Http\Controllers\Instructor;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
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
    use \App\Traits\ManagesLessons;

    public function index(Request $request, Course $course): Response
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);

        $sections = $course->sections()
            ->orderBy('order')
            ->with(['lessons' => function ($query) {
                $query->ordered();
            }])
            ->get()
            ->map(fn (CourseSection $section) => [
                'id' => $section->id,
                'title' => $section->title,
                'order' => $section->order,
                'lessons' => $section->lessons->map(fn (Lesson $lesson) => [
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
                ]),
            ]);

        // Lessons without sections
        $unsectionedLessons = $course->lessons()
            ->whereNull('section_id')
            ->ordered()
            ->get()
            ->map(fn (Lesson $lesson) => [
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
            'sections' => $sections,
            'unsectionedLessons' => $unsectionedLessons,
            'quizzes' => $course->quizzes()->withCount('questions')->get()->map(fn ($quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'total_marks' => $quiz->total_marks,
                'questions_count' => $quiz->questions_count,
                'is_published' => $quiz->is_published,
                'created_at' => $quiz->created_at->format('M d, Y'),
            ]),
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
            'sections' => $course->sections()->orderBy('order')->get(['id', 'title']),
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
            'sections' => $course->sections()->orderBy('order')->get(['id', 'title']),
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'order' => $lesson->order,
                'is_published' => $lesson->is_published,
                'section_id' => $lesson->section_id,
                'estimated_duration' => $lesson->estimated_duration,
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,

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



        $lesson->update([
            ...$this->buildLessonPayload($validated, $lesson->type, $lesson),
        ]);

        return redirect()->route('instructor.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lesson->title}' updated successfully.");
    }

    public function destroy(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        // Check for student progress
        $progressCount = $lesson->progress()->count();

        if ($progressCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            
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

    public function moveUp(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        try {
            if ($lesson->moveUp()) {
                return redirect()->back()->with('success', 'Lesson moved up successfully.');
            } else {
                return redirect()->back()->with('info', 'Lesson is already at the top.');
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to move lesson. Please try again.');
        }
    }

    public function moveDown(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureCourseOwnership($request, $course);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        try {
            if ($lesson->moveDown()) {
                return redirect()->back()->with('success', 'Lesson moved down successfully.');
            } else {
                return redirect()->back()->with('info', 'Lesson is already at the bottom.');
            }
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to move lesson. Please try again.');
        }
    }

    /**
     * Toggle lesson publication status
     */
    public function togglePublish(Request $request, Lesson $lesson): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureLessonOwnership($request, $lesson);

        try {
            $lesson->update([
                'is_published' => !$lesson->is_published,
            ]);

            return redirect()->back()
                ->with('success', $lesson->is_published ? 'Lesson published successfully.' : 'Lesson unpublished successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update lesson status.');
        }
    }

    private function ensureCourseOwnership(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only manage lessons for your own courses.');
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
                'text_content' => $lesson->text_content,
                'video_url' => $lesson->video_url,
                'video_duration' => $lesson->video_duration,
                'course' => [
                    'id' => $lesson->course->id,
                    'title' => $lesson->course->title,
                    'status' => $lesson->course->status,
                ],
                'created_at' => $lesson->created_at->format('M d, Y H:i'),
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
            'lessons_total' => $lessons->total(),
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

        // Check for student progress
        $progressCount = $lesson->progress()->count();

        if ($progressCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            
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
            'section_id' => 'nullable|exists:course_sections,id',
            'text_content' => $lessonType === Lesson::TYPE_TEXT ? 'required|string' : 'nullable|string',
            'video_url' => $lessonType === Lesson::TYPE_VIDEO ? 'required|url' : 'nullable|url',
            'video_duration' => 'nullable|integer|min:1',
        ];

        if ($includeCourse) {
            $rules['course_id'] = 'required|exists:courses,id';
        }

        return $request->validate($rules);
    }

    private function ensureLessonBelongsToCourse(Lesson $lesson, Course $course): void
    {
        if ($lesson->course_id !== $course->id) {
            abort(404, 'Lesson not found in this course.');
        }
    }
}
