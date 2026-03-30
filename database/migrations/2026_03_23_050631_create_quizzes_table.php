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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->integer('time_limit')->nullable()->comment('Time limit in minutes');
            $table->integer('total_marks')->default(0);
            $table->decimal('passing_score', 5, 2)->default(60.00)->comment('Passing score percentage');
            $table->integer('max_attempts')->default(3);
            $table->boolean('is_final_quiz')->default(false)->comment('Is this the final quiz for course completion');
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(1);
            $table->json('settings')->nullable()->comment('Additional quiz settings');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'is_active']);
            $table->index(['course_id', 'is_final_quiz']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};