<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MigrateUsers extends Command
{
    protected $signature = 'app:migrate-users';
    protected $description = 'Migrate existing students to the new users table and add default admin.';

    public function handle()
    {
        // 1. Create Admin
        DB::table('users')->updateOrInsert(
            ['login_id' => 'rashid'],
            [
                'name' => 'Rashid Admin',
                'email' => 'rashid@example.com',
                'password' => Hash::make('rashid123'),
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $this->info("Admin user created.");

        // 2. Migrate Students
        $students = DB::table('student')->get();
        foreach ($students as $student) {
            DB::table('users')->updateOrInsert(
                ['login_id' => $student->{'roll no'}],
                [
                    'name' => $student->name,
                    'email' => $student->{'email adress'} ?? null,
                    'password' => Hash::make($student->password),
                    'role' => 'student',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
        $this->info("Migrated " . $students->count() . " students to the users table.");
    }
}
