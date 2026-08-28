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
        // 1. Add wallet_balance to student table
        if (!Schema::hasColumn('student', 'wallet_balance')) {
            Schema::table('student', function (Blueprint $table) {
                $table->decimal('wallet_balance', 10, 2)->default(0.00);
            });
        }

        // 2. Create student_wallet_transactions table
        if (!Schema::hasTable('student_wallet_transactions')) {
            Schema::create('student_wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->integer('student_id');
                $table->string('type', 20); // 'credit' or 'debit'
                $table->decimal('amount', 10, 2);
                $table->string('description', 255);
                $table->string('reference_id', 100)->nullable();
                $table->decimal('balance_after', 10, 2)->default(0.00);
                $table->timestamps();

                $table->foreign('student_id')->references('id')->on('student')->onDelete('cascade');
            });
        }

        // 3. Create product_exchanges table
        if (!Schema::hasTable('product_exchanges')) {
            Schema::create('product_exchanges', function (Blueprint $table) {
                $table->id();
                $table->integer('student_id');
                $table->unsignedBigInteger('old_product_id');
                $table->unsignedBigInteger('new_product_id');
                $table->unsignedBigInteger('old_student_product_id')->nullable();
                $table->decimal('old_price', 10, 2);
                $table->decimal('new_price', 10, 2);
                $table->decimal('price_diff', 10, 2); // new_price - old_price
                $table->decimal('wallet_used', 10, 2)->default(0.00);
                $table->decimal('wallet_credited', 10, 2)->default(0.00);
                $table->decimal('amount_paid', 10, 2)->default(0.00);
                $table->string('payment_method', 100)->nullable();
                $table->string('status', 50)->default('completed');
                $table->timestamps();

                $table->foreign('student_id')->references('id')->on('student')->onDelete('cascade');
                $table->foreign('old_product_id')->references('id')->on('products')->onDelete('cascade');
                $table->foreign('new_product_id')->references('id')->on('products')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_exchanges');
        Schema::dropIfExists('student_wallet_transactions');
        if (Schema::hasColumn('student', 'wallet_balance')) {
            Schema::table('student', function (Blueprint $table) {
                $table->dropColumn('wallet_balance');
            });
        }
    }
};
