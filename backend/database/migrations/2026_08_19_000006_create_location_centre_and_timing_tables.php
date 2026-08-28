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
        // 1. TABLE: locations (City / Area locations)
        if (!Schema::hasTable('locations')) {
            Schema::create('locations', function (Blueprint $table) {
                $table->id();
                $table->string('city_name', 100)->unique(); // e.g. Basingstoke, Reading, Langley, Sutton, Manchester
                $table->string('region', 100)->nullable();  // e.g. Hampshire, Berkshire, Greater London
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. TABLE: centres (Tuition physical branches linked to locations)
        if (!Schema::hasTable('centres')) {
            Schema::create('centres', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('location_id');
                $table->string('centre_name', 150);         // e.g. Basingstoke Tuition Hub, Reading Campus
                $table->text('address');                    // Physical address
                $table->string('postcode', 20)->nullable(); // Postcode
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('location_id')
                    ->references('id')
                    ->on('locations')
                    ->onDelete('cascade');
            });
        }

        // 3. TABLE: centre_timing_slots (Available Days, Timings and Slot availability per Centre)
        if (!Schema::hasTable('centre_timing_slots')) {
            Schema::create('centre_timing_slots', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('centre_id');
                $table->string('day_of_week', 50);          // e.g. Sunday, Saturday, Weekday Evening
                $table->string('session_timing', 100);      // e.g. 14:00 to 17:00, 09:00 to 12:30, 17:00 to 19:30
                $table->time('time_start');                 // 14:00:00
                $table->time('time_end');                   // 17:00:00
                $table->integer('max_seats')->default(30);  // Total batch capacity
                $table->boolean('is_available')->default(true); // Is slot open for new bookings
                $table->timestamps();

                $table->foreign('centre_id')
                    ->references('id')
                    ->on('centres')
                    ->onDelete('cascade');
            });
        }

        // 4. Seed Clean Real-World Data
        $now = Carbon::now();

        $locationsData = [
            ['id' => 1, 'city_name' => 'Basingstoke', 'region' => 'Hampshire'],
            ['id' => 2, 'city_name' => 'Reading', 'region' => 'Berkshire'],
            ['id' => 3, 'city_name' => 'Langley', 'region' => 'Slough / Berkshire'],
            ['id' => 4, 'city_name' => 'Sutton', 'region' => 'Greater London'],
            ['id' => 5, 'city_name' => 'Manchester', 'region' => 'Greater Manchester'],
        ];

        foreach ($locationsData as $loc) {
            DB::table('locations')->updateOrInsert(
                ['id' => $loc['id']],
                [
                    'city_name'  => $loc['city_name'],
                    'region'     => $loc['region'],
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $centresData = [
            [
                'id'          => 1,
                'location_id' => 1,
                'centre_name' => 'Basingstoke Centre',
                'address'     => "Queen Mary's College Education Campus, Cliddesden Rd",
                'postcode'    => 'RG21 3HF',
            ],
            [
                'id'          => 2,
                'location_id' => 2,
                'centre_name' => 'Reading Centre',
                'address'     => 'University of Reading Campus, Crescent Road',
                'postcode'    => 'RG1 5RQ',
            ],
            [
                'id'          => 3,
                'location_id' => 3,
                'centre_name' => 'Langley Centre',
                'address'     => 'Langley Grammar & Academy Hub, Langley Road',
                'postcode'    => 'SL3 7EF',
            ],
            [
                'id'          => 4,
                'location_id' => 4,
                'centre_name' => 'Sutton Centre',
                'address'     => 'Sutton Grammar / Cheam Learning Centre, Manor Road',
                'postcode'    => 'SM1 4AS',
            ],
            [
                'id'          => 5,
                'location_id' => 5,
                'centre_name' => 'Manchester Centre',
                'address'     => 'Altrincham Grammar & Trafford Learning Hub, Cavendish Rd',
                'postcode'    => 'WA14 2NP',
            ],
        ];

        foreach ($centresData as $c) {
            DB::table('centres')->updateOrInsert(
                ['id' => $c['id']],
                [
                    'location_id' => $c['location_id'],
                    'centre_name' => $c['centre_name'],
                    'address'     => $c['address'],
                    'postcode'    => $c['postcode'],
                    'is_active'   => true,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]
            );
        }

        // Timing Slots per Centre
        $standardDays = ['Sunday', 'Saturday', 'Weekday Evening'];
        $timings = [
            ['session' => '14:00 to 17:00', 'start' => '14:00:00', 'end' => '17:00:00'],
            ['session' => '09:00 to 12:30', 'start' => '09:00:00', 'end' => '12:30:00'],
            ['session' => '17:00 to 19:30', 'start' => '17:00:00', 'end' => '19:30:00'],
        ];

        DB::table('centre_timing_slots')->delete();

        foreach ($centresData as $c) {
            foreach ($standardDays as $day) {
                foreach ($timings as $t) {
                    DB::table('centre_timing_slots')->insert([
                        'centre_id'      => $c['id'],
                        'day_of_week'    => $day,
                        'session_timing' => $t['session'],
                        'time_start'     => $t['start'],
                        'time_end'       => $t['end'],
                        'max_seats'      => 30,
                        'is_available'   => true,
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('centre_timing_slots');
        Schema::dropIfExists('centres');
        Schema::dropIfExists('locations');
    }
};
