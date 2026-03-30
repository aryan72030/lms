<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $instructor = $request->user();
        
        $courses = Course::where('instructor_id', $instructor->id)->pluck('id');
        
        $assignments = Lesson::whereIn('course_id', $courses)
            ->where('type', Lesson::TYPE_ASSIGNMENT)
            ->with(['course'])
            ->get()
            ->map(function ($lesson) {
                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'course_title' => $lesson->course->title,
                    'submissions_count' => AssignmentSubmission::where('lesson_id', $lesson->id)->count(),
                    'pending_count' => AssignmentSubmission::where('lesson_id', $lesson->id)
                        ->where('status', AssignmentSubmission::STATUS_SUBMITTED)
                        ->count(),
                ];
            });

        return Inertia::render('instructor/assignments/index', [
            'assignments' => $assignments,
        ]);
    }

    public function show(Request $request, Lesson $lesson): Response
    {
        $instructor = $request->user();
        
        if ($lesson->course->instructor_id !== $instructor->id) {
            abort(403);
        }

        $submissions = AssignmentSubmission::with(['student'])
            ->where('lesson_id', $lesson->id)
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(function ($submission) {
                return [
                    'id' => $submission->id,
                    'student_name' => $submission->student->name,
                    'submitted_at' => $submission->submitted_at?->format('M d, Y H:i'),
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'max_score' => $submission->max_score,
                    'file_path' => $submission->file_path,
                    'submission_text' => $submission->submission_text,
                    'feedback' => $submission->feedback,
                ];
            });

        return Inertia::render('instructor/assignments/show', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'course_title' => $lesson->course->title,
                'assignment_data' => $lesson->assignment_data,
            ],
            'submissions' => $submissions,
        ]);
    }

    public function grade(Request $request, AssignmentSubmission $submission)
    {
        $instructor = $request->user();
        
        if ($submission->lesson->course->instructor_id !== $instructor->id) {
            abort(403);
        }

        $request->validate([
            'score' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        $maxScore = $submission->lesson->assignment_data['max_score'] ?? 100;
        $percentage = ($request->score / $maxScore) * 100;

        $submission->update([
            'score' => $request->score,
            'max_score' => $maxScore,
            'percentage' => $percentage,
            'feedback' => $request->feedback,
            'status' => AssignmentSubmission::STATUS_GRADED,
            'graded_at' => now(),
        ]);

        return back()->with('success', 'Assignment graded successfully!');
    }
}
