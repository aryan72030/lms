<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonProgressController extends Controller
{
    /**
     * Mark a lesson as complete
     */
    public function markComplete(Request $request, Lesson $lesson): JsonResponse
    {
        $student = $request->user();
        
        // Verify student is enrolled in the course
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $lesson->course_id)
            ->first();
            
        if (!$enrollment || !$enrollment->isActive() || $enrollment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this course.',
            ], 403);
        }

        if ($enrollment->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Your access to this course has expired.',
            ], 403);
        }

        if (!$lesson->is_published) {
            return response()->json([
                'success' => false,
                'message' => 'This lesson is not available yet.',
            ], 403);
        }
        
        // Mark lesson as complete
        $progress = LessonProgress::markLessonComplete(
            $student->id,
            $lesson->id,
            $enrollment->id
        );
        
        // Recalculate enrollment progress
        $progressData = $enrollment->getProgressData();
        $enrollment->updateProgress($progressData['progress_percentage']);
        
        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as complete!',
            'progress' => $progressData,
            'lesson_completed' => true,
        ]);
    }
    
    /**
     * Mark a lesson as incomplete
     */
    public function markIncomplete(Request $request, Lesson $lesson): JsonResponse
    {
        $student = $request->user();
        
        // Verify student is enrolled in the course
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $lesson->course_id)
            ->first();
            
        if (!$enrollment || !$enrollment->isActive() || $enrollment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this course.',
            ], 403);
        }

        if ($enrollment->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Your access to this course has expired.',
            ], 403);
        }
        
        if (!$lesson->is_published) {
            return response()->json([
                'success' => false,
                'message' => 'This lesson is not available yet.',
            ], 403);
        }
        
        // Mark lesson as incomplete
        LessonProgress::markLessonIncomplete($student->id, $lesson->id, $enrollment->id);
        
        // Recalculate enrollment progress
        $progressData = $enrollment->getProgressData();
        $enrollment->updateProgress($progressData['progress_percentage']);
        
        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as incomplete.',
            'progress' => $progressData,
            'lesson_completed' => false,
        ]);
    }
    
    /**
     * Get progress for a specific course
     */
    public function getCourseProgress(Request $request, int $courseId): JsonResponse
    {
        $student = $request->user();
        
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $courseId)
            ->first();
            
        if (!$enrollment || !$enrollment->isActive() || $enrollment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this course.',
            ], 403);
        }
        
        $progressData = $enrollment->getProgressData();
        
        return response()->json([
            'success' => true,
            'progress' => $progressData,
        ]);
    }
    
    /**
     * Get all lesson progress for a course
     */
    public function getLessonProgress(Request $request, int $courseId): JsonResponse
    {
        $student = $request->user();
        
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('course_id', $courseId)
            ->first();
            
        if (!$enrollment || !$enrollment->isActive() || $enrollment->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this course.',
            ], 403);
        }
        
        $lessons = Lesson::where('course_id', $courseId)
            ->where('is_published', true)
            ->orderBy('order')
            ->get();
            
        $progressRecords = LessonProgress::where('student_id', $student->id)
            ->where('enrollment_id', $enrollment->id)
            ->get()
            ->keyBy('lesson_id');
            
        $lessonProgress = $lessons->map(function ($lesson) use ($progressRecords) {
            $progress = $progressRecords->get($lesson->id);
            
            return [
                'lesson_id' => $lesson->id,
                'lesson_title' => $lesson->title,
                'lesson_order' => $lesson->order,
                'is_completed' => $progress ? $progress->is_completed : false,
                'completed_at' => $progress && $progress->completed_at ? $progress->completed_at->format('Y-m-d H:i:s') : null,
                'time_spent' => $progress ? $progress->time_spent : 0,
            ];
        });
        
        return response()->json([
            'success' => true,
            'lessons' => $lessonProgress,
            'progress' => $enrollment->getProgressData(),
        ]);
    }
}
