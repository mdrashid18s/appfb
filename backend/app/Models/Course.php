<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $table = 'courses';
    protected $guarded = [];

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'course_id', 'id');
    }

    public function teachers()
    {
        return $this->hasMany(Teacher::class, 'course_id', 'id');
    }

    public function timetableSlots()
    {
        return $this->hasMany(Timetable::class, 'course_id', 'id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'course_id', 'id');
    }

    /**
     * Model Method: Fuzzy match course ID by course title or code
     */
    public static function findMatchingCourse(?string $courseName): ?int
    {
        if (!$courseName) {
            return null;
        }

        $courseId = static::where('name', $courseName)
            ->orWhere('code', $courseName)
            ->value('id');

        if (!$courseId) {
            foreach (static::all() as $c) {
                if (str_contains(strtolower($courseName), strtolower($c->code)) ||
                    str_contains(strtolower($c->name), strtolower(explode('–', $courseName)[0] ?? ''))) {
                    return $c->id;
                }
            }
        }

        return $courseId;
    }
}
