<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

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

    public function centre()
    {
        return $this->belongsTo(Centre::class, 'centre_id', 'id');
    }

    public function walletTransactions()
    {
        return $this->hasMany(StudentWalletTransaction::class, 'student_id', 'id');
    }

    /**
     * Credit funds to Student Store Wallet
     */
    public function creditWallet(float $amount, string $description, ?string $referenceId = null): StudentWalletTransaction
    {
        $amount = round($amount, 2);
        $newBalance = round(((float)$this->wallet_balance) + $amount, 2);
        $this->wallet_balance = $newBalance;
        $this->save();

        return StudentWalletTransaction::create([
            'student_id'    => $this->id,
            'type'          => StudentWalletTransaction::TYPE_CREDIT,
            'amount'        => $amount,
            'description'   => $description,
            'reference_id'  => $referenceId,
            'balance_after' => $newBalance,
        ]);
    }

    /**
     * Debit funds from Student Store Wallet
     */
    public function debitWallet(float $amount, string $description, ?string $referenceId = null): StudentWalletTransaction
    {
        $amount = round($amount, 2);
        $currentBalance = (float)$this->wallet_balance;
        $deductAmount = min($amount, $currentBalance);
        $newBalance = max(0, round($currentBalance - $deductAmount, 2));

        $this->wallet_balance = $newBalance;
        $this->save();

        return StudentWalletTransaction::create([
            'student_id'    => $this->id,
            'type'          => StudentWalletTransaction::TYPE_DEBIT,
            'amount'        => $deductAmount,
            'description'   => $description,
            'reference_id'  => $referenceId,
            'balance_after' => $newBalance,
        ]);
    }

    /**
     * Dynamic accessor returning course code for frontend compatibility
     */
    public function getDepartmentAttribute()
    {
        return $this->course ? $this->course->code : '';
    }

    public function getCourseNameAttribute()
    {
        return $this->course ? $this->course->name : '';
    }

    /**
     * Model Method: Generate sequential Roll Number for the current year
     */
    public static function generateNextRollNo(?string $year = null): string
    {
        $year = $year ?: date('Y');
        $lastStudent = DB::table('student')
            ->where('roll no', 'like', $year . '%')
            ->orderBy('roll no', 'desc')
            ->first();

        if ($lastStudent && is_numeric($lastStudent->{'roll no'})) {
            return strval(intval($lastStudent->{'roll no'}) + 1);
        }

        return $year . '0001';
    }

    /**
     * Model Method: Create student and automatically generate linked user credentials
     */
    public static function createWithUserCredentials(array $studentData, string $rawPassword = null): array
    {
        $rollNo = static::generateNextRollNo();
        $studentData['roll no'] = $rollNo;

        $student = static::create($studentData);

        $user = User::where('login_id', $rollNo)->orWhere('student_id', $student->id)->first();
        if (!$user) {
            $user = new User();
        }

        $user->name = $studentData['name'] ?? 'Student';
        $user->login_id = $rollNo;
        $user->email = $studentData['email adress'] ?? null;
        $user->password = \Illuminate\Support\Facades\Hash::make($rawPassword ?: 'Student@123');
        $user->role = 'student';
        $user->student_id = $student->id;

        try {
            $user->save();
        } catch (\Exception $ue) {
            // In case email unique constraint triggers in users table
            $user->email = $rollNo . '_' . ($studentData['email adress'] ?? 'student@xleducation.co.uk');
            $user->save();
        }

        return [
            'student' => $student,
            'user'    => $user,
            'roll_no' => $rollNo,
        ];
    }

    /**
     * Scope / Helper: Find student by roll number, id, email, user login_id, or name
     *
     * @param string|int $identifier
     * @return \App\Models\Student|null
     */
    public static function findByIdentifier($identifier)
    {
        if (!$identifier) {
            return null;
        }

        // 1. Direct match on roll no, id, or email
        $student = static::where('roll no', $identifier)
            ->orWhere('id', $identifier)
            ->orWhere('email adress', $identifier)
            ->first();

        if ($student) {
            return $student;
        }

        // 2. Match via linked User login_id or email
        $user = User::where('login_id', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if ($user && $user->student_id) {
            $student = static::find($user->student_id);
            if ($student) {
                return $student;
            }
        }

        // 3. Match by student name
        return static::where('name', $identifier)
            ->orWhere('name', 'like', '%' . $identifier . '%')
            ->first();
    }
}
