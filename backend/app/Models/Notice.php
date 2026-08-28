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

    // ─── Query Scopes (MVC Pattern) ─────────────────────────────────────────────

    /** Scope: Filter by course ID or global announcements */
    public function scopeForCourse($query, ?int $courseId)
    {
        if (!$courseId) return $query;
        return $query->where(function ($q) use ($courseId) {
            $q->whereNull('course_id')->orWhere('course_id', $courseId);
        });
    }

    /** Scope: Filter by notice category */
    public function scopeByCategory($query, ?string $category)
    {
        if (empty($category) || $category === 'All') return $query;
        return $query->where('category', $category);
    }

    /** Scope: Order by latest published */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
