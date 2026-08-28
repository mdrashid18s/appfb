<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\PaymentService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Cron Job Command: Sync & Reconcile Pending Razorpay Payments
 * Command: php artisan payments:sync-pending
 */
Artisan::command('payments:sync-pending', function (PaymentService $paymentService) {
    $this->info('[' . now()->toDateTimeString() . '] Starting Razorpay pending payments reconciliation...');
    $stats = $paymentService->syncPendingOrders();
    $this->info("Done! Checked: {$stats['total_pending']}, Paid: {$stats['resolved_paid']}, Failed: {$stats['resolved_failed']}, Pending: {$stats['still_pending']}");
})->purpose('Reconcile pending Razorpay orders against gateway API');

Schedule::command('payments:sync-pending')->everyFiveMinutes();
