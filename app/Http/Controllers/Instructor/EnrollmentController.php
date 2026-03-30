<?php

namespace App\Http\Controllers\Instructor;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    use HasRoleBasedAuthorization;

    public function index(Request $request): Response
    {
        $this->ensureInstructor($request);

        $query = Enrollment::with(['student', 'course'])
            ->whereHas('course', function ($q) {
                $q->where('instructor_id', Auth::id());
            });

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($studentQuery) use ($search) {
                    $studentQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                })
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
            if ($status === 'Completed') {
                $query->whereNotNull('completion_date');
            } else {
                $query->where('status', $status);
            }
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->get('payment_status'));
        }

        $enrollments = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($enrollment) => [
                'id' => $enrollment->id,
                'student' => [
                    'id' => $enrollment->student->id,
                    'name' => $enrollment->student->name,
                    'email' => $enrollment->student->email,
                ],
                'course' => [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'price' => $enrollment->course->price,
                ],
                'enrollment_date' => $enrollment->enrollment_date->format('M d, Y'),
                'payment_status' => $enrollment->payment_status,
                'payment_status_label' => $enrollment->getPaymentStatusLabel(),
                'payment_status_color' => $enrollment->getPaymentStatusColor(),
                'status' => $enrollment->status,
                'status_label' => $enrollment->getStatusLabel(),
                'status_color' => $enrollment->getStatusColor(),
                'progress' => $enrollment->progress,
                'completion_date' => $enrollment->completion_date?->format('M d, Y'),
                'created_at' => $enrollment->created_at->format('M d, Y H:i'),
            ]);

        // Get instructor's courses for filter dropdown
        $courses = Course::where('instructor_id', Auth::id())
            ->orderBy('title')
            ->get()
            ->map(fn($course) => [
                'id' => $course->id,
                'title' => $course->title,
            ]);

        // Get enrollment statistics
        $stats = [
            'total_enrollments' => Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', Auth::id()))->count(),
            'active_enrollments' => Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', Auth::id()))->where('status', 'Active')->count(),
            'completed_enrollments' => Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', Auth::id()))->whereNotNull('completion_date')->count(),
            'total_revenue' => (float) Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', Auth::id()))->where('payment_status', 'Completed')->sum('amount_paid'),
        ];

        return Inertia::render('instructor/enrollments/index', [
            'enrollments' => $enrollments,
            'courses' => $courses,
            'stats' => $stats,
            'filters' => $request->only(['search', 'course_id', 'status', 'payment_status']),
            'statuses' => [
                'active' => 'Active',
                'inactive' => 'Inactive',
                'completed' => 'Completed',
            ],
            'paymentStatuses' => [
                'pending' => 'Pending',
                'completed' => 'Completed',
                'failed' => 'Failed',
                'refunded' => 'Refunded',
            ],
        ]);
    }

    public function show(Request $request, Enrollment $enrollment): Response
    {
        $this->ensureInstructor($request);
        $this->ensureOwnership($request, $enrollment);

        $enrollment->load(['student', 'course', 'lessonProgress.lesson']);

        return Inertia::render('instructor/enrollments/show', [
            'enrollment' => [
                'id' => $enrollment->id,
                'student' => [
                    'id' => $enrollment->student->id,
                    'name' => $enrollment->student->name,
                    'email' => $enrollment->student->email,
                ],
                'course' => [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'price' => $enrollment->course->price,
                    'duration_hours' => $enrollment->course->duration_hours,
                ],
                'enrollment_date' => $enrollment->enrollment_date->format('M d, Y H:i'),
                'payment_status' => $enrollment->payment_status,
                'payment_status_label' => $enrollment->getPaymentStatusLabel(),
                'payment_status_color' => $enrollment->getPaymentStatusColor(),
                'status' => $enrollment->status,
                'status_label' => $enrollment->getStatusLabel(),
                'status_color' => $enrollment->getStatusColor(),
                'progress' => $enrollment->progress,
                'completion_date' => $enrollment->completion_date?->format('M d, Y H:i'),
                'amount' => $enrollment->amount_paid,
                'created_at' => $enrollment->created_at->format('M d, Y H:i'),
                'updated_at' => $enrollment->updated_at->format('M d, Y H:i'),
                'lesson_progress' => $enrollment->lessonProgress->map(fn($progress) => [
                    'lesson_id' => $progress->lesson_id,
                    'lesson_title' => $progress->lesson->title,
                    'completed_at' => $progress->completed_at?->format('M d, Y H:i'),
                    'is_completed' => $progress->is_completed,
                ]),
            ],
        ]);
    }

    private function ensureOwnership(Request $request, Enrollment $enrollment): void
    {
        if ($enrollment->course->instructor_id !== $request->user()->id) {
            abort(403, 'You can only view enrollments for your own courses.');
        }
    }
}
