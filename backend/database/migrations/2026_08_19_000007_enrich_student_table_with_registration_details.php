<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing registration fields to student table
        Schema::table('student', function (Blueprint $table) {
            if (!Schema::hasColumn('student', 'academic_session')) {
                $table->string('academic_session', 30)->default('2026-2027')->after('dob');
            }
            if (!Schema::hasColumn('student', 'gender')) {
                $table->string('gender', 20)->default('Male')->after('academic_session');
            }
            if (!Schema::hasColumn('student', 'current_school')) {
                $table->string('current_school', 255)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('student', 'parent_name')) {
                $table->string('parent_name', 150)->nullable()->after('current_school');
            }
            if (!Schema::hasColumn('student', 'secondary_email')) {
                $table->string('secondary_email', 255)->nullable()->after('email adress');
            }
            if (!Schema::hasColumn('student', 'target_school')) {
                $table->string('target_school', 255)->nullable()->after('course_id');
            }
            if (!Schema::hasColumn('student', 'learning_style')) {
                $table->string('learning_style', 40)->default('Classroom')->after('target_school');
            }
            if (!Schema::hasColumn('student', 'preferred_day')) {
                $table->string('preferred_day', 50)->default('Sunday')->after('centre_id');
            }
            if (!Schema::hasColumn('student', 'preferred_session')) {
                $table->string('preferred_session', 100)->default('14:00 to 17:00')->after('preferred_day');
            }
            if (!Schema::hasColumn('student', 'writing_addon')) {
                $table->string('writing_addon', 255)->nullable()->after('preferred_session');
            }
        });

        // 2. Realistic seed pools
        $prepSchools = [
            "St Edward's Prep School, Reading",
            "Crosfields School, Shinfield",
            "The Abbey Junior School, Reading",
            "Dolphin School, Wokingham",
            "Waverley Preparatory School",
            "Lambrook School, Winkfield",
            "Upton House School, Windsor",
            "Long Close School, Slough",
            "St George's School, Windsor Castle",
            "Cheam School, Headley",
            "Altrincham Preparatory School",
            "Bowdon Preparatory School for Girls",
            "Basingstoke Junior Academy",
            "Sutton Grammar Junior Feeder",
            "St Bernard's Prep School, Slough"
        ];

        $targetSchools = [
            "Reading School (Boys Grammar)",
            "Kendrick School (Girls Grammar)",
            "Slough Consortium (Herschel / Langley / Upton Court)",
            "Queen Elizabeth's School (Barnet)",
            "Tiffin Girls' School, Kingston",
            "Tiffin School (Boys), Kingston",
            "Altrincham Grammar School for Boys",
            "Altrincham Grammar School for Girls",
            "Henrietta Barnett School, Hampstead",
            "Sutton Grammar School for Boys",
            "Wallington County Grammar School",
            "Wilson's School, Wallington",
            "Chelmsford County High School for Girls",
            "King Edward VI Grammar School (KEGS)"
        ];

        $parentFirstNames = [
            'David', 'Rajesh', 'Farooq', 'Dr. Anand', 'Sarah', 'Vikram', 'Michael',
            'Sanjay', 'Imran', 'Dr. Priya', 'Robert', 'Amit', 'Tariq', 'Sunita',
            'Andrew', 'Ramesh', 'Zubair', 'Anita', 'Christopher', 'Naveen'
        ];

        $days = ['Sunday', 'Saturday', 'Weekday Evening'];
        $sessions = ['14:00 to 17:00', '09:00 to 12:30', '17:00 to 19:30'];
        $styles = ['Classroom', 'Classroom', 'Classroom', 'Online Live', 'DIY'];
        $writingAddons = [
            'Full 11+ Writing Course',
            'Creative Writing Intensive',
            'Vocabulary & Comprehension Booster',
            'None'
        ];

        // 3. Update existing student records in batches
        $students = DB::table('student')->get();
        foreach ($students->chunk(200) as $chunk) {
            foreach ($chunk as $std) {
                $nameParts = explode(' ', trim($std->name));
                $surname = count($nameParts) > 1 ? end($nameParts) : 'Parent';
                $parentFirst = $parentFirstNames[array_rand($parentFirstNames)];
                $parentFullName = $parentFirst . ' ' . $surname;

                $gender = (rand(0, 1) === 1) ? 'Male' : 'Female';
                $learningStyle = $styles[array_rand($styles)];
                $currentSchool = $prepSchools[array_rand($prepSchools)];
                $targetSchool = $targetSchools[array_rand($targetSchools)];
                $day = $days[array_rand($days)];
                $session = $sessions[array_rand($sessions)];
                $writing = $writingAddons[array_rand($writingAddons)];
                $secondaryEmail = strtolower($parentFirst . '.' . $surname . rand(1, 99) . '@gmail.com');

                DB::table('student')->where('id', $std->id)->update([
                    'academic_session'  => '2026-2027',
                    'gender'            => $gender,
                    'current_school'    => $currentSchool,
                    'parent_name'       => $parentFullName,
                    'secondary_email'   => $secondaryEmail,
                    'target_school'     => $targetSchool,
                    'learning_style'    => $learningStyle,
                    'preferred_day'     => $day,
                    'preferred_session' => $session,
                    'writing_addon'     => $writing,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('student', function (Blueprint $table) {
            $table->dropColumn([
                'academic_session',
                'gender',
                'current_school',
                'parent_name',
                'secondary_email',
                'target_school',
                'learning_style',
                'preferred_day',
                'preferred_session',
                'writing_addon'
            ]);
        });
    }
};
