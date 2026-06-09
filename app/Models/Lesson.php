<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lesson extends Model
{
    use HasFactory, SoftDeletes;

    // Lesson type constants
    const TYPE_TEXT  = 'Text';
    const TYPE_VIDEO = 'Video';

    protected $fillable = [
        'title',
        'description',
        'type',
        'order',
        'is_published',
        'course_id',
        'section_id',
        'text_content',
        'video_url',
        'video_duration',
        'estimated_duration',
        'resources',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'resources' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-assign order when creating new lesson
        static::creating(function ($lesson) {
            if (is_null($lesson->order)) {
                $maxOrder = static::where('course_id', $lesson->course_id)
                    ->when($lesson->section_id, function($q) use ($lesson) {
                        return $q->where('section_id', $lesson->section_id);
                    }, function($q) {
                        return $q->whereNull('section_id');
                    })
                    ->max('order');
                $lesson->order = ($maxOrder ?? 0) + 1;
            }
        });
    }

    // Relationships
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }



    // Type helper methods
    public function isText(): bool
    {
        return $this->type === self::TYPE_TEXT;
    }

    public function isVideo(): bool
    {
        return $this->type === self::TYPE_VIDEO;
    }

    // Content helper methods
    public function getContentAttribute()
    {
        return match($this->type) {
            self::TYPE_TEXT  => $this->text_content,
            self::TYPE_VIDEO => ['url' => $this->video_url, 'duration' => $this->video_duration],
            default          => null,
        };
    }

    public function getTypeIconAttribute(): string
    {
        return match($this->type) {
            self::TYPE_TEXT => 'FileText',
            self::TYPE_VIDEO => 'Play',
            default => 'FileText',
        };
    }

    public function getTypeColorAttribute(): string
    {
        return match($this->type) {
            self::TYPE_TEXT => 'blue',
            self::TYPE_VIDEO => 'red',
            default => 'gray',
        };
    }

    public function getDurationDisplayAttribute(): string
    {
        if ($this->estimated_duration <= 0) {
            return 'No duration set';
        }

        $hours = intval($this->estimated_duration / 60);
        $minutes = $this->estimated_duration % 60;

        if ($hours > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }

        return $minutes . 'm';
    }

    // Ordering methods
    public function moveUp(): bool
    {
        $previousLesson = static::where('course_id', $this->course_id)
            ->where('section_id', $this->section_id)
            ->where('order', '<', $this->order)
            ->orderBy('order', 'desc')
            ->first();

        if (!$previousLesson) {
            return false;
        }

        $this->swapOrder($previousLesson);
        return true;
    }

    public function moveDown(): bool
    {
        $nextLesson = static::where('course_id', $this->course_id)
            ->where('section_id', $this->section_id)
            ->where('order', '>', $this->order)
            ->orderBy('order', 'asc')
            ->first();

        if (!$nextLesson) {
            return false;
        }

        $this->swapOrder($nextLesson);
        return true;
    }

    public function moveTo(int $newOrder): bool
    {
        if ($newOrder === $this->order) {
            return true;
        }

        $lessons = static::where('course_id', $this->course_id)
            ->where('id', '!=', $this->id)
            ->orderBy('order')
            ->get();

        // Reorder all lessons
        $currentOrder = 1;
        foreach ($lessons as $lesson) {
            if ($currentOrder === $newOrder) {
                $currentOrder++; // Skip the position for current lesson
            }
            $lesson->update(['order' => $currentOrder]);
            $currentOrder++;
        }

        // Update current lesson order
        $this->update(['order' => $newOrder]);
        return true;
    }

    private function swapOrder(Lesson $otherLesson): void
    {
        $tempOrder = $this->order;
        $this->update(['order' => $otherLesson->order]);
        $otherLesson->update(['order' => $tempOrder]);
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

    public function scopeForCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Validation methods
    public function validateContent(): array
    {
        $errors = [];

        switch ($this->type) {
            case self::TYPE_TEXT:
                if (empty($this->text_content)) {
                    $errors[] = 'Text content is required for text lessons.';
                }
                break;

            case self::TYPE_VIDEO:
                if (empty($this->video_url)) {
                    $errors[] = 'Video URL is required for video lessons.';
                }
                break;

        }

        return $errors;
    }

    // Static helper methods
    public static function getTypes(): array
    {
        return [
            self::TYPE_TEXT,
            self::TYPE_VIDEO,
        ];
    }

    public static function reorderLessons(int $courseId, array $lessonIds): bool
    {
        try {
            foreach ($lessonIds as $index => $lessonId) {
                static::where('id', $lessonId)
                    ->where('course_id', $courseId)
                    ->update(['order' => $index + 1]);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}