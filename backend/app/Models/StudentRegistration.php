<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentRegistration extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ENROLLED  = 'enrolled';
    public const STATUS_CANCELLED = 'cancelled';

    protected $table = 'student_registrations';

    protected $fillable = [
        'ref_number',
        'first_name',
        'surname',
        'academic_session',
        'school_year',
        'gender',
        'dob',
        'current_school',
        'parent_first_name',
        'parent_surname',
        'primary_email',
        'secondary_email',
        'mobile',
        'address',
        'course_id',
        'learning_style',
        'centre_id',
        'preferred_day',
        'preferred_session',
        'target_school',
        'writing_addon',
        'skip_main_course',
        'status',
    ];

    protected $casts = [
        'dob'              => 'date',
        'skip_main_course' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function centre()
    {
        return $this->belongsTo(Centre::class, 'centre_id', 'id');
    }

    /**
     * Model Method: Get all registrations with course & centre relationships
     */
    public static function getAllWithDetails(?string $status = null)
    {
        $query = static::with(['course', 'centre'])->orderBy('created_at', 'desc');
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        return $query->get();
    }

    /**
     * Model Method: Update registration status
     */
    public function updateStatus(string $newStatus): bool
    {
        $this->status = $newStatus;
        return $this->save();
    }

    /**
     * Model Method: Check if a student is already registered with given email
     * Checks in student_registrations, student table, and users table.
     * Ek student dubara register nahi kar sakta.
     */
    public static function isDuplicateStudent(string $email, ?string $firstName = null, ?string $surname = null): bool
    {
        $email = strtolower(trim($email));
        if (empty($email)) {
            return false;
        }

        // 1. Check in student_registrations table
        $regQuery = static::where(function ($q) use ($email) {
            $q->whereRaw('LOWER(primary_email) = ?', [$email])
              ->orWhereRaw('LOWER(secondary_email) = ?', [$email]);
        });

        if (!empty($firstName)) {
            $regQuery->where('first_name', 'LIKE', trim($firstName));
        }
        if (!empty($surname)) {
            $regQuery->where('surname', 'LIKE', trim($surname));
        }

        if ($regQuery->exists()) {
            return true;
        }

        // 2. Check in student table (email address match)
        $studentExists = \App\Models\Student::where(function ($q) use ($email) {
            $q->whereRaw('LOWER(`email adress`) = ?', [$email])
              ->orWhereRaw('LOWER(`email_adress`) = ?', [$email])
              ->orWhereRaw('LOWER(`email`) = ?', [$email]);
        })->exists();

        if ($studentExists) {
            return true;
        }

        // 3. Check in users table (email already registered as student user)
        $userExists = \App\Models\User::whereRaw('LOWER(email) = ?', [$email])
            ->where('role', 'student')
            ->exists();

        return $userExists;
    }

    /**
     * Model Method: Check if email is already registered (backward compatibility)
     */
    public static function isEmailAlreadyRegistered(string $email): bool
    {
        return static::isDuplicateStudent($email);
    }
}
