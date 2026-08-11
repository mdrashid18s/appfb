<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTest extends Model
{
    protected $table = 'student_tests';
    protected $guarded = [];

    public function student()
    {
        return $this->belongsTo(Student::class, 'roll_no', 'roll no');
    }

    public function test()
    {
        return $this->belongsTo(TestTemplate::class, 'test_id', 'id');
    }

    public function testTemplate()
    {
        return $this->belongsTo(TestTemplate::class, 'test_id', 'id');
    }

    public function answers()
    {
        return $this->hasMany(StudentTestAnswer::class, 'student_test_id', 'id');
    }
}
