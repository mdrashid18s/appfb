<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop old foreign keys referencing tuition_centres
        Schema::table('student', function (Blueprint $table) {
            try {
                $table->dropForeign('student_centre_id_foreign');
            } catch (\Exception $e) {}
        });

        Schema::table('student_registrations', function (Blueprint $table) {
            try {
                $table->dropForeign('student_registrations_centre_id_foreign');
            } catch (\Exception $e) {}
        });

        // 2. Drop redundant old tables
        Schema::dropIfExists('centre_slots');
        Schema::dropIfExists('tuition_centres');

        // 3. Re-link foreign keys to the unified centres table
        Schema::table('student', function (Blueprint $table) {
            $table->foreign('centre_id')
                ->references('id')
                ->on('centres')
                ->nullOnDelete();
        });

        Schema::table('student_registrations', function (Blueprint $table) {
            $table->foreign('centre_id')
                ->references('id')
                ->on('centres')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // No-op rollback since centres is the primary source of truth
    }
};
