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
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            // Update the status enum to include 'Rejected'
            $table->enum('status', ['Draft', 'Submitted', 'Graded', 'Rejected'])->default('Draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_assignment_submissions', function (Blueprint $table) {
            // Revert back to original enum values
            $table->enum('status', ['Draft', 'Submitted', 'Graded'])->default('Draft')->change();
        });
    }
};
