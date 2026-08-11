<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure all student records link to course_id
        if (!Schema::hasColumn('student', 'course_id')) {
            Schema::table('student', function (Blueprint $table) {
                $table->foreignId('course_id')->nullable()->after('department')->constrained('courses')->onDelete('set null');
            });
        }

        // Migrate student string departments to course_id FKs
        $students = DB::table('student')->get();
        foreach ($students as $stu) {
            if (!empty($stu->department)) {
                $cId = DB::table('courses')->where('name', trim($stu->department))->value('id');
                if (!$cId) {
                    $cId = DB::table('courses')->insertGetId([
                        'name' => strtoupper(trim($stu->department)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                DB::table('student')->where('id', $stu->id)->update(['course_id' => $cId]);
            }
        }

        // 2. Ensure all timetable rows have course_id and subject_id filled
        $defaultCourseId = DB::table('courses')->first()->id ?? 1;
        $defaultSubjectId = DB::table('subjects')->first()->id ?? 1;

        DB::table('timetable')->whereNull('course_id')->update(['course_id' => $defaultCourseId]);
        DB::table('timetable')->whereNull('subject_id')->update(['subject_id' => $defaultSubjectId]);

        // 3. Drop legacy redundant string columns from timetable table
        Schema::table('timetable', function (Blueprint $table) {
            if (Schema::hasColumn('timetable', 'department')) {
                $table->dropColumn('department');
            }
            if (Schema::hasColumn('timetable', 'subject')) {
                $table->dropColumn('subject');
            }
            if (Schema::hasColumn('timetable', 'teacher')) {
                $table->dropColumn('teacher');
            }
        });
    }

    public function down(): void
    {
        Schema::table('timetable', function (Blueprint $table) {
            $table->string('department')->nullable();
            $table->string('subject')->nullable();
            $table->string('teacher')->nullable();
        });

        Schema::table('student', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });
    }
};
