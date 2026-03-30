<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            if (!Schema::hasColumn('lessons', 'section_id')) {
                $table->foreignId('section_id')->nullable()->after('course_id')->constrained('course_sections')->onDelete('set null');
            } else {
                $table->foreignId('section_id')->nullable()->change()->constrained('course_sections')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('section_id');
        });
    }
};
