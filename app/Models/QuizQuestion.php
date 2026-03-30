<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuizQuestion extends Model
{
    use HasFactory, SoftDeletes;

    // Question type constants
    const TYPE_MULTIPLE_CHOICE = 'multiple_choice';
    const TYPE_TRUE_FALSE = 'true_false';
    const TYPE_SHORT_ANSWER = 'short_answer';

    protected $fillable = [
        'quiz_id',
        'question_text',
        'question_type',
        'options',
        'correct_answer',
        'explanation',
        'points',
        'order',
        'is_active',
    ];

    protected $casts = [
        'options' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        // Auto-assign order when creating new question
        static::creating(function ($question) {
            if (is_null($question->order)) {
                $maxOrder = static::where('quiz_id', $question->quiz_id)->max('order');
                $question->order = ($maxOrder ?? 0) + 1;
            }
        });

        // Update quiz total marks when question is saved or deleted
        static::saved(function ($question) {
            $question->quiz->updateTotalMarks();
        });

        static::deleted(function ($question) {
            $question->quiz->updateTotalMarks();
        });
    }

    // Relationships
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    // Type helper methods
    public function isMultipleChoice(): bool
    {
        return $this->question_type === self::TYPE_MULTIPLE_CHOICE;
    }

    public function isTrueFalse(): bool
    {
        return $this->question_type === self::TYPE_TRUE_FALSE;
    }

    public function isShortAnswer(): bool
    {
        return $this->question_type === self::TYPE_SHORT_ANSWER;
    }

    // Answer validation methods
    public function isCorrectAnswer(string $answer): bool
    {
        if ($this->isShortAnswer()) {
            // For short answer, do case-insensitive comparison
            return strtolower(trim($answer)) === strtolower(trim($this->correct_answer));
        }

        // For multiple choice and true/false, exact match
        return trim($answer) === trim($this->correct_answer);
    }

    public function getFormattedOptions(): array
    {
        if (!$this->isMultipleChoice()) {
            return [];
        }

        $options = $this->options ?? [];
        
        // Ensure we have proper option structure
        if (empty($options)) {
            return [];
        }

        // If options are already in the correct format, return them
        if (isset($options[0]) && is_array($options[0]) && isset($options[0]['key'])) {
            return $options;
        }

        // Convert old format to new format
        $formattedOptions = [];
        $keys = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        foreach ($options as $index => $option) {
            if (is_string($option) && !empty(trim($option))) {
                $formattedOptions[] = [
                    'key' => $keys[$index] ?? chr(65 + $index),
                    'text' => trim($option),
                ];
            }
        }

        return $formattedOptions;
    }

    public function getTrueFalseOptions(): array
    {
        return [
            ['key' => 'True', 'text' => 'True'],
            ['key' => 'False', 'text' => 'False'],
        ];
    }

    // Ordering methods
    public function moveUp(): bool
    {
        $previousQuestion = static::where('quiz_id', $this->quiz_id)
            ->where('order', '<', $this->order)
            ->orderBy('order', 'desc')
            ->first();

        if (!$previousQuestion) {
            return false;
        }

        $this->swapOrder($previousQuestion);
        return true;
    }

    public function moveDown(): bool
    {
        $nextQuestion = static::where('quiz_id', $this->quiz_id)
            ->where('order', '>', $this->order)
            ->orderBy('order', 'asc')
            ->first();

        if (!$nextQuestion) {
            return false;
        }

        $this->swapOrder($nextQuestion);
        return true;
    }

    private function swapOrder(QuizQuestion $otherQuestion): void
    {
        $tempOrder = $this->order;
        $this->update(['order' => $otherQuestion->order]);
        $otherQuestion->update(['order' => $tempOrder]);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('question_type', $type);
    }

    // Validation methods
    public function validateQuestion(): array
    {
        $errors = [];

        if (empty(trim($this->question_text))) {
            $errors[] = 'Question text is required.';
        }

        if ($this->points <= 0) {
            $errors[] = 'Points must be greater than 0.';
        }

        switch ($this->question_type) {
            case self::TYPE_MULTIPLE_CHOICE:
                $options = $this->getFormattedOptions();
                if (count($options) < 2) {
                    $errors[] = 'Multiple choice questions must have at least 2 options.';
                }
                
                $validKeys = array_column($options, 'key');
                if (!in_array($this->correct_answer, $validKeys)) {
                    $errors[] = 'Correct answer must match one of the option keys.';
                }
                break;

            case self::TYPE_TRUE_FALSE:
                if (!in_array($this->correct_answer, ['True', 'False'])) {
                    $errors[] = 'True/False questions must have "True" or "False" as correct answer.';
                }
                break;

            case self::TYPE_SHORT_ANSWER:
                if (empty(trim($this->correct_answer))) {
                    $errors[] = 'Short answer questions must have a correct answer.';
                }
                break;
        }

        return $errors;
    }

    // Static methods
    public static function getTypes(): array
    {
        return [
            self::TYPE_MULTIPLE_CHOICE,
            self::TYPE_TRUE_FALSE,
            self::TYPE_SHORT_ANSWER,
        ];
    }

    public static function getTypeLabels(): array
    {
        return [
            self::TYPE_MULTIPLE_CHOICE => 'Multiple Choice',
            self::TYPE_TRUE_FALSE => 'True/False',
            self::TYPE_SHORT_ANSWER => 'Short Answer',
        ];
    }

    public static function reorderQuestions(int $quizId, array $questionIds): bool
    {
        try {
            foreach ($questionIds as $index => $questionId) {
                static::where('id', $questionId)
                    ->where('quiz_id', $quizId)
                    ->update(['order' => $index + 1]);
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}