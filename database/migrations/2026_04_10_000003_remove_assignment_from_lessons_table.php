<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old assignment_submissions table
        Schema::dropIfExists('assignment_submissions');

        // Remove assignment_data from lessons & update type enum
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('assignment_data');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->enum('type', ['Text', 'Video'])->default('Text')->change();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->json('assignment_data')->nullable();
            $table->enum('type', ['Text', 'Video', 'Assignment'])->default('Text')->change();
        });
    }
};
