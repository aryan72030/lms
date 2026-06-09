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
        Schema::table('courses', function (Blueprint $table) {
            $table->integer('access_duration')->default(0)->after('price')->comment('Access duration in days. 0 for lifetime access.');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->timestamp('expiry_date')->nullable()->after('enrollment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('access_duration');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('expiry_date');
        });
    }
};
