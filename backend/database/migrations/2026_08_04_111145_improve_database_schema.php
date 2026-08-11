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
        // 1. Drop redundant foreign key from student_tests
        Schema::table('student_tests', function (Blueprint $table) {
            // It's safe to drop if it exists. Sometimes Laravel names it differently based on when it was created.
            // Using raw statement to handle case where exact name might not exist without erroring the whole migration
            // In MariaDB/MySQL, dropping a foreign key requires exact name.
        });
        
        // Execute raw query to ignore error if the key doesn't exist
        try {
            DB::statement('ALTER TABLE student_tests DROP FOREIGN KEY student_tests_ibfk_1');
        } catch (\Exception $e) {
            // Ignore if it doesn't exist
        }

        // 2. Add student_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->integer('student_id')->nullable()->after('id');
            // Add foreign key
            $table->foreign('student_id')->references('id')->on('student')->onDelete('cascade');
        });

        // 3. Populate student_id by matching users.login_id with student.roll no
        DB::statement('
            UPDATE users u
            JOIN student s ON u.login_id = s.`roll no`
            SET u.student_id = s.id
            WHERE u.role = "student"
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropColumn('student_id');
        });
        
        Schema::table('student_tests', function (Blueprint $table) {
            $table->foreign('test_id', 'student_tests_ibfk_1')->references('id')->on('tests')->onDelete('cascade');
        });
    }
};
