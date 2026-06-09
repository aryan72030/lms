<?php

namespace App\Http\Controllers\Admin;

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
        $this->ensureAdmin($request);

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



        return Inertia::render('admin/lessons/index', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'status_label' => $course->status_label,
                'instructor' => [
                    'name' => $course->instructor?->name,
                    'email' => $course->instructor?->email,
                ],
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
        $this->ensureAdmin($request);

        return Inertia::render('admin/lessons/create', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'status_label' => $course->status_label,
            ],
            'sections' => $course->sections()->orderBy('order')->get(['id', 'title']),
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $this->validateLessonData($request);


        $lesson = Lesson::create([
            ...$this->buildLessonPayload($validated, $validated['type']),
            'course_id' => $course->id,
        ]);

        return redirect()
            ->route('admin.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lesson->title}' created successfully.");
    }

    public function edit(Request $request, Course $course, Lesson $lesson): Response
    {
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);
        
        

        return Inertia::render('admin/lessons/edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status,
                'status_label' => $course->status_label,
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
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        $validated = $this->validateLessonData($request, $lesson);


        $lesson->update([
            ...$this->buildLessonPayload($validated, $lesson->type, $lesson),
        ]);

        return redirect()
            ->route('admin.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lesson->title}' updated successfully.");
    }

    public function destroy(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        if ($lesson->is_published) {
            return redirect()
                ->route('admin.courses.lessons.index', $course)
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it is published. Unpublish it first.");
        }

        // Check for student progress
        $progressCount = $lesson->progress()->count();

        if ($progressCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            
            return redirect()
                ->route('admin.courses.lessons.index', $course)
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it has " . implode(' and ', $reasons) . ". Consider unpublishing it instead.");
        }

        $lessonTitle = $lesson->title;
        $lesson->delete();

        return redirect()
            ->route('admin.courses.lessons.index', $course)
            ->with('success', "Lesson '{$lessonTitle}' deleted successfully.");
    }

    /**
     * Toggle lesson publication status
     */
    public function togglePublish(Request $request, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);

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

    public function reorder(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'lesson_ids' => 'required|array',
            'lesson_ids.*' => 'required|integer|exists:lessons,id',
        ]);

        try {
            Lesson::reorderLessons($course->id, $validated['lesson_ids']);

            return response()->json([
                'success' => true,
                'message' => 'Lessons reordered successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder lessons.',
            ], 500);
        }
    }

    public function moveUp(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        if ($lesson->moveUp()) {
            return redirect()->back()->with('success', 'Lesson moved up successfully.');
        }

        return redirect()->back()->with('info', 'Lesson is already at the top.');
    }

    public function moveDown(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        if ($lesson->moveDown()) {
            return redirect()->back()->with('success', 'Lesson moved down successfully.');
        }

        return redirect()->back()->with('info', 'Lesson is already at the bottom.');
    }

    public function allLessons(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = Lesson::with(['course.instructor'])
            ->whereHas('course');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('course', function ($courseQuery) use ($search) {
                        $courseQuery->where('title', 'like', "%{$search}%")
                            ->orWhereHas('instructor', function ($instructorQuery) use ($search) {
                                $instructorQuery->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->get('course_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $lessons = $query->ordered()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(function (Lesson $lesson) {
                $course = $lesson->course;

                return [
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
                        'id' => $course?->id,
                        'title' => $course?->title ?? 'Unknown Course',
                        'status' => $course?->status ?? 'Unknown',
                        'instructor_name' => $course?->instructor?->name,
                    ],
                    'created_at' => $lesson->created_at->format('M d, Y H:i'),
                ];
            });

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'instructor_name' => $course->instructor?->name,
            ]);

        return Inertia::render('admin/lessons/all', [
            'lessons' => $lessons,
            'courses' => $courses,
            'lessonTypes' => Lesson::getTypes(),
            'filters' => $request->only(['search', 'course_id', 'type']),
        ]);
    }

    public function createStandalone(Request $request): Response
    {
        $this->ensureAdmin($request);

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'status_label' => $course->status_label,
                'instructor_name' => $course->instructor?->name,
            ]);

        return Inertia::render('admin/lessons/create-standalone', [
            'courses' => $courses,
            'lessonTypes' => Lesson::getTypes(),
        ]);
    }

    public function storeStandalone(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $this->validateLessonData($request, null, true);

        $lesson = Lesson::create([
            ...$this->buildLessonPayload($validated, $validated['type']),
            'course_id' => $validated['course_id'],
        ]);

        return redirect()
            ->route('admin.lessons.all')
            ->with('success', "Lesson '{$lesson->title}' created successfully.");
    }

    public function editStandalone(Request $request, Lesson $lesson): Response
    {
        $this->ensureAdmin($request);

        $lesson->load(['course']);

        $courses = Course::with('instructor')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'status_label' => $course->status_label,
                'instructor_name' => $course->instructor?->name,
            ]);

        return Inertia::render('admin/lessons/edit-standalone', [
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
        $this->ensureAdmin($request);

        $validated = $this->validateLessonData($request, $lesson, true);

        $lesson->update([
            ...$this->buildLessonPayload($validated, $lesson->type, $lesson),
            'course_id' => $validated['course_id'],
        ]);

        return redirect()
            ->route('admin.lessons.all')
            ->with('success', "Lesson '{$lesson->title}' updated successfully.");
    }

    public function destroyStandalone(Request $request, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);

        if ($lesson->is_published) {
            return redirect()
                ->route('admin.lessons.all')
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it is published. Unpublish it first.");
        }

        // Check for student progress
        $progressCount = $lesson->progress()->count();

        if ($progressCount > 0) {
            $reasons = [];
            if ($progressCount > 0) $reasons[] = "{$progressCount} student progress record(s)";
            
            return redirect()
                ->route('admin.lessons.all')
                ->with('error', "Cannot delete lesson '{$lesson->title}' because it has " . implode(' and ', $reasons) . ". Consider unpublishing it instead.");
        }

        $lessonTitle = $lesson->title;
        $lesson->delete();

        return redirect()
            ->route('admin.lessons.all')
            ->with('success', "Lesson '{$lessonTitle}' deleted successfully.");
    }

    public function toggleStatus(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->ensureAdmin($request);
        $this->ensureLessonBelongsToCourse($lesson, $course);

        $lesson->update([
            'is_published' => !$lesson->is_published
        ]);

        $status = $lesson->is_published ? 'published' : 'unpublished';
        return redirect()->back()->with('success', "Lesson '{$lesson->title}' {$status} successfully.");
    }

    public function storeSection(Request $request, Course $course): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $maxOrder = $course->sections()->max('order');
        
        $course->sections()->create([
            'title' => $validated['title'],
            'order' => ($maxOrder ?? 0) + 1,
        ]);

        return redirect()->back()->with('success', 'Section created successfully.');
    }

    public function updateSection(Request $request, Course $course, CourseSection $section): RedirectResponse
    {
        $this->ensureAdmin($request);
        
        if ($section->course_id !== $course->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $section->update($validated);

        return redirect()->back()->with('success', 'Section updated successfully.');
    }

    public function destroySection(Request $request, Course $course, CourseSection $section): RedirectResponse
    {
        $this->ensureAdmin($request);

        if ($section->course_id !== $course->id) {
            abort(404);
        }

        // Move lessons to unsectioned before deleting
        $section->lessons()->update(['section_id' => null]);
        
        $section->delete();

        return redirect()->back()->with('success', 'Section deleted successfully.');
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
