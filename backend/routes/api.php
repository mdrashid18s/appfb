<?php

/**
 * @file api.php
 * @description Laravel Backend ke sare API Routes (REST Endpoints).
 *
 * Yeh file poori application ka "address book" hai.
 * Jab bhi frontend koi URL par request bhejta hai, Laravel yahan se decide karta hai
 * ki us request ko handle karne ke liye kaunsa Controller ka kaunsa method call hoga.
 *
 * Route format: Route::HTTP_METHOD('/url', [Controller::class, 'method'])
 *
 * ─── ROUTE GROUPS ────────────────────────────────────────────────────────────────
 * 1. PUBLIC Routes     - Koi bhi access kar sakta hai (login, forgot password)
 * 2. PROTECTED Routes  - Sirf logged-in users (auth:sanctum middleware)
 * 3. ADMIN Routes      - Admin panel ke features (test management, student management)
 * ─────────────────────────────────────────────────────────────────────────────────
 *
 * Sabse pehle zaroori Laravel classes import karte hain:
 */

use Illuminate\Http\Request;          // HTTP request object (body, headers, etc.)
use Illuminate\Support\Facades\Route; // Route registration facade

// ══════════════════════════════════════════════════════════════════════════════
// DEFAULT LARAVEL ROUTE (Built-in Sanctum route)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/user
 * Auth Guard: auth:sanctum middleware (token required)
 * Purpose: Currently logged-in user ka data return karta hai.
 * Sanctum token header mein bhejo: Authorization: Bearer <token>
 */
Route::get('/user', function (Request $request) {
    return $request->user(); // Token se authenticated user return karo
})->middleware('auth:sanctum');

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES - Authentication & Password Reset
// (Koi bhi access kar sakta hai - token ki zaroorat nahi)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/login/request-otp
 * Controller: AuthController@requestLoginOtp
 * Purpose: Send OTP to email for login.
 */
Route::post('/login/request-otp', [\App\Http\Controllers\Api\AuthController::class, 'requestLoginOtp']);

/**
 * POST /api/login/verify-otp
 * Controller: AuthController@verifyLoginOtp
 * Purpose: Verify OTP and login.
 */
Route::post('/login/verify-otp', [\App\Http\Controllers\Api\AuthController::class, 'verifyLoginOtp']);

/**
 * POST /api/register-profile
 * Controller: AuthController@registerProfile
 * Purpose: Register a new student profile.
 */
Route::post('/register-profile', [\App\Http\Controllers\Api\AuthController::class, 'registerProfile']);

/**
 * POST /api/forgot-password/send-otp
 * Controller: AuthController@sendOtp
 * Purpose: Forgot password - Step 1: Student ke phone par OTP bhejo.
 * Body: { identifier: "roll_no" }
 * Response: { success, mock_otp (dev only) }
 */
Route::post('/forgot-password/send-otp', [\App\Http\Controllers\Api\AuthController::class, 'sendOtp']);

/**
 * POST /api/forgot-password/verify-otp
 * Controller: AuthController@verifyOtp
 * Purpose: Forgot password - Step 2: OTP verify karo.
 * Body: { roll_no, otp }
 * Response: { success }
 */
Route::post('/forgot-password/verify-otp', [\App\Http\Controllers\Api\AuthController::class, 'verifyOtp']);

/**
 * POST /api/forgot-password/reset
 * Controller: AuthController@resetPassword
 * Purpose: Forgot password - Step 3: Naya password set karo.
 * Body: { roll_no, otp, new_password }
 * Response: { success }
 */
Route::post('/forgot-password/reset', [\App\Http\Controllers\Api\AuthController::class, 'resetPassword']);

// Serve PDFs with CORS headers (Publicly accessible with long random filename)
Route::get('/pdf/{path}', [\App\Http\Controllers\Api\AuthController::class, 'servePdf'])->where('path', '.*');

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES - Sanctum Auth Required
// (Sirf logged-in users - Authorization: Bearer <token> header mandatory)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Route::middleware('auth:sanctum')->group(...)
 * Iske andar ke sare routes ke liye valid Sanctum token required hai.
 * Token nahi hoga to 401 Unauthorized response milega automatically.
 */
Route::middleware('auth:sanctum')->group(function () {

    /**
     * POST /api/logout
     * Controller: AuthController@logout
     * Purpose: Current auth token delete karo (logout).
     * Response: { success }
     */
    Route::post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);

    /**
     * POST /api/student/{id}/update
     * Controller: AuthController@updateProfile
     * Purpose: Student ka profile update karo (name, email, phone, etc.)
     * URL param: {id} = student ka database ID
     * Body: { name, roll_no, department, email_adress, phone_no, dob, adress }
     * Response: { success, student }
     */
    Route::post('/student/{id}/update', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);

    /**
     * POST /api/student/{id}/dp
     * Controller: AuthController@updateDp
     * Purpose: Student ki profile picture (DP) upload ya remove karo.
     * URL param: {id} = student ka database ID
     * Body: FormData with { action: 'upload_file'/'remove', dp: <file> }
     * Response: { success, student }
     */
    Route::post('/student/{id}/dp', [\App\Http\Controllers\Api\AuthController::class, 'updateDp']);

    /**
     * POST /api/student/{id}/password
     * Controller: AuthController@changePassword
     * Purpose: Student ka password change karo.
     * URL param: {id} = student ka database ID
     * Body: { new_password }
     * Response: { success }
     */
    Route::post('/student/{id}/password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);

    /**
     * GET /api/student/{roll_no}/tests
     * Controller: AuthController@getAssignedTests
     * Purpose: Kisi student ke sare assigned tests fetch karo (active + completed + expired).
     * URL param: {roll_no} = student ka roll number
     * Response: { success, tests: [...] }
     */
    Route::get('/student/{roll_no}/tests', [\App\Http\Controllers\Api\AuthController::class, 'getAssignedTests']);
    Route::get('/student/{roll_no}/analytics', [\App\Http\Controllers\Api\AuthController::class, 'getStudentAnalytics']);

    /**
     * GET /api/student/tests/{testId}/start
     * Controller: AuthController@startTest
     * Purpose: Test shuru karne par questions aur test details fetch karo.
     * URL param: {testId} = test ka ID
     * Query params: student_test_id, mode (normal/sweep/retake)
     * Response: { success, questions, test }
     */
    Route::get('/student/tests/{testId}/start', [\App\Http\Controllers\Api\AuthController::class, 'startTest']);

    // Upload answer photos
    Route::post('/student/tests/{testId}/upload-answers', [\App\Http\Controllers\Api\AuthController::class, 'uploadAnswers']);

    /**
     * POST /api/student/tests/{testId}/submit
     * Controller: AuthController@submitTest
     * Purpose: Test ke answers submit karo aur score calculate karo.
     * URL param: {testId} = test ka ID
     * Body: { student_test_id, answers: { questionId: selectedOption, ... } }
     * Response: { success, score (percentage) }
     */
    Route::post('/student/tests/{testId}/submit', [\App\Http\Controllers\Api\AuthController::class, 'submitTest']);
});

// Notifications Endpoints (Public/Auth accessible for Student & Admin)
Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'getNotifications']);
Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
Route::post('/notifications/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES - Test & Student Management
// (Currently unprotected - production mein admin middleware add karna chahiye)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/tests
 * Controller: AdminController@getTests
 * Purpose: Admin dashboard ke liye sare test templates fetch karo (with assigned count).
 * Response: { success, tests: [...] }
 */
Route::get('/admin/tests', [\App\Http\Controllers\Api\AdminController::class, 'getTests']);

/**
 * POST /api/admin/login
 * Controller: AdminController@login
 * Purpose: Admin authentication.
 */
Route::post('/admin/login', [\App\Http\Controllers\Api\AdminController::class, 'login']);

/**
 * POST /api/admin/tests
 * Controller: AdminController@storeTest
 * Purpose: Naya test template create karo.
 * Body: { category, code, name, description, questions_count, total_marks, duration, papers_count }
 * Response: { success, test }
 */
Route::post('/admin/tests', [\App\Http\Controllers\Api\AdminController::class, 'storeTest']);

/**
 * GET /api/admin/students
 * Controller: AdminController@getStudents
 * Purpose: Sare students ki list (test assign karne ke liye).
 * Response: { success, students: [{id, name, roll_no, department, email}] }
 */
Route::get('/admin/students', [\App\Http\Controllers\Api\AdminController::class, 'getStudents']);
Route::get('/admin/tests/{id}/questions', [\App\Http\Controllers\Api\AdminController::class, 'getTestQuestions']);
Route::post('/admin/tests/{id}/questions', [\App\Http\Controllers\Api\AdminController::class, 'addTestQuestion']);
Route::delete('/admin/questions/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteTestQuestion']);
Route::get('/admin/test-results', [\App\Http\Controllers\Api\AdminController::class, 'getTestResults']);
Route::get('/admin/student-tests/{id}/details', [\App\Http\Controllers\Api\AdminController::class, 'getStudentTestDetails']);
Route::post('/admin/student-tests/{id}/grade', [\App\Http\Controllers\Api\AdminController::class, 'gradeStudentTest']);
Route::get('/admin/notices', [\App\Http\Controllers\Api\AdminController::class, 'getNotices']);
Route::post('/admin/notices', [\App\Http\Controllers\Api\AdminController::class, 'storeNotice']);
Route::delete('/admin/notices/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteNotice']);
Route::post('/admin/update-profile', [\App\Http\Controllers\Api\AdminController::class, 'updateProfile']);
Route::post('/admin/update-password', [\App\Http\Controllers\Api\AdminController::class, 'updatePassword']);

/**
 * POST /api/admin/assign
 * Controller: AdminController@assignTest
 * Purpose: Ek test ko multiple students ke roll numbers par assign karo.
 * Body: { test_id, roll_nos: [...], config: { mode, startDate, startTime, expiryDate, expiryTime } }
 * Response: { success }
 */
Route::post('/admin/assign', [\App\Http\Controllers\Api\AdminController::class, 'assignTest']);

/**
 * GET /api/admin/tests/{id}/assigned-students
 * Controller: AdminController@getAssignedStudents
 * Purpose: Ek specific test kin-kin students ko assigned hai.
 */
Route::get('/admin/tests/{id}/assigned-students', [\App\Http\Controllers\Api\AdminController::class, 'getAssignedStudents']);

/**
 * GET /api/admin/student-tests/{id}/answers
 * Controller: AdminController@getStudentAnswers
 * Purpose: Fetch uploaded answer photos for a student test submission.
 */
Route::get('/admin/student-tests/{id}/answers', [\App\Http\Controllers\Api\AdminController::class, 'getStudentAnswers']);

/**
 * POST /api/admin/student-tests/{studentTestId}/grade
 * Controller: AdminController@gradeStudentTest
 * Purpose: Assign marks to a student's test submission.
 */
Route::post('/admin/student-tests/{studentTestId}/grade', [\App\Http\Controllers\Api\AdminController::class, 'gradeStudentTest']);

/**
 * POST /api/admin/tests/{id}/remove-student
 * Controller: AdminController@removeStudent
 * Purpose: Kisi student ko is test se remove karo (student_tests record delete).
 * URL param: {id} = test ka ID
 * Body: { roll_no }
 * Response: { success }
 */
Route::post('/admin/tests/{id}/remove-student', [\App\Http\Controllers\Api\AdminController::class, 'removeStudent']);

// Add route for uploading test PDF to existing test
Route::post('/admin/tests/{id}/upload-pdf', [\App\Http\Controllers\Api\AdminController::class, 'uploadTestPdf']);

/**
 * Test Templates DELETE APIs
/api/admin/tests/{id}
 * Controller: AdminController@deleteTemplate
 * Purpose: Test template aur uske sare assignments delete karo.
 * URL param: {id} = test ka ID
 * Response: { success }
 */
Route::delete('/admin/tests/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteTemplate']);

/**
 * GET /api/admin/tests/{id}/questions
 * Controller: AdminController@getQuestions
 * Purpose: Kisi test ke sare MCQ questions fetch karo.
 * URL param: {id} = test ka ID
 * Response: { success, questions: [...] }
 */
Route::get('/admin/tests/{id}/questions', [\App\Http\Controllers\Api\AdminController::class, 'getQuestions']);

/**
 * POST /api/admin/tests/{id}/questions
 * Controller: AdminController@storeQuestion
 * Purpose: Kisi test mein naya MCQ question add karo.
 * URL param: {id} = test ka ID
 * Body: { question_text, option_a, option_b, option_c, option_d, correct_option, marks }
 * Response: { success, question }
 */
Route::post('/admin/tests/{id}/questions', [\App\Http\Controllers\Api\AdminController::class, 'storeQuestion']);

/**
 * DELETE /api/admin/tests/{id}/questions/{questionId}
 * Controller: AdminController@deleteQuestion
 * Purpose: Kisi test ka specific question delete karo.
 * URL params: {id} = test ka ID, {questionId} = question ka ID
 * Response: { success }
 */
Route::delete('/admin/tests/{id}/questions/{questionId}', [\App\Http\Controllers\Api\AdminController::class, 'deleteQuestion']);

// ══════════════════════════════════════════════════════════════════════════════
// TIMETABLE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

/** GET /api/admin/timetable — Sab departments ka timetable (admin) */
Route::get('/admin/timetable', [\App\Http\Controllers\Api\AdminController::class, 'getAllTimetable']);

/** GET /api/admin/departments — Unique departments list */
Route::get('/admin/departments', [\App\Http\Controllers\Api\AdminController::class, 'getDepartments']);

/** POST /api/admin/timetable — Slot create/update */
Route::post('/admin/timetable', [\App\Http\Controllers\Api\AdminController::class, 'saveTimetableSlot']);

/** DELETE /api/admin/timetable/{id} — Slot delete */
Route::delete('/admin/timetable/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteTimetableSlot']);

/** GET /api/timetable/{department} — Student apne department ka timetable dekhe */
Route::get('/timetable/{department}', [\App\Http\Controllers\Api\AdminController::class, 'getTimetable']);

/** GET /api/student/tests/{studentTestId}/submission — Student answers & submission review */
Route::get('/student/tests/{studentTestId}/submission', [\App\Http\Controllers\Api\AuthController::class, 'getStudentSubmission']);

// ══════════════════════════════════════════════════════════════════════════════
// MASTER COURSES, SUBJECTS & TEACHERS ROUTES
// ══════════════════════════════════════════════════════════════════════════════

Route::get('/admin/courses', [\App\Http\Controllers\Api\AdminController::class, 'getCourses']);
Route::post('/admin/courses', [\App\Http\Controllers\Api\AdminController::class, 'addCourse']);
Route::put('/admin/courses/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateCourse']);
Route::delete('/admin/courses/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteCourse']);

Route::get('/admin/subjects', [\App\Http\Controllers\Api\AdminController::class, 'getSubjects']);
Route::post('/admin/subjects', [\App\Http\Controllers\Api\AdminController::class, 'addSubject']);
Route::put('/admin/subjects/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateSubject']);
Route::delete('/admin/subjects/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteSubject']);

Route::get('/admin/teachers', [\App\Http\Controllers\Api\AdminController::class, 'getTeachers']);
Route::post('/admin/teachers', [\App\Http\Controllers\Api\AdminController::class, 'addTeacher']);
Route::put('/admin/teachers/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateTeacher']);
Route::delete('/admin/teachers/{id}', [\App\Http\Controllers\Api\AdminController::class, 'deleteTeacher']);
Route::post('/admin/subjects/assign-teacher', [\App\Http\Controllers\Api\AdminController::class, 'assignTeacherToSubject']);
Route::post('/admin/subjects/unassign-teacher', [\App\Http\Controllers\Api\AdminController::class, 'unassignTeacherFromSubject']);
Route::get('/admin/faculty-timetable/{teacherId}', [\App\Http\Controllers\Api\AdminController::class, 'getFacultyTimetable']);

// ══════════════════════════════════════════════════════════════════════════════
// WEEKLY HOMEWORK ROUTES
// ══════════════════════════════════════════════════════════════════════════════

Route::post('/admin/homework/save-weekly', [\App\Http\Controllers\Api\HomeworkController::class, 'saveWeeklyHomework']);
Route::get('/admin/homework', [\App\Http\Controllers\Api\HomeworkController::class, 'getAllWeeklyHomework']);
Route::delete('/admin/homework/weekly', [\App\Http\Controllers\Api\HomeworkController::class, 'deleteWeeklyHomework']);
Route::get('/admin/homework/submissions', [\App\Http\Controllers\Api\HomeworkController::class, 'getHomeworkSubmissions']);
Route::post('/admin/homework/submissions/{id}/grade', [\App\Http\Controllers\Api\HomeworkController::class, 'gradeSubmission']);

Route::get('/student/homework', [\App\Http\Controllers\Api\HomeworkController::class, 'getStudentWeeklyHomework']);
Route::post('/student/homework/{homeworkId}/submit', [\App\Http\Controllers\Api\HomeworkController::class, 'submitHomeworkPhoto']);
