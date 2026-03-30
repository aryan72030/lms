<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard
     */
    public function index(Request $request): Response
    {
        // Get dashboard statistics
        $stats = [
            'total_users' => User::count(),
            'total_admins' => User::where('role', User::ROLE_ADMIN)->count(),
            'total_instructors' => User::where('role', User::ROLE_INSTRUCTOR)->count(),
            'total_students' => User::where('role', User::ROLE_STUDENT)->count(),
            
            'total_courses' => Course::count(),
            'published_courses' => Course::where('status', Course::STATUS_PUBLISHED)->count(),
            'pending_courses' => Course::where('status', Course::STATUS_REVIEW)->count(),
            'draft_courses' => Course::where('status', Course::STATUS_DRAFT)->count(),
            
            'total_enrollments' => Enrollment::count(),
            'active_enrollments' => Enrollment::where('status', Enrollment::STATUS_ACTIVE)->count(),
            'completed_enrollments' => Enrollment::whereNotNull('completion_date')->count(),
            
            'total_revenue' => Payment::where('status', Payment::STATUS_COMPLETED)->sum('amount'),
            'monthly_revenue' => Payment::where('status', Payment::STATUS_COMPLETED)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            'pending_payments' => Payment::where('status', Payment::STATUS_PENDING)->sum('amount'),
            'failed_payments' => Payment::where('status', Payment::STATUS_FAILED)->count(),
        ];
        
        // Recent activity data
        $recent_users = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'role', 'created_at'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at->format('M d, Y'),
                    'created_at_human' => $user->created_at->diffForHumans(),
                ];
            });
        
        $recent_courses = Course::with(['instructor', 'category'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'instructor_name' => $course->instructor->name,
                    'category' => $course->category->name,
                    'status' => $course->status,
                    'created_at' => $course->created_at->diffForHumans(),
                ];
            });

        $recent_enrollments = Enrollment::with(['student', 'course'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'student_name' => $enrollment->student->name,
                    'course_title' => $enrollment->course->title,
                    'date' => $enrollment->created_at->diffForHumans(),
                    'status' => $enrollment->status,
                ];
            });

        $recent_payments = Payment::with(['student', 'course'])
            ->where('status', Payment::STATUS_COMPLETED)
            ->latest('paid_at')
            ->take(5)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'student_name' => $payment->student->name,
                    'course_title' => $payment->course->title,
                    'amount' => $payment->amount,
                    'date' => $payment->paid_at->diffForHumans(),
                ];
            });

        $pending_approvals = Course::with(['instructor'])
            ->where('status', Course::STATUS_REVIEW)
            ->latest('submitted_at')
            ->take(5)
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'instructor_name' => $course->instructor->name,
                    'submitted_at' => $course->submitted_at?->diffForHumans(),
                ];
            });
        
        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent_users' => $recent_users,
            'recent_courses' => $recent_courses,
            'recent_enrollments' => $recent_enrollments,
            'recent_payments' => $recent_payments,
            'pending_approvals' => $pending_approvals,
        ]);
    }
}