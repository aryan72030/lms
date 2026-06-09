<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Mail\CourseEnrollment;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\CourseAssignmentSubmission;
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
            // Add expiry date and refund dates to response
            $enrollment->expiry_date = $enrollment->expiry_date?->format('Y-m-d H:i:s');
            $enrollment->refunded_at = $enrollment->refunded_at?->format('Y-m-d H:i:s');
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

        // Check for max students limit
        $maxStudents = (int) Setting::get('max_students_per_course', 0);
        if ($maxStudents > 0) {
            $currentStudents = Enrollment::where('course_id', $course->id)
                ->where(function($q) {
                    $q->where('status', Enrollment::STATUS_ACTIVE)
                      ->orWhereNotNull('completion_date');
                })->count();
            
            if ($currentStudents >= $maxStudents) {
                return redirect()->back()->with('error', 'This course has reached its maximum student limit.');
            }
        }

        // Check if course is published
        if (!$course->isPublished()) {
            return redirect()->back()->with('error', 'This course is not available for enrollment.');
        }

        // Check if student is already enrolled (Active/Completed)
        $existingEnrollment = Enrollment::where('student_id', Auth::id())
            ->where('course_id', $course->id)
            ->first();

        $alreadyCompleted = (bool) $existingEnrollment?->completion_date;
        $isExpiredEnrollment = (bool) $existingEnrollment?->isExpired();

        // Block if Refund Requested is pending
        if ($existingEnrollment && $existingEnrollment->status === Enrollment::STATUS_REFUND_REQUESTED) {
            return redirect()->back()->with('error', 'Your refund request is pending. Please wait for admin review before re-enrolling.');
        }

        if (
            $existingEnrollment &&
            !$isExpiredEnrollment &&
            !in_array($existingEnrollment->status, [Enrollment::STATUS_CANCELLED, Enrollment::STATUS_REFUNDED, Enrollment::STATUS_INACTIVE]) &&
            (
                $existingEnrollment->status === Enrollment::STATUS_ACTIVE ||
                $alreadyCompleted ||
                $existingEnrollment->payment_status === Enrollment::PAYMENT_STATUS_COMPLETED
            )
        ) {
            return redirect()->back()->with('error', 'You are already enrolled in this course.');
        }

        // Create or reuse enrollment based on course price
        if ($course->price > 0) {
            // Paid course - create or reuse enrollment
            if ($existingEnrollment && $existingEnrollment->payment_status === Enrollment::PAYMENT_STATUS_PENDING) {
                $enrollment = $existingEnrollment;
            } elseif ($existingEnrollment && (
                $isExpiredEnrollment || 
                in_array($existingEnrollment->status, [
                    Enrollment::STATUS_REFUNDED, 
                    Enrollment::STATUS_CANCELLED,
                    Enrollment::STATUS_INACTIVE,
                ])
            )) {
                $existingEnrollment->resetForReEnrollment('Re-enrolled after ' . $existingEnrollment->status);
                $existingEnrollment->update([
                    'payment_status' => Enrollment::PAYMENT_STATUS_PENDING,
                    'payment_method' => Enrollment::METHOD_PAYPAL,
                    'status'         => Enrollment::STATUS_INACTIVE,
                    'amount_paid'    => $course->price,
                ]);

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
                
                $errorMessage = $paypalResult['error'] ?? 'Failed to create payment order. Please try again.';
                return redirect()->back()->with('error', $errorMessage);
            }
        } else {
            // Free course - direct enrollment
            if ($existingEnrollment && (
                in_array($existingEnrollment->status, [
                    Enrollment::STATUS_CANCELLED,
                    Enrollment::STATUS_REFUNDED,
                    Enrollment::STATUS_INACTIVE,
                ]) || $isExpiredEnrollment
            )) {
                $expiryDate = $course->access_duration
                    ? now()->addDays($course->access_duration)
                    : null;

                $existingEnrollment->resetForReEnrollment('Re-enrolled after ' . $existingEnrollment->status);
                $existingEnrollment->update([
                    'payment_status' => Enrollment::PAYMENT_STATUS_FREE,
                    'payment_method' => Enrollment::METHOD_FREE,
                    'status'         => Enrollment::STATUS_ACTIVE,
                    'expiry_date'    => $expiryDate,
                ]);

                $enrollment = $existingEnrollment;
            } elseif (!$existingEnrollment) {
                $enrollment = Enrollment::createEnrollment(Auth::id(), $course->id, 0);
            } else {
                return redirect()->back()->with('error', 'You are already enrolled in this course.');
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
        $this->authorize('view', $enrollment);

        // Prevent access if payment is pending
        if ($enrollment->payment_status === Enrollment::PAYMENT_STATUS_PENDING) {
            return redirect()->route('student.courses.show', $enrollment->course->id)
                ->with('error', 'Please complete your payment to access this course.');
        }

        // Prevent access if enrollment is not active (e.g. Refunded, Cancelled, Inactive)
        if (!$enrollment->isActive()) {
            $statusMessage = match ($enrollment->status) {
                Enrollment::STATUS_REFUNDED => 'Your enrollment has been refunded and access has been revoked.',
                Enrollment::STATUS_CANCELLED => 'Your enrollment has been cancelled.',
                Enrollment::STATUS_REFUND_REQUESTED => 'Your refund request is pending. Access is temporarily restricted.',
                default => 'Your enrollment is currently inactive.',
            };

            return redirect()->route('student.enrollments.index')
                ->with('error', $statusMessage);
        }

        if ($enrollment->isExpired()) {
            return redirect()->route('student.enrollments.index')
                ->with('error', 'Your access to this course has expired.');
        }

        $enrollment->load([
            'course.instructor',
            'course.category',
            'course.lessons' => function ($query) {
                $query->where('is_published', true)->orderBy('order');
            },
            'course.assignments' => function ($query) {
                $query->where('is_published', true)->orderBy('order');
            },
        ]);
        
        // Get lesson progress for this enrollment
        $lessonProgress = LessonProgress::where('student_id', Auth::id())
            ->where('enrollment_id', $enrollment->id)
            ->get()
            ->map(function ($progress) {
                return [
                    'lesson_id'    => $progress->lesson_id,
                    'is_completed' => $progress->is_completed,
                    'completed_at' => $progress->completed_at?->format('Y-m-d H:i:s'),
                    'time_spent'   => $progress->time_spent,
                ];
            });

        // Get assignment submissions for this enrollment
        $assignmentIds = $enrollment->course->assignments->pluck('id');
        $submissions = CourseAssignmentSubmission::whereIn('course_assignment_id', $assignmentIds)
            ->where('student_id', Auth::id())
            ->get()
            ->keyBy('course_assignment_id');

        $assignments = $enrollment->course->assignments->map(function ($assignment) use ($enrollment, $submissions) {
            $submission = $submissions->get($assignment->id);
            $dueDate    = $assignment->dueDateFor($enrollment);
            return [
                'id'           => $assignment->id,
                'title'        => $assignment->title,
                'instructions' => $assignment->instructions,
                'max_score'    => $assignment->max_score,
                'passing_score'=> $assignment->passing_score,
                'due_days'     => $assignment->due_days,
                'due_date'     => $dueDate->format('M d, Y'),
                'is_overdue'   => now()->isAfter($dueDate),
                'submission'   => $submission ? [
                    'id'              => $submission->id,
                    'status'          => $submission->status,
                    'submission_text' => $submission->submission_text,
                    'file_path'       => $submission->file_path,
                    'file_original_name' => $submission->file_original_name,
                    'score'           => $submission->score,
                    'percentage'      => $submission->percentage,
                    'feedback'        => $submission->feedback,
                    'submitted_at'    => $submission->submitted_at?->format('M d, Y H:i'),
                    'graded_at'       => $submission->graded_at?->format('M d, Y H:i'),
                    'is_passed'       => $submission->isGraded() ? $submission->isPassed() : null,
                ] : null,
            ];
        })->values();
        
        // Update enrollment progress
        $progressData = $enrollment->getProgressData();

        return Inertia::render('student/enrollments/show', [
            'enrollment' => [
                'id' => $enrollment->id,
                'enrollment_date' => $enrollment->enrollment_date->format('Y-m-d H:i:s'),
                'expiry_date' => $enrollment->expiry_date?->format('Y-m-d H:i:s'),
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
                    'lessons' => $enrollment->course->lessons->map(function ($lesson) {
                        return [
                            'id'                 => $lesson->id,
                            'title'              => $lesson->title,
                            'description'        => $lesson->description,
                            'type'               => $lesson->type,
                            'order'              => $lesson->order,
                            'estimated_duration' => $lesson->estimated_duration,
                            'duration_display'   => $lesson->duration_display,
                            'text_content'       => $lesson->text_content,
                            'video_url'          => $lesson->video_url,
                            'video_duration'     => $lesson->video_duration,
                        ];
                    })->values(),
                ],
            ],
            'lessonProgress' => $lessonProgress,
            'assignments'    => $assignments,
        ]);
    }

    /**
     * Update enrollment progress (for lesson completion)
     */
    public function updateProgress(Request $request, Enrollment $enrollment)
    {
        $this->authorize('update', $enrollment);

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
     * Request a refund for an enrollment
     */
    public function requestRefund(Request $request, Enrollment $enrollment)
    {
        $this->authorize('update', $enrollment);

        // Validate reason
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        // Only allow refund requests for active, paid enrollments
        if ($enrollment->status !== Enrollment::STATUS_ACTIVE || $enrollment->payment_status !== Enrollment::PAYMENT_STATUS_COMPLETED) {
            return redirect()->back()->with('error', 'Only active paid enrollments can be refunded.');
        }

        $reason = $request->reason;
        $enrollment->update([
            'status' => Enrollment::STATUS_REFUND_REQUESTED,
            'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . "Refund requested on " . now()->format('Y-m-d') . ". Reason: " . $reason,
        ]);

        return redirect()->back()->with('success', 'Refund request submitted successfully. The administrator will review it soon.');
    }

    /**
     * Cancel enrollment
     */
    public function cancel(Enrollment $enrollment)
    {
        $this->authorize('update', $enrollment);

        // Don't allow cancelling paid courses via this method
        if ($enrollment->course->price > 0) {
            return redirect()->back()->with('error', 'Paid enrollments cannot be cancelled. Please request a refund instead if it was already paid.');
        }

        // If it's a pending enrollment, just delete it
        if ($enrollment->isPending()) {
            $enrollment->delete();
            return redirect()->back()->with('success', 'Pending enrollment cancelled successfully.');
        }

        // For active/free enrollments, just mark as cancelled
        $enrollment->update([
            'status' => Enrollment::STATUS_CANCELLED,
            'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . "Cancelled by student on " . now()->format('Y-m-d'),
        ]);

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

        $isExpiredEnrollment = (bool) $existingEnrollment?->isExpired();

        // can_enroll is true if no enrollment exists, or if the previous one expired,
        // or if it's otherwise not an active/completed enrollment.
        $canEnroll = !$existingEnrollment ||
                    $isExpiredEnrollment ||
                    ($existingEnrollment->status !== Enrollment::STATUS_ACTIVE &&
                     $existingEnrollment->payment_status !== Enrollment::PAYMENT_STATUS_COMPLETED);

        if ($existingEnrollment) {
            $existingEnrollment->is_expired = $isExpiredEnrollment;
            $existingEnrollment->expiry_date = $existingEnrollment->expiry_date?->format('Y-m-d H:i:s');
        }

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
