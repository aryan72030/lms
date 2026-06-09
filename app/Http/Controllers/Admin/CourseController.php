<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = Course::with(['instructor', 'category', 'approvedBy']);

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('instructor', function ($instructorQuery) use ($search) {
                      $instructorQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $courses = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'objectives' => $course->objectives,
                'requirements' => $course->requirements,
                'target_audience' => $course->target_audience,
                'price' => $course->price,
                'access_duration' => $course->access_duration,
                'duration_hours' => $course->duration_hours,
                'difficulty_level' => $course->difficulty_level,
                'thumbnail' => $course->thumbnail ? '/files/' . $course->thumbnail : null,
                'status' => $course->status,
                'status_label' => $course->status_label,
                'status_color' => $course->status_color,
                'instructor' => [
                    'id' => $course->instructor->id,
                    'name' => $course->instructor->name,
                    'email' => $course->instructor->email,
                ],
                'category' => [
                    'id' => $course->category->id,
                    'name' => $course->category->name,
                ],
                'approved_by' => $course->approvedBy ? [
                    'id' => $course->approvedBy->id,
                    'name' => $course->approvedBy->name,
                ] : null,
                'rejection_reason' => $course->rejection_reason,
                'submitted_at' => $course->submitted_at?->format('M d, Y H:i'),
                'approved_at' => $course->approved_at?->format('M d, Y H:i'),
                'published_at' => $course->published_at?->format('M d, Y H:i'),
                'created_at' => $course->created_at->format('M d, Y'),
                'can_be_approved' => $course->canBeApproved(),
                'can_be_republished' => $course->canBeRepublished(),
            ]);

        // Get data for modals
        $categories = CourseCategory::active()->orderBy('name')->get();
        $instructors = User::where('role', User::ROLE_INSTRUCTOR)
            ->where('status', User::STATUS_ACTIVE)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/courses/index', [
            'courses' => $courses,
            'filters' => $request->only(['search', 'status']),
            'statuses' => [
                Course::STATUS_DRAFT,
                Course::STATUS_REVIEW,
                Course::STATUS_PUBLISHED,
                Course::STATUS_ARCHIVED,
            ],
            'categories' => $categories->map(fn($category) => [
                'id' => $category->id,
                'name' => $category->name,
            ]),
            'instructors' => $instructors->map(fn($instructor) => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'email' => $instructor->email,
            ]),
            'difficultyLevels' => [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureAdmin($request);

        $categories = CourseCategory::active()->orderBy('name')->get(['id', 'name']);
        $instructors = User::where('role', User::ROLE_INSTRUCTOR)
            ->where('status', User::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('admin/courses/create', [
            'categories' => $categories,
            'instructors' => $instructors,
            'difficultyLevels' => [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $maxSize = Setting::get('max_file_upload_size', 2) * 1024; // KB
        $allowFree = Setting::get('allow_free_courses', true);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:50',
            'objectives' => 'nullable|string',
            'requirements' => 'nullable|array',
            'target_audience' => 'nullable|array',
            'language' => 'required|string',
            'thumbnail' => "nullable|image|max:{$maxSize}",
            'price' => ['required', 'numeric', 'max:9999.99', $allowFree ? 'min:0' : 'min:1'],
            'access_duration' => 'nullable|integer|min:0|max:3650',
            'duration_hours' => 'required|integer|min:1|max:500',
            'difficulty_level' => 'required|in:' . implode(',', [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ]),
            'instructor_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:course_categories,id',
        ], [
            'price.min' => $allowFree ? 'Price must be at least 0.' : 'Free courses are not allowed. Price must be at least 1.',
        ]);

        // Verify instructor role
        $instructor = User::findOrFail($validated['instructor_id']);
        if (!$instructor->isInstructor() || !$instructor->isActive()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected instructor is not valid or inactive.',
                    'errors' => ['instructor_id' => ['Selected instructor is not valid or inactive.']]
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['instructor_id' => 'Selected instructor is not valid or inactive.'])
                ->withInput();
        }

        // Verify category is active
        $category = CourseCategory::findOrFail($validated['category_id']);
        if (!$category->isActive()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is not active.',
                    'errors' => ['category_id' => ['Selected category is not active.']]
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['category_id' => 'Selected category is not active.'])
                ->withInput();
        }

        try {
            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store('courses/thumbnails', 'public');
                $validated['thumbnail'] = $path;
            }

            // Determine course status based on settings
            // For courses created by admin, we can auto-approve them or set them to published
            if ($request->user()->isAdmin() || Setting::get('auto_approve_courses', false)) {
                $validated['status'] = Course::STATUS_PUBLISHED;
                $validated['approved_by'] = $request->user()->id;
                $validated['approved_at'] = now();
                $validated['published_at'] = now();
            } else if (Setting::get('require_admin_approval', true)) {
                $validated['status'] = Course::STATUS_REVIEW;
                $validated['submitted_at'] = now();
            } else {
                $validated['status'] = Course::STATUS_DRAFT;
            }

            $course = Course::create($validated);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Course '{$course->title}' created successfully.",
                    'course' => [
                        'id' => $course->id,
                        'title' => $course->title,
                    ]
                ]);
            }

            return redirect()->route('admin.courses.index')
                ->with('success', "Course '{$course->title}' created successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create course. Reason: ' . $e->getMessage()
                ], 500);
            }
            return redirect()->back()
                ->with('error', 'Failed to create course. Please try again.')
                ->withInput();
        }
    }

    public function show(Course $course): RedirectResponse
    {
        return redirect()->route('admin.courses.index');
    }

    public function edit(Request $request, Course $course): Response
    {
        $this->ensureAdmin($request);

        $course->load(['category', 'instructor']);
        $categories = CourseCategory::active()->orderBy('name')->get(['id', 'name']);
        $instructors = User::where('role', User::ROLE_INSTRUCTOR)
            ->where('status', User::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('admin/courses/edit', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'objectives' => $course->objectives,
                'requirements' => $course->requirements ?? [],
                'target_audience' => $course->target_audience ?? [],
                'thumbnail' => $course->thumbnail ? '/files/' . $course->thumbnail : null,
                'language' => $course->language ?? 'English',
                'price' => $course->price,
                'access_duration' => $course->access_duration,
                'duration_hours' => $course->duration_hours,
                'difficulty_level' => $course->difficulty_level,
                'category_id' => $course->category_id,
                'instructor_id' => $course->instructor_id,
                'status' => $course->status,
                'status_label' => $course->status_label,
            ],
            'categories' => $categories,
            'instructors' => $instructors,
            'difficultyLevels' => [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ],
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $maxSize = Setting::get('max_file_upload_size', 2) * 1024; // KB
        $allowFree = Setting::get('allow_free_courses', true);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:50',
            'objectives' => 'nullable|string',
            'requirements' => 'nullable|array',
            'target_audience' => 'nullable|array',
            'language' => 'required|string',
            'thumbnail' => "nullable|image|max:{$maxSize}",
            'price' => ['required', 'numeric', 'max:9999.99', $allowFree ? 'min:0' : 'min:1'],
            'access_duration' => 'nullable|integer|min:0|max:3650',
            'duration_hours' => 'required|integer|min:1|max:500',
            'difficulty_level' => 'required|in:' . implode(',', [
                Course::DIFFICULTY_BEGINNER,
                Course::DIFFICULTY_INTERMEDIATE,
                Course::DIFFICULTY_ADVANCED,
            ]),
            'instructor_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:course_categories,id',
        ], [
            'price.min' => $allowFree ? 'Price must be at least 0.' : 'Free courses are not allowed. Price must be at least 1.',
        ]);

        // Verify instructor role
        $instructor = User::findOrFail($validated['instructor_id']);
        if (!$instructor->isInstructor() || !$instructor->isActive()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected instructor is not valid or inactive.',
                    'errors' => ['instructor_id' => ['Selected instructor is not valid or inactive.']]
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['instructor_id' => 'Selected instructor is not valid or inactive.'])
                ->withInput();
        }

        // Verify category is active
        $category = CourseCategory::findOrFail($validated['category_id']);
        if (!$category->isActive()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is not active.',
                    'errors' => ['category_id' => ['Selected category is not active.']]
                ], 422);
            }
            return redirect()->back()
                ->withErrors(['category_id' => 'Selected category is not active.'])
                ->withInput();
        }

        try {
            if ($request->hasFile('thumbnail')) {
                // Delete old thumbnail if exists
                if ($course->thumbnail) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($course->thumbnail);
                }
                $path = $request->file('thumbnail')->store('courses/thumbnails', 'public');
                $validated['thumbnail'] = $path;
            }

            $course->update($validated);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Course '{$course->title}' updated successfully.",
                    'course' => [
                        'id' => $course->id,
                        'title' => $course->title,
                    ]
                ]);
            }

            return redirect()->route('admin.courses.index')
                ->with('success', "Course '{$course->title}' updated successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update course. Please try again.'
                ], 500);
            }
            return redirect()->back()
                ->with('error', 'Failed to update course. Please try again.')
                ->withInput();
        }
    }

    public function approve(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        if (!$course->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Course cannot be approved in its current status.',
            ], 400);
        }

        try {
            $course->approve($request->user());

            return response()->json([
                'success' => true,
                'message' => "Course '{$course->title}' has been approved and published.",
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                    'approved_at' => $course->approved_at?->format('M d, Y H:i'),
                    'published_at' => $course->published_at?->format('M d, Y H:i'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve course. Please try again.',
            ], 500);
        }
    }

    public function reject(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        if (!$course->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Course cannot be rejected in its current status.',
            ], 400);
        }

        try {
            $course->reject($request->user(), $request->reason);

            return response()->json([
                'success' => true,
                'message' => "Course '{$course->title}' has been rejected.",
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                    'rejection_reason' => $course->rejection_reason,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject course. Please try again.',
            ], 500);
        }
    }

    public function archive(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        if (!$course->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Only published courses can be archived.',
            ], 400);
        }

        try {
            $course->archive();

            return response()->json([
                'success' => true,
                'message' => "Course '{$course->title}' has been archived.",
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive course. Please try again.',
            ], 500);
        }
    }

    public function republish(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        if (!$course->canBeRepublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Only archived courses can be republished.',
            ], 400);
        }

        try {
            $course->republish($request->user());

            return response()->json([
                'success' => true,
                'message' => "Course '{$course->title}' has been republished.",
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                    'published_at' => $course->published_at?->format('M d, Y H:i'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to republish course. Please try again.',
            ], 500);
        }
    }

    public function forceSubmit(Request $request, Course $course): JsonResponse
    {
        $this->ensureAdmin($request);

        if (!$course->isDraft()) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft courses can be submitted for review.',
            ], 400);
        }

        try {
            $course->update([
                'status' => Course::STATUS_REVIEW,
                'submitted_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Course '{$course->title}' has been submitted for review.",
                'course' => [
                    'id' => $course->id,
                    'status' => $course->status,
                    'status_label' => $course->status_label,
                    'status_color' => $course->status_color,
                    'submitted_at' => $course->submitted_at?->format('M d, Y H:i'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit course for review. Please try again.',
            ], 500);
        }
    }

    public function destroy(Request $request, Course $course)
    {
        $this->ensureAdmin($request);

        try {
            // Check if course has enrollments
            $enrollmentCount = $course->enrollments()->count();
            if ($enrollmentCount > 0) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => "Cannot delete course '{$course->title}' because it has {$enrollmentCount} student enrollment(s). Archive the course instead."
                    ], 400);
                }
                return redirect()->route('admin.courses.index')
                    ->with('error', "Cannot delete course '{$course->title}' because it has {$enrollmentCount} student enrollment(s). Archive the course instead.");
            }

            $courseName = $course->title;
            $course->delete();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Course '{$courseName}' deleted successfully."
                ]);
            }

            return redirect()->route('admin.courses.index')
                ->with('success', "Course '{$courseName}' deleted successfully.");
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete course. Please try again.'
                ], 500);
            }
            return redirect()->route('admin.courses.index')
                ->with('error', 'Failed to delete course. Please try again.');
        }
    }
}
