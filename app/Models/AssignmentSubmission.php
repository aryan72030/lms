<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'lesson_id',
        'enrollment_id',
        'submission_text',
        'file_path',
        'submitted_at',
        'graded_at',
        'score',
        'max_score',
        'percentage',
        'feedback',
        'status',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'Draft';
    const STATUS_SUBMITTED = 'Submitted';
    const STATUS_GRADED = 'Graded';

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

    public function isSubmitted(): bool
    {
        return !is_null($this->submitted_at);
    }

    public function isGraded(): bool
    {
        return !is_null($this->graded_at);
    }

    public function isPassed(): bool
    {
        return $this->percentage >= 70; // 70% passing grade
    }

    public function getDueDateAttribute()
    {
        $lesson = $this->lesson;
        $dueDays = (int) ($lesson->assignment_data['due_days'] ?? 7);
        return $this->created_at->addDays($dueDays);
    }

    public function isOverdue(): bool
    {
        return now()->isAfter($this->due_date) && !$this->isSubmitted();
    }
}