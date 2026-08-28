<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Class StudentTest
 * 
 * Yeh model Student dwara attempt kiye gaye tests, unke scores, completion status,
 * aur academic evaluation report card data ko handle karta hai.
 * 
 * @property int $id
 * @property int $test_id
 * @property string $roll_no
 * @property string $mode
 * @property string $status
 * @property float|null $score
 * @property string|null $start_datetime
 * @property string|null $expiry_datetime
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class StudentTest extends Model
{
    protected $table = 'student_tests';
    protected $guarded = [];
    public $timestamps = false;

    /**
     * Relationship: Student record jiske roll no se test juda hai
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'roll_no', 'roll no');
    }

    /**
     * Relationship: Linked Test Template / Assessment details
     */
    public function test()
    {
        return $this->belongsTo(TestTemplate::class, 'test_id', 'id');
    }

    public function testTemplate()
    {
        return $this->belongsTo(TestTemplate::class, 'test_id', 'id');
    }

    /**
     * Relationship: Student dwara submit kiye gaye questions ke answers
     */
    public function answers()
    {
        return $this->hasMany(StudentTestAnswer::class, 'student_test_id', 'id');
    }

    /**
     * Scope: Specific student ke roll number se filter karna
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $rollNo
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForRollNo($query, $rollNo)
    {
        return $query->where('student_tests.roll_no', $rollNo);
    }

    /**
     * Scope: Test template table ke sath join karke full assessment details lana
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithTestDetails($query)
    {
        return $query->leftJoin('tests', 'student_tests.test_id', '=', 'tests.id')
            ->select(
                'student_tests.id as student_test_id',
                'student_tests.test_id',
                'student_tests.roll_no',
                'student_tests.mode',
                'student_tests.status',
                'student_tests.score',
                'student_tests.start_datetime',
                'student_tests.expiry_datetime',
                'student_tests.created_at',
                'tests.category',
                'tests.code as test_code',
                'tests.name as test_name',
                'tests.descr as test_description',
                'tests.questions as total_questions',
                'tests.marks as total_marks',
                'tests.duration as duration_minutes',
                'tests.papers as papers_count'
            )
            ->orderBy('student_tests.created_at', 'desc');
    }

    /**
     * Helper Method: Score aur Total Marks ke hisaab se Grade, Badge aur Evaluation Remarks calculate karna
     * 
     * @param float|null $score
     * @param int $maxMarks
     * @param bool $isCompleted
     * @return array
     */
    public static function calculateGradeAndRemarks(?float $score, int $maxMarks, bool $isCompleted = true): array
    {
        if (!$isCompleted || $score === null) {
            return [
                'percentage'        => null,
                'grade'             => 'Pending',
                'grade_color'       => '#64748b',
                'performance_badge' => 'Pending',
                'remarks'           => 'Assessment Pending / In Progress'
            ];
        }

        $percentage = $maxMarks > 0 ? round(($score / $maxMarks) * 100, 1) : 0;

        if ($percentage >= 90) {
            return [
                'percentage'        => $percentage,
                'grade'             => 'A*',
                'grade_color'       => '#16a34a',
                'performance_badge' => 'Outstanding Distinction',
                'remarks'           => 'Exceptional mastery of subject concepts and outstanding analytical problem-solving skills.'
            ];
        } elseif ($percentage >= 80) {
            return [
                'percentage'        => $percentage,
                'grade'             => 'A',
                'grade_color'       => '#059669',
                'performance_badge' => 'Distinction',
                'remarks'           => 'Excellent grasp of topics with high accuracy and commendable speed.'
            ];
        } elseif ($percentage >= 70) {
            return [
                'percentage'        => $percentage,
                'grade'             => 'B',
                'grade_color'       => '#0284c7',
                'performance_badge' => 'Merit',
                'remarks'           => 'Good performance with sound conceptual understanding. Minor revision recommended in complex questions.'
            ];
        } elseif ($percentage >= 60) {
            return [
                'percentage'        => $percentage,
                'grade'             => 'C',
                'grade_color'       => '#d97706',
                'performance_badge' => 'Credit',
                'remarks'           => 'Satisfactory performance. Regular practice and concept strengthening suggested.'
            ];
        } elseif ($percentage >= 50) {
            return [
                'percentage'        => $percentage,
                'grade'             => 'D',
                'grade_color'       => '#ea580c',
                'performance_badge' => 'Pass',
                'remarks'           => 'Pass achieved. Targeted homework and revision sessions recommended to elevate grades.'
            ];
        } else {
            return [
                'percentage'        => $percentage,
                'grade'             => 'E',
                'grade_color'       => '#dc2626',
                'performance_badge' => 'Needs Practice',
                'remarks'           => 'Needs structured guidance and additional practice assessments to build foundational clarity.'
            ];
        }
    }

    /**
     * Model Encapsulation: Student ke liye complete report card marksheet array generate karna
     * 
     * @param string $studentRoll
     * @param \App\Models\Student $student
     * @return array
     */
    public static function generateReportCardData(string $studentRoll, Student $student): array
    {
        // Sabhi possible identifiers collect karna (roll no, id, ya same student name records)
        $identifiers = array_unique(array_filter([
            $studentRoll,
            $student->{'roll no'},
            strval($student->id),
            $student->id
        ]));

        $studentTests = static::query()
            ->whereIn('student_tests.roll_no', $identifiers)
            ->withTestDetails()
            ->get();

        // Fallback: Agar directly match na mile, toh same student name/email se check karein
        if ($studentTests->isEmpty()) {
            $matchingRolls = Student::where('name', $student->name)
                ->orWhere('email adress', $student->{'email adress'})
                ->pluck('roll no')
                ->filter()
                ->toArray();
            
            if (!empty($matchingRolls)) {
                $studentTests = static::query()
                    ->whereIn('student_tests.roll_no', $matchingRolls)
                    ->withTestDetails()
                    ->get();
            }
        }

        $marksheets = [];
        $totalMarksScored = 0;
        $totalMaxMarks = 0;
        $completedTestsCount = 0;

        foreach ($studentTests as $st) {
            $maxMarks = intval($st->total_marks) > 0 ? intval($st->total_marks) : 100;
            $score = $st->score !== null ? floatval($st->score) : null;
            $isCompleted = ($st->status === 'completed' || $score !== null);

            $eval = static::calculateGradeAndRemarks($score, $maxMarks, $isCompleted);

            if ($isCompleted && $score !== null) {
                $totalMarksScored += $score;
                $totalMaxMarks += $maxMarks;
                $completedTestsCount++;
            }

            $marksheets[] = [
                'student_test_id'   => $st->student_test_id,
                'test_id'           => $st->test_id,
                'test_code'         => $st->test_code ?: ('TEST-' . $st->test_id),
                'test_name'         => $st->test_name ?: 'Academic Assessment Test',
                'category'          => $st->category ?: 'General Assessment',
                'total_questions'   => intval($st->total_questions) ?: 25,
                'total_marks'       => $maxMarks,
                'score_obtained'    => $score,
                'percentage'        => $eval['percentage'],
                'grade'             => $eval['grade'],
                'grade_color'       => $eval['grade_color'],
                'performance_badge' => $eval['performance_badge'],
                'remarks'           => $eval['remarks'],
                'status'            => $st->status ?: ($isCompleted ? 'completed' : 'assigned'),
                'exam_date'         => $st->created_at ? date('d M Y', strtotime($st->created_at)) : date('d M Y'),
                'duration_minutes'  => intval($st->duration_minutes) ?: 45,
            ];
        }

        // Cumulative overall statistics
        $overallPercentage = $totalMaxMarks > 0 ? round(($totalMarksScored / $totalMaxMarks) * 100, 1) : 0;
        $overallGrade = 'N/A';
        if ($completedTestsCount > 0) {
            if ($overallPercentage >= 90) $overallGrade = 'A*';
            elseif ($overallPercentage >= 80) $overallGrade = 'A';
            elseif ($overallPercentage >= 70) $overallGrade = 'B';
            elseif ($overallPercentage >= 60) $overallGrade = 'C';
            elseif ($overallPercentage >= 50) $overallGrade = 'D';
            else $overallGrade = 'E';
        }

        return [
            'student' => [
                'name'              => $student->name,
                'roll_no'           => $studentRoll,
                'department'        => $student->department ?: ($student->{'course name'} ?? 'Year 6'),
                'email'             => $student->{'email adress'} ?? $student->email,
                'parent_name'       => $student->{'parent name'} ?? null,
                'parent_phone'      => $student->{'parent mobile number'} ?? null,
                'centre'            => $student->centre ?: 'XL Education Main Campus',
                'academic_session'  => '2026 - 2027',
                'issue_date'        => date('d F Y'),
            ],
            'summary' => [
                'total_assigned_tests'  => count($studentTests),
                'completed_tests_count' => $completedTestsCount,
                'total_marks_scored'    => $totalMarksScored,
                'total_max_marks'       => $totalMaxMarks,
                'overall_percentage'    => $overallPercentage,
                'overall_grade'         => $overallGrade,
                'academic_standing'     => $overallPercentage >= 80 ? 'Distinction Scholar' : ($overallPercentage >= 60 ? 'Commended Student' : 'Active Learner'),
            ],
            'marksheets' => $marksheets
        ];
    }
}
