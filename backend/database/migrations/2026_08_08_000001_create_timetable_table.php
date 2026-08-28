<?php

/**
 * @file 2026_08_08_000001_create_timetable_table.php
 * @description Database Migration: 'timetable' table ka schema define karna.
 *
 * Migration Lifecycle:
 *   - up()   : Jab `php artisan migrate` command run hota hai, tab yeh method naya table aur columns banata hai.
 *   - down() : Jab `php artisan migrate:rollback` command run hota hai, tab yeh method table ko undo/delete (drop) karta hai.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (Database me Table Create Karna).
     *
     * @return void
     */
    public function up(): void
    {
        // Schema::create naya table 'timetable' banata hai
        Schema::create('timetable', function (Blueprint $table) {
            // 1. $table->id(): Auto-incrementing Primary Key (BIGINT UNSIGNED) banata hai
            $table->id();

            // 2. $table->string('department'): VARCHAR(255) column (e.g. 'Year 10', 'GCSE')
            $table->string('department');

            // 3. $table->enum('day', [...]): Sirf specified 7 days ki value accept karega
            $table->enum('day', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

            // 4. $table->time('time_start'): Class shuru hone ka time (HH:MM:SS)
            $table->time('time_start');

            // 5. $table->time('time_end'): Class khatam hone ka time (HH:MM:SS)
            $table->time('time_end');

            // 6. $table->string('subject'): Subject ka naam (e.g. 'Mathematics', 'Physics')
            $table->string('subject');

            // 7. ->nullable(): Yeh column optional hai (Teacher assign na ho toh empty/null reh sakta hai)
            $table->string('teacher')->nullable();

            // 8. $table->timestamps(): Do automatic columns banata hai: 'created_at' aur 'updated_at'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations (Table ko Rollback / Delete Karna).
     *
     * @return void
     */
    public function down(): void
    {
        // Agar 'timetable' table exist karta hai toh use drop (delete) kar do
        Schema::dropIfExists('timetable');
    }
};
