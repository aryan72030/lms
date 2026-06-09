<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('title');
            $table->text('instructions');
            $table->integer('max_score')->default(100);
            $table->integer('passing_score')->default(70);
            $table->integer('due_days')->default(7);
            $table->boolean('is_published')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['course_id', 'order']);
            $table->index(['course_id', 'is_published']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_assignments');
    }
};
