<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Carbon\Carbon;

#[Signature('enrollments:cleanup-pending')]
#[Description('Mark pending enrollments as failed after 24 hours of inactivity')]
class CleanupPendingEnrollments extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Cleaning up stale pending enrollments...');

        $staleTime = Carbon::now()->subHours(24);

        $staleCount = Enrollment::where('payment_status', Enrollment::PAYMENT_STATUS_PENDING)
            ->where('created_at', '<', $staleTime)
            ->update([
                'payment_status' => Enrollment::PAYMENT_STATUS_FAILED,
                'notes' => 'Enrollment expired due to non-payment within 24 hours.'
            ]);

        $this->info("Successfully marked {$staleCount} enrollments as failed.");
    }
}
