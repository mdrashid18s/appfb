<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Timetable extends Model
{
    use SoftDeletes;

    protected $table = 'timetable';
    protected $guarded = [];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id', 'id');
    }

    // ─── Query Scopes (MVC Pattern) ─────────────────────────────────────────────

    /** Eager load course, subject, and teacher relations */
    public function scopeWithDetails($query)
    {
        return $query->with(['course', 'subject', 'teacher']);
    }

    /** Filter by course ID */
    public function scopeForCourse($query, ?int $courseId)
    {
        if (!$courseId) return $query;
        return $query->where('course_id', $courseId);
    }

    /** Filter by day of week */
    public function scopeForDay($query, ?string $day)
    {
        if (!$day) return $query;
        return $query->where('day_of_week', $day);
    }

    /** Order timetable chronologically by day and time */
    public function scopeSortedBySlot($query)
    {
        return $query->orderBy('day_of_week')->orderBy('start_time');
    }
}
