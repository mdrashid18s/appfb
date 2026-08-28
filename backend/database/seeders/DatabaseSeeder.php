<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Class DatabaseSeeder
 * 
 * Yeh Laravel ka Main Seeder file hai (`php artisan db:seed`).
 * 
 * Kaam:
 *   1. Initial dummy ya master data (jaise default Admin account, demo products, sample tests)
 *      ko database tables ke andar automatically insert karta hai.
 *   2. Factories ko call karke bulk testing data generate kar sakta hai.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Database me initial seed data fill karna.
     */
    public function run(): void
    {
        // Default testing user create karna
        User::factory()->create([
            'name'  => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
