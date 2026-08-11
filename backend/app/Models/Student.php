<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $table = 'student';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $guarded = [];
    protected $appends = ['department'];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    /**
     * Dynamic accessor returning course name for legacy frontend compatibility
     */
    public function getDepartmentAttribute()
    {
        return $this->course ? $this->course->code : '';
    }

    public function getCourseNameAttribute()
    {
        return $this->course ? $this->course->name : '';
    }
}
