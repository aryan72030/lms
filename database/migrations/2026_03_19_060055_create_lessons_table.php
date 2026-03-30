<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['Text', 'Video', 'Quiz', 'Assignment'])->default('Text');
            $table->integer('order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            
            // Content fields for different lesson types
            $table->longText('text_content')->nullable(); // For Text lessons
            $table->string('video_url')->nullable(); // For Video lessons
            $table->integer('video_duration')->nullable(); // Video duration in seconds
            $table->json('quiz_data')->nullable(); // For Quiz lessons (questions, answers, etc.)
            $table->json('assignment_data')->nullable(); // For Assignment lessons (instructions, files, etc.)
            
            // Additional metadata
            $table->integer('estimated_duration')->default(0); // Estimated completion time in minutes
            $table->json('resources')->nullable(); // Additional resources (files, links, etc.)
            
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'order']);
            $table->index(['course_id', 'type']);
            $table->index(['course_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};