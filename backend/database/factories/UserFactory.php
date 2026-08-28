<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Class UserFactory
 * 
 * Yeh Factory file Testing aur Development ke liye fake/dummy user data automatically generate karti hai.
 * 
 * Example Usage:
 *   - `User::factory()->create();` -> 1 Fake User create hoga.
 *   - `User::factory(50)->create();` -> 50 Fake Users ek click me create ho jayenge.
 * 
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Factory me use hone wala default hashed password.
     */
    protected static ?string $password;

    /**
     * Model ke fake attributes define karta hai (Name, Email, Password etc.).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Fake realistic name aur email generate karna
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'remember_token'    => Str::random(10),
        ];
    }

    /**
     * State helper: Unverified email wala user generate karne ke liye.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
