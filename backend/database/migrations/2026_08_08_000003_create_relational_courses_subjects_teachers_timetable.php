<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create courses table
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. BCA, BBA, BCOM, BSC, MCA
            $table->string('code')->nullable(); // e.g. BCA-101
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed initial default courses
        $defaultCourses = [
            ['name' => 'BCA', 'code' => 'BCA', 'description' => 'Bachelor of Computer Applications'],
            ['name' => 'BBA', 'code' => 'BBA', 'description' => 'Bachelor of Business Administration'],
            ['name' => 'BCOM', 'code' => 'BCOM', 'description' => 'Bachelor of Commerce'],
            ['name' => 'BSC', 'code' => 'BSC', 'description' => 'Bachelor of Science'],
            ['name' => 'MCA', 'code' => 'MCA', 'description' => 'Master of Computer Applications'],
        ];

        foreach ($defaultCourses as $c) {
            DB::table('courses')->insertOrIgnore([
                'name' => $c['name'],
                'code' => $c['code'],
                'description' => $c['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $bcaId = DB::table('courses')->where('name', 'BCA')->value('id');

        // 2. Add course_id foreign key to subjects
        if (!Schema::hasColumn('subjects', 'course_id')) {
            Schema::table('subjects', function (Blueprint $table) use ($bcaId) {
                $table->foreignId('course_id')->nullable()->default($bcaId)->constrained('courses')->onDelete('cascade');
            });
        }

        // 3. Add course_id foreign key to teachers
        if (!Schema::hasColumn('teachers', 'course_id')) {
            Schema::table('teachers', function (Blueprint $table) use ($bcaId) {
                $table->foreignId('course_id')->nullable()->default($bcaId)->constrained('courses')->onDelete('cascade');
            });
        }

        // 4. Upgrade timetable table with strict foreign key constraints
        Schema::table('timetable', function (Blueprint $table) {
            if (!Schema::hasColumn('timetable', 'course_id')) {
                $table->foreignId('course_id')->nullable()->after('id')->constrained('courses')->onDelete('cascade');
            }
            if (!Schema::hasColumn('timetable', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('course_id')->constrained('subjects')->onDelete('cascade');
            }
            if (!Schema::hasColumn('timetable', 'teacher_id')) {
                $table->foreignId('teacher_id')->nullable()->after('subject_id')->constrained('teachers')->onDelete('set null');
            }
        });

        // 5. Data Migration: Match existing timetable string records with relational foreign key IDs
        $timetableRows = DB::table('timetable')->get();

        foreach ($timetableRows as $row) {
            // Find or create Course ID
            $courseName = trim($row->department ?? 'BCA');
            if (empty($courseName)) $courseName = 'BCA';

            $course = DB::table('courses')->where('name', $courseName)->first();
            if (!$course) {
                $cId = DB::table('courses')->insertGetId([
                    'name' => strtoupper($courseName),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $cId = $course->id;
            }

            // Find or create Subject ID
            $subjectName = trim($row->subject ?? 'General');
            if (empty($subjectName)) $subjectName = 'General';

            $subject = DB::table('subjects')->where('name', $subjectName)->first();
            if (!$subject) {
                $sId = DB::table('subjects')->insertGetId([
                    'name' => $subjectName,
                    'course_id' => $cId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $sId = $subject->id;
            }

            // Find or create Teacher ID
            $tId = null;
            if (!empty($row->teacher)) {
                $teacherName = trim($row->teacher);
                $teacher = DB::table('teachers')->where('name', $teacherName)->first();
                if (!$teacher) {
                    $tId = DB::table('teachers')->insertGetId([
                        'name' => $teacherName,
                        'course_id' => $cId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $tId = $teacher->id;
                }
            }

            // Update timetable record with foreign keys
            DB::table('timetable')->where('id', $row->id)->update([
                'course_id' => $cId,
                'subject_id' => $sId,
                'teacher_id' => $tId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('timetable', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropColumn(['course_id', 'subject_id', 'teacher_id']);
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        Schema::dropIfExists('courses');
    }
};
