<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the student dashboard
     */
    public function index(Request $request): Response
    {
        $student = $request->user();
        $studentId = $student->id;
        
        // Get actual enrollment statistics
        $totalEnrollments = Enrollment::forStudent($studentId)->where('payment_status', '!=', Enrollment::PAYMENT_STATUS_PENDING)->count();
        $completedCourses = Enrollment::forStudent($studentId)->whereNotNull('completion_date')->count();
        $inProgressCourses = Enrollment::forStudent($studentId)
            ->whereNull('completion_date')
            ->active()
            ->count();
        
        // Calculate total lessons completed across all courses
        $totalLessonsCompleted = LessonProgress::where('student_id', $studentId)
            ->where('is_completed', true)
            ->count();
        
        // Get quiz statistics
        $totalQuizzesTaken = QuizAttempt::where('student_id', $studentId)
            ->whereNotNull('completed_at')
            ->count();
        
        $averageQuizScore = QuizAttempt::where('student_id', $studentId)
            ->whereNotNull('completed_at')
            ->avg('percentage') ?? 0;
        
        // Get assignment statistics
        $totalAssignmentsSubmitted = AssignmentSubmission::where('student_id', $studentId)
            ->where('status', AssignmentSubmission::STATUS_SUBMITTED)
            ->count();
        
        $stats = [
            'enrolled_courses' => $totalEnrollments,
            'completed_courses' => $completedCourses,
            'in_progress_courses' => $inProgressCourses,
            'certificates_earned' => $completedCourses, // Assuming 1 certificate per completed course
            
            'total_lessons_completed' => $totalLessonsCompleted,
            'total_quizzes_taken' => $totalQuizzesTaken,
            'total_assignments_submitted' => $totalAssignmentsSubmitted,
            
            'average_score' => round($averageQuizScore, 1),
        ];
        
        // Get enrolled courses with progress
        $enrolled_courses = Enrollment::with(['course.instructor', 'course.category', 'course.lessons'])
            ->forStudent($studentId)
            ->active()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                $progressData = $enrollment->getProgressData();
                
                return [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'instructor_name' => $enrollment->course->instructor->name,
                    'category' => $enrollment->course->category->name,
                    'progress' => $progressData['progress_percentage'],
                    'status' => $enrollment->completion_date ? 'Completed' : 'In Progress',
                    'completed_lessons' => $progressData['completed_lessons'],
                    'total_lessons' => $progressData['total_lessons'],
                    'remaining_lessons' => $progressData['remaining_lessons'],
                    'last_accessed' => $enrollment->updated_at->diffForHumans(),
                ];
            });
        
        // Get recent activity (lessons, quizzes, assignments)
        $recentLessons = LessonProgress::with(['lesson.course'])
            ->where('student_id', $studentId)
            ->where('is_completed', true)
            ->orderBy('completed_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($progress) {
                return [
                    'type' => 'lesson_completed',
                    'title' => 'Completed: ' . $progress->lesson->title,
                    'course_title' => $progress->lesson->course->title,
                    'date' => $progress->completed_at->diffForHumans(),
                    'icon' => 'CheckCircle',
                    'color' => 'green',
                ];
            });
        
        $recentQuizzes = QuizAttempt::with(['quiz.course'])
            ->where('student_id', $studentId)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($attempt) {
                return [
                    'type' => 'quiz_completed',
                    'title' => 'Quiz: ' . $attempt->quiz->title,
                    'course_title' => $attempt->quiz->course->title,
                    'date' => $attempt->completed_at->diffForHumans(),
                    'score' => round($attempt->percentage, 1),
                    'icon' => 'Target',
                    'color' => $attempt->isPassed() ? 'green' : 'red',
                ];
            });
        
        $recentAssignments = AssignmentSubmission::with(['lesson.course'])
            ->where('student_id', $studentId)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($submission) {
                return [
                    'type' => 'assignment_submitted',
                    'title' => 'Assignment: ' . $submission->lesson->title,
                    'course_title' => $submission->lesson->course->title,
                    'date' => $submission->submitted_at->diffForHumans(),
                    'score' => $submission->percentage ? round($submission->percentage, 1) : null,
                    'icon' => 'FileText',
                    'color' => $submission->isPassed() ? 'green' : ($submission->isGraded() ? 'red' : 'blue'),
                ];
            });
        
        // Combine and sort recent activity
        $recent_activity = collect()
            ->merge($recentLessons)
            ->merge($recentQuizzes)
            ->merge($recentAssignments)
            ->sortByDesc('date')
            ->take(10)
            ->values();
        
        // Get certificates (completed courses)
        $certificates = Enrollment::with('course')
            ->forStudent($studentId)
            ->whereNotNull('completion_date')
            ->orderBy('completion_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'course_title' => $enrollment->course->title,
                    'completion_date' => $enrollment->completion_date->format('M d, Y'),
                    'certificate_id' => 'CERT-' . str_pad($enrollment->id, 6, '0', STR_PAD_LEFT),
                ];
            });
        
        // Get recommended courses (published courses not enrolled in)
        $enrolledCourseIds = Enrollment::forStudent($studentId)->pluck('course_id');
        $recommended_courses = Course::published()
            ->whereNotIn('id', $enrolledCourseIds)
            ->with(['instructor', 'category'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'instructor_name' => $course->instructor->name,
                    'category' => $course->category->name,
                    'price' => $course->price,
                    'rating' => '4.5', // Placeholder
                    'students_count' => Enrollment::where('course_id', $course->id)->count(),
                ];
            });
        
        // Get learning progress for all enrolled courses
        $learning_progress = Enrollment::with(['course'])
            ->forStudent($studentId)
            ->active()
            ->get()
            ->map(function ($enrollment) {
                $progressData = $enrollment->getProgressData();
                
                return [
                    'course_id' => $enrollment->course->id,
                    'course_title' => $enrollment->course->title,
                    'progress_percentage' => $progressData['progress_percentage'],
                    'completed_lessons' => $progressData['completed_lessons'],
                    'total_lessons' => $progressData['total_lessons'],
                    'status' => $enrollment->completion_date ? 'Completed' : 'In Progress',
                ];
            });
        
        return Inertia::render('student/dashboard', [
            'stats' => $stats,
            'enrolled_courses' => $enrolled_courses,
            'recent_activity' => $recent_activity,
            'certificates' => $certificates,
            'recommended_courses' => $recommended_courses,
            'learning_progress' => $learning_progress,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
            ],
        ]);
    }
}
