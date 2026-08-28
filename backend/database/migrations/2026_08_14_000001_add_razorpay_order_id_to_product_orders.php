<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_orders', function (Blueprint $table) {
            // Link to Razorpay's own order ID (for webhook matching)
            if (!Schema::hasColumn('product_orders', 'razorpay_order_id')) {
                $table->string('razorpay_order_id')->nullable()->after('coupon_code');
            }

            // Normalize payment_status to include pending + cancelled
            // Existing values: paid, completed, failed → now: pending, paid, failed, cancelled
            DB::statement("ALTER TABLE product_orders MODIFY COLUMN payment_status ENUM('pending','paid','completed','failed','cancelled') NOT NULL DEFAULT 'pending'");
        });
    }

    public function down(): void
    {
        Schema::table('product_orders', function (Blueprint $table) {
            $table->dropColumn('razorpay_order_id');
            DB::statement("ALTER TABLE product_orders MODIFY COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'");
        });
    }
};
