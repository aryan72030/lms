<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'lesson_id',
        'enrollment_id',
        'started_at',
        'ended_at',
        'duration_minutes',
        'activity_type',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    const ACTIVITY_LESSON = 'lesson';
    const ACTIVITY_QUIZ = 'quiz';
    const ACTIVITY_ASSIGNMENT = 'assignment';

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

    public static function startSession(int $studentId, int $lessonId, int $enrollmentId, string $activityType = self::ACTIVITY_LESSON): self
    {
        return self::create([
            'student_id' => $studentId,
            'lesson_id' => $lessonId,
            'enrollment_id' => $enrollmentId,
            'started_at' => now(),
            'activity_type' => $activityType,
        ]);
    }

    public function endSession(): void
    {
        $this->update([
            'ended_at' => now(),
            'duration_minutes' => $this->started_at->diffInMinutes(now()),
        ]);
    }

    public static function getTotalLearningTime(int $studentId): int
    {
        return self::where('student_id', $studentId)
            ->whereNotNull('ended_at')
            ->sum('duration_minutes');
    }

    public static function getLearningStreak(int $studentId): int
    {
        $sessions = self::where('student_id', $studentId)
            ->whereNotNull('ended_at')
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(created_at) as date')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->toArray();

        if (empty($sessions)) {
            return 0;
        }

        $streak = 0;
        $currentDate = now()->format('Y-m-d');
        
        foreach ($sessions as $sessionDate) {
            if ($sessionDate === $currentDate || $sessionDate === now()->subDay()->format('Y-m-d')) {
                $streak++;
                $currentDate = now()->subDays($streak)->format('Y-m-d');
            } else {
                break;
            }
        }

        return $streak;
    }
}