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
        Schema::create('homework', function (Blueprint $table) {
            $table->id();
            $table->string('target_type')->default('course'); // 'course' or 'student'
            $table->foreignId('course_id')->nullable()->constrained('courses')->onDelete('cascade');
            $table->string('roll_no')->nullable();
            $table->date('week_start_date');
            $table->string('day_of_week'); // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->onDelete('set null');
            $table->string('subject_name')->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['course_id', 'week_start_date']);
            $table->index(['roll_no', 'week_start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homework');
    }
};
