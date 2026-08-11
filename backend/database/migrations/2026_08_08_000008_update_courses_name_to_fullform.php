<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'BCA'  => ['name' => 'Bachelor of Computer Applications', 'code' => 'BCA'],
            'BBA'  => ['name' => 'Bachelor of Business Administration', 'code' => 'BBA'],
            'BCOM' => ['name' => 'Bachelor of Commerce', 'code' => 'BCOM'],
            'BSC'  => ['name' => 'Bachelor of Science', 'code' => 'BSC'],
            'MCA'  => ['name' => 'Master of Computer Applications', 'code' => 'MCA'],
        ];

        foreach ($map as $short => $info) {
            DB::table('courses')
                ->where('code', $short)
                ->orWhere('name', $short)
                ->update([
                    'name' => $info['name'],
                    'code' => $info['code'],
                    'updated_at' => now()
                ]);
        }
    }

    public function down(): void
    {
        $map = [
            'BCA'  => 'Bachelor of Computer Applications',
            'BBA'  => 'Bachelor of Business Administration',
            'BCOM' => 'Bachelor of Commerce',
            'BSC'  => 'Bachelor of Science',
            'MCA'  => 'Master of Computer Applications',
        ];

        foreach ($map as $short => $full) {
            DB::table('courses')
                ->where('name', $full)
                ->update([
                    'name' => $short,
                    'code' => $short,
                    'updated_at' => now()
                ]);
        }
    }
};
