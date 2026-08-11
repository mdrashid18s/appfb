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
        Schema::table('homework_submissions', function (Blueprint $table) {
            if (!Schema::hasColumn('homework_submissions', 'teacher_grade')) {
                $table->string('teacher_grade')->nullable()->after('remarks');
            }
            if (!Schema::hasColumn('homework_submissions', 'teacher_remarks')) {
                $table->text('teacher_remarks')->nullable()->after('teacher_grade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('homework_submissions', function (Blueprint $table) {
            if (Schema::hasColumn('homework_submissions', 'teacher_grade')) {
                $table->dropColumn('teacher_grade');
            }
            if (Schema::hasColumn('homework_submissions', 'teacher_remarks')) {
                $table->dropColumn('teacher_remarks');
            }
        });
    }
};
