<?php

namespace App\Mail;

use App\Models\Course;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CourseSubmission extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Course $course
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Course Submitted for Review: ' . $this->course->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.course-submission',
        );
    }
}
