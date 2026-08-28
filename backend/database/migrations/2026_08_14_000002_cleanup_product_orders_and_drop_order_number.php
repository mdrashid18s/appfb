<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Purge legacy orders without real Razorpay order ID
        $fakeOrders = DB::table('product_orders')->whereNull('razorpay_order_id')->pluck('id')->toArray();
        if (!empty($fakeOrders)) {
            DB::table('student_products')->whereIn('order_id', $fakeOrders)->delete();
            DB::table('product_order_items')->whereIn('order_id', $fakeOrders)->delete();
            DB::table('product_orders')->whereIn('id', $fakeOrders)->delete();
        }

        // Clean orphaned student products
        DB::table('student_products')->whereNull('order_id')->delete();

        // 2. Drop `order_number` column from `product_orders`
        Schema::table('product_orders', function (Blueprint $table) {
            if (Schema::hasColumn('product_orders', 'order_number')) {
                $table->dropColumn('order_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('product_orders', 'order_number')) {
                $table->string('order_number')->nullable()->after('id');
            }
        });
    }
};
