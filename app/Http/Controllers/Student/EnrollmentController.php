<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Mail\CourseEnrollment;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\LessonProgress;
use App\Models\Setting;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    private PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }
    /**
     * Display student's enrollments
     */
    public function index(Request $request)
    {
        $query = Enrollment::with(['course.instructor', 'course.category'])
            ->forStudent(Auth::id())
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('status')) {
            if ($request->status === 'completed') {
                $query->whereNotNull('completion_date');
            } elseif ($request->status === 'in_progress') {
                $query->whereNull('completion_date')->where('status', Enrollment::STATUS_ACTIVE);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $enrollments = $query->paginate((int) Setting::get('pagination_limit', 10))->withQueryString();

        $enrollments->getCollection()->transform(function ($enrollment) {
            if ($enrollment->course) {
                $enrollment->course->thumbnail = $enrollment->course->thumbnail ? '/files/' . $enrollment->course->thumbnail : null;
            }
            return $enrollment;
        });

        return Inertia::render('student/enrollments/index', [
            'enrollments' => $enrollments,
            'filters' => $request->only(['status', 'payment_status']),
        ]);
    }

    /**
     * Enroll in a course
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $course = Course::findOrFail($request->course_id);

        // Check if course is published
        if (!$course->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'This course is not available for enrollment.',
            ], 400);
        }

        // Check if student is already enrolled (Active/Completed)
        $existingEnrollment = Enrollment::where('student_id', Auth::id())
            ->where('course_id', $course->id)
            ->first();

        $alreadyCompleted = (bool) $existingEnrollment?->completion_date;

        if ($existingEnrollment && ($existingEnrollment->status === Enrollment::STATUS_ACTIVE || $alreadyCompleted || $existingEnrollment->payment_status === Enrollment::PAYMENT_STATUS_COMPLETED)) {
            return response()->json([
                'success' => false,
                'message' => 'You are already enrolled in this course.',
            ], 400);
        }

        // Create or reuse enrollment based on course price
        if ($course->price > 0) {
            // Paid course - create or reuse pending enrollment
            if ($existingEnrollment && $existingEnrollment->payment_status === Enrollment::PAYMENT_STATUS_PENDING) {
                $enrollment = $existingEnrollment;
            } else {
                $enrollment = Enrollment::createEnrollment(Auth::id(), $course->id, $course->price);
            }
            
            // Create PayPal payment order
            $paypalResult = $this->paypalService->createOrder(Auth::user(), $course, $enrollment);
            
            if ($paypalResult['success']) {
                return Inertia::location($paypalResult['approval_url']);
            } else {
                // If this was a new enrollment, delete it if PayPal order creation failed
                if (!$existingEnrollment) {
                    $enrollment->delete();
                }
                
                return redirect()->back()->with('error', 'Failed to create payment order. Please try again.');
            }
        } else {
            // Free course - direct enrollment
            if ($existingEnrollment) {
                $enrollment = $existingEnrollment;
                $enrollment->update([
                    'payment_status' => Enrollment::PAYMENT_STATUS_FREE,
                    'payment_method' => Enrollment::METHOD_FREE,
                    'status' => Enrollment::STATUS_ACTIVE,
                ]);
            } else {
                $enrollment = Enrollment::createEnrollment(Auth::id(), $course->id, 0);
            }
            
            // Send enrollment confirmation email
            $emailSettings = Setting::getEmailSettings();
            if ($emailSettings['enabled'] && $emailSettings['types']['course_enrollment']) {
                try {
                    Mail::to(Auth::user()->email)->send(new CourseEnrollment($enrollment));
                } catch (\Exception $mailException) {
                    \Illuminate\Support\Facades\Log::error('Failed to send enrollment email to student: ' . Auth::user()->email, [
                        'error' => $mailException->getMessage(),
                        'enrollment_id' => $enrollment->id
                    ]);
                }
            }
            
            return redirect()->route('student.enrollments.show', $enrollment->id)
                ->with('success', 'Successfully enrolled in the course!');
        }
    }

    /**
     * Show enrollment details
     */
    public function show(Enrollment $enrollment)
    {
        // Ensure student can only view their own enrollments
        if ($enrollment->student_id !== Auth::id()) {
            abort(403, 'Unauthorized access to enrollment.');
        }

        // Prevent access if payment is pending
        if ($enrollment->payment_status === Enrollment::PAYMENT_STATUS_PENDING) {
            return redirect()->route('student.courses.show', $enrollment->course->id)
                ->with('error', 'Please complete your payment to access this course.');
        }

        $enrollment->load([
            'course.instructor',
            'course.category',
            'course.lessons' => function ($query) {
                $query->where('is_published', true)->orderBy('order');
            }
        ]);
        
        // Get lesson progress for this enrollment
        $lessonProgress = LessonProgress::where('student_id', Auth::id())
            ->where('enrollment_id', $enrollment->id)
            ->get()
            ->map(function ($progress) {
                return [
                    'lesson_id' => $progress->lesson_id,
                    'is_completed' => $progress->is_completed,
                    'completed_at' => $progress->completed_at?->format('Y-m-d H:i:s'),
                    'time_spent' => $progress->time_spent,
                ];
            });
        
        // Update enrollment progress
        $progressData = $enrollment->getProgressData();

        return Inertia::render('student/enrollments/show', [
            'enrollment' => [
                'id' => $enrollment->id,
                'enrollment_date' => $enrollment->enrollment_date?->format('Y-m-d H:i:s'),
                'payment_status' => $enrollment->payment_status,
                'status' => $enrollment->status,
                'progress' => $progressData['progress_percentage'],
                'completion_date' => $enrollment->completion_date?->toISOString(),
                'amount_paid' => $enrollment->amount_paid,
                'course' => [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'description' => $enrollment->course->description,
                    'price' => $enrollment->course->price,
                    'thumbnail' => $enrollment->course->thumbnail ? '/files/' . $enrollment->course->thumbnail : null,
                    'instructor' => [
                        'id' => $enrollment->course->instructor->id,
                        'name' => $enrollment->course->instructor->name,
                    ],
                    'category' => [
                        'id' => $enrollment->course->category->id,
                        'name' => $enrollment->course->category->name,
                    ],
                    'lessons' => $enrollment->course->lessons->map(fn ($lesson) => [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'description' => $lesson->description,
                        'type' => $lesson->type,
                        'order' => $lesson->order,
                        'estimated_duration' => $lesson->estimated_duration,
                        'duration_display' => $lesson->duration_display,
                        'text_content' => $lesson->text_content,
                        'video_url' => $lesson->video_url,
                        'video_duration' => $lesson->video_duration,
                        'quiz_data' => $lesson->quiz_data,
                        'assignment_data' => $lesson->assignment_data,
                    ])->values(),
                ],
            ],
            'lessonProgress' => $lessonProgress,
        ]);
    }

    /**
     * Update enrollment progress (for lesson completion)
     */
    public function updateProgress(Request $request, Enrollment $enrollment)
    {
        // Ensure student can only update their own enrollments
        if ($enrollment->student_id !== Auth::id()) {
            abort(403, 'Unauthorized access to enrollment.');
        }

        $request->validate([
            'progress' => 'required|numeric|min:0|max:100',
        ]);

        $enrollment->updateProgress($request->progress);

        return response()->json([
            'success' => true,
            'message' => 'Progress updated successfully.',
            'progress' => $enrollment->progress,
            'completed' => !is_null($enrollment->completion_date),
        ]);
    }

    /**
     * Cancel enrollment (for pending payments only)
     */
    public function cancel(Enrollment $enrollment)
    {
        // Ensure student can only cancel their own enrollments
        if ($enrollment->student_id !== Auth::id()) {
            abort(403, 'Unauthorized access to enrollment.');
        }

        // Only allow cancellation of pending enrollments
        if (!$enrollment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending enrollments can be cancelled.',
            ], 400);
        }

        $enrollment->delete();

        return redirect()->back()->with('success', 'Enrollment cancelled successfully.');
    }

    /**
     * Get enrollment statistics for student dashboard
     */
    public function statistics()
    {
        $studentId = Auth::id();

        $stats = [
            'total_enrollments' => Enrollment::forStudent($studentId)->where('payment_status', '!=', Enrollment::PAYMENT_STATUS_PENDING)->count(),
            'active_enrollments' => Enrollment::forStudent($studentId)->active()->count(),
            'completed_courses' => Enrollment::forStudent($studentId)->whereNotNull('completion_date')->count(),
            'in_progress_courses' => Enrollment::forStudent($studentId)
                ->whereNull('completion_date')
                ->active()
                ->count(),
            'total_progress' => Enrollment::forStudent($studentId)->active()->avg('progress') ?? 0,
        ];

        return response()->json($stats);
    }

    /**
     * Check if student can enroll in a course
     */
    public function checkEnrollment(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $studentId = Auth::id();
        $courseId = $request->course_id;

        $existingEnrollment = Enrollment::where('student_id', $studentId)
            ->where('course_id', $courseId)
            ->first();

        // can_enroll is true if no enrollment exists OR if it's not active/completed
        $canEnroll = !$existingEnrollment || 
                    ($existingEnrollment->status !== Enrollment::STATUS_ACTIVE && 
                     $existingEnrollment->payment_status !== Enrollment::PAYMENT_STATUS_COMPLETED);

        return response()->json([
            'can_enroll' => $canEnroll,
            'enrollment' => $existingEnrollment,
        ]);
    }

    /**
     * Display student's earned certificates
     */
    public function certificates()
    {
        $certificates = Enrollment::with(['course.instructor'])
            ->forStudent(Auth::id())
            ->whereNotNull('completion_date')
            ->orderBy('completion_date', 'desc')
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'course_title' => $enrollment->course->title,
                    'instructor_name' => $enrollment->course->instructor->name,
                    'completion_date' => $enrollment->completion_date?->toISOString(),
                    'certificate_id' => 'CERT-' . str_pad($enrollment->id, 6, '0', STR_PAD_LEFT),
                ];
            });

        return Inertia::render('student/certificates/index', [
            'certificates' => $certificates,
        ]);
    }
}
