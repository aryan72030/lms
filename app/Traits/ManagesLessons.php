<?php

namespace App\Traits;

use App\Models\Lesson;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait ManagesLessons
{

    /**
     * Build the lesson payload for creation or update
     */
    protected function buildLessonPayload(array $validated, string $type, ?Lesson $lesson = null): array
    {
        $payload = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'estimated_duration' => $validated['estimated_duration'],
            'is_published' => $validated['is_published'] ?? false,
            'section_id' => $validated['section_id'] ?? null,
        ];

        if (!$lesson) {
            $payload['type'] = $type;
        }

        switch ($type) {
            case Lesson::TYPE_TEXT:
                $payload['text_content'] = $validated['text_content'];
                $payload['video_url'] = null;
                $payload['video_duration'] = null;
                $payload['assignment_data'] = null;
                break;

            case Lesson::TYPE_VIDEO:
                $payload['text_content'] = null;
                $payload['video_url'] = $validated['video_url'];
                $payload['video_duration'] = $validated['video_duration'] ?? null;
                $payload['assignment_data'] = null;
                break;



        }

        return $payload;
    }
}
