<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            // Old: unique(['student_id', 'lesson_id'])
            // New: allow progress per enrollment attempt
            if (Schema::hasColumn('lesson_progress', 'enrollment_id')) {
                $table->dropUnique('lesson_progress_student_id_lesson_id_unique');
                $table->unique(['student_id', 'lesson_id', 'enrollment_id'], 'lesson_progress_student_lesson_enrollment_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropUnique('lesson_progress_student_lesson_enrollment_unique');
            $table->unique(['student_id', 'lesson_id']);
        });
    }
};

