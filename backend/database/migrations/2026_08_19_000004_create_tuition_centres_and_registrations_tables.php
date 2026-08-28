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
        // 1. Create tuition_centres table
        if (!Schema::hasTable('tuition_centres')) {
            Schema::create('tuition_centres', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100)->unique();
                $table->string('city', 100);
                $table->text('address');
                $table->string('postcode', 20)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 2. Create centre_slots table (Centres + Day/Session time slots)
        if (!Schema::hasTable('centre_slots')) {
            Schema::create('centre_slots', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('centre_id');
                $table->string('day', 50); // Saturday, Sunday, Weekday Evening
                $table->string('session_name', 100); // Morning Session, Afternoon Session, Evening Session
                $table->time('time_start');
                $table->time('time_end');
                $table->timestamps();

                $table->foreign('centre_id')
                    ->references('id')
                    ->on('tuition_centres')
                    ->onDelete('cascade');
            });
        }

        // 3. Create student_registrations table (Normalized multi-step registrations)
        if (!Schema::hasTable('student_registrations')) {
            Schema::create('student_registrations', function (Blueprint $table) {
                $table->id();
                $table->string('ref_number', 40)->unique();
                $table->string('first_name', 100);
                $table->string('surname', 100);
                $table->string('academic_session', 20)->default('2026-2027');
                $table->string('school_year', 50);
                $table->string('gender', 20);
                $table->date('dob');
                $table->string('current_school', 255);
                $table->string('parent_first_name', 100);
                $table->string('parent_surname', 100);
                $table->string('primary_email', 255);
                $table->string('secondary_email', 255)->nullable();
                $table->string('mobile', 30);
                $table->text('address')->nullable();
                
                // Foreign key links
                $table->unsignedBigInteger('course_id')->nullable();
                $table->string('learning_style', 40)->default('Classroom'); // Classroom, Online Live, DIY
                $table->unsignedBigInteger('centre_id')->nullable();
                
                $table->string('preferred_day', 50)->nullable();
                $table->string('preferred_session', 100)->nullable();
                $table->string('target_school', 255)->nullable();
                $table->string('writing_addon', 255)->nullable();
                $table->boolean('skip_main_course')->default(false);
                $table->string('status', 30)->default('pending'); // pending, confirmed, enrolled, cancelled
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('course_id')
                    ->references('id')
                    ->on('courses')
                    ->onDelete('set null');

                $table->foreign('centre_id')
                    ->references('id')
                    ->on('tuition_centres')
                    ->onDelete('set null');
            });
        }

        // 4. Add centre_id FK to student table if not already present
        if (Schema::hasTable('student') && !Schema::hasColumn('student', 'centre_id')) {
            Schema::table('student', function (Blueprint $table) {
                $table->unsignedBigInteger('centre_id')->nullable()->after('course_id');
                $table->foreign('centre_id')
                    ->references('id')
                    ->on('tuition_centres')
                    ->onDelete('set null');
            });
        }

        // 5. Seed Real Tuition Centres and their respective Day/Time slots
        $now = Carbon::now();

        $centres = [
            [
                'id' => 1,
                'name' => 'Reading Centre',
                'city' => 'Reading',
                'address' => 'University of Reading Campus, Crescent Road',
                'postcode' => 'RG1 5RQ',
                'is_active' => true,
            ],
            [
                'id' => 2,
                'name' => 'Langley Centre',
                'city' => 'Slough / Langley',
                'address' => 'Langley Grammar & Academy Hub, Langley Road',
                'postcode' => 'SL3 7EF',
                'is_active' => true,
            ],
            [
                'id' => 3,
                'name' => 'Basingstoke Centre',
                'city' => 'Basingstoke',
                'address' => "Queen Mary's College Education Campus, Cliddesden Rd",
                'postcode' => 'RG21 3HF',
                'is_active' => true,
            ],
            [
                'id' => 4,
                'name' => 'Sutton Centre',
                'city' => 'Sutton',
                'address' => 'Sutton Grammar / Cheam Learning Centre, Manor Road',
                'postcode' => 'SM1 4AS',
                'is_active' => true,
            ],
            [
                'id' => 5,
                'name' => 'Manchester Centre',
                'city' => 'Manchester',
                'address' => 'Altrincham Grammar & Trafford Learning Hub, Cavendish Rd',
                'postcode' => 'WA14 2NP',
                'is_active' => true,
            ],
        ];

        foreach ($centres as $c) {
            DB::table('tuition_centres')->updateOrInsert(
                ['id' => $c['id']],
                [
                    'name' => $c['name'],
                    'city' => $c['city'],
                    'address' => $c['address'],
                    'postcode' => $c['postcode'],
                    'is_active' => $c['is_active'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // Populate Standard Slots per Centre
        $days = ['Saturday', 'Sunday', 'Weekday Evening (Mon - Thu)'];
        $sessions = [
            ['Morning Session (9:00 AM – 12:30 PM)', '09:00:00', '12:30:00'],
            ['Afternoon Session (1:30 PM – 5:00 PM)', '13:30:00', '17:00:00'],
            ['Evening Session (5:00 PM – 7:30 PM)', '17:00:00', '19:30:00'],
        ];

        DB::table('centre_slots')->truncate();

        foreach ($centres as $c) {
            foreach ($days as $day) {
                foreach ($sessions as $s) {
                    DB::table('centre_slots')->insert([
                        'centre_id' => $c['id'],
                        'day' => $day,
                        'session_name' => $s[0],
                        'time_start' => $s[1],
                        'time_end' => $s[2],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('student') && Schema::hasColumn('student', 'centre_id')) {
            Schema::table('student', function (Blueprint $table) {
                $table->dropForeign(['centre_id']);
                $table->dropColumn('centre_id');
            });
        }

        Schema::dropIfExists('student_registrations');
        Schema::dropIfExists('centre_slots');
        Schema::dropIfExists('tuition_centres');
    }
};
