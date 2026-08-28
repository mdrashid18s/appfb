<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Replace university degree courses (BCA, BBA, BCOM, BSC, MCA)
 * with school year / class groups (Year 6 through A-Level) matching the
 * XL Education registration page structure.
 *
 * Students are linked via course_id FK so we also remap student.course_id
 * to point at the new "Year 6" entry as a sensible default.
 */
return new class extends Migration
{
    private array $newCourses = [
        ['code' => 'Year 6',  'name' => 'Year 6'],
        ['code' => 'Year 7',  'name' => 'Year 7'],
        ['code' => 'Year 8',  'name' => 'Year 8'],
        ['code' => 'Year 9',  'name' => 'Year 9'],
        ['code' => 'Year 10', 'name' => 'Year 10'],
        ['code' => 'Year 11', 'name' => 'Year 11'],
        ['code' => 'Year 12', 'name' => 'Year 12'],
        ['code' => 'Year 13', 'name' => 'Year 13'],
        ['code' => 'GCSE',    'name' => 'GCSE'],
        ['code' => 'A-Level', 'name' => 'A-Level'],
    ];

    private array $oldCodes = ['BCA','BBA','BCOM','BSC','MCA'];

    public function up(): void
    {
        // 1. Insert / update new school year courses
        foreach ($this->newCourses as $course) {
            DB::table('courses')->updateOrInsert(
                ['code' => $course['code']],
                [
                    'name'       => $course['name'],
                    'code'       => $course['code'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 2. Remap any students whose course_id pointed to an old course
        //    -> point them to "Year 6" as default
        $year6Id = DB::table('courses')->where('code', 'Year 6')->value('id');
        $oldIds  = DB::table('courses')->whereIn('code', $this->oldCodes)->pluck('id')->toArray();

        if ($year6Id && count($oldIds) > 0) {
            // Remap student table (uses course_id FK)
            if (Schema::hasColumn('student', 'course_id')) {
                DB::table('student')
                    ->whereIn('course_id', $oldIds)
                    ->update(['course_id' => $year6Id]);
            }
            // Remap subjects
            if (Schema::hasColumn('subjects', 'course_id')) {
                DB::table('subjects')
                    ->whereIn('course_id', $oldIds)
                    ->update(['course_id' => $year6Id]);
            }
            // Remap teachers
            if (Schema::hasColumn('teachers', 'course_id')) {
                DB::table('teachers')
                    ->whereIn('course_id', $oldIds)
                    ->update(['course_id' => $year6Id]);
            }
            // Remap timetable
            if (Schema::hasColumn('timetable', 'course_id')) {
                DB::table('timetable')
                    ->whereIn('course_id', $oldIds)
                    ->update(['course_id' => $year6Id]);
            }
        }

        // 3. Delete old university-degree course records
        DB::table('courses')->whereIn('code', $this->oldCodes)->delete();
    }

    public function down(): void
    {
        $old = [
            ['code' => 'BCA',  'name' => 'Bachelor of Computer Applications'],
            ['code' => 'BBA',  'name' => 'Bachelor of Business Administration'],
            ['code' => 'BCOM', 'name' => 'Bachelor of Commerce'],
            ['code' => 'BSC',  'name' => 'Bachelor of Science'],
            ['code' => 'MCA',  'name' => 'Master of Computer Applications'],
        ];
        foreach ($old as $c) {
            DB::table('courses')->updateOrInsert(
                ['code' => $c['code']],
                ['name' => $c['name'], 'code' => $c['code'], 'updated_at' => now()]
            );
        }
        $newCodes = array_column($this->newCourses, 'code');
        DB::table('courses')->whereIn('code', $newCodes)->delete();
    }
};
