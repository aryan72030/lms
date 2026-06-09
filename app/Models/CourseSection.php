<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseSection extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'order',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'section_id')->orderBy('order');
    }

    public function moveUp(): bool
    {
        $previousSection = static::where('course_id', $this->course_id)
            ->where('order', '<', $this->order)
            ->orderBy('order', 'desc')
            ->first();

        if (!$previousSection) {
            return false;
        }

        $this->swapOrder($previousSection);
        return true;
    }

    public function moveDown(): bool
    {
        $nextSection = static::where('course_id', $this->course_id)
            ->where('order', '>', $this->order)
            ->orderBy('order', 'asc')
            ->first();

        if (!$nextSection) {
            return false;
        }

        $this->swapOrder($nextSection);
        return true;
    }

    private function swapOrder(CourseSection $otherSection): void
    {
        $tempOrder = $this->order;
        $this->update(['order' => $otherSection->order]);
        $otherSection->update(['order' => $tempOrder]);
    }
}
