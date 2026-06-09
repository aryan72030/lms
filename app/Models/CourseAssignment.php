<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'instructions',
        'assignment_type',
        'allowed_file_types',
        'max_file_size_mb',
        'max_files',
        'max_score',
        'passing_score',
        'due_days',
        'is_published',
        'order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'allowed_file_types' => 'array',
    ];

    // Relationships
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(CourseAssignmentSubmission::class);
    }

    // Student ની submission get કરો
    public function submissionFor(int $studentId): ?CourseAssignmentSubmission
    {
        return $this->submissions()->where('student_id', $studentId)->first();
    }

    // Due date calculate — enrollment date + due_days
    public function dueDateFor(Enrollment $enrollment): \Carbon\Carbon
    {
        return \Carbon\Carbon::parse($enrollment->enrollment_date)->addDays($this->due_days);
    }

    public function isOverdueFor(Enrollment $enrollment): bool
    {
        return now()->isAfter($this->dueDateFor($enrollment));
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    // Assignment type helpers
    public function isTextType(): bool
    {
        return $this->assignment_type === 'text';
    }

    public function isFileType(): bool
    {
        return $this->assignment_type === 'file';
    }

    public function isMixedType(): bool
    {
        return $this->assignment_type === 'mixed';
    }

    public function allowsFiles(): bool
    {
        return in_array($this->assignment_type, ['file', 'mixed']);
    }

    public function allowsText(): bool
    {
        return in_array($this->assignment_type, ['text', 'mixed']);
    }

    public function getDefaultAllowedFileTypes(): array
    {
        return ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip'];
    }

    public function getAllowedFileTypesAttribute($value)
    {
        return $value ? json_decode($value, true) : $this->getDefaultAllowedFileTypes();
    }

    // Auto-order on create
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($assignment) {
            if (is_null($assignment->order)) {
                $max = static::where('course_id', $assignment->course_id)->max('order');
                $assignment->order = ($max ?? 0) + 1;
            }
        });
    }
}
