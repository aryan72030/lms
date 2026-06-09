<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            $table->integer('resubmission_count')->default(0)->after('graded_at');
            $table->timestamp('last_reopened_at')->nullable()->after('resubmission_count');
        });
    }

    public function down(): void
    {
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            $table->dropColumn(['resubmission_count', 'last_reopened_at']);
        });
    }
};