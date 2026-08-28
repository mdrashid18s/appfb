<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $classes = [
        ['code' => 'Year 3',  'name' => 'Year 3 (11+ Introduction)'],
        ['code' => 'Year 4',  'name' => 'Year 4 (11+ Foundation)'],
        ['code' => 'Year 5',  'name' => 'Year 5 (11+ Preparation)'],
        ['code' => 'Year 6',  'name' => 'Year 6 (11+ Advanced)'],
        ['code' => 'Year 7',  'name' => 'Year 7 (Pre-GCSE)'],
        ['code' => 'Year 8',  'name' => 'Year 8 (Pre-GCSE)'],
        ['code' => 'Year 9',  'name' => 'Year 9 (Pre-GCSE)'],
        ['code' => 'Year 10', 'name' => 'Year 10 (GCSE)'],
        ['code' => 'Year 11', 'name' => 'Year 11 (GCSE)'],
        ['code' => 'Year 12', 'name' => 'Year 12 (A-Level)'],
        ['code' => 'Year 13', 'name' => 'Year 13 (A-Level)'],
        ['code' => 'GCSE',    'name' => 'GCSE Core'],
        ['code' => 'A-Level', 'name' => 'A-Level Core'],
    ];

    private array $legacyDegreeCodes = ['BCA', 'BBA', 'BCOM', 'BSC', 'MCA', 'B.Tech', 'M.Tech', 'MBA'];

    public function up(): void
    {
        // 1. Insert or update all school year classes
        foreach ($this->classes as $cls) {
            DB::table('courses')->updateOrInsert(
                ['code' => $cls['code']],
                [
                    'name'       => $cls['name'],
                    'code'       => $cls['code'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 2. Get fallback Year 5 id
        $defaultCourseId = DB::table('courses')->where('code', 'Year 5')->value('id') 
                        ?? DB::table('courses')->first()->id;

        // 3. Find any legacy course ids
        $legacyIds = DB::table('courses')
            ->whereIn('code', $this->legacyDegreeCodes)
            ->orWhereIn('name', $this->legacyDegreeCodes)
            ->pluck('id')
            ->toArray();

        if (count($legacyIds) > 0 && $defaultCourseId) {
            // Remap student table
            if (Schema::hasColumn('student', 'course_id')) {
                DB::table('student')->whereIn('course_id', $legacyIds)->update(['course_id' => $defaultCourseId]);
            }
            // Remap subjects table
            if (Schema::hasColumn('subjects', 'course_id')) {
                DB::table('subjects')->whereIn('course_id', $legacyIds)->update(['course_id' => $defaultCourseId]);
            }
            // Remap teachers table
            if (Schema::hasColumn('teachers', 'course_id')) {
                DB::table('teachers')->whereIn('course_id', $legacyIds)->update(['course_id' => $defaultCourseId]);
            }
            // Remap timetable table
            if (Schema::hasColumn('timetable', 'course_id')) {
                DB::table('timetable')->whereIn('course_id', $legacyIds)->update(['course_id' => $defaultCourseId]);
            }
            // Remap notices table
            if (Schema::hasColumn('notices', 'course_id')) {
                DB::table('notices')->whereIn('course_id', $legacyIds)->update(['course_id' => $defaultCourseId]);
            }

            // Delete legacy courses
            DB::table('courses')->whereIn('id', $legacyIds)->delete();
        }
    }

    public function down(): void
    {
        // No down migration needed for clean school schema
    }
};
