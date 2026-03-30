<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the instructor dashboard
     */
    public function index(Request $request): Response
    {
        $instructor = $request->user();
        $instructorId = $instructor->id;

        // Get instructor courses
        $courses = Course::where('instructor_id', $instructorId)->get();
        $courseIds = $courses->pluck('id');

        // Course statistics
        $totalCourses = $courses->count();
        $publishedCourses = $courses->where('status', Course::STATUS_PUBLISHED)->count();
        $draftCourses = $courses->where('status', Course::STATUS_DRAFT)->count();
        $pendingCourses = $courses->where('status', Course::STATUS_REVIEW)->count();

        // Student statistics
        $enrollments = Enrollment::whereIn('course_id', $courseIds)->get();
        $totalStudents = $enrollments->unique('student_id')->count();
        $activeStudents = $enrollments->where('status', Enrollment::STATUS_ACTIVE)->unique('student_id')->count();
        $completedStudents = $enrollments->whereNotNull('completion_date')->unique('student_id')->count();

        // Earnings statistics
        $allPayments = Payment::whereIn('course_id', $courseIds)->get();
        
        $totalEarnings = $allPayments->where('status', Payment::STATUS_COMPLETED)->sum('amount');
        $monthlyEarnings = $allPayments->where('status', Payment::STATUS_COMPLETED)
            ->where('paid_at', '>=', now()->startOfMonth())
            ->sum('amount');
        
        $pendingPayments = $allPayments->where('status', Payment::STATUS_PENDING)->sum('amount');
        $failedPayments = $allPayments->where('status', Payment::STATUS_FAILED)->sum('amount');

        // Content statistics
        $lessonsCount = Lesson::whereIn('course_id', $courseIds)->count();
        $quizzesCount = Quiz::whereIn('course_id', $courseIds)->count();
        $assignmentsCount = Lesson::whereIn('course_id', $courseIds)->where('type', Lesson::TYPE_ASSIGNMENT)->count();

        $stats = [
            'total_courses' => $totalCourses,
            'published_courses' => $publishedCourses,
            'draft_courses' => $draftCourses,
            'pending_courses' => $pendingCourses,
            
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'completed_students' => $completedStudents,
            
            'total_earnings' => round($totalEarnings, 2),
            'monthly_earnings' => round($monthlyEarnings, 2),
            'pending_payments' => round($pendingPayments, 2),
            'failed_payments' => round($failedPayments, 2),
            'abandoned_carts_count' => $allPayments->where('status', Payment::STATUS_PENDING)->count(),
            
            'total_lessons' => $lessonsCount,
            'total_quizzes' => $quizzesCount,
            'total_assignments' => $assignmentsCount,
        ];
        
        // My Courses with basic stats
        $my_courses = Course::with(['category'])
            ->where('instructor_id', $instructorId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status,
                    'category' => $course->category->name,
                    'students_count' => Enrollment::where('course_id', $course->id)->count(),
                    'revenue' => Payment::where('course_id', $course->id)->where('status', Payment::STATUS_COMPLETED)->sum('amount'),
                ];
            });

        // Recent Enrollments
        $recent_enrollments = Enrollment::with(['student', 'course'])
            ->whereIn('course_id', $courseIds)
            ->orderBy('created_at', 'desc')
            ->limit(5)
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

        // Recent Activity (Quiz attempts, Assignment submissions)
        $recent_quiz_attempts = QuizAttempt::with(['student', 'quiz.course'])
            ->whereIn('lesson_id', function ($query) use ($courseIds) {
                $query->select('id')->from('quizzes')->whereIn('course_id', $courseIds);
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($attempt) {
                return [
                    'type' => 'quiz',
                    'student_name' => $attempt->student->name,
                    'course_title' => $attempt->quiz->course->title,
                    'activity' => 'Completed quiz: ' . $attempt->quiz->title,
                    'date' => $attempt->created_at->diffForHumans(),
                    'score' => $attempt->percentage,
                ];
            });

        $recent_activity = $recent_quiz_attempts; // Can merge more later

        // Top Performing Courses
        $top_courses = Course::where('instructor_id', $instructorId)
            ->where('status', Course::STATUS_PUBLISHED)
            ->get()
            ->map(function ($course) {
                $enrollmentsCount = Enrollment::where('course_id', $course->id)->count();
                $revenue = Payment::where('course_id', $course->id)->where('status', Payment::STATUS_COMPLETED)->sum('amount');
                
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'students' => $enrollmentsCount,
                    'revenue' => round($revenue, 2),
                ];
            })
            ->sortByDesc('students')
            ->values()
            ->take(5);

        // Recent Payments
        $recent_payments = Payment::with(['student', 'course'])
            ->whereIn('course_id', $courseIds)
            ->where('status', Payment::STATUS_COMPLETED)
            ->orderBy('paid_at', 'desc')
            ->limit(5)
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
        
        return Inertia::render('instructor/dashboard', [
            'stats' => $stats,
            'my_courses' => $my_courses,
            'recent_enrollments' => $recent_enrollments,
            'recent_activity' => $recent_activity,
            'top_courses' => $top_courses,
            'recent_payments' => $recent_payments,
            'instructor' => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'email' => $instructor->email,
            ],
        ]);
    }
}
