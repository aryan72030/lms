<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class CourseAssignmentSubmission extends Model
{
    use HasFactory;

    protected $table = 'course_assignment_submissions';

    const STATUS_DRAFT     = 'Draft';
    const STATUS_SUBMITTED = 'Submitted';
    const STATUS_GRADED    = 'Graded';
    const STATUS_REJECTED  = 'Rejected';

    protected $fillable = [
        'course_assignment_id',
        'student_id',
        'enrollment_id',
        'submission_text',
        'file_path',
        'file_original_name',
        'files',
        'status',
        'score',
        'percentage',
        'feedback',
        'submitted_at',
        'graded_at',
        'resubmission_count',
        'last_reopened_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'graded_at'    => 'datetime',
        'last_reopened_at' => 'datetime',
        'files'        => 'array',
    ];

    // Relationships
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(CourseAssignment::class, 'course_assignment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    // Status helpers
    public function isDraft(): bool     { return $this->status === self::STATUS_DRAFT; }
    public function isSubmitted(): bool { return in_array($this->status, [self::STATUS_SUBMITTED, self::STATUS_GRADED]); }
    public function isGraded(): bool    { return $this->status === self::STATUS_GRADED; }
    public function isRejected(): bool  { return $this->status === self::STATUS_REJECTED; }

    public function isPassed(): bool
    {
        return $this->isGraded() && $this->percentage >= $this->assignment->passing_score;
    }

    public function passed(): bool
    {
        return $this->isPassed();
    }

    public function isOverdue(): bool
    {
        if (!$this->due_date) {
            return false;
        }
        return $this->due_date->isPast() && !$this->isSubmitted();
    }

    public function getDueDateAttribute()
    {
        if (!$this->enrollment || !$this->assignment) {
            return null;
        }
        
        return $this->enrollment->enrollment_date->addDays($this->assignment->due_days);
    }

    public function getMaxScoreAttribute()
    {
        return $this->assignment ? $this->assignment->max_score : 0;
    }

    // Submit
    public function submit(): bool
    {
        $this->status       = self::STATUS_SUBMITTED;
        $this->submitted_at = now();
        
        // Increment resubmission count if this is a resubmission
        if ($this->last_reopened_at) {
            $this->resubmission_count = ($this->resubmission_count ?? 0) + 1;
        }
        
        return $this->save();
    }

    // Reopen for editing
    public function reopen(): bool
    {
        $this->status = self::STATUS_DRAFT;
        $this->submitted_at = null;
        $this->last_reopened_at = now();
        return $this->save();
    }

    // Clear grading data
    public function clearGrade(): bool
    {
        $this->score = null;
        $this->percentage = null;
        $this->feedback = null;
        $this->graded_at = null;
        $this->status = self::STATUS_DRAFT;
        return $this->save();
    }

    // Reject submission
    public function reject(?string $feedback = null): bool
    {
        $this->status = self::STATUS_REJECTED;
        $this->feedback = $feedback;
        $this->score = null;      // Clear existing score
        $this->percentage = null; // Clear existing percentage
        $this->graded_at = null;  // A rejected submission is not 'graded', so clear this timestamp.
        $this->submitted_at = null; // Clear submitted_at to allow a fresh resubmission.
        $this->last_reopened_at = now(); // Mark that it was effectively 'reopened' by rejection for the student.

        $saved = $this->save();

        if ($saved) {
            // TODO: Implement notification logic here (e.g., dispatch an event or send an email to the student)
            // This would inform the student about the rejection and the feedback, prompting them to take action.
            // Example: SubmissionRejected::dispatch($this, $feedback);
        }

        return $saved;
    }

    // Grade
    public function grade(int $score, ?string $feedback = null): bool
    {
        $maxScore         = $this->assignment->max_score;
        $this->score      = min($score, $maxScore);
        $this->percentage = $maxScore > 0 ? round(($this->score / $maxScore) * 100, 2) : 0;
        $this->feedback   = $feedback;
        $this->status     = self::STATUS_GRADED;
        $this->graded_at  = now();
        return $this->save();
    }

    // File helpers
    public function hasFiles(): bool
    {
        return !empty($this->files) || !empty($this->file_path);
    }

    public function getAllFiles(): array
    {
        $files = [];
        
        // Add new multiple files
        if (!empty($this->files) && is_array($this->files)) {
            foreach ($this->files as $file) {
                try {
                    // Handle both array and object formats
                    $filePath = is_array($file) ? ($file['path'] ?? null) : (is_object($file) ? $file->path : null);
                    $originalName = is_array($file) ? ($file['original_name'] ?? null) : (is_object($file) ? $file->original_name : null);
                    $size = is_array($file) ? ($file['size'] ?? null) : (is_object($file) ? ($file->size ?? null) : null);
                    $mimeType = is_array($file) ? ($file['mime_type'] ?? null) : (is_object($file) ? ($file->mime_type ?? null) : null);
                    
                    // Skip if path is missing
                    if (empty($filePath) || !is_string($filePath)) {
                        continue;
                    }
                    
                    $files[] = [
                        'path' => $filePath,
                        'original_name' => $originalName ?: 'Unknown File',
                        'url' => null, // Will be generated in controller
                        'size' => $size,
                        'mime_type' => $mimeType,
                    ];
                } catch (\Exception $e) {
                    // Skip corrupted file entries
                    Log::warning('Corrupted file entry in submission ' . $this->id . ': ' . json_encode($file));
                    continue;
                }
            }
        }
        
        // Add legacy single file
        if (!empty($this->file_path) && !empty($this->file_original_name) && is_string($this->file_path)) {
            $files[] = [
                'path' => $this->file_path,
                'original_name' => $this->file_original_name,
                'url' => null // Will be generated in controller
            ];
        }
        
        return $files;
    }
}
