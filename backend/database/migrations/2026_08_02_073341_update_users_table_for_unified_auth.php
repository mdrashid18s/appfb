<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_id')->unique()->after('id')->nullable();
            $table->string('email')->nullable()->change();
            $table->string('role')->default('student')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['login_id', 'role']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
