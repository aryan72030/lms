<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\Enrollment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    /**
     * Display published courses for students
     */
    public function index(Request $request)
    {
        $query = Course::with(['instructor', 'category'])
            ->published()
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('instructor', function ($instructorQuery) use ($search) {
                      $instructorQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('price_filter')) {
            if ($request->price_filter === 'free') {
                $query->where('price', 0);
            } elseif ($request->price_filter === 'paid') {
                $query->where('price', '>', 0);
            }
        }

        if ($request->filled('difficulty') && $request->difficulty !== 'all') {
            $query->where('difficulty_level', $request->difficulty);
        }

        $courses = $query->paginate((int) Setting::get('pagination_limit', 10))->withQueryString();

        $courses->getCollection()->transform(function ($course) {
            $course->thumbnail = $course->thumbnail ? '/files/' . $course->thumbnail : null;
            return $course;
        });

        // Get enrollment status for each course if user is authenticated
        $wishlistIds = [];
        if (Auth::check()) {
            $studentId = Auth::id();
            $enrollmentStatuses = Enrollment::where('student_id', $studentId)
                ->whereIn('course_id', $courses->pluck('id'))
                ->get()
                ->keyBy('course_id');

            $wishlistIds = \App\Models\Wishlist::where('user_id', $studentId)
                ->whereIn('course_id', $courses->pluck('id'))
                ->pluck('course_id')
                ->toArray();

            $courses->getCollection()->transform(function ($course) use ($enrollmentStatuses) {
                $course->enrollment_status = $enrollmentStatuses->get($course->id);
                return $course;
            });
        }

        // Get filter options
        $categories = CourseCategory::active()->select('id', 'name')->orderBy('name')->get();
        $difficulties = [
            Course::DIFFICULTY_BEGINNER => 'Beginner',
            Course::DIFFICULTY_INTERMEDIATE => 'Intermediate',
            Course::DIFFICULTY_ADVANCED => 'Advanced',
        ];

        return Inertia::render('student/courses/index', [
            'courses' => $courses,
            'categories' => $categories,
            'difficulties' => $difficulties,
            'wishlist_ids' => $wishlistIds,
            'filters' => $request->only(['search', 'category_id', 'price_filter', 'difficulty']),
        ]);
    }

    /**
     * Show course details for students
     */
    public function show(Course $course)
    {
        // Only show published courses
        if (!$course->isPublished()) {
            abort(404, 'Course not found or not available.');
        }

        $course->load([
            'instructor',
            'category',
            'lessons' => function ($query) {
                $query->published()->orderBy('order');
            }
        ]);

        // Get enrollment status if user is authenticated
        $enrollmentStatus = null;
        $isWishlisted = false;
        if (Auth::check()) {
            $studentId = Auth::id();
            $enrollmentStatus = Enrollment::where('student_id', $studentId)
                ->where('course_id', $course->id)
                ->first();
            
            $isWishlisted = \App\Models\Wishlist::where('user_id', $studentId)
                ->where('course_id', $course->id)
                ->exists();
        }

        // Get course statistics
        $stats = [
            'total_lessons' => $course->lessons->count(),
            'total_enrollments' => Enrollment::where('course_id', $course->id)->count(),
            'lesson_types' => $course->lessons->groupBy('type')->map->count(),
        ];

        return Inertia::render('student/courses/show', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'objectives' => $course->objectives,
                'price' => $course->price,
                'duration_hours' => $course->duration_hours,
                'difficulty_level' => $course->difficulty_level,
                'thumbnail' => $course->thumbnail ? '/files/' . $course->thumbnail : null,
                'created_at' => $course->created_at?->format('Y-m-d H:i:s'),
                'instructor' => [
                    'id' => $course->instructor->id,
                    'name' => $course->instructor->name,
                    'email' => $course->instructor->email,
                ],
                'category' => [
                    'id' => $course->category->id,
                    'name' => $course->category->name,
                ],
                'lessons' => $course->lessons->map(fn ($lesson) => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'description' => $lesson->description,
                    'type' => $lesson->type,
                    'order' => $lesson->order,
                    'estimated_duration' => $lesson->estimated_duration,
                    'duration_display' => $lesson->duration_display,
                ])->values(),
            ],
            'enrollmentStatus' => $enrollmentStatus,
            'isWishlisted' => $isWishlisted,
            'stats' => $stats,
            'user' => Auth::user() ? [
                'id' => Auth::id(),
                'role' => Auth::user()->role,
            ] : null,
        ]);
    }
}
