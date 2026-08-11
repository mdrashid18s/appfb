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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('recipient_type')->default('all'); // 'all', 'student', 'admin'
            $table->unsignedBigInteger('student_id')->nullable();
            $table->string('roll_no')->nullable();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('system'); // 'test', 'homework', 'notice', 'submission', 'profile', 'system'
            $table->string('link')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
