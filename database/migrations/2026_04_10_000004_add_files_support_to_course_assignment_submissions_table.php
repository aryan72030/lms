<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            $table->json('files')->nullable()->after('file_original_name');
        });
    }

    public function down(): void
    {
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            $table->dropColumn('files');
        });
    }
};