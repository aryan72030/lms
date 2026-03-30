<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('enrollments')
            ->whereNull('status')
            ->orWhere('status', '')
            ->update(['status' => 'Active']);
    }

    public function down(): void
    {
        // no-op
    }
};
