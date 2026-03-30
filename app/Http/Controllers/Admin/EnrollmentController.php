<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhereHas('course', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
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
        ];

        return Inertia::render('admin/enrollments/index', [
            'enrollments' => $enrollments,
            'courses' => $courses,
            'statuses' => $statuses,
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

        $enrollment->save();

        return redirect()->route('admin.enrollments.index')
            ->with('success', 'Student enrolled successfully.');
    }

    /**
     * Display the specified enrollment
     */
    public function show(Enrollment $enrollment)
    {
        $enrollment->load(['student', 'course.instructor', 'course.lessons']);

        return Inertia::render('admin/enrollments/show', [
            'enrollment' => $enrollment,
        ]);
    }

    /**
     * Update the specified enrollment
     */
    public function update(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', [Enrollment::STATUS_ACTIVE, Enrollment::STATUS_INACTIVE]),
            'progress' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $enrollment->update([
            'status' => $request->status,
            'progress' => $request->progress ?? $enrollment->progress,
            'notes' => $request->notes,
        ]);

        // Mark as completed if progress is 100%
        if ($request->progress == 100 && is_null($enrollment->completion_date)) {
            $enrollment->update(['completion_date' => now()]);
        }

        return redirect()->route('admin.enrollments.index')
            ->with('success', 'Enrollment updated successfully.');
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