<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->nullable();
            $table->timestamps();
        });

        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('department')->nullable();
            $table->timestamps();
        });

        // Insert initial clean master subjects
        $defaultSubjects = [
            'Computer Science',
            'Coding Practice',
            'Business Development',
            'Mathematics',
            'Personality Development (PDP)',
            'Networking',
            'English Speaking',
            'Data Structures & Algorithms',
            'Web Development',
            'Database Management Systems (DBMS)'
        ];

        foreach ($defaultSubjects as $sub) {
            DB::table('subjects')->insertOrIgnore([
                'name' => $sub,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Insert initial clean master teachers
        $defaultTeachers = [
            'Mr. Rashid',
            'Mr. Adam',
            'Mrs. Shruti',
            'Mr. Firoj',
            'Prof. Bora',
            'Mr. Khan',
            'Mrs. Nazia'
        ];

        foreach ($defaultTeachers as $t) {
            DB::table('teachers')->insertOrIgnore([
                'name' => $t,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Cleanup existing misspelled timetable entries in database
        DB::table('timetable')->where('subject', 'LIKE', '%coding paractice%')->update(['subject' => 'Coding Practice']);
        DB::table('timetable')->where('subject', 'LIKE', '%computer science%')->update(['subject' => 'Computer Science']);
        DB::table('timetable')->where('subject', 'LIKE', '%Buisness Devolopement%')->update(['subject' => 'Business Development']);
        DB::table('timetable')->where('subject', 'LIKE', '%pdp%')->update(['subject' => 'Personality Development (PDP)']);
        DB::table('timetable')->where('subject', 'LIKE', '%networking%')->update(['subject' => 'Networking']);
        DB::table('timetable')->where('subject', 'LIKE', '%mathematics%')->update(['subject' => 'Mathematics']);
        DB::table('timetable')->where('subject', 'LIKE', '%English Speaking%')->update(['subject' => 'English Speaking']);

        DB::table('timetable')->where('teacher', 'LIKE', '%mr Khan%')->update(['teacher' => 'Mr. Khan']);
        DB::table('timetable')->where('teacher', 'LIKE', '%mr Ahmed%')->update(['teacher' => 'Mr. Ahmed']);
        DB::table('timetable')->where('teacher', 'LIKE', '%proffesor Bora%')->update(['teacher' => 'Prof. Bora']);
        DB::table('timetable')->where('teacher', 'LIKE', '%Mrs Shuruti%')->update(['teacher' => 'Mrs. Shruti']);
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('teachers');
    }
};
