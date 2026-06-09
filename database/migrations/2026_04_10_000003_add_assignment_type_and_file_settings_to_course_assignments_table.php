<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->enum('assignment_type', ['text', 'file', 'mixed'])->default('text')->after('instructions');
            $table->json('allowed_file_types')->nullable()->after('assignment_type');
            $table->integer('max_file_size_mb')->default(10)->after('allowed_file_types');
            $table->integer('max_files')->default(1)->after('max_file_size_mb');
        });
    }

    public function down(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->dropColumn(['assignment_type', 'allowed_file_types', 'max_file_size_mb', 'max_files']);
        });
    }
};