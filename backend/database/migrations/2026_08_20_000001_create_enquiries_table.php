<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('enquiries')) {
            Schema::create('enquiries', function (Blueprint $table) {
                $table->id();
                $table->string('parent_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('child_year')->nullable();
                $table->string('branch')->nullable();
                $table->string('subject')->nullable();
                $table->text('message');
                $table->enum('type', ['general', 'branch_enquiry', 'franchise_enquiry', 'feedback'])->default('general');
                $table->enum('status', ['new', 'in_progress', 'replied', 'closed'])->default('new');
                $table->text('admin_reply')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
