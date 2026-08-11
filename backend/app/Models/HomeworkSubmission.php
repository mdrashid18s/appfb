<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeworkSubmission extends Model
{
    use HasFactory;

    protected $table = 'homework_submissions';

    protected $fillable = [
        'homework_id',
        'student_id',
        'roll_no',
        'student_name',
        'status',
        'attachment_photo',
        'remarks',
        'teacher_grade',
        'teacher_remarks',
        'submitted_at',
    ];

    public function homework()
    {
        return $this->belongsTo(Homework::class, 'homework_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
