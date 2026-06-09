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
        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('refund_id')->nullable()->after('transaction_id');
            $table->decimal('refund_amount', 10, 2)->nullable()->after('refund_id');
            $table->timestamp('refunded_at')->nullable()->after('refund_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['refund_id', 'refund_amount', 'refunded_at']);
        });
    }
};
