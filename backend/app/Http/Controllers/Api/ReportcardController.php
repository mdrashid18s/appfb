<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\StudentTest;
use Illuminate\Http\JsonResponse;

/**
 * Class ReportcardController
 * 
 * Yeh controller Student ke sabhi diye gaye tests ke actual scores aur assessment data
 * ko fetch karke Model dwara processed official academic Report Card & Marksheet JSON return karta hai.
 * Strict MVC: Fat Model, Skinny Controller pattern follow karta hai.
 */
class ReportcardController extends Controller
{
    /**
     * GET /api/student/reportcards
     * 
     * Student ke sabhi completed tests aur individual performance marksheet fetch karna.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getStudentReportCards(Request $request): JsonResponse
    {
        // 1. Identify Student (Query param, Authenticated user login_id, ya first active record)
        $rollNo = $request->query('roll_no');
        $user = $request->user();

        if (!$rollNo && $user) {
            $rollNo = $user->login_id ?: $user->student_id;
        }

        if (!$rollNo) {
            // Fallback: Agar parameter na mile toh pehla student_tests record ya student uthayenge
            $studentWithTests = StudentTest::whereNotNull('roll_no')->first();
            if ($studentWithTests && $studentWithTests->roll_no) {
                $rollNo = $studentWithTests->roll_no;
            } else {
                $firstStudent = Student::first();
                $rollNo = $firstStudent ? ($firstStudent->{'roll no'} ?? $firstStudent->roll_no) : null;
            }
        }

        if (!$rollNo) {
            return response()->json([
                'success' => false,
                'message' => 'No student identifier found'
            ], 404);
        }

        // 2. Fetch Student Profile using Model Helper
        $student = Student::findByIdentifier($rollNo);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student record not found for roll no: ' . $rollNo
            ], 404);
        }

        $studentRoll = $student->{'roll no'} ?? $student->roll_no ?? strval($student->id);

        // 3. Delegate Report Card Data Generation to Model (Encapsulated Business Logic)
        $reportData = StudentTest::generateReportCardData($studentRoll, $student);

        return response()->json(array_merge(['success' => true], $reportData));
    }
}
