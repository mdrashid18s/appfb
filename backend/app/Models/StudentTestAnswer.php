<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTestAnswer extends Model
{
    protected $table = 'student_test_answers';
    protected $guarded = [];

    public function studentTest()
    {
        return $this->belongsTo(StudentTest::class, 'student_test_id', 'id');
    }

    public function question()
    {
        return $this->belongsTo(TestQuestion::class, 'question_id', 'id');
    }
}
