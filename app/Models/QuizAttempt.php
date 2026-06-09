<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Arr;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'quiz_id',
        'enrollment_id',
        'attempt_number',
        'answers',
        'score',
        'max_score',
        'percentage',
        'is_passed',
        'started_at',
        'completed_at',
        'time_spent',
        'status',
    ];

    protected $casts = [
        'answers' => 'array',
        'completed_at' => 'datetime',
        'started_at' => 'datetime',
        'percentage' => 'float',
        'score' => 'integer',
        'max_score' => 'integer',
        'is_passed' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function calculateScore(): void
    {
        $quiz = $this->quiz;
        $answers = $this->answers ?? [];

        $score = 0;
        $maxScore = 0;

        $questions = $quiz->activeQuestions()->get();

        foreach ($questions as $question) {
            $maxScore += (int) $question->points;

            $studentAnswer = Arr::get($answers, (string) $question->id);
            if (is_null($studentAnswer)) {
                continue;
            }

            if ($question->isCorrectAnswer((string) $studentAnswer)) {
                $score += (int) $question->points;
            }
        }

        $this->score = $score;
        $this->max_score = $maxScore;
        $this->percentage = $maxScore > 0 ? ($score / $maxScore) * 100 : 0;
        $this->is_passed = $this->percentage >= (float) $quiz->passing_score;
        $this->status = 'completed';
        $this->completed_at = $this->completed_at ?? now();
    }

    public function isCompleted(): bool
    {
        return !is_null($this->completed_at);
    }

    public function isPassed(): bool
    {
        return $this->percentage >= (float) $this->quiz->passing_score;
    }

    public function getGradeLetter(): string
    {
        $percentage = (float) ($this->percentage ?? 0);

        return match (true) {
            $percentage >= 90 => 'A',
            $percentage >= 80 => 'B',
            $percentage >= 70 => 'C',
            $percentage >= 60 => 'D',
            default => 'F',
        };
    }

    public function getDetailedResults(): array
    {
        $quiz = $this->quiz()->with('questions')->first();
        $answers = $this->answers ?? [];

        return $quiz->questions
            ->where('is_active', true)
            ->sortBy('order')
            ->values()
            ->map(function (QuizQuestion $question) use ($answers) {
                $studentAnswer = Arr::get($answers, (string) $question->id);
                $isCorrect = !is_null($studentAnswer) && $question->isCorrectAnswer((string) $studentAnswer);

                return [
                    'question_id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'options' => $question->getFormattedOptions(),
                    'correct_answer' => $question->correct_answer,
                    'student_answer' => $studentAnswer,
                    'is_correct' => $isCorrect,
                    'points' => (int) $question->points,
                    'points_awarded' => $isCorrect ? (int) $question->points : 0,
                    'explanation' => $question->explanation,
                ];
            })
            ->all();
    }
}
