<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * Class Notification
 * 
 * Yeh Eloquent Model `notifications` database table ko represent karta hai.
 * System me sabhi announcements, homework alerts, test schedules aur submission results
 * isi model ke zariye manage aur query kiye jaate hain.
 * 
 * Architecture: Fat Model Pattern (Query Scopes & Encapsulated Business Methods)
 */
class Notification extends Model
{
    use HasFactory;

    // Recipient Types Constants
    public const RECIPIENT_ADMIN   = 'admin';
    public const RECIPIENT_STUDENT = 'student';
    public const RECIPIENT_ALL     = 'all';

    // Notification Categories Constants
    public const TYPE_INFO         = 'info';
    public const TYPE_SUCCESS      = 'success';
    public const TYPE_WARNING      = 'warning';
    public const TYPE_ANNOUNCEMENT = 'announcement';

    protected $table = 'notifications';

    protected $fillable = [
        'recipient_type',
        'student_id',
        'roll_no',
        'title',
        'message',
        'type',
        'link',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    /**
     * Scope: Recipient role ('admin' ya 'student') aur student ke roll number ke hisaab se filter karta hai.
     *
     * @param Builder $query
     * @param string $role ('student' | 'admin')
     * @param string|null $rollNo
     * @return Builder
     */
    public function scopeForRecipient(Builder $query, string $role = 'student', ?string $rollNo = null): Builder
    {
        if ($role === 'admin') {
            return $query->whereIn('recipient_type', ['admin', 'all']);
        }

        $query->whereIn('recipient_type', ['student', 'all']);

        if ($rollNo) {
            $query->where(function ($q) use ($rollNo) {
                $q->whereNull('roll_no')->orWhere('roll_no', $rollNo);
            });
        }

        return $query;
    }

    /**
     * Helper Method: Recipient ke liye latest 30 notifications descending order me fetch karta hai.
     *
     * @param string $role
     * @param string|null $rollNo
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getForRecipient(string $role = 'student', ?string $rollNo = null, int $limit = 30)
    {
        return static::forRecipient($role, $rollNo)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();
    }

    /**
     * Helper Method: Current notification ko 'is_read = true' set karta hai.
     *
     * @return bool
     */
    public function markAsRead(): bool
    {
        $this->is_read = true;
        return $this->save();
    }

    /**
     * Helper Method: Specific student ya admin ke sabhi notifications ko ek sath 'read' mark karta hai.
     *
     * @param string $role
     * @param string|null $rollNo
     * @return int Updated rows count
     */
    public static function markAllAsReadForRecipient(string $role = 'student', ?string $rollNo = null): int
    {
        return static::forRecipient($role, $rollNo)->update(['is_read' => true]);
    }
}
