<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestTemplate extends Model
{
    use HasFactory;

    protected $table = 'tests';

    protected $fillable = [
        'group_title',
        'category',
        'code',
        'name',
        'descr',
        'questions',
        'marks',
        'duration',
        'papers',
        'question_pdf',
    ];

    public $timestamps = false; // Existing table doesn't have updated_at

    public function testQuestions()
    {
        return $this->hasMany(TestQuestion::class, 'test_id', 'id');
    }
}
