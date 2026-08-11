<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $table = 'notices';
    protected $fillable = ['title', 'category', 'content', 'author', 'course_id'];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
}
