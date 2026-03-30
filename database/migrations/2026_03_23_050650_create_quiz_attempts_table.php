<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade');
            $table->integer('attempt_number')->default(1);
            $table->json('answers')->nullable()->comment('Student answers');
            $table->integer('score')->default(0)->comment('Points scored');
            $table->integer('total_points')->default(0)->comment('Total possible points');
            $table->decimal('percentage', 5, 2)->default(0.00)->comment('Score percentage');
            $table->boolean('is_passed')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('time_taken')->nullable()->comment('Time taken in minutes');
            $table->enum('status', ['in_progress', 'completed', 'abandoned'])->default('in_progress');
            $table->timestamps();

            $table->index(['lesson_id', 'student_id']);
            $table->index(['enrollment_id', 'is_passed']);
            $table->index(['student_id', 'completed_at']);
            $table->unique(['lesson_id', 'student_id', 'attempt_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};