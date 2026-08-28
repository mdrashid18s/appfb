<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        $now = Carbon::now();

        // 1. Fetch Course IDs by code
        $courses = DB::table('courses')->pluck('id', 'code')->toArray();

        // Ensure key courses exist
        $y3Id = $courses['Year 3'] ?? DB::table('courses')->where('code', 'like', '%3%')->value('id');
        $y4Id = $courses['Year 4'] ?? DB::table('courses')->where('code', 'like', '%4%')->value('id');
        $y5Id = $courses['Year 5'] ?? DB::table('courses')->where('code', 'like', '%5%')->value('id');
        $y6Id = $courses['Year 6'] ?? DB::table('courses')->where('code', 'like', '%6%')->value('id');
        $y7Id = $courses['Year 7'] ?? DB::table('courses')->where('code', 'like', '%7%')->value('id');
        $y8Id = $courses['Year 8'] ?? DB::table('courses')->where('code', 'like', '%8%')->value('id');
        $y9Id = $courses['Year 9'] ?? DB::table('courses')->where('code', 'like', '%9%')->value('id');
        $y10Id = $courses['Year 10'] ?? DB::table('courses')->where('code', 'like', '%10%')->value('id');
        $y11Id = $courses['Year 11'] ?? DB::table('courses')->where('code', 'like', '%11%')->value('id');
        $y12Id = $courses['Year 12'] ?? DB::table('courses')->where('code', 'like', '%12%')->value('id');
        $y13Id = $courses['Year 13'] ?? DB::table('courses')->where('code', 'like', '%13%')->value('id');
        $gcseId = $courses['GCSE'] ?? DB::table('courses')->where('code', 'GCSE')->value('id');
        $aLevelId = $courses['A-Level'] ?? DB::table('courses')->where('code', 'A-Level')->value('id');

        // 2. Clean legacy subject_teacher and timetable records
        DB::table('subject_teacher')->truncate();
        DB::table('timetable')->truncate();

        // Remove old university subjects
        DB::table('subjects')->delete();

        // 3. Define Class-wise Subjects List
        $classSubjects = [
            // Year 3 (11+ Introduction)
            ['name' => '11+ Early Maths & Mental Arithmetic', 'type' => 'theory', 'course_id' => $y3Id],
            ['name' => '11+ Vocabulary & Reading Comprehension', 'type' => 'theory', 'course_id' => $y3Id],
            ['name' => '11+ Introductory Verbal Reasoning', 'type' => 'theory', 'course_id' => $y3Id],
            ['name' => '11+ Introductory Non-Verbal Reasoning', 'type' => 'theory', 'course_id' => $y3Id],

            // Year 4 (11+ Foundation)
            ['name' => '11+ Foundation Mathematics & Word Problems', 'type' => 'theory', 'course_id' => $y4Id],
            ['name' => '11+ English Comprehension & SPAG', 'type' => 'theory', 'course_id' => $y4Id],
            ['name' => '11+ Verbal Reasoning (Foundation Techniques)', 'type' => 'theory', 'course_id' => $y4Id],
            ['name' => '11+ Non-Verbal & Spatial Reasoning', 'type' => 'theory', 'course_id' => $y4Id],

            // Year 5 (11+ Preparation)
            ['name' => '11+ Advanced Numerical Reasoning & Problem Solving', 'type' => 'theory', 'course_id' => $y5Id],
            ['name' => '11+ Advanced English & Creative Writing', 'type' => 'theory', 'course_id' => $y5Id],
            ['name' => '11+ Verbal Reasoning Masterclass', 'type' => 'theory', 'course_id' => $y5Id],
            ['name' => '11+ Non-Verbal & Spatial Reasoning Speed Drills', 'type' => 'theory', 'course_id' => $y5Id],
            ['name' => '11+ Full-Length Timed Mock Practice', 'type' => 'theory', 'course_id' => $y5Id],

            // Year 6 (11+ Advanced & Entrance)
            ['name' => '11+ Final Exam Technique & Speed Drills', 'type' => 'theory', 'course_id' => $y6Id],
            ['name' => '11+ Advanced Grammar School Mocks (GL & CEM)', 'type' => 'theory', 'course_id' => $y6Id],
            ['name' => 'Independent School 11+ Entrance Masterclass', 'type' => 'theory', 'course_id' => $y6Id],

            // Year 7 (Pre-GCSE)
            ['name' => 'Year 7 Mathematics (Algebra & Geometry)', 'type' => 'theory', 'course_id' => $y7Id],
            ['name' => 'Year 7 English Language & Literature', 'type' => 'theory', 'course_id' => $y7Id],
            ['name' => 'Year 7 Combined Science (Physics, Chemistry, Biology)', 'type' => 'theory', 'course_id' => $y7Id],
            ['name' => 'Year 7 Reasoning & Problem Solving', 'type' => 'theory', 'course_id' => $y7Id],

            // Year 8 (Pre-GCSE)
            ['name' => 'Year 8 Mathematics (Advanced Algebra & Statistics)', 'type' => 'theory', 'course_id' => $y8Id],
            ['name' => 'Year 8 English Analytical Writing & Reading', 'type' => 'theory', 'course_id' => $y8Id],
            ['name' => 'Year 8 Combined Science (Applied Concepts)', 'type' => 'theory', 'course_id' => $y8Id],

            // Year 9 (Pre-GCSE Transition)
            ['name' => 'Year 9 Mathematics (Pre-GCSE Higher Tier)', 'type' => 'theory', 'course_id' => $y9Id],
            ['name' => 'Year 9 English Language & Literature Skills', 'type' => 'theory', 'course_id' => $y9Id],
            ['name' => 'Year 9 Triple Science Foundation', 'type' => 'theory', 'course_id' => $y9Id],

            // Year 10 (GCSE)
            ['name' => 'GCSE Mathematics (Higher Tier)', 'type' => 'theory', 'course_id' => $y10Id],
            ['name' => 'GCSE English Language & Literature', 'type' => 'theory', 'course_id' => $y10Id],
            ['name' => 'GCSE Physics (Forces, Waves, Energy)', 'type' => 'theory', 'course_id' => $y10Id],
            ['name' => 'GCSE Chemistry (Organic & Quantitative)', 'type' => 'theory', 'course_id' => $y10Id],
            ['name' => 'GCSE Biology (Cell Biology & Genetics)', 'type' => 'theory', 'course_id' => $y10Id],
            ['name' => 'GCSE Combined Science (Trilogy)', 'type' => 'theory', 'course_id' => $y10Id],

            // Year 11 (GCSE Mastery)
            ['name' => 'GCSE Mathematics Exam Prep & Past Papers', 'type' => 'theory', 'course_id' => $y11Id],
            ['name' => 'GCSE English Literature Text Analysis & Essay Mastery', 'type' => 'theory', 'course_id' => $y11Id],
            ['name' => 'GCSE Science Revision & Practical Skills', 'type' => 'theory', 'course_id' => $y11Id],

            // Year 12 (A-Level)
            ['name' => 'A-Level Pure Mathematics (Year 1)', 'type' => 'theory', 'course_id' => $y12Id],
            ['name' => 'A-Level Statistics & Mechanics', 'type' => 'theory', 'course_id' => $y12Id],
            ['name' => 'A-Level Physics (Mechanics & Waves)', 'type' => 'theory', 'course_id' => $y12Id],
            ['name' => 'A-Level Chemistry (Inorganic & Physical)', 'type' => 'theory', 'course_id' => $y12Id],
            ['name' => 'A-Level Biology (Biological Molecules & Cells)', 'type' => 'theory', 'course_id' => $y12Id],
            ['name' => 'A-Level Economics (Micro & Macro)', 'type' => 'theory', 'course_id' => $y12Id],

            // Year 13 (A-Level Advanced)
            ['name' => 'A-Level Pure Mathematics (Year 2 & Further Topics)', 'type' => 'theory', 'course_id' => $y13Id],
            ['name' => 'A-Level Physics (Nuclear & Quantum)', 'type' => 'theory', 'course_id' => $y13Id],
            ['name' => 'A-Level Chemistry (Organic Synthesis)', 'type' => 'theory', 'course_id' => $y13Id],
            ['name' => 'A-Level Biology (Genetics & Gene Technology)', 'type' => 'theory', 'course_id' => $y13Id],

            // GCSE Core
            ['name' => 'GCSE Core Mathematics & Problem Solving', 'type' => 'theory', 'course_id' => $gcseId],
            ['name' => 'GCSE Core English Language', 'type' => 'theory', 'course_id' => $gcseId],
            ['name' => 'GCSE Core Science Revision', 'type' => 'theory', 'course_id' => $gcseId],

            // A-Level Core
            ['name' => 'A-Level Core Mathematics Masterclass', 'type' => 'theory', 'course_id' => $aLevelId],
            ['name' => 'A-Level Core Sciences Review', 'type' => 'theory', 'course_id' => $aLevelId],
        ];

        foreach ($classSubjects as $sub) {
            if (!empty($sub['course_id'])) {
                DB::table('subjects')->insert([
                    'name' => $sub['name'],
                    'type' => $sub['type'],
                    'course_id' => $sub['course_id'],
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null,
                ]);
            }
        }

        // 4. Update Clean Specialist Teachers
        DB::table('teachers')->delete();

        $teachers = [
            [
                'id' => 1,
                'name' => 'Mr. Md Rashid',
                'designation' => 'Head of Academics & Mathematics Lead',
                'course_id' => $y5Id,
            ],
            [
                'id' => 2,
                'name' => 'Mrs. Shruti Sharma',
                'designation' => 'Lead English & Verbal Reasoning Specialist',
                'course_id' => $y5Id,
            ],
            [
                'id' => 3,
                'name' => 'Mr. Adam Smith',
                'designation' => 'Non-Verbal & Spatial Reasoning Specialist',
                'course_id' => $y4Id,
            ],
            [
                'id' => 4,
                'name' => 'Mr. Firoj Alam',
                'designation' => 'Senior Physics & Science Specialist',
                'course_id' => $y10Id,
            ],
            [
                'id' => 5,
                'name' => 'Mrs. Nazia Khan',
                'designation' => 'Lead Chemistry & Biology Specialist',
                'course_id' => $y10Id,
            ],
            [
                'id' => 6,
                'name' => 'Mr. Rohit Sharma',
                'designation' => 'Senior GCSE & A-Level Mathematics Tutor',
                'course_id' => $y11Id,
            ],
            [
                'id' => 7,
                'name' => 'Prof. Alok Bora',
                'designation' => 'Advanced A-Level Mathematics & Economics Lead',
                'course_id' => $y12Id,
            ],
            [
                'id' => 8,
                'name' => 'Mr. Tariq Khan',
                'designation' => '11+ Primary Foundation Tutor',
                'course_id' => $y3Id,
            ],
        ];

        foreach ($teachers as $t) {
            DB::table('teachers')->insert([
                'id' => $t['id'],
                'name' => $t['name'],
                'designation' => $t['designation'],
                'course_id' => $t['course_id'],
                'created_at' => $now,
                'updated_at' => $now,
                'deleted_at' => null,
            ]);
        }

        // 5. Assign Subjects to Teachers (subject_teacher pivot)
        $allSubjects = DB::table('subjects')->get();

        foreach ($allSubjects as $sub) {
            $teacherId = null;
            $name = strtolower($sub->name);

            if (str_contains($name, 'math') || str_contains($name, 'numerical') || str_contains($name, 'algebra') || str_contains($name, 'statistics')) {
                if (str_contains($name, 'a-level') || str_contains($name, 'pure')) {
                    $teacherId = 7; // Prof. Alok Bora
                } elseif (str_contains($name, 'gcse')) {
                    $teacherId = 6; // Mr. Rohit Sharma
                } elseif (str_contains($name, 'year 3') || str_contains($name, 'early')) {
                    $teacherId = 8; // Mr. Tariq Khan
                } else {
                    $teacherId = 1; // Mr. Md Rashid
                }
            } elseif (str_contains($name, 'verbal reasoning') && !str_contains($name, 'non-verbal')) {
                $teacherId = 2; // Mrs. Shruti Sharma
            } elseif (str_contains($name, 'non-verbal') || str_contains($name, 'spatial')) {
                $teacherId = 3; // Mr. Adam Smith
            } elseif (str_contains($name, 'english') || str_contains($name, 'vocabulary') || str_contains($name, 'reading') || str_contains($name, 'writing') || str_contains($name, 'literature')) {
                if (str_contains($name, 'year 3') || str_contains($name, 'early')) {
                    $teacherId = 8; // Mr. Tariq Khan
                } else {
                    $teacherId = 2; // Mrs. Shruti Sharma
                }
            } elseif (str_contains($name, 'physics') || (str_contains($name, 'science') && (str_contains($name, 'gcse') || str_contains($name, 'year 10') || str_contains($name, 'forces')))) {
                $teacherId = 4; // Mr. Firoj Alam
            } elseif (str_contains($name, 'chemistry') || str_contains($name, 'biology') || str_contains($name, 'cells') || str_contains($name, 'genetics')) {
                $teacherId = 5; // Mrs. Nazia Khan
            } elseif (str_contains($name, 'economics')) {
                $teacherId = 7; // Prof. Alok Bora
            } else {
                $teacherId = 1; // Default Mr. Md Rashid
            }

            if ($teacherId) {
                DB::table('subject_teacher')->insert([
                    'subject_id' => $sub->id,
                    'teacher_id' => $teacherId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 6. Populate Realistic Timetable Slots for key school classes
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $timeSlots = [
            ['09:00:00', '10:30:00'],
            ['11:00:00', '12:30:00'],
            ['14:00:00', '15:30:00'],
            ['16:00:00', '17:30:00'],
        ];

        // Seed timetable for Year 5, Year 4, Year 3, Year 6, Year 10, GCSE
        $targetCourses = [$y5Id, $y4Id, $y3Id, $y6Id, $y10Id, $y11Id, $gcseId];

        foreach ($targetCourses as $cId) {
            if (!$cId) continue;
            $courseSubs = DB::table('subjects')->where('course_id', $cId)->get();
            if ($courseSubs->isEmpty()) continue;

            $dayIdx = 0;
            foreach ($courseSubs as $s) {
                $teacherId = DB::table('subject_teacher')->where('subject_id', $s->id)->value('teacher_id') ?? 1;
                $day = $days[$dayIdx % count($days)];
                $slot = $timeSlots[$dayIdx % count($timeSlots)];

                DB::table('timetable')->insert([
                    'course_id' => $cId,
                    'subject_id' => $s->id,
                    'teacher_id' => $teacherId,
                    'day' => $day,
                    'time_start' => $slot[0],
                    'time_end' => $slot[1],
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null,
                ]);

                $dayIdx++;
            }
        }
    }

    public function down(): void
    {
        DB::table('subject_teacher')->truncate();
        DB::table('timetable')->truncate();
    }
};
