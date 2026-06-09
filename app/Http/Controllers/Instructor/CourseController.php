<?php

namespace App\Http\Controllers\Instructor;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Mail\CourseSubmission;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\Setting;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureInstructor($request);

        $query = Course::with(['category'])
            ->forInstructor($request->user()->id);

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $courses = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail ? '/files/' . $course->thumbnail : null,
                'description' => $course->description,
                'objectives' => $course->objectives,
                'requirements' => $course->requirements,
                'target_audience' => $course->target_audience,
                'price' => $course->price,
                'access_duration' => $course->access_duration,
                'language' => $course->language,
                'duration_hours' => $course->duration_hours,
                'difficulty_level' => $course->difficulty_level,
                'status' => $course->status,
                'status_label' => $course->status_label,
                'status_color' => $course->status_color,
                'category' => [
                    'id' => $course->category->id,
                    'name' => $course->category->name,
                ],
                'rejection_reason' => $course->rejection_reason,
                'submitted_at' => $course->submitted_at?->format('M d, Y H:i'),
                'published_at' => $course->published_at?->format('M d, Y H:i'),
                'created_at' => $course->created_at->format('M d, Y'),
                'can_be_edited' => $course->canBeEdited(),
                'can_be_submitted' => $course->canBeSubmitted(),
            ]);

        return Inertia::render('instructor/courses/index', [
            'courses' => $courses,
            'filters' => $request->only(['search', 'status']),
            'statuses' => [
                Course::STATUS_DRAFT,
                Course::STATUS_REVIEW,
                Course::STATUS_PUBLISHED,
                Course::STATUS_ARCHIVED,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureInstructor($request);

        $categories = CourseCategory::active()->get(['id', 'name']);
        $defaultDuration = 40;

        return Inertia::render('instructor/courses/create', [
            'categories' => $categories,
            'defaultDuration' => $defaultDuration,
            'difficultyLevels' => [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureInstructor($request);

        $maxSize = Setting::get('max_file_upload_size', 2) * 1024; // KB
        $requireDescription = Setting::get('require_course_description', true);
        $requireThumbnail = Setting::get('require_course_thumbnail', true);
        $allowFree = Setting::get('allow_free_courses', true);

        $validated = $request->validate([
            'title' => [
                'required', 
                'string', 
                'max:255',
                Rule::unique('courses', 'title')->where('instructor_id', $request->user()->id)
            ],
            'description' => ($requireDescription ? 'required|' : 'nullable|') . 'string' . ($requireDescription ? '|min:50' : ''),
            'objectives' => 'nullable|string',
            'requirements' => 'nullable|array',
            'target_audience' => 'nullable|array',
            'language' => 'required|string',
            'thumbnail' => ($requireThumbnail ? 'required|' : 'nullable|') . "image|max:{$maxSize}",
            'price' => ['required', 'numeric', 'max:9999.99', $allowFree ? 'min:0' : 'min:1'],
            'access_duration' => 'nullable|integer|min:0|max:3650',
            'duration_hours' => 'required|integer|min:1|max:500',
            'difficulty_level' => ['required', Rule::in([
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ])],
            'category_id' => 'required|exists:course_categories,id',
        ], [
            'price.min' => $allowFree ? 'Price must be at least 0.' : 'Free courses are not allowed. Price must be at least 1.',
        ]);

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('courses/thumbnails', 'public');
            $validated['thumbnail'] = $path;
        }
        $validated['instructor_id'] = $request->user()->id;
        $validated['status'] = Course::STATUS_DRAFT;

        $course = Course::create($validated);

        return redirect()->route('instructor.courses.index')
            ->with('success', "Course '{$course->title}' created successfully.");
    }

    public function edit(Request $request, Course $course)
    {
        $this->ensureInstructor($request);
        $this->ensureOwnership($request, $course);



        $course->load(['category']);
        $categories = CourseCategory::active()->get(['id', 'name']);

        return Inertia::render('instructor/courses/edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'objectives' => $course->objectives,
                'requirements' => $course->requirements ?? [],
                'target_audience' => $course->target_audience ?? [],
                'thumbnail' => $course->thumbnail ? '/files/' . $course->thumbnail : null,
                'language' => $course->language,
                'price' => $course->price,
                'access_duration' => $course->access_duration,
                'duration_hours' => $course->duration_hours,
                'difficulty_level' => $course->difficulty_level,
                'category_id' => $course->category_id,
                'status' => $course->status,
                'status_label' => $course->status_label,
            ],
            'categories' => $categories,
            'difficultyLevels' => [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ],
        ]);
    }

    public function update(Request $request, Course $course): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnership($request, $course);



        $maxSize = Setting::get('max_file_upload_size', 2) * 1024; // KB
        $requireDescription = Setting::get('require_course_description', true);
        $requireThumbnail = Setting::get('require_course_thumbnail', true);
        $allowFree = Setting::get('allow_free_courses', true);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => ($requireDescription ? 'required|' : 'nullable|') . 'string' . ($requireDescription ? '|min:50' : ''),
            'objectives' => 'nullable|string',
            'requirements' => 'nullable|array',
            'target_audience' => 'nullable|array',
            'language' => 'required|string',
            'thumbnail' => "nullable|image|max:{$maxSize}",
            'price' => ['required', 'numeric', 'max:9999.99', $allowFree ? 'min:0' : 'min:1'],
            'access_duration' => 'nullable|integer|min:0|max:3650',
            'duration_hours' => 'required|integer|min:1',
            'difficulty_level' => ['required', Rule::in([
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ])],
            'category_id' => 'required|exists:course_categories,id',
        ], [
            'price.min' => $allowFree ? 'Price must be at least 0.' : 'Free courses are not allowed. Price must be at least 1.',
        ]);

        if ($requireThumbnail && !$course->thumbnail && !$request->hasFile('thumbnail')) {
            return back()->withErrors(['thumbnail' => 'A course thumbnail is required.'])->withInput();
        }

        if ($request->hasFile('thumbnail')) {
            // Delete old thumbnail if exists
            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
            $path = $request->file('thumbnail')->store('courses/thumbnails', 'public');
            $validated['thumbnail'] = $path;
        }

        $course->update($validated);

        return redirect()->route('instructor.courses.index')
            ->with('success', "Course '{$course->title}' updated successfully.");
    }

    public function submitForReview(Request $request, Course $course): JsonResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnership($request, $course);

        if (!$course->canBeSubmittedForReview()) {
            $errors = [];
            if (!$course->canBeSubmitted()) {
                $errors[] = 'Course cannot be submitted for review in its current status.';
            }
            if (!$course->hasMinimumContent()) {
                $errors[] = "Course must have at least 1 lesson(s) before submission.";
            }
            if (!$course->hasPublishedLessons()) {
                $errors[] = 'Course must have at least one published lesson before submission.';
            }
            if (Setting::get('require_final_quiz', true) && !$course->hasFinalQuiz()) {
                $errors[] = 'Course must have a final quiz before submission.';
            }
            
            return response()->json([
                'success' => false,
                'message' => implode(' ', $errors),
            ], 400);
        }

        try {
            if (Setting::get('auto_approve_courses', false)) {
                $course->autoApprove();
                $message = "Course '{$course->title}' has been automatically approved and published.";
            } else {
                $course->submitForReview();
                $message = "Course '{$course->title}' has been submitted for review.";
                
                // Send course submission email
                $emailSettings = Setting::getEmailSettings();
                if ($emailSettings['enabled'] && $emailSettings['types']['instructor_notifications']) {
                    try {
                        Mail::to($request->user()->email)->send(new CourseSubmission($course));
                    } catch (\Exception $mailException) {
                        \Illuminate\Support\Facades\Log::error('Failed to send course submission email: ' . $request->user()->email, [
                            'error' => $mailException->getMessage(),
                            'course_id' => $course->id
                        ]);
                    }
                }

                // Send Slack notification
                try {
                    $notificationService = new NotificationService();
                    $notificationService->notifyCourseSubmission(
                        [
                            'name' => $request->user()->name,
                            'email' => $request->user()->email
                        ],
                        [
                            'title' => $course->title,
                            'category' => $course->category->name,
                            'price' => $course->price
                        ]
                    );
                } catch (\Exception $slackException) {
                    \Illuminate\Support\Facades\Log::error('Failed to send Slack notification for course submission', [
                        'error' => $slackException->getMessage(),
                        'course_id' => $course->id
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                    'submitted_at' => $course->submitted_at?->format('M d, Y H:i'),
                    'published_at' => $course->published_at?->format('M d, Y H:i'),
                    'can_be_submitted' => $course->canBeSubmitted(),
                    'can_be_edited' => $course->canBeEdited(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit course for review. Please try again.',
            ], 500);
        }
    }

    public function destroy(Request $request, Course $course): RedirectResponse
    {
        $this->ensureInstructor($request);
        $this->ensureOwnership($request, $course);

        // Don't allow deletion of archived courses
        if ($course->isArchived()) {
            return redirect()->route('instructor.courses.index')
                ->with('error', 'Archived courses cannot be deleted.');
        }

        // Check if course has enrollments - this is the main constraint
        $enrollmentCount = $course->enrollments()->count();
        if ($enrollmentCount > 0) {
            return redirect()->route('instructor.courses.index')
                ->with('error', "Cannot delete course '{$course->title}' because it has {$enrollmentCount} student enrollment(s). You can still edit the course to make updates.");
        }

        try {
            $courseName = $course->title;
            $course->delete();

            return redirect()->route('instructor.courses.index')
                ->with('success', "Course '{$courseName}' deleted successfully.");
        } catch (\Exception $e) {
            return redirect()->route('instructor.courses.index')
                ->with('error', 'Failed to delete course. Please try again.');
        }
    }

    private function ensureOwnership(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only manage your own courses.');
        }
    }
}
