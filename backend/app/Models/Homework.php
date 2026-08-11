<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Homework extends Model
{
    use SoftDeletes;

    protected $table = 'homework';
    protected $guarded = [];

    protected $casts = [
        'week_start_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'id');
    }

    public function submissions()
    {
        return $this->hasMany(HomeworkSubmission::class, 'homework_id', 'id');
    }
}
