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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrollment_date')->useCurrent();
            $table->enum('payment_status', ['Free', 'Pending', 'Completed', 'Failed'])->default('Free');
            $table->enum('payment_method', ['PayPal', 'Free'])->default('Free');
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->decimal('progress', 5, 2)->default(0.00); // Progress percentage (0.00 to 100.00)
            $table->timestamp('completion_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('transaction_id')->nullable(); // PayPal transaction ID
            $table->decimal('amount_paid', 10, 2)->nullable(); // Amount paid for the course
            $table->timestamps();
            
            // Ensure one enrollment per student per course
            $table->unique(['student_id', 'course_id']);
            
            // Indexes for better performance
            $table->index(['student_id', 'status']);
            $table->index(['course_id', 'status']);
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
