<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    // Status constants
    const STATUS_DRAFT = 'Draft';
    const STATUS_REVIEW = 'Review';
    const STATUS_PUBLISHED = 'Published';
    const STATUS_ARCHIVED = 'Archived';

    // Difficulty levels
    const DIFFICULTY_BEGINNER = 'Beginner';
    const DIFFICULTY_INTERMEDIATE = 'Intermediate';
    const DIFFICULTY_ADVANCED = 'Advanced';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'objectives',
        'requirements',
        'target_audience',
        'thumbnail',
        'language',
        'price',
        'access_duration',
        'duration_hours',
        'difficulty_level',
        'status',
        'instructor_id',
        'category_id',
        'approved_by',
        'rejection_reason',
        'submitted_at',
        'approved_at',
        'published_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'objectives' => 'array',
        'requirements' => 'array',
        'target_audience' => 'array',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($course) {
            if (empty($course->slug)) {
                $course->slug = static::generateUniqueSlug($course->title);
            }
        });

        static::updating(function ($course) {
            if ($course->isDirty('title')) {
                $course->slug = static::generateUniqueSlug($course->title, $course->id);
            }
        });
    }

    /**
     * Generate a unique slug for the course
     */
    private static function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (static::withTrashed()->where('slug', $slug)
            ->when($excludeId, fn($query) => $query->where('id', '!=', $excludeId))
            ->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    // Relationships
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CourseCategory::class, 'category_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->ordered();
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(CourseReview::class);
    }

    public function averageRating()
    {
        return $this->reviews()->avg('rating') ?: 0;
    }

    public function reviewsCount()
    {
        return $this->reviews()->count();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class)->orderBy('order');
    }

    public function publishedAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class)->where('is_published', true)->orderBy('order');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class)->ordered();
    }

    public function activeQuizzes(): HasMany
    {
        return $this->hasMany(Quiz::class)->where('is_active', true)->ordered();
    }

    public function finalQuiz(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Quiz::class)->where('is_final_quiz', true)->where('is_active', true);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'enrollments', 'course_id', 'student_id')
                    ->withPivot(['enrollment_date', 'payment_status', 'status', 'progress', 'completion_date'])
                    ->withTimestamps();
    }

    // Status helper methods
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isInReview(): bool
    {
        return $this->status === self::STATUS_REVIEW;
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    public function canBeEdited(): bool
    {
        // Allow editing of all courses except archived ones
        return !$this->isArchived();
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_REVIEW;
    }

    public function canBePublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function canBeRepublished(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    // Workflow methods
    public function submitForReview(): bool
    {
        if (!$this->canBeSubmitted()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_REVIEW,
            'submitted_at' => now(),
        ]);

        return true;
    }

    public function autoApprove(): bool
    {
        if (!$this->canBeSubmitted()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'approved_at' => now(),
            'published_at' => now(),
            'rejection_reason' => null,
            'submitted_at' => now(),
        ]);

        return true;
    }

    public function approve(User $admin): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'published_at' => now(),
            'rejection_reason' => null,
        ]);

        return true;
    }

    public function reject(User $admin, string $reason): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_DRAFT,
            'approved_by' => $admin->id,
            'rejection_reason' => $reason,
            'submitted_at' => null,
        ]);

        return true;
    }

    public function archive(): bool
    {
        if (!$this->isPublished()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_ARCHIVED,
        ]);

        return true;
    }

    public function republish(User $admin): bool
    {
        if (!$this->isArchived()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'approved_by' => $admin->id,
            'published_at' => now(),
        ]);

        return true;
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeInReview($query)
    {
        return $query->where('status', self::STATUS_REVIEW);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    public function scopeForInstructor($query, $instructorId)
    {
        return $query->where('instructor_id', $instructorId);
    }

    // Validation methods
    public function hasMinimumContent(): bool
    {
        return $this->lessons()->count() >= 1;
    }

    public function hasPublishedLessons(): bool
    {
        return $this->lessons()->published()->count() > 0;
    }

    public function hasFinalQuiz(): bool
    {
        return $this->finalQuiz()->exists();
    }

    public function getFinalQuiz(): ?Quiz
    {
        return $this->finalQuiz()->first();
    }

    public function getContentCompletionPercentage(): int
    {
        $totalLessons = $this->lessons()->count();
        if ($totalLessons === 0) return 0;
        
        $publishedLessons = $this->lessons()->published()->count();
        return (int) round(($publishedLessons / $totalLessons) * 100);
    }

    public function canBeSubmittedForReview(): bool
    {
        $requireFinalQuiz = Setting::get('require_final_quiz', true);
        
        return $this->canBeSubmitted() && 
               $this->hasMinimumContent() && 
               $this->hasPublishedLessons() &&
               (!$requireFinalQuiz || $this->hasFinalQuiz());
    }
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_REVIEW => 'Under Review',
            self::STATUS_PUBLISHED => 'Published',
            self::STATUS_ARCHIVED => 'Archived',
            default => $this->status,
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_REVIEW => 'yellow',
            self::STATUS_PUBLISHED => 'green',
            self::STATUS_ARCHIVED => 'red',
            default => 'gray',
        };
    }
}
