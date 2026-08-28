<?php

/**
 * @file AdminController.php
 * @description Admin Panel ke sare Operations ka Controller.
 *
 * Yeh controller admin-facing sare features handle karta hai:
 *   - Admin login (hardcoded credentials - simple auth)
 *   - Test templates ki list dekhna
 *   - Naya test template create karna
 *   - Sare students ki list dekhna
 *   - Students ko test assign karna (scheduling ke sath)
 *   - Kisi test ke assigned students dekhna
 *   - Student ko test se remove karna
 *   - Test template delete karna
 *   - Test ke MCQ questions dekhna / add karna / delete karna
 *
 * @namespace App\Http\Controllers\Api
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; // Laravel ka base Controller
use Illuminate\Http\Request;          // HTTP request access
use App\Models\TestTemplate;          // tests table Model
use App\Models\TestQuestion;          // test_questions table Model
use App\Models\Student;               // students table Model
use App\Models\StudentTest;           // student_tests table Model
use App\Models\Course;                // courses table Model
use App\Models\Subject;               // subjects table Model
use App\Models\Teacher;               // teachers table Model
use App\Models\Timetable;             // timetable table Model
use App\Models\Notice;                // notices table Model
use App\Models\User;                  // users table Model
use App\Models\Centre;
use App\Models\CentreTimingSlot;
use App\Models\Location;
use App\Models\Enquiry;
use App\Models\StudentRegistration;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;

/**
 * AdminController Class
 *
 * Admin ki saari functionality is ek controller mein hai.
 * Note: Admin routes abhi authentication protected nahi hain (public hain).
 * Production mein admin middleware zaroor add karna chahiye.
 */
class AdminController extends Controller
{
    /**
     * login() - Admin Login
     *
     * Supports login with ID, login_id, username, or email.
     */
    public function login(Request $request)
    {
        $id = $request->input('login_id') ?? $request->input('id') ?? $request->input('username') ?? $request->input('email');
        $password = $request->input('password');

        if (!$id || !$password) {
            return response()->json([
                'success' => false,
                'message' => 'Admin ID / Username and Password are required.'
            ], 422);
        }

        $cleanId = strtolower(trim($id));
        $cleanPassword = trim($password);

        // 1. Hardcoded admin credentials check
        if (($cleanId === 'rashid' || $cleanId === 'admin' || $cleanId === 'admin@xleducation.co.uk') && 
            ($cleanPassword === 'rashid123' || $cleanPassword === 'admin123' || $cleanPassword === 'rashid')) {
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'admin'   => [
                    'id'    => 'rashid',
                    'name'  => 'Rashid (Admin)',
                    'email' => 'admin@xleducation.co.uk',
                    'role'  => 'admin'
                ]
            ]);
        }

        // 2. Database Users check for role 'admin'
        $user = User::where('role', 'admin')
            ->where(function ($q) use ($cleanId) {
                $q->where('email', $cleanId)
                  ->orWhere('login_id', $cleanId)
                  ->orWhere('username', $cleanId);
            })
            ->first();

        if ($user && Hash::check($cleanPassword, $user->password)) {
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'admin'   => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'admin'
                ]
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
    }

    /**
     * getTests() - Sare Test Templates Fetch Karo
     *
     * Admin dashboard ke liye sare tests ki list return karta hai.
     * Har test ke sath yeh bhi batata hai ki kitne students ko assign kiya gaya hai.
     *
     * Process:
     *   1. tests table se sare records fetch karo (latest first)
     *   2. Har test ke liye student_tests table mein count karo (assigned students)
     *   3. Har test object mein assigned_count property add karo
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTests()
    {
        $tests = TestTemplate::getAllWithCounts();
        
        return response()->json(['success' => true, 'tests' => $tests]);
    }

    /**
     * storeTest() - Naya Test Template Create Karo
     *
     * Admin ke "Create Test" form se data lekar database mein naya test template save karta hai.
     *
     * Validation rules:
     *   - category, code, name, questions_count, total_marks, duration: required
     *   - description: optional (nullable)
     *   - papers_count: required aur numeric
     *
     * @param Request $request - POST request with test form data
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeTest(Request $request)
    {
        // Input validation
        $request->validate([
            'category' => 'required|string',           // Mock/Weekly/Milestone/etc.
            'code' => 'required|string',               // Unique test code (MTF-01)
            'name' => 'required|string',               // Test ka naam
            'description' => 'nullable|string',        // Optional description
            'questions_count' => 'required|string',    // Total questions count
            'total_marks' => 'required|string',        // Total marks
            'duration' => 'required|string',           // Duration in minutes
            'papers_count' => 'required|numeric',      // Number of papers (1, 2, etc.)
            'question_pdf' => 'nullable|file|mimes:pdf|max:10240', // Max 10MB PDF
        ]);

        $pdfPath = null;
        if ($request->hasFile('question_pdf')) {
            $pdfPath = $request->file('question_pdf')->store('question_pdfs', 'public');
        }

        // TestTemplate::create() Eloquent Model ka create method
        // Yeh array mein diye values se naya record INSERT karta hai
        $test = TestTemplate::create([
            'group_title' => '',                           // Abhi unused field
            'category' => $request->category,             // Test category
            'code' => $request->code,                     // Test code
            'name' => $request->name,                     // Test naam
            'descr' => $request->description ?? '',        // Description (ya empty string)
            'questions' => $request->questions_count,      // Total questions
            'marks' => $request->total_marks,              // Total marks
            'duration' => $request->duration,              // Duration
            'papers' => $request->papers_count,            // Papers count
            'question_pdf' => $pdfPath,                    // PDF Path
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Test template created successfully',
            'test' => $test // Naya created test object return karo
        ]);
    }

    /**
     * uploadTestPdf() - Upload PDF for an existing test
     */
    public function uploadTestPdf(Request $request, $id)
    {
        $request->validate([
            'question_pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        $test = TestTemplate::findOrFail($id);

        if ($request->hasFile('question_pdf')) {
            $pdfPath = $request->file('question_pdf')->store('question_pdfs', 'public');
            $test->update(['question_pdf' => $pdfPath]);
            return response()->json([
                'success' => true,
                'message' => 'Test PDF uploaded successfully.',
                'question_pdf' => $pdfPath
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No file provided.'], 400);
    }


    /**
     * getStudents() - Sare Students Ki List Fetch Karo
     *
     * Assign Test modal ke liye students ki list deta hai.
     *
     * Note: Column aliases use kiye hain kyunki database columns mein spaces hain:
     *   'roll no' → roll_no    (Frontend mein easy access ke liye)
     *   'email adress' → email  (Frontend mein easy access ke liye)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudents()
    {
        $students = Student::with(['course', 'centre.location'])
            ->orderBy('name')
            ->get()
            ->map(function ($s) {
                $deptCode = $s->course ? $s->course->code : ($s->department ?: 'General');
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'roll_no' => $s->{'roll no'} ?? ('STU-' . $s->id),
                    'email' => $s->{'email adress'} ?? '',
                    'secondary_email' => $s->secondary_email ?? '',
                    'phone_no' => $s->{'phone no'} ? '0' . $s->{'phone no'} : '',
                    'gender' => $s->gender ?? 'Male',
                    'dob' => $s->dob ?? '',
                    'academic_session' => $s->academic_session ?? '2026-2027',
                    'parent_name' => $s->parent_name ?? '',
                    'current_school' => $s->current_school ?? '',
                    'target_school' => $s->target_school ?? '',
                    'learning_style' => $s->learning_style ?? 'Classroom',
                    'writing_addon' => $s->writing_addon ?? 'Full 11+ Writing Course',
                    'centre_id' => $s->centre_id,
                    'centre_name' => $s->centre ? $s->centre->centre_name : 'Basingstoke Centre',
                    'centre_address' => $s->centre ? ($s->centre->address . ($s->centre->postcode ? ', ' . $s->centre->postcode : '')) : '',
                    'preferred_day' => $s->preferred_day ?? 'Sunday',
                    'preferred_session' => $s->preferred_session ?? '14:00 to 17:00',
                    'address' => $s->adress ?? '',
                    'course_id' => $s->course_id,
                    'department' => $deptCode,
                    'course_name' => $s->course ? $s->course->name : ''
                ];
            });
                    
        return response()->json(['success' => true, 'students' => $students]);
    }

    /**
     * assignTest() - Students Ko Test Assign Karo
     *
     * Ek test ko multiple students ke roll numbers par assign karta hai.
     * Scheduling support hai (start datetime + expiry datetime).
     *
     * Duplicate prevention: Agar student ko woh test already assign hai to skip karo.
     *
     * Batch insert use karta hai performance ke liye (ek baar mein sare records insert).
     *
     * @param Request $request - POST request with { test_id, roll_nos[], config{} }
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignTest(Request $request)
    {
        $request->validate([
            'test_id' => 'required|integer',
            'roll_nos' => 'required|array', // Array of roll numbers
        ]);

        $testId = $request->test_id;           // Kaunsa test assign ho raha hai
        $rollNos = $request->roll_nos;          // Kaunse students ko
        $config = $request->config ?? [];      // Schedule + mode config (optional)

        $now = now(); // Current timestamp (sare records mein same time)
        $inserts = []; // Batch insert array
        
        $assignedCount = 0;
        $duplicateCount = 0;

        foreach ($rollNos as $rollNo) {
            // Duplicate prevention: Pehle check karo ki assignment already exist karta hai
            $exists = \Illuminate\Support\Facades\DB::table('student_tests')
                        ->where('test_id', $testId)
                        ->where('roll_no', $rollNo)
                        ->exists(); // Boolean return karta hai
            
            if (!$exists) {
                $startDateTime = null;
                if (!empty($config['startDate']) && !empty($config['startTime'])) {
                    // Always extract just the HH:mm part and append :00
                    $timePrefix = substr($config['startTime'], 0, 5);
                    $startDateTime = $config['startDate'] . ' ' . $timePrefix . ':00';
                }
                
                // Expiry datetime combine karo
                $expiryDateTime = null;
                if (!empty($config['expiryDate']) && !empty($config['expiryTime'])) {
                    $timePrefix = substr($config['expiryTime'], 0, 5);
                    $expiryDateTime = $config['expiryDate'] . ' ' . $timePrefix . ':00';
                }

                // Batch array mein naya record add karo
                $inserts[] = [
                    'test_id' => $testId,
                    'roll_no' => $rollNo,
                    'status' => 'assigned',    // Default status
                    'score' => null,           // Initial score null (pending)
                    // Mode: "Online (Web Browser)" → "online", "Offline..." → "offline"
                    'mode' => strtolower(explode(' ', $config['mode'] ?? 'online')[0]),
                    'start_datetime' => $startDateTime,
                    'expiry_datetime' => $expiryDateTime,
                    'label' => null,           // Future use ke liye
                    'stamp_type' => null,      // Future use ke liye
                    'action_type' => null,     // Future use ke liye
                    'created_at' => $now,
                ];
                $assignedCount++;
            } else {
                $duplicateCount++;
            }
        }

        if ($assignedCount === 0 && $duplicateCount > 0) {
            return response()->json([
                'success' => false, 
                'message' => "All {$duplicateCount} selected student(s) already have this test. No new assignments made."
            ]);
        }

        // Ek baar mein sare records insert karo (efficient batch operation)
        if (!empty($inserts)) {
            \Illuminate\Support\Facades\DB::table('student_tests')->insert($inserts);

            $test = \App\Models\Test::find($testId);
            $testName = $test ? $test->name : 'New Practice Test';
            \App\Models\Notification::create([
                'recipient_type' => 'student',
                'title' => 'New Test Paper Assigned 📝',
                'message' => "Admin assigned new test '{$testName}' to your student account.",
                'type' => 'test',
                'link' => '/student',
            ]);
        }

        $msg = "Test assigned to {$assignedCount} student(s) successfully.";
        if ($duplicateCount > 0) {
            $msg .= " ({$duplicateCount} student(s) were skipped as they already had it).";
        }

        return response()->json(['success' => true, 'message' => $msg]);
    }

    /**
     * getAssignedStudents() - Kisi Test Ke Assigned Students Fetch Karo
     *
     * student_tests table ko student table se JOIN karke
     * is test ke sare assigned students ki details return karta hai.
     *
     * @param int $id - URL parameter: Test ka ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssignedStudents($id)
    {
        $studentTests = StudentTest::with(['student.course'])
            ->where('test_id', $id)
            ->get();

        $students = $studentTests->map(function ($st) {
            $student = $st->student;
            return [
                'id' => $student ? $student->id : null,
                'student_test_id' => $st->id,
                'name' => $student ? $student->name : null,
                'roll_no' => $st->roll_no,
                'department' => $student ? ($student->department ?: 'General') : 'General',
                'email' => $student ? $student->{'email adress'} : null,
                'mode' => $st->mode,
                'status' => $st->status,
                'score' => $st->score,
            ];
        })->sortBy('name')->values();
            
        return response()->json(['success' => true, 'students' => $students]);
    }

    /**
     * removeStudent() - Kisi Student Ko Test Se Remove Karo
     *
     * student_tests table se specific record delete karta hai.
     * Iske baad student ko woh test nahi dikhega.
     *
     * @param Request $request - POST request with { roll_no }
     * @param int $id - URL parameter: Test ka ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeStudent(Request $request, $id)
    {
        $request->validate([
            'roll_no' => 'required|string',
        ]);

        // student_tests mein is test_id + roll_no wala record delete karo
        \Illuminate\Support\Facades\DB::table('student_tests')
            ->where('test_id', $id)           // Kaunse test se
            ->where('roll_no', $request->roll_no) // Kaun sa student
            ->delete();

        return response()->json(['success' => true, 'message' => 'Student removed from test']);
    }

    /**
     * deleteTemplate() - Test Template aur Uske Assignments Delete Karo
     *
     * Pehle student_tests table se is test ke sare assignments delete karta hai.
     * Phir tests table se test template delete karta hai.
     *
     * Yeh manual deletion isliye hai kyunki foreign key cascade configured nahi hai.
     * Production mein ON DELETE CASCADE add karna chahiye database mein.
     *
     * @param int $id - URL parameter: Test ka ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteTemplate($id)
    {
        try {
            // Step 1: Pehle sare assignments delete karo (foreign key constraint se bachne ke liye)
            \Illuminate\Support\Facades\DB::table('student_tests')
                ->where('test_id', $id)
                ->delete();
            
            // Step 2: Test template delete karo
            \Illuminate\Support\Facades\DB::table('tests')
                ->where('id', $id)
                ->delete();
            
            return response()->json(['success' => true, 'message' => 'Template deleted successfully']);
        } catch (\Exception $e) {
            // Koi bhi database error catch karo
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template: ' . $e->getMessage()
            ], 500); // 500 = Internal Server Error
        }
    }

    /**
     * getQuestions() - Kisi Test Ke Sare MCQ Questions Fetch Karo
     *
     * ManageQuestionsModal mein existing questions display karne ke liye.
     *
     * @param int $id - URL parameter: Test ka ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getQuestions($id)
    {
        // is test_id wale sare questions nikalo
        $questions = TestQuestion::where('test_id', $id)->get();
        return response()->json(['success' => true, 'questions' => $questions]);
    }

    /**
     * storeQuestion() - Kisi Test Mein Naya MCQ Question Add Karo
     *
     * Question add karne ke baad tests table mein questions count bhi update karta hai.
     * Yeh ensure karta hai ki test card par dikhne wala question count accurate rahe.
     *
     * @param Request $request - POST request with question data
     * @param int $id - URL parameter: Test ka ID (jisme question add ho raha hai)
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeQuestion(Request $request, $id)
    {
        // Input validation
        $request->validate([
            'question_text' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_option' => 'required|in:A,B,C,D', // Sirf A/B/C/D valid hain
            'marks' => 'required|integer',              // Marks integer hona chahiye
        ]);

        // Naya question create karo Eloquent Model se
        $question = TestQuestion::create([
            'test_id' => $id,                              // Kaunse test mein
            'question_text' => $request->question_text,    // Question ka text
            'option_a' => $request->option_a,             // Option A
            'option_b' => $request->option_b,             // Option B
            'option_c' => $request->option_c,             // Option C
            'option_d' => $request->option_d,             // Option D
            'correct_option' => $request->correct_option, // Sahi jawab (A/B/C/D)
            'marks' => $request->marks,                   // Is question ke marks
        ]);

        // Tests table mein questions count automatically update karo
        // (Manual sync kyunki alag tables hain)
        $count = TestQuestion::where('test_id', $id)->count(); // Total questions ab
        \Illuminate\Support\Facades\DB::table('tests')
            ->where('id', $id)
            ->update(['questions' => $count]); // Accurate count store karo

        return response()->json([
            'success' => true,
            'message' => 'Question added successfully',
            'question' => $question, // Naya question object return karo
            'count' => $count
        ]);
    }

    /**
     * deleteQuestion() - Kisi Test Ka Specific Question Delete Karo
     *
     * Question delete karne ke baad tests table mein questions count bhi update karta hai.
     * Double WHERE ensure karta hai ki sirf is test ka yeh specific question delete ho.
     *
     * @param int $testId    - Test ka ID
     * @param int $questionId - Delete hone wale question ka ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteQuestion($testId, $questionId)
    {
        try {
            // Double condition: test_id + question id dono match hone chahiye
            // (Security: koi doosre test ka question delete na ho sake)
            TestQuestion::where('id', $questionId)
                        ->where('test_id', $testId)
                        ->delete();
            
            // Questions count recalculate karke tests table update karo
            $count = TestQuestion::where('test_id', $testId)->count();
            \Illuminate\Support\Facades\DB::table('tests')
                ->where('id', $testId)
                ->update(['questions' => $count]);
            
            return response()->json([
                'success' => true, 
                'message' => 'Question deleted successfully',
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete question'], 500);
        }
    }

    /**
     * getStudentAnswers() - Fetch uploaded answers for a specific student test
     */
    public function getStudentAnswers($studentTestId)
    {
        $answers = \Illuminate\Support\Facades\DB::table('student_uploaded_answers')
            ->where('student_test_id', $studentTestId)
            ->get();
            
        return response()->json([
            'success' => true,
            'answers' => $answers
        ]);
    }

    /**
     * gradeStudentTest() - Assign marks to a student's test submission
     *
     * @param Request $request
     * @param int $studentTestId
     * @return \Illuminate\Http\JsonResponse
     */
    public function gradeStudentTest(Request $request, $studentTestId)
    {
        $request->validate([
            'score' => 'required|numeric|min:0|max:100'
        ]);

        $studentTest = \Illuminate\Support\Facades\DB::table('student_tests')->where('id', $studentTestId)->first();
        
        if (!$studentTest) {
            return response()->json(['success' => false, 'message' => 'Student test record not found'], 404);
        }

        \Illuminate\Support\Facades\DB::table('student_tests')
            ->where('id', $studentTestId)
            ->update([
                'score' => $request->score,
                'status' => 'completed'
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Score updated successfully',
            'score' => $request->score
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    /**
     * getAllTimetable() - Fetch all active timetable slots with 3NF relational joins

     * GET /api/admin/timetable
     */
    public function getAllTimetable()
    {
        $slots = Timetable::withDetails()
            ->orderByRaw("FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')")
            ->orderBy('time_start')
            ->get()
            ->map(function ($slot) {
                return [
                    'id' => $slot->id,
                    'course_id' => $slot->course_id,
                    'subject_id' => $slot->subject_id,
                    'teacher_id' => $slot->teacher_id,
                    'day' => $slot->day,
                    'time_start' => $slot->time_start,
                    'time_end' => $slot->time_end,
                    'department' => $slot->course ? $slot->course->name : null,
                    'subject' => $slot->subject ? $slot->subject->name : null,
                    'teacher' => $slot->teacher ? $slot->teacher->name : null,
                ];
            });

        return response()->json(['success' => true, 'slots' => $slots]);
    }

    /**
     * getTimetable($department) - Fetch active timetable for specific course/department by name or course_id
     * GET /api/timetable/{department}
     */
    public function getTimetable($department)
    {
        $query = Timetable::with(['course', 'subject', 'teacher']);
        $dept = trim(urldecode($department));

        if (is_numeric($dept)) {
            $course = Course::find($dept);
            if ($course) {
                $courseIds = Course::where('name', $course->name)
                    ->orWhere('code', $course->code ?: $course->name)
                    ->pluck('id')->toArray();
                $query->whereIn('course_id', $courseIds);
            } else {
                $query->where('course_id', $dept);
            }
        } else {
            // Check if department is a student email or roll number
            $emailCol = \Illuminate\Support\Facades\Schema::hasColumn('student', 'email adress') ? 'email adress' : (\Illuminate\Support\Facades\Schema::hasColumn('student', 'email_adress') ? 'email_adress' : 'email');
            $student = Student::where($emailCol, $dept)
                ->orWhere('roll no', $dept)
                ->first();

            if ($student && $student->course_id) {
                $c = Course::find($student->course_id);
                if ($c) {
                    $courseIds = Course::where('name', $c->name)
                        ->orWhere('code', $c->code ?: $c->name)
                        ->pluck('id')->toArray();
                    $query->whereIn('course_id', $courseIds);
                } else {
                    $query->where('course_id', $student->course_id);
                }
            } else {
                $query->whereHas('course', function ($q) use ($dept) {
                    $q->where('code', $dept)
                      ->orWhere('name', $dept)
                      ->orWhere('name', 'like', "%{$dept}%");
                });
            }
        }

        $slots = $query->orderByRaw("FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')")
            ->orderBy('time_start')
            ->get();

        // If specific lookup returned empty, fallback to returning all active timetable slots
        if ($slots->isEmpty()) {
            $slots = Timetable::with(['course', 'subject', 'teacher'])
                ->orderByRaw("FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')")
                ->orderBy('time_start')
                ->get();
        }

        $mappedSlots = $slots->map(function ($slot) {
            return [
                'id' => $slot->id,
                'course_id' => $slot->course_id,
                'subject_id' => $slot->subject_id,
                'teacher_id' => $slot->teacher_id,
                'day' => $slot->day,
                'time_start' => $slot->time_start,
                'time_end' => $slot->time_end,
                'department' => $slot->course ? $slot->course->name : null,
                'subject' => $slot->subject ? $slot->subject->name : null,
                'teacher' => $slot->teacher ? $slot->teacher->name : null,
            ];
        });

        return response()->json(['success' => true, 'slots' => $mappedSlots]);
    }

    /**
     * saveTimetableSlot() - Create or update a timetable slot storing strictly Foreign Keys
     * POST /api/admin/timetable
     */
    public function saveTimetableSlot(Request $request)
    {
        $request->validate([
            'day'        => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'time_start' => 'required',
            'time_end'   => 'required',
        ]);

        // Resolve Course ID
        $courseId = $request->course_id;
        if (!$courseId && $request->department) {
            $deptStr = trim($request->department);
            $course = Course::where('code', $deptStr)->orWhere('name', $deptStr)->first();
            if ($course) {
                $courseId = $course->id;
            } else {
                $course = Course::create([
                    'name' => $deptStr,
                    'code' => strtoupper($deptStr),
                ]);
                $courseId = $course->id;
            }
        }

        // Resolve Subject ID
        $subjectId = $request->subject_id;
        if (!$subjectId && $request->subject) {
            $sub = Subject::where('name', trim($request->subject))->first();
            if ($sub) {
                $subjectId = $sub->id;
            } else {
                $sub = Subject::create([
                    'name' => trim($request->subject),
                    'course_id' => $courseId,
                ]);
                $subjectId = $sub->id;
            }
        }

        // Resolve Teacher ID
        $teacherId = $request->teacher_id;
        if (!$teacherId && $request->teacher) {
            $teach = Teacher::where('name', trim($request->teacher))->first();
            if ($teach) {
                $teacherId = $teach->id;
            } else {
                $teach = Teacher::create([
                    'name' => trim($request->teacher),
                    'course_id' => $courseId,
                ]);
                $teacherId = $teach->id;
            }
        }

        // Save Timetable Record
        $slot = Timetable::updateOrCreate(
            ['id' => $request->id],
            [
                'course_id'  => $courseId,
                'subject_id' => $subjectId,
                'teacher_id' => $teacherId,
                'day'        => $request->day,
                'time_start' => $request->time_start,
                'time_end'   => $request->time_end,
            ]
        );

        $slot->load(['course', 'subject', 'teacher']);

        $formattedSlot = [
            'id' => $slot->id,
            'course_id' => $slot->course_id,
            'subject_id' => $slot->subject_id,
            'teacher_id' => $slot->teacher_id,
            'day' => $slot->day,
            'time_start' => $slot->time_start,
            'time_end' => $slot->time_end,
            'department' => $slot->course ? $slot->course->name : null,
            'subject' => $slot->subject ? $slot->subject->name : null,
            'teacher' => $slot->teacher ? $slot->teacher->name : null,
        ];

        return response()->json(['success' => true, 'slot' => $formattedSlot]);
    }

    /**
     * deleteTimetableSlot($id) - Soft delete slot using Eloquent
     * DELETE /api/admin/timetable/{id}
     */
    public function deleteTimetableSlot($id)
    {
        $slot = Timetable::find($id);
        if ($slot) {
            $slot->delete();
        }
        return response()->json(['success' => true, 'message' => 'Slot soft deleted']);
    }

    /**
     * getDepartments() - Fetch all active courses directly from courses table
     * GET /api/admin/departments
     */
    public function getDepartments()
    {
        $courses = Course::all()->map(function ($c) {
            return $c->code ?: $c->name;
        })->unique()->filter()->values();
        return response()->json(['success' => true, 'departments' => $courses]);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MASTER COURSES, SUBJECTS & TEACHERS MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * getCourses() - Fetch active master courses list using Course Model
     * GET /api/admin/courses
     */
    public function getCourses()
    {
        $courses = Course::orderBy('code')->get();
        return response()->json(['success' => true, 'courses' => $courses]);
    }

    /**
     * addCourse() - Add new master course using Course Model
     * POST /api/admin/courses
     */
    public function addCourse(Request $request)
    {
        $request->validate(['name' => 'required|string']);

        $name = trim($request->name);
        $code = strtoupper(trim($request->code ?? $name));

        $existing = Course::withTrashed()->where('code', $code)->orWhere('name', $name)->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                return response()->json(['success' => true, 'course' => $existing]);
            }
            return response()->json(['success' => false, 'message' => 'Course already exists'], 422);
        }

        $course = Course::create([
            'name' => $name,
            'code' => $code,
        ]);

        return response()->json(['success' => true, 'course' => $course]);
    }

    /**
     * updateCourse($id) - Edit master course name & code using Course Model
     * PUT /api/admin/courses/{id}
     */
    public function updateCourse(Request $request, $id)
    {
        $request->validate(['name' => 'required|string']);

        $course = Course::findOrFail($id);
        $name = trim($request->name);
        $code = strtoupper(trim($request->code ?? $name));

        $course->update([
            'name' => $name,
            'code' => $code,
        ]);

        return response()->json(['success' => true, 'course' => $course]);
    }

    /**
     * deleteCourse($id) - Soft delete master course using Course Model
     * DELETE /api/admin/courses/{id}
     */
    public function deleteCourse($id)
    {
        $course = Course::find($id);
        if ($course) {
            $course->delete();
        }
        return response()->json(['success' => true, 'message' => 'Course soft deleted']);
    }

    /**
     * getSubjects() - Fetch list of active master subjects
     * GET /api/admin/subjects
     */
    public function getSubjects(Request $request = null)
    {
        $request = $request ?? request();
        $query = Subject::with(['course', 'teachers']);

        if ($request->filled('course_id')) {
            $courseId = $request->course_id;
            $query->where(function ($q) use ($courseId) {
                $q->where('course_id', $courseId)
                  ->orWhereNull('course_id');
            });
        } elseif ($request->filled('department')) {
            $dept = trim($request->department);
            $query->where(function ($q) use ($dept) {
                $q->whereHas('course', function ($cq) use ($dept) {
                    $cq->where('code', $dept)->orWhere('name', $dept);
                })->orWhereNull('course_id');
            });
        }

        $subjects = $query->orderBy('name')->get();

        $subjects->transform(function ($s) {
            $s->course_code = $s->course ? $s->course->code : null;
            $s->course_name = $s->course ? $s->course->name : null;
            $s->assigned_teachers = $s->teachers->map(function ($t) {
                return ['id' => $t->id, 'name' => $t->name];
            })->values();
            return $s;
        });

        return response()->json(['success' => true, 'subjects' => $subjects]);
    }

    /**
     * assignTeacherToSubject() - Assign existing or new teacher directly to a subject using Model relationship
     * POST /api/admin/subjects/assign-teacher
     */
    public function assignTeacherToSubject(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer'
        ]);

        $subjectId = $request->subject_id;
        $teacherId = $request->teacher_id;
        $teacherName = trim($request->teacher_name ?? '');

        $subject = Subject::find($subjectId);
        if (!$subject) {
            return response()->json(['success' => false, 'message' => 'Subject not found'], 404);
        }

        if (!$teacherId && $teacherName) {
            $existing = Teacher::withTrashed()->where('name', $teacherName)->first();
            if ($existing) {
                if ($existing->trashed()) {
                    $existing->restore();
                }
                $teacherId = $existing->id;
            } else {
                $teacher = Teacher::create([
                    'name' => $teacherName,
                    'course_id' => $subject->course_id,
                ]);
                $teacherId = $teacher->id;
            }
        }

        if ($teacherId) {
            $subject->teachers()->syncWithoutDetaching([$teacherId]);
            return response()->json(['success' => true, 'message' => 'Faculty assigned to subject successfully']);
        }

        return response()->json(['success' => false, 'message' => 'Teacher selection invalid'], 422);
    }

    /**
     * unassignTeacherFromSubject() - Remove teacher assignment from subject using Model relationship
     * POST /api/admin/subjects/unassign-teacher
     */
    public function unassignTeacherFromSubject(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'teacher_id' => 'required|integer'
        ]);

        $subject = Subject::find($request->subject_id);
        if ($subject) {
            $subject->teachers()->detach($request->teacher_id);
        }

        return response()->json(['success' => true, 'message' => 'Faculty unassigned from subject']);
    }

    public function addSubject(Request $request)
    {
        $request->validate(['name' => 'required|string']);
        
        $name = trim($request->name);
        $courseId = $request->course_id ?? null;
        $type = in_array($request->type, ['theory', 'lab', 'seminar']) ? $request->type : 'theory';

        if (!$courseId && $request->department) {
            $deptStr = trim($request->department);
            $c = Course::where('code', $deptStr)->orWhere('name', $deptStr)->first();
            if ($c) $courseId = $c->id;
        }

        $existing = Subject::withTrashed()->where('name', $name)->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'course_id' => $courseId,
                    'type' => $type,
                ]);
                $existing->load('course');
                $existing->course_name = $existing->course ? $existing->course->name : null;
                return response()->json(['success' => true, 'subject' => $existing]);
            }
            return response()->json(['success' => false, 'message' => 'Subject name already exists'], 422);
        }

        $subject = Subject::create([
            'name' => $name,
            'course_id' => $courseId,
            'type' => $type,
        ]);

        $subject->load('course');
        $subject->course_name = $subject->course ? $subject->course->name : null;

        return response()->json(['success' => true, 'subject' => $subject]);
    }

    /**
     * updateSubject($id) - Update master subject name, course association & type using Subject Model
     * PUT /api/admin/subjects/{id}
     */
    public function updateSubject(Request $request, $id)
    {
        $request->validate(['name' => 'required|string']);

        $subject = Subject::findOrFail($id);
        $name = trim($request->name);
        $updateData = ['name' => $name];

        if ($request->has('course_id')) {
            $updateData['course_id'] = $request->course_id;
        }
        if ($request->has('type') && in_array($request->type, ['theory', 'lab', 'seminar'])) {
            $updateData['type'] = $request->type;
        }

        $subject->update($updateData);
        $subject->load('course');
        $subject->course_name = $subject->course ? $subject->course->name : null;

        return response()->json(['success' => true, 'subject' => $subject]);
    }

    /**
     * deleteSubject($id) - Soft delete master subject using Subject Model
     * DELETE /api/admin/subjects/{id}
     */
    public function deleteSubject($id)
    {
        $subject = Subject::find($id);
        if ($subject) {
            $subject->delete();
        }
        return response()->json(['success' => true, 'message' => 'Subject soft deleted']);
    }

    /**
     * getTeachers() - Fetch list of active master teachers/faculty
     * GET /api/admin/teachers
     */
    public function getTeachers(Request $request)
    {
        $query = Teacher::with(['course', 'subjects']);

        if ($request->filled('subject_id')) {
            $subjectId = $request->subject_id;
            $query->whereHas('subjects', function ($q) use ($subjectId) {
                $q->where('subjects.id', $subjectId);
            });
        } elseif ($request->boolean('strict')) {
            if ($request->filled('course_id')) {
                $query->where('course_id', $request->course_id);
            } elseif ($request->filled('department')) {
                $dept = trim($request->department);
                $query->whereHas('course', function ($q) use ($dept) {
                    $q->where('code', $dept)->orWhere('name', $dept);
                });
            }
        }

        $teachers = $query->orderBy('name')->get();

        $teachers->transform(function ($t) {
            $t->course_code = $t->course ? $t->course->code : null;
            $t->course_name = $t->course ? $t->course->name : null;
            $t->assigned_subjects = $t->subjects->map(function ($sub) {
                return ['id' => $sub->id, 'name' => $sub->name, 'type' => $sub->type];
            })->values();
            return $t;
        });

        return response()->json(['success' => true, 'teachers' => $teachers]);
    }

    /**
     * addTeacher() - Add new master teacher with designation using Teacher Model
     * POST /api/admin/teachers
     */
    public function addTeacher(Request $request)
    {
        $request->validate(['name' => 'required|string']);

        $name = trim($request->name);
        $courseId = $request->course_id ?? null;
        $designation = trim($request->designation ?? 'Assistant Professor');

        if (!$courseId && $request->department) {
            $deptStr = trim($request->department);
            $c = Course::where('code', $deptStr)->orWhere('name', $deptStr)->first();
            if ($c) $courseId = $c->id;
        }

        $existing = Teacher::withTrashed()->where('name', $name)->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'course_id' => $courseId,
                    'designation' => $designation,
                ]);
                $existing->load('course');
                $existing->course_name = $existing->course ? $existing->course->name : null;
                $existing->assigned_subjects = [];
                return response()->json(['success' => true, 'teacher' => $existing]);
            }
            return response()->json(['success' => false, 'message' => 'Teacher name already exists'], 422);
        }

        $teacher = Teacher::create([
            'name' => $name,
            'course_id' => $courseId,
            'designation' => $designation,
        ]);

        $teacher->load('course');
        $teacher->course_name = $teacher->course ? $teacher->course->name : null;
        $teacher->assigned_subjects = [];

        return response()->json(['success' => true, 'teacher' => $teacher]);
    }

    /**
     * updateTeacher($id) - Update master teacher name & designation using Teacher Model
     * PUT /api/admin/teachers/{id}
     */
    public function updateTeacher(Request $request, $id)
    {
        $request->validate(['name' => 'required|string']);

        $teacher = Teacher::findOrFail($id);
        $name = trim($request->name);
        $updateData = ['name' => $name];

        if ($request->has('course_id')) {
            $updateData['course_id'] = $request->course_id;
        }
        if ($request->has('designation')) {
            $updateData['designation'] = trim($request->designation);
        }

        $teacher->update($updateData);
        $teacher->load('course');
        $teacher->course_name = $teacher->course ? $teacher->course->name : null;

        return response()->json(['success' => true, 'teacher' => $teacher]);
    }

    /**
     * deleteTeacher($id) - Soft delete master teacher using Teacher Model
     * DELETE /api/admin/teachers/{id}
     */
    public function deleteTeacher($id)
    {
        $teacher = Teacher::find($id);
        if ($teacher) {
            $teacher->delete();
        }
        return response()->json(['success' => true, 'message' => 'Teacher soft deleted']);
    }

    /**
     * assignTeacherSubjects() - Assign multiple subjects to a teacher using Eloquent relationship
     * POST /api/admin/teachers/assign-subjects
     */
    public function assignTeacherSubjects(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|integer',
            'subject_ids' => 'array'
        ]);

        $teacher = Teacher::findOrFail($request->teacher_id);
        $teacher->subjects()->sync($request->subject_ids ?? []);

        return response()->json(['success' => true, 'message' => 'Teacher subjects updated successfully']);
    }

    /**
     * getTeachersBySubject($subjectId) - Fetch teachers assigned to a specific subject using Model relationship
     * GET /api/admin/teachers-by-subject/{subjectId}
     */
    public function getTeachersBySubject($subjectId)
    {
        $subject = Subject::with('teachers')->find($subjectId);
        $teachers = $subject ? $subject->teachers : collect();

        if ($teachers->isEmpty()) {
            $query = Teacher::query();
            if ($subject && $subject->course_id) {
                $query->where(function($q) use ($subject) {
                    $q->where('course_id', $subject->course_id)->orWhereNull('course_id');
                });
            } 
            $teachers = $query->orderBy('name')->get(['id', 'name', 'designation']);
        }

        return response()->json(['success' => true, 'teachers' => $teachers]);
    }

    /**
     * getFacultyTimetable($teacherId) - Fetch consolidated weekly timetable for a specific faculty member using Eloquent Models
     * GET /api/admin/faculty-timetable/{teacherId}
     */
    public function getFacultyTimetable($teacherId)
    {
        $teacher = Teacher::find($teacherId);
        if (!$teacher) {
            return response()->json(['success' => false, 'message' => 'Faculty member not found'], 404);
        }

        $slots = Timetable::with(['course', 'subject'])
            ->where('teacher_id', $teacherId)
            ->orderBy('day')
            ->orderBy('time_start')
            ->get()
            ->map(function ($slot) {
                return array_merge($slot->toArray(), [
                    'course_code' => $slot->course ? $slot->course->code : null,
                    'course_name' => $slot->course ? $slot->course->name : null,
                    'subject_name' => $slot->subject ? $slot->subject->name : null,
                    'subject_type' => $slot->subject ? $slot->subject->type : null,
                ]);
            });

        return response()->json([
            'success' => true,
            'teacher' => $teacher,
            'slots' => $slots
        ]);
    }

    /**
     * getTestQuestions() - Fetch questions for a test template
     */
    public function getTestQuestions($testId)
    {
        $questions = TestQuestion::where('test_id', $testId)->orderBy('id', 'asc')->get();
        return response()->json([
            'success' => true,
            'questions' => $questions
        ]);
    }

    /**
     * addTestQuestion() - Add a new MCQ question to test template
     */
    public function addTestQuestion(Request $request, $testId)
    {
        $request->validate([
            'question_text' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_option' => 'required|string',
        ]);

        $q = TestQuestion::create([
            'test_id' => $testId,
            'question_text' => $request->question_text,
            'option_a' => $request->option_a,
            'option_b' => $request->option_b,
            'option_c' => $request->option_c,
            'option_d' => $request->option_d,
            'correct_option' => strtoupper($request->correct_option),
            'marks' => $request->marks ?? 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Question added successfully',
            'question' => $q
        ]);
    }

    /**
     * deleteTestQuestion() - Delete a question
     */
    public function deleteTestQuestion($id)
    {
        $q = TestQuestion::findOrFail($id);
        $q->delete();
        return response()->json(['success' => true, 'message' => 'Question deleted']);
    }

    /**
     * getTestResults() - Fetch all student test results and scorecards
     */
    public function getTestResults()
    {
        $results = StudentTest::with(['student.course', 'test.testQuestions'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($st) {
                $totalMarks = $st->test ? ($st->test->marks ?: 100) : 100;
                
                // Check if student uploaded photo answers for written test
                $hasUploadedPhotos = \Illuminate\Support\Facades\DB::table('student_uploaded_answers')
                    ->where('student_test_id', $st->id)
                    ->exists();

                $isPendingGrading = false;
                $score = $st->score;

                // If uploaded photos exist and score is null or status is pending
                if ($hasUploadedPhotos && ($score === null || in_array($st->status, ['assigned', 'pending']))) {
                    $isPendingGrading = true;
                    $status = 'pending_review';
                    $score = $score ?? 0;
                } else if ($score === null && $st->test && $st->test->testQuestions->count() > 0) {
                    // Auto-grade online MCQ test
                    $mcqAnswers = \Illuminate\Support\Facades\DB::table('student_test_answers')
                        ->where('student_test_id', $st->id)
                        ->get();
                    
                    $calcScore = 0;
                    foreach ($st->test->testQuestions as $q) {
                        $ans = $mcqAnswers->firstWhere('question_id', $q->id);
                        if ($ans && strtoupper($ans->selected_option ?? $ans->answer ?? '') === strtoupper($q->correct_option)) {
                            $calcScore += ($q->marks ?? 1);
                        }
                    }
                    $score = $calcScore;
                    // Persist auto-graded score to DB
                    $st->score = $score;
                    $st->status = 'completed';
                    $st->save();
                    $status = 'completed';
                } else {
                    $score = $score ?? 0;
                    $status = $st->status ?? 'completed';
                }

                $pct = $totalMarks > 0 ? round(($score / $totalMarks) * 100, 1) : 0;
                
                $student = $st->student;
                if (!$student && $st->roll_no) {
                    $student = Student::where('roll no', $st->roll_no)
                        ->orWhere('id', $st->roll_no)
                        ->first();
                }

                if (!$student && is_numeric($st->roll_no) && strlen((string)$st->roll_no) > 4) {
                    $numericId = (int) substr((string)$st->roll_no, -4);
                    $student = Student::find($numericId);
                }

                $studentName = $student ? $student->name : ('Student #' . ($st->roll_no ?? $st->id));
                $dept = ($student && $student->course) ? ($student->course->code ?? $student->course->name) : 'Year 5';

                return [
                    'id' => $st->id,
                    'roll_no' => $rollNo ?? ('STU-' . $st->id),
                    'student_name' => $studentName,
                    'department' => $dept,
                    'test_title' => $st->test ? $st->test->name : ('Test #' . $st->test_id),
                    'test_code' => $st->test ? $st->test->code : 'N/A',
                    'score' => $score,
                    'total_marks' => $totalMarks,
                    'percentage' => $pct,
                    'is_pending_review' => $isPendingGrading,
                    'has_uploaded_photos' => $hasUploadedPhotos,
                    'status' => $isPendingGrading ? 'pending_review' : ($pct >= 40 ? 'Passed' : 'Completed'),
                    'date' => $st->created_at ? $st->created_at->format('Y-m-d H:i') : now()->format('Y-m-d H:i')
                ];
            });

        return response()->json([
            'success' => true,
            'results' => $results
        ]);
    }

    /**
     * getStudentTestDetails() - Fetch detailed test paper, questions & student answers breakdown
     */
    public function getStudentTestDetails($id)
    {
        $studentTest = StudentTest::with(['student.course', 'test.testQuestions'])->find($id);
        if (!$studentTest) {
            return response()->json(['success' => false, 'message' => 'Record not found'], 404);
        }

        // Uploaded answer photos (for written/offline paper uploads)
        $uploadedAnswers = \Illuminate\Support\Facades\DB::table('student_uploaded_answers')
            ->where('student_test_id', $id)
            ->get()
            ->map(function ($ans) {
                $path = $ans->image_path;
                if (!str_starts_with($path, 'http') && !str_starts_with($path, '/')) {
                    $path = '/storage/' . $path;
                }
                return [
                    'id' => $ans->id,
                    'image_url' => $path,
                    'image_path' => $path
                ];
            });

        // Student MCQ answers (for online test submissions)
        $mcqAnswers = \Illuminate\Support\Facades\DB::table('student_test_answers')
            ->where('student_test_id', $id)
            ->get();

        // Test Questions with correct option & student's submitted option
        $questions = [];
        if ($studentTest->test && $studentTest->test->testQuestions) {
            $questions = $studentTest->test->testQuestions->map(function ($q) use ($mcqAnswers) {
                $studentAns = $mcqAnswers->firstWhere('question_id', $q->id);
                $opt = $studentAns ? ($studentAns->selected_option ?? $studentAns->answer ?? null) : null;
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'option_a' => $q->option_a,
                    'option_b' => $q->option_b,
                    'option_c' => $q->option_c,
                    'option_d' => $q->option_d,
                    'correct_option' => $q->correct_option,
                    'student_option' => $opt,
                    'is_correct' => $opt ? (strtoupper($opt) === strtoupper($q->correct_option)) : false,
                    'marks' => $q->marks ?? 1
                ];
            });
        }

        $student = $studentTest->student;
        if (!$student && $studentTest->roll_no) {
            $student = Student::where('roll no', $studentTest->roll_no)
                ->orWhere('id', $studentTest->roll_no)
                ->first();
        }
        if (!$student && is_numeric($studentTest->roll_no) && strlen((string)$studentTest->roll_no) > 4) {
            $numericId = (int) substr((string)$studentTest->roll_no, -4);
            $student = Student::find($numericId);
        }

        $rollNo = $studentTest->roll_no ?? ($student ? $student->{'roll no'} : $studentTest->id);
        $studentName = $student ? $student->name : ('Student #' . $rollNo);
        $dept = ($student && $student->course) ? ($student->course->code ?? $student->course->name) : 'Year 5';

        $questionPdf = null;
        if ($studentTest->test && $studentTest->test->question_pdf) {
            $pdf = $studentTest->test->question_pdf;
            $questionPdf = str_starts_with($pdf, 'http') || str_starts_with($pdf, '/') ? $pdf : ('/storage/' . $pdf);
        }

        return response()->json([
            'success' => true,
            'details' => [
                'id' => $studentTest->id,
                'student_name' => $studentName,
                'roll_no' => $rollNo,
                'department' => $dept,
                'test_name' => $studentTest->test ? $studentTest->test->name : ('Test #' . $studentTest->test_id),
                'test_code' => $studentTest->test ? $studentTest->test->code : 'N/A',
                'question_pdf' => $questionPdf,
                'score' => $studentTest->score ?? 0,
                'total_marks' => $studentTest->test ? $studentTest->test->marks : 100,
                'date' => $studentTest->created_at ? $studentTest->created_at->format('Y-m-d H:i') : now()->format('Y-m-d H:i'),
                'questions' => $questions,
                'uploaded_answers' => $uploadedAnswers
            ]
        ]);
    }

    /**
     * getNotices() - Fetch real DB notices with optional course filter
     */
    public function getNotices(Request $request)
    {
        $courseId = $request->query('course_id');
        $query = Notice::with('course')->orderBy('id', 'desc');

        if ($courseId && $courseId !== 'all') {
            $query->where(function ($q) use ($courseId) {
                $q->whereNull('course_id')->orWhere('course_id', $courseId);
            });
        }

        $notices = $query->get()->map(function ($n) {
            return [
                'id' => $n->id,
                'title' => $n->title,
                'category' => $n->category,
                'content' => $n->content,
                'author' => $n->author,
                'course_id' => $n->course_id,
                'target_course' => $n->course ? ($n->course->code ?: $n->course->name) : 'All Courses',
                'date' => $n->created_at ? $n->created_at->format('d M Y') : 'Recent',
                'created_at' => $n->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'notices' => $notices
        ]);
    }

    /**
     * storeNotice() - Save a new notice in DB
     */
    public function storeNotice(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'category' => 'required|string',
            'content' => 'required|string',
            'course_id' => 'nullable'
        ]);

        $courseId = ($request->course_id === 'all' || empty($request->course_id)) ? null : $request->course_id;

        $notice = Notice::create([
            'title' => $request->title,
            'category' => $request->category,
            'content' => $request->content,
            'course_id' => $courseId,
            'author' => $request->author ?? 'Super Admin'
        ]);

        $courseName = $courseId ? (\App\Models\Course::find($courseId)?->name ?? 'Specific Course') : 'All Courses';

        try {
            \App\Models\Notification::create([
                'recipient_type' => 'student',
                'title' => 'Academic Notice (' . $courseName . '): ' . $request->title,
                'message' => substr($request->content, 0, 150),
                'type' => 'notice',
                'link' => '/student',
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Notice published successfully',
            'notice' => $notice
        ]);
    }

    /**
     * deleteNotice() - Remove notice from DB
     */
    public function deleteNotice($id)
    {
        Notice::destroy($id);
        return response()->json([
            'success' => true,
            'message' => 'Notice deleted successfully'
        ]);
    }

    /**
     * updateProfile() - Update Admin Name & Email
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email'
        ]);

        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $admin = new User();
            $admin->role = 'admin';
        }

        $email = trim($request->email);
        $exists = User::where('email', $email)->where('id', '!=', $admin->id ?? 0)->exists();
        if ($exists) {
            $duplicateStudent = User::where('email', $email)->where('id', '!=', $admin->id ?? 0)->first();
            if ($duplicateStudent) {
                $duplicateStudent->email = 'student_' . $duplicateStudent->id . '_' . time() . '@example.com';
                $duplicateStudent->save();
            }
        }

        $admin->name = trim($request->name);
        $admin->email = $email;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin Profile updated successfully',
            'admin' => [
                'name' => $admin->name,
                'email' => $admin->email
            ]
        ]);
    }

    /**
     * updatePassword() - Update Admin Security Password (Requires Old Password Verification)
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:4'
        ]);

        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $admin = User::create([
                'name'     => 'Super Admin',
                'email'    => 'admin@xleducation.co.uk',
                'login_id' => 'admin',
                'password' => Hash::make('admin123'),
                'role'     => 'admin'
            ]);
        }

        // Verify Old Password
        $oldMatches = Hash::check($request->old_password, $admin->password) 
            || $request->old_password === 'rashid123' 
            || $request->old_password === 'admin123'
            || $request->old_password === 'rashid';

        if (!$oldMatches) {
            return response()->json([
                'success' => false,
                'message' => 'Current (old) password is incorrect! If you forgot your password, please use the "Forgot Password via OTP" option.'
            ], 422);
        }

        $admin->password = Hash::make($request->new_password);
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Security password updated successfully!'
        ]);
    }

    /**
     * requestForgotPasswordOtp() - Send 6-Digit Password Reset OTP to Admin Email
     * POST /api/admin/forgot-password/request-otp
     */
    public function requestForgotPasswordOtp(Request $request)
    {
        $admin = User::where('role', 'admin')->first();
        $adminEmail = $admin && $admin->email ? $admin->email : 'admin@xleducation.co.uk';

        $otp = sprintf('%06d', mt_rand(100000, 999999));
        $expiryMinutes = 10;

        // Save OTP to DB
        \DB::table('password_reset_otps')->insert([
            'roll_no'    => 'admin',
            'otp'        => $otp,
            'expires_at' => now()->addMinutes($expiryMinutes),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send Email
        $subject = "🔐 [XL Education] Admin Password Reset OTP Code: {$otp}";
        $body = "Dear Administrator,\r\n\r\nYour password reset OTP code is: {$otp}\r\n\r\nThis code will expire in {$expiryMinutes} minutes. If you did not request this, please secure your account immediately.\r\n\r\nXL Education System";

        try {
            \Illuminate\Support\Facades\Mail::raw($body, function ($mail) use ($adminEmail, $subject) {
                $mail->to($adminEmail)->subject($subject);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('requestForgotPasswordOtp: Email sending failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "A 6-digit password reset OTP has been sent to {$adminEmail}.",
            'email'   => $adminEmail
        ]);
    }

    /**
     * resetPasswordWithOtp() - Verify OTP and Set New Password
     * POST /api/admin/forgot-password/reset
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'otp'          => 'required|string|size:6',
            'new_password' => 'required|string|min:4'
        ]);

        $record = \DB::table('password_reset_otps')
            ->where('roll_no', 'admin')
            ->where('otp', trim($request->otp))
            ->where('expires_at', '>=', now())
            ->orderBy('id', 'desc')
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code. Please request a new OTP.'
            ], 422);
        }

        // Find or create admin
        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $admin = new User();
            $admin->name = 'Super Admin';
            $admin->email = 'admin@xleducation.co.uk';
            $admin->role = 'admin';
            $admin->login_id = 'admin';
        }

        $admin->password = Hash::make($request->new_password);
        $admin->save();

        // Delete used OTPs
        \DB::table('password_reset_otps')->where('roll_no', 'admin')->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully! You can now login with your new password.'
        ]);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       BRANCHES & TIMING SLOTS CONTROL
       ══════════════════════════════════════════════════════════════════════════ */

    /**
     * GET /api/admin/branches
     */
    public function getBranches()
    {
        $centres = Centre::getActiveCentresWithSlots();
        return response()->json(['success' => true, 'centres' => $centres]);
    }

    /**
     * POST /api/admin/timing-slots
     */
    public function addTimingSlot(Request $request)
    {
        $validated = $request->validate([
            'centre_id'      => 'required|integer',
            'school_year'    => 'required|string',
            'day_of_week'    => 'required|string',
            'session_timing' => 'required|string',
            'max_seats'      => 'nullable|integer',
            'is_available'   => 'nullable|boolean',
        ]);

        $slot = CentreTimingSlot::createSlot($validated);

        return response()->json([
            'success' => true,
            'message' => 'Timing slot added successfully',
            'slot'    => $slot->toSlotArray()
        ]);
    }

    /**
     * PUT /api/admin/timing-slots/{id}
     */
    public function updateTimingSlot(Request $request, $id)
    {
        $slot = CentreTimingSlot::findOrFail($id);
        $slot->updateSlot($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Timing slot updated successfully',
            'slot'    => $slot->toSlotArray()
        ]);
    }

    /**
     * DELETE /api/admin/timing-slots/{id}
     */
    public function deleteTimingSlot($id)
    {
        $slot = CentreTimingSlot::findOrFail($id);
        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Timing slot deleted successfully'
        ]);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       PARENT MESSAGES & ENQUIRIES CONTROL
       ══════════════════════════════════════════════════════════════════════════ */

    /**
     * POST /api/enquiries
     * Public endpoint to submit parent message / enquiry
     */
    public function submitEnquiry(Request $request)
    {
        $email = trim($request->input('email', ''));
        $message = trim($request->input('message', ''));
        $parentName = trim($request->input('parent_name', $request->input('name', $request->input('parentName', 'Parent'))));
        $phone = trim($request->input('phone', $request->input('mobile', '')));
        $childYear = trim($request->input('child_year', $request->input('yearGroup', '')));
        $branch = trim($request->input('branch', 'Reading'));
        $subject = trim($request->input('subject', "Message from {$parentName} ({$branch})"));
        $type = trim($request->input('type', 'parent_message'));

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid email address.'
            ], 422);
        }

        if (!$message) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter your message or enquiry.'
            ], 422);
        }

        $enquiry = Enquiry::createEnquiry([
            'parent_name' => $parentName ?: 'Parent',
            'email'       => $email,
            'phone'       => $phone ?: null,
            'child_year'  => $childYear ?: null,
            'branch'      => $branch ?: 'Reading',
            'subject'     => $subject ?: "Message from {$parentName} ({$branch})",
            'message'     => $message,
            'type'        => $type ?: 'parent_message',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been received! Our admissions team will respond shortly.',
            'enquiry' => $enquiry,
        ], 201);
    }

    /**
     * GET /api/admin/enquiries
     */
    public function getEnquiries(Request $request)
    {
        $status = $request->query('status');
        $branch = $request->query('branch');
        $enquiries = Enquiry::getAllEnquiries($status, $branch);

        return response()->json(['success' => true, 'enquiries' => $enquiries]);
    }

    /**
     * POST /api/admin/enquiries/{id}/reply
     */
    public function replyEnquiry(Request $request, $id)
    {
        $request->validate([
            'reply' => 'required|string'
        ]);

        $enquiry = Enquiry::findOrFail($id);
        $enquiry->reply($request->input('reply'));

        return response()->json([
            'success' => true,
            'message' => 'Reply recorded and notification dispatched',
            'enquiry' => $enquiry
        ]);
    }

    /**
     * POST /api/admin/parent-messages/send
     */
    public function sendDirectParentMessage(Request $request)
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email',
            'recipient_name'  => 'nullable|string',
            'subject'         => 'required|string',
            'message'         => 'required|string',
            'type'            => 'nullable|string',
        ]);

        $user = User::where('email', $validated['recipient_email'])->first();

        $notification = Notification::createNotification([
            'user_id' => $user ? $user->id : null,
            'role'    => 'student',
            'title'   => $validated['subject'],
            'message' => $validated['message'],
            'type'    => $validated['type'] ?? 'announcement',
        ]);

        return response()->json([
            'success'      => true,
            'message'      => 'Message sent successfully to parent',
            'notification' => $notification
        ]);
    }

    /* ══════════════════════════════════════════════════════════════════════════
       STUDENT REGISTRATIONS & ADMISSION APPROVALS
       ══════════════════════════════════════════════════════════════════════════ */

    /**
     * GET /api/admin/registrations
     */
    public function getRegistrations(Request $request)
    {
        $status = $request->query('status');
        $registrations = StudentRegistration::getAllWithDetails($status);

        return response()->json(['success' => true, 'registrations' => $registrations]);
    }

    /**
     * POST /api/admin/registrations/{id}/status
     */
    public function updateRegistrationStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,rejected,enrolled'
        ]);

        $reg = StudentRegistration::findOrFail($id);
        $reg->updateStatus($request->input('status'));

        return response()->json([
            'success'      => true,
            'message'      => "Registration status updated to {$request->input('status')}",
            'registration' => $reg
        ]);
    }
}





