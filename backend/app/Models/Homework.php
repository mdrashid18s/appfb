<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class Homework extends Model
{
    use SoftDeletes;

    protected $table = 'homework';
    protected $guarded = [];

    protected $casts = [
        'week_start_date' => 'date:Y-m-d',
        'due_date'        => 'date:Y-m-d',
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

    /**
     * Model Method: Save/Overwrite an entire week's batch of homework
     */
    public static function saveWeeklyBatch(array $validated): array
    {
        $weekStartDate = Carbon::parse($validated['week_start_date'])->startOfWeek()->format('Y-m-d');
        $targetType = $validated['target_type'];
        $courseId = $validated['course_id'] ?? null;
        $rollNo = $validated['roll_no'] ?? null;

        // Delete existing records for this week & target
        $query = static::where('week_start_date', $weekStartDate)
            ->where('target_type', $targetType);

        if ($targetType === 'course') {
            $query->where('course_id', $courseId);
        } else {
            $query->where('roll_no', $rollNo);
        }
        $query->forceDelete();

        $createdCount = 0;
        foreach ($validated['items'] as $item) {
            if (empty($item['title']) && empty($item['description']) && empty($item['subject_id'])) {
                continue;
            }

            static::create([
                'target_type'     => $targetType,
                'course_id'       => $targetType === 'course' ? $courseId : null,
                'roll_no'         => $targetType === 'student' ? $rollNo : null,
                'week_start_date' => $weekStartDate,
                'day_of_week'     => $item['day_of_week'],
                'subject_id'      => !empty($item['subject_id']) ? $item['subject_id'] : null,
                'title'           => $item['title'] ?? 'Homework Assignment',
                'description'     => $item['description'] ?? '',
                'due_date'        => !empty($item['due_date']) ? $item['due_date'] : null,
            ]);
            $createdCount++;
        }

        if ($createdCount > 0) {
            $courseName = $courseId ? (Course::find($courseId)?->name ?? 'Course') : 'your course';
            Notification::create([
                'recipient_type' => 'student',
                'roll_no'        => $targetType === 'student' ? $rollNo : null,
                'title'          => 'New Weekly Homework Published 📚',
                'message'        => "Admin published {$createdCount} new homework task(s) for {$courseName} (Week of {$weekStartDate}).",
                'type'           => 'homework',
                'link'           => '/student/homework',
            ]);
        }

        return [
            'created_count'   => $createdCount,
            'week_start_date' => $weekStartDate,
        ];
    }
}
