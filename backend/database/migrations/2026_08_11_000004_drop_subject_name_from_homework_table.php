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
        if (Schema::hasColumn('homework', 'subject_name')) {
            Schema::table('homework', function (Blueprint $table) {
                $table->dropColumn('subject_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('homework', 'subject_name')) {
            Schema::table('homework', function (Blueprint $table) {
                $table->string('subject_name')->nullable()->after('subject_id');
            });
        }
    }
};
