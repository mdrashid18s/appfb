<?php

/**
 * @file 2026_08_02_070216_create_password_reset_otps_table.php
 * @description Database Migration: 'password_reset_otps' table ka structure banana.
 *
 * Yeh table Forgot Password (Password Reset) ke time generate hone wale
 * temporary OTPs ko safely store karne ke liye use hoti hai.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (Table Create Karna).
     */
    public function up(): void
    {
        Schema::create('password_reset_otps', function (Blueprint $table) {
            // Auto-increment Primary Key ID
            $table->id();

            // Student ka roll number jo password reset request kar raha hai
            $table->string('roll_no');

            // Student ke phone/email par bheja gaya 6-digit OTP code
            $table->string('otp');

            // OTP ki expiry date & time (e.g. 5-10 minutes baad expired)
            $table->timestamp('expires_at');

            // 'created_at' aur 'updated_at' timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations (Table Delete / Rollback Karna).
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_otps');
    }
};
