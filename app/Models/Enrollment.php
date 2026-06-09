<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    // Payment status constants
    const PAYMENT_STATUS_FREE = 'Free';
    const PAYMENT_STATUS_PENDING = 'Pending';
    const PAYMENT_STATUS_COMPLETED = 'Completed';
    const PAYMENT_STATUS_FAILED = 'Failed';

    // Payment method constants
    const METHOD_PAYPAL = 'PayPal';
    const METHOD_FREE = 'Free';

    // Status constants
    const STATUS_ACTIVE = 'Active';
    const STATUS_INACTIVE = 'Inactive';
    const STATUS_CANCELLED = 'Cancelled';
    const STATUS_REFUNDED = 'Refunded';
    const STATUS_REFUND_REQUESTED = 'Refund Requested';

    // Refund Status
    const PAYMENT_STATUS_REFUNDED = 'Refunded';

    protected $fillable = [
        'student_id',
        'course_id',
        'enrollment_date',
        'payment_status',
        'payment_method',
        'status',
        'progress',
        'completion_date',
        'expiry_date',
        'notes',
        'transaction_id',
        'amount_paid',
        'refund_id',
        'refund_amount',
        'refunded_at',
        'refund_count',
    ];

    protected $casts = [
        'enrollment_date' => 'datetime',
        'completion_date' => 'datetime',
        'expiry_date' => 'datetime',
        'refunded_at' => 'datetime',
        'progress' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'refund_count' => 'integer',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Status helper methods
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isFree(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_FREE;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_COMPLETED;
    }

    public function isPending(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PENDING;
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function resetForReEnrollment(string $reason = ''): void
    {
        // Clear lesson progress
        $this->lessonProgress()->delete();

        // Clear quiz attempts
        $this->quizAttempts()->delete();

        // Reset enrollment fields - status will be set by caller
        $this->updateQuietly([
            'completion_date' => null,
            'progress'        => 0,
            'expiry_date'     => null,
            'transaction_id'  => null,
            'notes'           => ($this->notes ? $this->notes . "\n" : '') .
                                 'Re-enrolled on ' . now()->format('Y-m-d') .
                                 ($reason ? '. Reason: ' . $reason : ''),
        ]);

        // Refresh model to avoid stale data
        $this->refresh();
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    // Progress methods
    public function calculateProgress(): float
    {
        $totalLessons = $this->course->lessons()->published()->count();
        
        if ($totalLessons === 0) {
            return 0.00;
        }
        
        $completedLessons = $this->lessonProgress()
            ->where('is_completed', true)
            ->count();
        
        $progress = round(($completedLessons / $totalLessons) * 100, 2);
        
        // Update the progress field in enrollment
        $this->updateQuietly(['progress' => $progress]);
        
        return $progress;
    }

    public function isCompleted(): bool
    {
        // Course is completed only if student passed the final quiz
        $finalQuiz = $this->course->getFinalQuiz();
        
        if (!$finalQuiz) {
            return false; // No final quiz means course cannot be completed
        }
        
        return $this->quizAttempts()
            ->where('quiz_id', $finalQuiz->id)
            ->where('is_passed', true)
            ->exists();
    }

    public function hasPassedFinalQuiz(): bool
    {
        return $this->isCompleted();
    }

    public function getFinalQuizAttempt(): ?QuizAttempt
    {
        $finalQuiz = $this->course->getFinalQuiz();
        
        if (!$finalQuiz) {
            return null;
        }
        
        return $this->quizAttempts()
            ->where('quiz_id', $finalQuiz->id)
            ->where('is_passed', true)
            ->orderBy('percentage', 'desc')
            ->first();
    }

    public function getProgressData(): array
    {
        $totalLessons = $this->course->lessons()->published()->count();
        $completedLessons = $this->lessonProgress()
            ->where('is_completed', true)
            ->count();
        
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;
        
        return [
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'progress_percentage' => $progressPercentage,
            'remaining_lessons' => $totalLessons - $completedLessons,
        ];
    }

    public function updateProgress(float $progress): bool
    {
        $this->progress = min(100.00, max(0.00, $progress));
        
        // Removed automatic completion based on progress. 
        // Completion now requires passing the final exam.
        
        return $this->save();
    }

    // Payment methods
    public function markAsPaid(string $transactionId, float $amount): bool
    {
        $this->loadMissing('course'); // Ensure course relationship is loaded

        $this->payment_status = self::PAYMENT_STATUS_COMPLETED;
        $this->transaction_id = $transactionId;
        $this->amount_paid = $amount;
        $this->status = self::STATUS_ACTIVE;
        
        // Set expiry date if course has duration
        if ($this->course && $this->course->access_duration > 0) {
            $this->expiry_date = now()->addDays($this->course->access_duration);
        } else {
            $this->expiry_date = null; // Explicitly set to null for lifetime access
        }

        return $this->save();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where('payment_status', '!=', self::PAYMENT_STATUS_PENDING);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    // Validation methods
    public static function canEnroll(int $studentId, int $courseId): bool
    {
        $existing = static::where('student_id', $studentId)
            ->where('course_id', $courseId)
            ->first();

        if (!$existing) return true;

        return $existing->isExpired() ||
               in_array($existing->status, [self::STATUS_CANCELLED, self::STATUS_REFUNDED, self::STATUS_INACTIVE]);
    }

    public static function createEnrollment(int $studentId, int $courseId, float $coursePrice = 0): self
    {
        $course = Course::findOrFail($courseId);
        $enrollment = new static([
            'student_id' => $studentId,
            'course_id' => $courseId,
            'enrollment_date' => now(),
        ]);

        if ($coursePrice > 0) {
            $enrollment->payment_status = self::PAYMENT_STATUS_PENDING;
            $enrollment->payment_method = self::METHOD_PAYPAL;
            $enrollment->status = self::STATUS_INACTIVE;
            $enrollment->amount_paid = $coursePrice;
        } else {
            $enrollment->payment_status = self::PAYMENT_STATUS_FREE;
            $enrollment->payment_method = self::METHOD_FREE;
            $enrollment->status = self::STATUS_ACTIVE;
            
            // Set expiry date if course has duration
            if ($course->access_duration > 0) {
                $enrollment->expiry_date = now()->addDays($course->access_duration);
            }
        }

        $enrollment->save();
        return $enrollment;
    }

    // Status and payment status helper methods
    public function getStatusLabel(): string
    {
        if (!is_null($this->completion_date)) {
            return 'Completed';
        }

        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_REFUNDED => 'Refunded',
            self::STATUS_REFUND_REQUESTED => 'Refund Requested',
            default => ucfirst((string) $this->status),
        };
    }

    public function getStatusColor(): string
    {
        if (!is_null($this->completion_date)) {
            return 'blue';
        }

        return match ($this->status) {
            self::STATUS_ACTIVE => 'green',
            self::STATUS_INACTIVE => 'gray',
            self::STATUS_CANCELLED => 'red',
            self::STATUS_REFUNDED => 'purple',
            self::STATUS_REFUND_REQUESTED => 'orange',
            default => 'gray',
        };
    }

    public function getPaymentStatusLabel(): string
    {
        return match($this->payment_status) {
            self::PAYMENT_STATUS_FREE => 'Free',
            self::PAYMENT_STATUS_PENDING => 'Pending',
            self::PAYMENT_STATUS_COMPLETED => 'Completed',
            self::PAYMENT_STATUS_FAILED => 'Failed',
            default => ucfirst($this->payment_status),
        };
    }

    public function getPaymentStatusColor(): string
    {
        return match($this->payment_status) {
            self::PAYMENT_STATUS_FREE => 'blue',
            self::PAYMENT_STATUS_PENDING => 'yellow',
            self::PAYMENT_STATUS_COMPLETED => 'green',
            self::PAYMENT_STATUS_FAILED => 'red',
            default => 'gray',
        };
    }
}
