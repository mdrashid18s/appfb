<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure all students have valid course_id
        $students = DB::table('student')->get();
        foreach ($students as $stu) {
            if (empty($stu->course_id) && !empty($stu->department)) {
                $cId = DB::table('courses')->where('name', trim($stu->department))->value('id');
                if (!$cId) {
                    $cId = DB::table('courses')->insertGetId([
                        'name' => strtoupper(trim($stu->department)),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
                DB::table('student')->where('id', $stu->id)->update(['course_id' => $cId]);
            }
        }

        // 2. Ensure all teachers have valid course_id
        $teachers = DB::table('teachers')->get();
        foreach ($teachers as $t) {
            if (empty($t->course_id) && !empty($t->department)) {
                $cId = DB::table('courses')->where('name', trim($t->department))->value('id');
                if (!$cId) {
                    $cId = DB::table('courses')->insertGetId([
                        'name' => strtoupper(trim($t->department)),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
                DB::table('teachers')->where('id', $t->id)->update(['course_id' => $cId]);
            }
        }

        // 3. Drop legacy department string column from student table
        Schema::table('student', function (Blueprint $table) {
            if (Schema::hasColumn('student', 'department')) {
                $table->dropColumn('department');
            }
        });

        // 4. Drop legacy department string column from teachers table
        Schema::table('teachers', function (Blueprint $table) {
            if (Schema::hasColumn('teachers', 'department')) {
                $table->dropColumn('department');
            }
        });
    }

    public function down(): void
    {
        Schema::table('student', function (Blueprint $table) {
            $table->string('department')->nullable();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('department')->nullable();
        });
    }
};
