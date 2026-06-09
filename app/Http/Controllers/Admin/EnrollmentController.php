<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

use App\Mail\PaymentRefunded;
use Illuminate\Support\Facades\Mail;

class EnrollmentController extends Controller
{
    /**
     * Display a listing of enrollments
     */
    public function index(Request $request)
    {
        $query = Enrollment::with(['student', 'course', 'course.instructor'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('course', function ($cq) use ($search) {
                    $cq->where('title', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        $enrollments = $query->paginate((int) Setting::get('pagination_limit', 10))->withQueryString();

        $enrollments->getCollection()->transform(function($enrollment) {
            $enrollment->expiry_date_formatted = $enrollment->expiry_date?->format('Y-m-d');
            return $enrollment;
        });

        // Get filter options
        $courses = Course::published()->select('id', 'title')->get();
        $statuses = [
            Enrollment::STATUS_ACTIVE => 'Active',
            Enrollment::STATUS_INACTIVE => 'Inactive',
        ];
        $paymentStatuses = [
            Enrollment::PAYMENT_STATUS_FREE => 'Free',
            Enrollment::PAYMENT_STATUS_PENDING => 'Pending',
            Enrollment::PAYMENT_STATUS_COMPLETED => 'Completed',
            Enrollment::PAYMENT_STATUS_FAILED => 'Failed',
            Enrollment::PAYMENT_STATUS_REFUNDED => 'Refunded',
        ];

        $allStatuses = [
            Enrollment::STATUS_ACTIVE => 'Active',
            Enrollment::STATUS_INACTIVE => 'Inactive',
            Enrollment::STATUS_CANCELLED => 'Cancelled',
            Enrollment::STATUS_REFUNDED => 'Refunded',
            Enrollment::STATUS_REFUND_REQUESTED => 'Refund Requested',
        ];

        return Inertia::render('admin/enrollments/index', [
            'enrollments' => $enrollments,
            'enrollments_total' => $enrollments->total(),
            'courses' => $courses,
            'statuses' => $statuses,
            'allStatuses' => $allStatuses,
            'paymentStatuses' => $paymentStatuses,
            'filters' => $request->only(['search', 'status', 'payment_status', 'course_id']),
            'students' => User::where('role', User::ROLE_STUDENT)
                ->where('status', User::STATUS_ACTIVE)
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store a newly created enrollment
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if student role is correct
        $student = User::findOrFail($request->student_id);
        if (!$student->isStudent()) {
            return back()->withErrors(['student_id' => 'Selected user is not a student.']);
        }

        // Check if course is published
        $course = Course::findOrFail($request->course_id);
        if (!$course->isPublished()) {
            return back()->withErrors(['course_id' => 'Course must be published to allow enrollments.']);
        }

        // Check if enrollment already exists
        if (!Enrollment::canEnroll($request->student_id, $request->course_id)) {
            return back()->withErrors(['course_id' => 'Student is already enrolled in this course.']);
        }

        // Create enrollment (Admin can enroll students for free regardless of course price)
        $enrollment = new Enrollment([
            'student_id' => $request->student_id,
            'course_id' => $request->course_id,
            'enrollment_date' => now(),
            'payment_status' => Enrollment::PAYMENT_STATUS_FREE,
            'payment_method' => Enrollment::METHOD_FREE,
            'status' => Enrollment::STATUS_ACTIVE,
            'notes' => $request->notes,
        ]);

        // Set expiry date if course has duration
        if ($course->access_duration > 0) {
            $enrollment->expiry_date = now()->addDays($course->access_duration);
        }

        $enrollment->save();

        return redirect()->route('admin.enrollments.index')
            ->with('success', 'Student enrolled successfully.');
    }

    /**
     * Get enrollment details for Modal view
     */
    public function getDetails(Enrollment $enrollment)
    {
        $enrollment->load([
            'student:id,name,email',
            'course:id,title,price,instructor_id,access_duration',
            'course.instructor:id,name',
            'course.lessons:id,course_id,title,type,order',
            'lessonProgress'
        ]);

        return response()->json([
            'success' => true,
            'enrollment' => $enrollment,
            'completed_lesson_ids' => $enrollment->lessonProgress->pluck('lesson_id')->toArray()
        ]);
    }

    /**
     * Toggle lesson completion status for an enrollment
     */
    public function toggleLesson(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'is_completed' => 'required|boolean'
        ]);

        $lessonId = $request->lesson_id;
        $isCompleted = $request->is_completed;

        if ($isCompleted) {
            \App\Models\LessonProgress::markLessonComplete(
                $enrollment->student_id,
                $lessonId,
                $enrollment->id
            );
        } else {
            \App\Models\LessonProgress::markLessonIncomplete(
                $enrollment->student_id,
                $lessonId,
                $enrollment->id
            );
        }

        // Recalculate progress using the model method for consistency
        $progress = $enrollment->calculateProgress();

        return response()->json([
            'success' => true,
            'progress' => $progress,
            'status' => $enrollment->status
        ]);
    }

    /**
     * Display the specified enrollment
     */
    public function show(Enrollment $enrollment)
    {
        $this->authorize('view', $enrollment);
        $enrollment->load(['student', 'course.instructor', 'course.lessons', 'lessonProgress']);

        return Inertia::render('admin/enrollments/show', [
            'enrollment' => $enrollment,
            'completed_lesson_ids' => $enrollment->lessonProgress->pluck('lesson_id')->toArray()
        ]);
    }

    /**
     * Update the specified enrollment
     */
    public function update(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'status' => 'required|in:Active,Inactive,Cancelled,Refunded,Refund Requested',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $enrollment->update([
            'status' => $validated['status'],
            'expiry_date' => $validated['expiry_date'] ? \Carbon\Carbon::parse($validated['expiry_date']) : null,
            'notes' => $validated['notes'],
        ]);

        return redirect()->back()->with('success', 'Enrollment updated successfully.');
    }

    /**
     * Approve a refund request
     */
    public function approveRefund(Request $request, Enrollment $enrollment)
    {
        $this->authorize('delete', $enrollment);

        Log::info('Approving refund for enrollment: ' . $enrollment->id);
        
        $request->validate([
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        try {
            $refundId = 'REF-' . strtoupper(bin2hex(random_bytes(8))) . '-' . now()->format('Ymd');
            
            $enrollment->update([
                'status' => Enrollment::STATUS_REFUNDED,
                'payment_status' => Enrollment::PAYMENT_STATUS_REFUNDED,
                'refund_id' => $refundId,
                'refund_amount' => $enrollment->amount_paid,
                'refunded_at' => now(),
                'refund_count' => $enrollment->refund_count + 1,
                'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . 
                          "Refund APPROVED by admin on " . now()->format('Y-m-d H:i') . ". " . 
                          "Virtual Refund ID: " . $refundId . ". " .
                          ($request->admin_notes ? "Admin Notes: " . $request->admin_notes : ""),
            ]);

            // Update associated payment if exists
            $enrollment->payments()->update(['status' => Payment::STATUS_REFUNDED]);

            return redirect()->back()->with('success', 'Refund approved and enrollment marked as Refunded.');
        } catch (\Exception $e) {
            Log::error('Approve refund error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to approve refund.');
        }
    }

    /**
     * Reject a refund request
     */
    public function rejectRefund(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $enrollment->update([
                'status' => Enrollment::STATUS_ACTIVE,
                'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . 
                          "Refund REJECTED by admin on " . now()->format('Y-m-d') . ". " . 
                          "Reason: " . $request->rejection_reason,
            ]);

            return redirect()->back()->with('success', 'Refund request rejected. Enrollment is now Active again.');
        } catch (\Exception $e) {
            Log::error('Reject refund error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to reject refund.');
        }
    }

    /**
     * Refund an enrollment
     */
    public function refund(Request $request, Enrollment $enrollment)
    {
        $this->authorize('delete', $enrollment);

        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $reason = $request->reason ?: 'No reason provided';
        $refundId = 'REF-' . strtoupper(bin2hex(random_bytes(8))) . '-' . now()->format('Ymd');

        $enrollment->update([
            'status' => Enrollment::STATUS_REFUNDED,
            'payment_status' => Enrollment::PAYMENT_STATUS_REFUNDED,
            'refund_id' => $refundId,
            'refund_amount' => $enrollment->amount_paid,
            'refunded_at' => now(),
            'refund_count' => $enrollment->refund_count + 1,
            'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . 
                      "Refunded by admin on " . now()->format('Y-m-d H:i') . ". " . 
                      "Virtual Refund ID: " . $refundId . ". " .
                      "Reason: " . $reason,
        ]);

        // Update associated payment if exists
        $enrollment->payments()->update(['status' => Payment::STATUS_REFUNDED]);

        // Send Email Notification
        if (Setting::get('email_payment_refund', true)) {
            try {
                Mail::to($enrollment->student->email)->send(new PaymentRefunded($enrollment, $reason));
            } catch (\Exception $e) {
                Log::error('Failed to send refund email: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Enrollment has been marked as refunded.');
    }

    /**
     * Cancel an enrollment
     */
    public function cancel(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $enrollment->update([
            'status' => Enrollment::STATUS_CANCELLED,
            'notes' => ($enrollment->notes ? $enrollment->notes . "\n" : "") . "Cancelled on " . now()->format('Y-m-d') . ". Reason: " . ($request->reason ?: 'No reason provided'),
        ]);

        return redirect()->back()->with('success', 'Enrollment has been cancelled.');
    }

    /**
     * Remove the specified enrollment
     */
    public function destroy(Enrollment $enrollment)
    {
        $studentName = $enrollment->student->name;
        $courseTitle = $enrollment->course->title;

        $enrollment->delete();

        return redirect()->route('admin.enrollments.index')
            ->with('success', "Enrollment for {$studentName} in {$courseTitle} has been removed.");
    }

    /**
     * Bulk update enrollment statuses
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'enrollment_ids' => 'required|array',
            'enrollment_ids.*' => 'exists:enrollments,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        $enrollments = Enrollment::whereIn('id', $request->enrollment_ids);

        switch ($request->action) {
            case 'activate':
                $enrollments->update(['status' => Enrollment::STATUS_ACTIVE]);
                $message = 'Selected enrollments have been activated.';
                break;
            case 'deactivate':
                $enrollments->update(['status' => Enrollment::STATUS_INACTIVE]);
                $message = 'Selected enrollments have been deactivated.';
                break;
            case 'delete':
                $count = $enrollments->count();
                $enrollments->delete();
                $message = "{$count} enrollments have been deleted.";
                break;
        }

        return back()->with('success', $message);
    }
}
