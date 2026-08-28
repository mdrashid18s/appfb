<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Homework;
use App\Models\Course;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;

class HomeworkController extends Controller
{
    /**
     * Save/Update an entire week's homework in a single batch operation.
     */
    public function saveWeeklyHomework(Request $request)
    {
        $validated = $request->validate([
            'target_type'         => 'required|in:course,student',
            'course_id'           => 'nullable|exists:courses,id',
            'roll_no'             => 'nullable|string',
            'week_start_date'     => 'required|date',
            'items'               => 'required|array',
            'items.*.day_of_week' => 'required|string',
            'items.*.subject_id'   => 'nullable',
            'items.*.subject_name' => 'nullable|string',
            'items.*.title'       => 'nullable|string',
            'items.*.description' => 'nullable|string',
            'items.*.due_date'    => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            $result = Homework::saveWeeklyBatch($validated);
            DB::commit();

            return response()->json([
                'success'         => true,
                'message'         => "Successfully saved {$result['created_count']} homework tasks for the week of {$result['week_start_date']}.",
                'week_start_date' => $result['week_start_date'],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save weekly homework: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all published weekly homework batches for Admin Panel overview.
     */
    public function getAllWeeklyHomework()
    {
        $allHomework = Homework::with(['course', 'subject'])
            ->orderBy('week_start_date', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        // Group by unique batch key: target_type + (course_id or roll_no) + week_start_date
        $grouped = [];
        foreach ($allHomework as $item) {
            $weekStart = Carbon::parse($item->week_start_date)->format('Y-m-d');
            $key = $item->target_type . '_' . ($item->course_id ?? $item->roll_no) . '_' . $weekStart;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'key' => $key,
                    'target_type' => $item->target_type,
                    'course_id' => $item->course_id,
                    'course_name' => $item->course ? $item->course->name : null,
                    'course_code' => $item->course ? $item->course->code : null,
                    'roll_no' => $item->roll_no,
                    'week_start_date' => $weekStart,
                    'total_tasks' => 0,
                    'items' => []
                ];
            }

            $grouped[$key]['items'][] = [
                'id' => $item->id,
                'day_of_week' => $item->day_of_week,
                'subject_id' => $item->subject_id,
                'subject_name' => $item->subject ? $item->subject->name : 'General',
                'title' => $item->title,
                'description' => $item->description,
                'due_date' => $item->due_date ? Carbon::parse($item->due_date)->format('Y-m-d') : null,
            ];
            $grouped[$key]['total_tasks']++;
        }

        return response()->json([
            'success' => true,
            'batches' => array_values($grouped)
        ]);
    }

    /**
     * Delete a weekly homework batch by target and week_start_date.
     */
    public function deleteWeeklyHomework(Request $request)
    {
        $validated = $request->validate([
            'target_type' => 'required|in:course,student',
            'course_id' => 'nullable',
            'roll_no' => 'nullable',
            'week_start_date' => 'required|date',
        ]);

        $query = Homework::where('week_start_date', $validated['week_start_date'])
            ->where('target_type', $validated['target_type']);

        if ($validated['target_type'] === 'course') {
            $query->where('course_id', $validated['course_id']);
        } else {
            $query->where('roll_no', $validated['roll_no']);
        }

        $query->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Weekly homework batch deleted successfully.'
        ]);
    }

    /**
     * Get weekly homework for a logged-in student.
     */
    public function getStudentWeeklyHomework(Request $request)
    {
        $user = $request->user();
        
        // Find student record either from auth user or roll_no parameter
        $rollNo = $request->query('roll_no');
        $courseId = $request->query('course_id');

        if ($user) {
            $student = Student::where('email_adress', $user->email)
                ->orWhere('roll no', $user->login_id ?? $user->username)
                ->first();
            if ($student) {
                $rollNo = $student->{'roll no'} ?? $student->roll_no ?? $user->login_id;
                $courseId = $student->course_id;
            }
        }

        $requestedDate = $request->query('week_start_date');
        $carbonWeek = $requestedDate ? Carbon::parse($requestedDate) : Carbon::now();
        $weekStartDate = $carbonWeek->startOfWeek()->format('Y-m-d');
        $weekEndDate = Carbon::parse($weekStartDate)->addDays(6)->format('Y-m-d');

        // Resolve matching course IDs (e.g., both BCA course_id 1 and 6)
        $matchingCourseIds = [];
        if ($courseId) {
            $course = Course::find($courseId);
            if ($course) {
                $matchingCourseIds = Course::where('name', $course->name)
                    ->orWhere('code', $course->code ?: $course->name)
                    ->pluck('id')->toArray();
            } else {
                $matchingCourseIds = [$courseId];
            }
        }

        // Fetch homework matching student's specific roll_no OR student's course_ids
        $homeworkQuery = Homework::with('subject')
            ->where('week_start_date', $weekStartDate)
            ->where(function ($q) use ($rollNo, $matchingCourseIds) {
                if ($rollNo) {
                    $q->orWhere(function ($sub) use ($rollNo) {
                        $sub->where('target_type', 'student')->where('roll_no', $rollNo);
                    });
                }
                if (!empty($matchingCourseIds)) {
                    $q->orWhere(function ($sub) use ($matchingCourseIds) {
                        $sub->where('target_type', 'course')->whereIn('course_id', $matchingCourseIds);
                    });
                }
            })
            ->get();

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $structuredSchedule = [];

        // Include existing student submissions in the response tasks map
        $submissions = \App\Models\HomeworkSubmission::where('roll_no', $rollNo)->get()->keyBy('homework_id');

        foreach ($days as $index => $day) {
            $dayDate = Carbon::parse($weekStartDate)->addDays($index)->format('Y-m-d');
            $dayTasks = $homeworkQuery->filter(function ($item) use ($day) {
                return strcasecmp($item->day_of_week, $day) === 0;
            })->map(function ($item) use ($submissions) {
                $sub = $submissions->get($item->id);
                return [
                    'id' => $item->id,
                    'subject' => $item->subject ? $item->subject->name : ($item->subject_name ?: 'General'),
                    'title' => $item->title,
                    'description' => $item->description,
                    'due_date' => $item->due_date ? Carbon::parse($item->due_date)->format('Y-m-d') : null,
                    'target_type' => $item->target_type,
                    'submission' => $sub ? [
                        'id' => $sub->id,
                        'status' => $sub->status,
                        'attachment_photo' => $sub->attachment_photo,
                        'teacher_grade' => $sub->teacher_grade,
                        'teacher_remarks' => $sub->teacher_remarks,
                        'submitted_at' => $sub->submitted_at,
                        'remarks' => $sub->remarks
                    ] : null
                ];
            })->values();

            $structuredSchedule[] = [
                'day_of_week' => $day,
                'date' => $dayDate,
                'tasks' => $dayTasks
            ];
        }

        return response()->json([
            'success' => true,
            'week_start_date' => $weekStartDate,
            'week_end_date' => $weekEndDate,
            'schedule' => $structuredSchedule
        ]);
    }

    /**
     * Submit homework photo proof by student
     */
    public function submitHomeworkPhoto(Request $request, $homeworkId)
    {
        $request->validate([
            'roll_no' => 'nullable',
            'photo'   => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:10240',
            'remarks' => 'nullable|string'
        ]);

        // Photo is mandatory — no photo, no submission
        if (!$request->hasFile('photo')) {
            return response()->json(['success' => false, 'message' => 'Photo upload karna zaroori hai homework submit karne ke liye.'], 422);
        }

        $homework = Homework::findOrFail($homeworkId);
        $user = $request->user();
        $inputRoll = trim($request->input('roll_no', ''));

        // Strictly identify student — prefer auth token, then roll_no input
        $student = null;
        if ($user) {
            $student = Student::where('email adress', $user->email)
                ->orWhere('email_adress', $user->email)
                ->orWhere('roll no', $user->login_id ?? $user->username)
                ->first();
        }
        if (!$student && !empty($inputRoll)) {
            $rollCol = \Illuminate\Support\Facades\Schema::hasColumn('student', 'roll no') ? 'roll no' : 'roll_no';
            $student = Student::where($rollCol, $inputRoll)->first();
        }

        // Must identify student — reject anonymous submissions
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student identity verify nahi ho saka. Please login karke try karo.'], 403);
        }

        $studentId   = $student->id;
        $studentName = $student->name;
        $rollNo      = $student->{'roll no'} ?? $student->roll_no ?? $inputRoll;

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $fileName = 'hw_' . $homeworkId . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/homework');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $file->move($destinationPath, $fileName);
            $photoPath = '/uploads/homework/' . $fileName;
        }

        // Find existing submission by student_id or roll_no for this homework
        $existing = \App\Models\HomeworkSubmission::where('homework_id', $homeworkId)
            ->where(function ($q) use ($studentId, $rollNo) {
                if ($studentId) {
                    $q->where('student_id', $studentId)->orWhere('roll_no', $rollNo);
                } else {
                    $q->where('roll_no', $rollNo);
                }
            })
            ->first();

        if ($existing) {
            $existing->student_id = $studentId ?: $existing->student_id;
            $existing->student_name = $studentName;
            $existing->roll_no = $rollNo;
            $existing->status = 'submitted';
            if ($photoPath) {
                $existing->attachment_photo = $photoPath;
            }
            if ($request->remarks) {
                $existing->remarks = $request->remarks;
            }
            $existing->submitted_at = now();
            $existing->save();
            $submission = $existing;
        } else {
            $submission = \App\Models\HomeworkSubmission::create([
                'homework_id' => $homeworkId,
                'student_id' => $studentId,
                'student_name' => $studentName,
                'roll_no' => $rollNo,
                'status' => 'submitted',
                'attachment_photo' => $photoPath,
                'remarks' => $request->remarks,
                'submitted_at' => now()
            ]);
        }

        // Send Notification to Admin
        try {
            $subjectName = $homework->subject ? $homework->subject->name : 'Homework';
            Notification::create([
                'recipient_type' => 'admin',
                'title' => 'New Homework Photo Submitted 📷',
                'message' => "Student {$studentName} (Roll #{$rollNo}) uploaded homework proof photo for {$subjectName} - '{$homework->title}'.",
                'type' => 'homework',
                'link' => '/admin/dashboard'
            ]);
        } catch (\Exception $e) {
            // Silently catch
        }

        return response()->json([
            'success' => true,
            'message' => 'Homework photo submitted successfully!',
            'submission' => $submission
        ]);
    }

    /**
     * Get all student homework submissions for Admin Dashboard
     */
    public function getHomeworkSubmissions(Request $request)
    {
        $courseId = $request->query('course_id');
        $weekStartDate = $request->query('week_start_date');

        $query = \App\Models\HomeworkSubmission::with(['homework.course', 'homework.subject']);

        if ($weekStartDate) {
            $query->whereHas('homework', function ($q) use ($weekStartDate) {
                $q->where('week_start_date', $weekStartDate);
            });
        }

        if ($courseId) {
            $query->whereHas('homework', function ($q) use ($courseId) {
                $q->where('course_id', $courseId);
            });
        }

        // Show all completed, submitted, or verified student homework records
        $query->where(function ($q) {
            $q->whereIn('status', ['completed', 'submitted', 'verified'])
              ->orWhereNotNull('attachment_photo');
        });

        $submissions = $query->orderBy('submitted_at', 'desc')->get();

        // Calculate student completion stats
        $studentsQuery = Student::query();
        if ($courseId) {
            $studentsQuery->where('course_id', $courseId);
        } else {
            $submittedRolls = $submissions->pluck('roll_no')->unique()->filter()->values();
            if ($submittedRolls->count() > 0) {
                $studentsQuery->whereIn('roll no', $submittedRolls);
            } else {
                $studentsQuery->limit(20);
            }
        }
        $allStudents = $studentsQuery->get(['id', 'name', 'roll no', 'course_id']);

        $studentProgress = $allStudents->map(function ($stu) use ($submissions) {
            $roll = $stu->{'roll no'};
            $stuSubmissions = $submissions->where('roll_no', $roll);
            return [
                'student_id' => $stu->id,
                'name' => $stu->name,
                'roll_no' => $roll,
                'submitted_count' => $stuSubmissions->count(),
                'submissions' => $stuSubmissions->values()
            ];
        });

        return response()->json([
            'success' => true,
            'submissions' => $submissions,
            'student_progress' => $studentProgress
        ]);
    }

    /**
     * Toggle homework completion status by student (Mark Complete / Mark Pending)
     */
    public function toggleHomeworkCompletion(Request $request, $homeworkId)
    {
        $homework = Homework::findOrFail($homeworkId);
        $user = $request->user();
        $inputRoll = trim($request->input('roll_no', ''));
        $status = $request->input('status', 'completed'); // 'completed' or 'pending'

        $student = null;
        if ($user) {
            $student = Student::where('email adress', $user->email)
                ->orWhere('email_adress', $user->email)
                ->orWhere('roll no', $user->login_id ?? $user->username)
                ->first();
        }
        if (!$student && !empty($inputRoll)) {
            $rollCol = \Illuminate\Support\Facades\Schema::hasColumn('student', 'roll no') ? 'roll no' : 'roll_no';
            $student = Student::where($rollCol, $inputRoll)->first();
        }

        $studentId   = $student ? $student->id : null;
        $studentName = $student ? $student->name : 'Student';
        $rollNo      = $student ? ($student->{'roll no'} ?? $student->roll_no ?? $inputRoll) : $inputRoll;

        $existing = \App\Models\HomeworkSubmission::where('homework_id', $homeworkId)
            ->where(function ($q) use ($studentId, $rollNo) {
                if ($studentId) {
                    $q->where('student_id', $studentId)->orWhere('roll_no', $rollNo);
                } else {
                    $q->where('roll_no', $rollNo);
                }
            })
            ->first();

        $newStatus = ($status === 'pending') ? 'pending' : 'completed';

        if ($existing) {
            $existing->student_id = $studentId ?: $existing->student_id;
            $existing->student_name = $studentName ?: $existing->student_name;
            $existing->status = $newStatus;
            $existing->submitted_at = now();
            $existing->save();
            $submission = $existing;
        } else {
            $submission = \App\Models\HomeworkSubmission::create([
                'homework_id' => $homeworkId,
                'student_id' => $studentId,
                'student_name' => $studentName,
                'roll_no' => $rollNo,
                'status' => $newStatus,
                'submitted_at' => now()
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Homework completion updated',
            'submission' => $submission
        ]);
    }

    /**
     * Grade student homework submission (Wrong, Good, Very Good, Excellent) and add teacher remarks.
     */
    public function gradeSubmission(Request $request, $id)
    {
        $validated = $request->validate([
            'teacher_grade' => 'required|string|in:Wrong,Good,Very Good,Excellent',
            'teacher_remarks' => 'nullable|string'
        ]);

        $submission = \App\Models\HomeworkSubmission::findOrFail($id);
        $submission->teacher_grade = $validated['teacher_grade'];
        $submission->teacher_remarks = $request->input('teacher_remarks') ?: null;
        $submission->status = 'verified';
        $submission->save();

        // Reload from DB to confirm save
        $submission->refresh();

        // Send notification to student
        try {
            Notification::create([
                'recipient_type' => 'student',
                'roll_no' => $submission->roll_no,
                'title' => 'Homework Graded 📝',
                'message' => "Your teacher graded your homework as '{$submission->teacher_grade}'. Remarks: " . ($submission->teacher_remarks ?: 'Good effort!'),
                'type' => 'homework',
                'link' => '/student/homework',
            ]);
        } catch (\Exception $e) {
            // Silently catch
        }

        return response()->json([
            'success' => true,
            'message' => 'Homework graded successfully!',
            'submission' => $submission
        ]);
    }
}
