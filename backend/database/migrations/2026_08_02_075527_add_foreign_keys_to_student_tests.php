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
        // First ensure roll no is indexed in student table
        Schema::table('student', function (Blueprint $table) {
            $table->index('roll no');
        });

        Schema::table('student_tests', function (Blueprint $table) {
            $table->foreign('test_id')->references('id')->on('tests')->onDelete('cascade');
            // 'roll no' has space in its name, so we specify the columns explicitly
            $table->foreign('roll_no')->references('roll no')->on('student')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_tests', function (Blueprint $table) {
            //
        });
    }
};
