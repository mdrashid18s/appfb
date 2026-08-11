<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestQuestion extends Model
{
    protected $table = 'test_questions';
    protected $guarded = [];

    public function test()
    {
        return $this->belongsTo(Test::class, 'test_id', 'id');
    }
}
