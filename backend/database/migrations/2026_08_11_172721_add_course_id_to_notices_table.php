<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            // null = sab courses ke liye (All Courses), specific id = sirf us course ke liye
            $table->unsignedBigInteger('course_id')->nullable()->after('author');
        });
    }

    public function down(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });
    }
};
