<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    use HasFactory;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'student_id',
        'lesson_id',
        'enrollment_id',
        'is_completed',
        'completed_at',
        'time_spent',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    // Helper methods
    public function markAsCompleted(): bool
    {
        $this->is_completed = true;
        $this->completed_at = now();
        return $this->save();
    }

    public function markAsIncomplete(): bool
    {
        $this->is_completed = false;
        $this->completed_at = null;
        return $this->save();
    }

    // Static methods
    public static function markLessonComplete(int $studentId, int $lessonId, int $enrollmentId): self
    {
        $progress = static::firstOrCreate([
            'student_id' => $studentId,
            'lesson_id' => $lessonId,
            'enrollment_id' => $enrollmentId,
        ]);

        if (!$progress->is_completed) {
            $progress->markAsCompleted();
        }

        return $progress;
    }

    public static function markLessonIncomplete(int $studentId, int $lessonId, ?int $enrollmentId = null): bool
    {
        $progress = static::where('student_id', $studentId)
            ->where('lesson_id', $lessonId)
            ->when($enrollmentId, fn ($q) => $q->where('enrollment_id', $enrollmentId))
            ->first();

        if ($progress) {
            return $progress->markAsIncomplete();
        }

        return false;
    }

    public static function getStudentProgress(int $studentId, int $courseId): array
    {
        $enrollment = Enrollment::where('student_id', $studentId)
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollment) {
            return [
                'total_lessons' => 0,
                'completed_lessons' => 0,
                'progress_percentage' => 0,
            ];
        }

        $totalLessons = Lesson::where('course_id', $courseId)
            ->where('is_published', true)
            ->count();

        $completedLessons = static::where('student_id', $studentId)
            ->where('enrollment_id', $enrollment->id)
            ->where('is_completed', true)
            ->count();

        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;

        return [
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'progress_percentage' => $progressPercentage,
        ];
    }
}
