<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quiz extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'course_id',
        'time_limit',
        'total_marks',
        'passing_score',
        'max_attempts',
        'is_final_quiz',
        'is_active',
        'order',
        'settings',
    ];

    protected $casts = [
        'passing_score' => 'decimal:2',
        'is_final_quiz' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-assign order when creating new quiz
        static::creating(function ($quiz) {
            if (is_null($quiz->order)) {
                $maxOrder = static::where('course_id', $quiz->course_id)->max('order');
                $quiz->order = ($maxOrder ?? 0) + 1;
            }
        });

        // Update total marks when questions change
        static::saved(function ($quiz) {
            $quiz->updateTotalMarks();
        });

        // Cleanup associated questions when quiz is deleted
        static::deleting(function ($quiz) {
            if ($quiz->isForceDeleting()) {
                $quiz->questions()->forceDelete();
            } else {
                $quiz->questions()->delete();
            }
        });
    }

    // Relationships
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'quiz_id');
    }

    public function activeQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->where('is_active', true)->orderBy('order');
    }

    // Helper methods
    public function updateTotalMarks(): void
    {
        $totalMarks = $this->activeQuestions()->sum('points');
        if ($this->total_marks !== $totalMarks) {
            $this->updateQuietly(['total_marks' => $totalMarks]);
        }
    }

    public function getPassingMarks(): float
    {
        return ($this->total_marks * $this->passing_score) / 100;
    }

    public function isTimeLimited(): bool
    {
        return !is_null($this->time_limit) && $this->time_limit > 0;
    }

    public function canStudentAttempt(int $studentId): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Check if student has already passed
        if ($this->hasStudentPassed($studentId)) {
            return false;
        }

        $maxAttempts = $this->max_attempts > 0 ? $this->max_attempts : 1;
        if ($this->getStudentAttemptCount($studentId) >= $maxAttempts) {
            return false;
        }

        return true;
    }

    public function getStudentAttemptCount(int $studentId): int
    {
        return $this->attempts()
            ->where('student_id', $studentId)
            ->where('status', 'completed')
            ->count();
    }

    public function getStudentBestScore(int $studentId): ?QuizAttempt
    {
        return $this->attempts()
            ->where('student_id', $studentId)
            ->where('status', 'completed')
            ->orderBy('percentage', 'desc')
            ->first();
    }

    public function hasStudentPassed(int $studentId): bool
    {
        return $this->attempts()
            ->where('student_id', $studentId)
            ->where('is_passed', true)
            ->exists();
    }

    public function getStudentPassedAttempt(int $studentId): ?QuizAttempt
    {
        return $this->attempts()
            ->where('student_id', $studentId)
            ->where('is_passed', true)
            ->orderBy('percentage', 'desc')
            ->first();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFinalQuizzes($query)
    {
        return $query->where('is_final_quiz', true);
    }

    public function scopeForCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    // Static methods
    public static function getFinalQuizForCourse(int $courseId): ?self
    {
        return static::where('course_id', $courseId)
            ->where('is_final_quiz', true)
            ->where('is_active', true)
            ->first();
    }

    public static function createFinalQuiz(int $courseId, array $data): self
    {
        // Ensure only one final quiz per course
        static::where('course_id', $courseId)
            ->update(['is_final_quiz' => false]);

        return static::create([
            ...$data,
            'course_id' => $courseId,
            'is_final_quiz' => true,
            'is_active' => true,
        ]);
    }

    // Validation methods
    public function hasQuestions(): bool
    {
        return $this->activeQuestions()->count() > 0;
    }

    public function isReadyForStudents(): bool
    {
        return $this->is_active && $this->hasQuestions() && $this->total_marks > 0;
    }

    public function scopeReadyForStudents($query)
    {
        return $query
            ->where('is_active', true)
            ->where('total_marks', '>', 0)
            ->whereHas('questions', function ($q) {
                $q->where('is_active', true);
            });
    }

    public function validateQuizData(): array
    {
        $errors = [];

        if (!$this->hasQuestions()) {
            $errors[] = 'Quiz must have at least one question.';
        }

        if ($this->total_marks <= 0) {
            $errors[] = 'Quiz must have a total marks greater than 0.';
        }

        if ($this->passing_score < 0 || $this->passing_score > 100) {
            $errors[] = 'Passing score must be between 0 and 100.';
        }

        if ($this->max_attempts <= 0) {
            $errors[] = 'Maximum attempts must be greater than 0.';
        }

        return $errors;
    }

    // Statistics methods
    public function getAttemptStatistics(): array
    {
        $totalAttemptsAll = $this->attempts()->count();
        $totalCompleted = $this->attempts()->where('status', 'completed')->count();
        $passedCompleted = $this->attempts()->where('status', 'completed')->where('is_passed', true)->count();
        $failedCompleted = $this->attempts()->where('status', 'completed')->where('is_passed', false)->count();

        $completionRate = $totalAttemptsAll > 0 ? ($totalCompleted / $totalAttemptsAll) * 100 : 0;
        $passRate = $totalCompleted > 0 ? ($passedCompleted / $totalCompleted) * 100 : 0;

        return [
            'total_attempts' => $totalCompleted,
            'passed_attempts' => $passedCompleted,
            'failed_attempts' => $failedCompleted,
            'average_score' => round($this->attempts()->where('status', 'completed')->avg('percentage') ?? 0, 2),
            'highest_score' => $this->attempts()->where('status', 'completed')->max('percentage') ?? 0,
            'lowest_score' => $this->attempts()->where('status', 'completed')->min('percentage') ?? 0,
            'completion_rate' => round($completionRate, 2),
            'pass_rate' => round($passRate, 2),
        ];
    }
}
