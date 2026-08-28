<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Location;
use App\Models\Centre;
use App\Models\Course;
use App\Models\Student;
use App\Models\User;
use App\Models\StudentRegistration;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    /**
     * GET /api/locations
     * Return list of active locations with their centres and timing slots (Delegated to Model)
     */
    public function getLocationSlots(Request $request)
    {
        $course = $request->query('course');
        $hierarchy = Location::getHierarchyForCourse($course);

        return response()->json($hierarchy);
    }

    /**
     * GET /api/centres
     * Return list of active tuition centres with their slot timings (Delegated to Model)
     */
    public function getCentres()
    {
        $centres = Centre::getActiveCentresWithSlots();

        return response()->json([
            'success' => true,
            'data'    => $centres,
        ]);
    }

    /**
     * POST /api/registrations/check-duplicate
     * Check if an email is already registered before proceeding (Delegated to Model)
     */
    public function checkDuplicate(Request $request)
    {
        $email = trim($request->input('email', $request->input('primaryEmail', '')));
        $firstName = trim($request->input('firstName', $request->input('first_name', '')));
        $surname = trim($request->input('surname', $request->input('last_name', '')));

        if (!$email) {
            return response()->json(['success' => true, 'is_duplicate' => false]);
        }

        if (StudentRegistration::isDuplicateStudent($email, $firstName, $surname)) {
            $studentLabel = ($firstName || $surname) ? trim($firstName . ' ' . $surname) : 'This student';
            return response()->json([
                'success'      => false,
                'is_duplicate' => true,
                'message'      => "{$studentLabel} is already registered with email ({$email}). Please log in to your account.",
            ]);
        }

        return response()->json([
            'success'      => true,
            'is_duplicate' => false,
        ]);
    }

    /**
     * POST /api/registrations/create-payment-order
     * Create a real Razorpay Order for Student Registration Fee
     */
    public function createPaymentOrder(Request $request)
    {
        $email = trim($request->input('email', $request->input('primaryEmail', '')));
        $firstName = trim($request->input('firstName', ''));
        $surname = trim($request->input('surname', ''));

        // Prevent Duplicate registration before initiating payment
        if (!empty($email) && StudentRegistration::isDuplicateStudent($email, $firstName, $surname)) {
            $studentLabel = ($firstName || $surname) ? trim($firstName . ' ' . $surname) : 'This student';
            return response()->json([
                'success'            => false,
                'already_registered' => true,
                'message'            => "{$studentLabel} is already registered with email ({$email}). Please log in to your account.",
            ], 422);
        }

        $amount = (float) $request->input('amount', 49.00);
        $amountInPaise = (int) round($amount * 100);
        $keyId = config('services.razorpay.key_id', env('RAZORPAY_KEY_ID', 'rzp_test_TPDGO81jJHn8ti'));
        $keySecret = config('services.razorpay.key_secret', env('RAZORPAY_KEY_SECRET', '6z8Jx4rnxejApXZGKDkINC4Z'));

        try {
            $payload = json_encode([
                'amount'          => $amountInPaise,
                'currency'        => 'INR',
                'receipt'         => 'reg_' . strtoupper(Str::random(8)),
                'payment_capture' => 1,
            ]);

            $ch = curl_init('https://api.razorpay.com/v1/orders');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_USERPWD        => $keyId . ':' . $keySecret,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_TIMEOUT        => 30,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr  = curl_error($ch);
            curl_close($ch);

            if ($curlErr) {
                Log::error('Razorpay Reg Order cURL error', ['error' => $curlErr]);
                return response()->json([
                    'success' => false,
                    'message' => 'Network error connecting to payment gateway: ' . $curlErr,
                ], 500);
            }

            $data = json_decode($response, true);

            if ($httpCode !== 200 || empty($data['id'])) {
                Log::error('Razorpay Reg Order creation failed', ['response' => $data]);
                return response()->json([
                    'success' => false,
                    'message' => $data['error']['description'] ?? 'Failed to initialize payment with gateway.',
                ], 400);
            }

            return response()->json([
                'success'           => true,
                'key_id'            => $keyId,
                'razorpay_order_id' => $data['id'],
                'amount'            => $amountInPaise,
                'currency'          => 'INR',
            ]);
        } catch (\Exception $e) {
            Log::error('Registration createPaymentOrder exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/registrations
     * Store new student registration from multi-step registration page
     */
    public function submitRegistration(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'firstName'        => 'required|string|max:100',
                'surname'          => 'required|string|max:100',
                'academicSession'  => 'required|string|max:20',
                'schoolYear'       => 'required|string|max:50',
                'gender'           => 'required|string|max:20',
                'dob'              => 'required',
                'currentSchool'    => 'required|string|max:255',
                'parentFirstName'  => 'required|string|max:100',
                'parentSurname'    => 'required|string|max:100',
                'primaryEmail'     => 'required|email|max:255',
                'mobile'           => 'required|string|max:30',
                'course'           => 'required|string|max:255',
                'learningStyle'    => 'required|string|max:40',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $primaryEmail = trim($request->input('primaryEmail'));
            $firstName = trim($request->input('firstName'));
            $surname = trim($request->input('surname'));

            // Prevent Duplicate Registration using Model Helper
            if (StudentRegistration::isDuplicateStudent($primaryEmail, $firstName, $surname)) {
                $studentLabel = ($firstName || $surname) ? trim($firstName . ' ' . $surname) : 'This student';
                return response()->json([
                    'success'            => false,
                    'already_registered' => true,
                    'message'            => "{$studentLabel} is already registered with email address ({$primaryEmail}). Please sign in to your dashboard.",
                ], 422);
            }

            // Domain Model Lookups
            $courseName = $request->input('course');
            $courseId = Course::findMatchingCourse($courseName);

            $centreName = $request->input('centreLocation');
            $centreId = $request->input('learningStyle') === 'Classroom' ? Centre::findMatchingCentre($centreName) : null;

            $refNumber = 'REG-' . strtoupper(Str::random(7));
            $fullName = trim($request->input('firstName') . ' ' . $request->input('surname'));
            $parentFullName = trim($request->input('parentFirstName') . ' ' . $request->input('parentSurname'));
            $dobFormatted = $request->input('dob') ? date('Y-m-d', strtotime($request->input('dob'))) : null;

            // 1. Create Student Registration record
            $registration = StudentRegistration::create([
                'ref_number'        => $refNumber,
                'first_name'        => $request->input('firstName'),
                'surname'           => $request->input('surname'),
                'academic_session'  => $request->input('academicSession', '2026-2027'),
                'school_year'       => $request->input('schoolYear'),
                'gender'            => $request->input('gender'),
                'dob'               => $dobFormatted,
                'current_school'    => $request->input('currentSchool'),
                'parent_first_name' => $request->input('parentFirstName'),
                'parent_surname'    => $request->input('parentSurname'),
                'primary_email'     => $primaryEmail,
                'secondary_email'   => $request->input('secondaryEmail'),
                'mobile'            => $request->input('mobile'),
                'address'           => $request->input('address'),
                'course_id'         => $courseId,
                'learning_style'    => $request->input('learningStyle', 'Classroom'),
                'centre_id'         => $centreId,
                'preferred_day'     => $request->input('preferredDay'),
                'preferred_session' => $request->input('preferredSession'),
                'target_school'     => $request->input('targetSchool'),
                'writing_addon'     => $request->input('writingAddon'),
                'skip_main_course'  => $request->boolean('skipMainCourse'),
                'status'            => 'confirmed',
            ]);

            // 2. Create Student profile and linked User credentials via Model
            $creationResult = Student::createWithUserCredentials([
                'name'              => $fullName,
                'dob'               => $dobFormatted,
                'academic_session'  => $request->input('academicSession', '2026-2027'),
                'gender'            => $request->input('gender'),
                'current_school'    => $request->input('currentSchool'),
                'parent_name'       => $parentFullName,
                'course_id'         => $courseId,
                'target_school'     => $request->input('targetSchool'),
                'learning_style'    => $request->input('learningStyle', 'Classroom'),
                'centre_id'         => $centreId,
                'preferred_day'     => $request->input('preferredDay'),
                'preferred_session' => $request->input('preferredSession'),
                'writing_addon'     => $request->input('writingAddon'),
                'phone no'          => $request->input('mobile'),
                'email adress'      => $primaryEmail,
                'secondary_email'   => $request->input('secondaryEmail'),
                'adress'            => $request->input('address'),
            ]);

            $student = $creationResult['student'];
            $newRollNo = $creationResult['roll_no'];

            // 3. Send Professional Confirmation Email
            $this->sendRegistrationConfirmationEmail($registration, $student, $newRollNo, $courseName, $centreName);

            return response()->json([
                'success'         => true,
                'message'         => 'Registration submitted successfully!',
                'ref_number'      => $refNumber,
                'roll_no'         => $newRollNo,
                'registration_id' => $registration->id,
                'data'            => $registration->load(['course', 'centre']),
                'student'         => $student->load(['course', 'centre.location']),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('submitRegistration exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'input' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Registration processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send Professional Registration Confirmation Email to Student & Parent (Rich Green Theme)
     */
    protected function sendRegistrationConfirmationEmail($registration, $student, $newRollNo, $courseName, $centreName)
    {
        $primaryEmail = trim($registration->primary_email);
        if (!$primaryEmail || !filter_var($primaryEmail, FILTER_VALIDATE_EMAIL)) {
            Log::warning('sendRegistrationConfirmationEmail: No valid primary email', [
                'reg_id' => $registration->id ?? null
            ]);
            return;
        }

        try {
            $appName = config('app.name', 'XL Education');
            $studentName = trim($registration->first_name . ' ' . $registration->surname);
            $parentName = trim($registration->parent_first_name . ' ' . $registration->parent_surname);
            $refNumber = $registration->ref_number;
            $academicSession = $registration->academic_session ?: '2026-2027';
            $schoolYear = $registration->school_year ?: 'N/A';
            $learningStyle = $registration->learning_style ?: 'Classroom';
            $preferredDay = $registration->preferred_day ?: 'N/A';
            $preferredSession = $registration->preferred_session ?: 'N/A';
            $mobile = $registration->mobile ?: 'N/A';
            $portalLoginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login/student';

            $locationHtml = "";
            if ($learningStyle === 'Classroom' && $centreName) {
                $locationHtml = "
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600; width: 38%;'>Tuition Centre Location</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;'>{$centreName}</td>
                </tr>";
            }

            $emailHtml = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Enrollment Confirmed - {$appName}</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f0fdf4; padding: 36px 12px;'>
    <tr>
      <td align='center'>
        <!-- Main Email Container -->
        <table width='100%' cellpadding='0' cellspacing='0' style='max-width: 620px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 35px rgba(5, 150, 105, 0.12); border: 1.5px solid #bbf7d0;'>
          
          <!-- Green Header Celebration Banner -->
          <tr>
            <td style='background: linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%); padding: 38px 32px 32px; text-align: center;'>
              
              <!-- Celebration Confirmation Badge -->
              <div style='display: inline-block; background: rgba(255, 255, 255, 0.22); border: 1.5px solid rgba(255, 255, 255, 0.45); border-radius: 30px; padding: 6px 20px; margin-bottom: 14px;'>
                <span style='color: #ffffff; font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;'>&#10004; OFFICIAL ENROLLMENT CONFIRMATION</span>
              </div>
              
              <h1 style='margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;'>
                Congratulations, {$studentName}!
              </h1>
              <p style='margin: 8px 0 0; color: #dcfce7; font-size: 15px; line-height: 1.5; font-weight: 500;'>
                Your registration for <strong>{$courseName}</strong> has been successfully confirmed.
              </p>
            </td>
          </tr>

          <!-- Confirmation Graphic Banner (Green Modern Badge) -->
          <tr>
            <td style='background: #ecfdf5; padding: 18px 32px; border-bottom: 1px solid #d1fae5; text-align: center;'>
              <table align='center' cellpadding='0' cellspacing='0'>
                <tr>
                  <td style='background: #10b981; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; text-align: center; font-size: 20px; font-weight: bold; line-height: 36px;'>
                    &#10003;
                  </td>
                  <td style='padding-left: 14px; text-align: left;'>
                    <strong style='color: #065f46; font-size: 14px; display: block;'>Seat Secured &amp; Payment Received</strong>
                    <span style='color: #047857; font-size: 12px;'>Fee Paid: ₹49.00 / £49.00 &middot; Status: Active Enrolled</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Salutation -->
          <tr>
            <td style='padding: 28px 32px 14px;'>
              <p style='margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;'>
                Dear <strong>{$parentName}</strong>,
              </p>
              <p style='margin: 8px 0 0; color: #475569; font-size: 14px; line-height: 1.6;'>
                We are delighted to welcome your child <strong>{$studentName}</strong> to <strong>{$appName}</strong>. All registration and course enrollment details are officially recorded. Below are the assigned student credentials for portal login:
              </p>
            </td>
          </tr>

          <!-- Highlight Credentials Box (Roll No & Ref No) -->
          <tr>
            <td style='padding: 0 32px 20px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='background: #f0fdf4; border: 2px dashed #86efac; border-radius: 14px;'>
                <tr>
                  <td style='padding: 18px 20px; width: 50%; border-right: 1px dashed #86efac;' align='center'>
                    <span style='color: #15803d; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;'>STUDENT ID / ROLL NO</span>
                    <span style='color: #047857; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; display: block;'>{$newRollNo}</span>
                    <span style='color: #166534; font-size: 11px; font-weight: 600;'>(Your Login ID)</span>
                  </td>
                  <td style='padding: 18px 20px; width: 50%;' align='center'>
                    <span style='color: #15803d; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;'>REGISTRATION REF</span>
                    <span style='color: #0f172a; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; display: block;'>{$refNumber}</span>
                    <span style='display: inline-block; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 12px; margin-top: 3px;'>CONFIRMED &#10003;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Enrollment Details Table -->
          <tr>
            <td style='padding: 0 32px 24px;'>
              <h3 style='margin: 0 0 12px; color: #065f46; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px;'>
                &#128218; Course &amp; Batch Details
              </h3>
              <table width='100%' cellpadding='0' cellspacing='0' style='border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;'>
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600; width: 38%;'>Enrolled Course</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #047857; font-size: 14px; font-weight: 800;'>{$courseName}</td>
                </tr>
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600;'>Academic Session</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;'>{$academicSession}</td>
                </tr>
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600;'>School Year</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;'>{$schoolYear}</td>
                </tr>
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600;'>Delivery Format</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;'>{$learningStyle}</td>
                </tr>
                {$locationHtml}
                <tr>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 600;'>Class Schedule</td>
                  <td style='padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;'>{$preferredDay} &middot; {$preferredSession}</td>
                </tr>
                <tr>
                  <td style='padding: 12px 18px; color: #475569; font-size: 13px; font-weight: 600;'>Registered Mobile</td>
                  <td style='padding: 12px 18px; color: #0f172a; font-size: 13px; font-weight: 700;'>{$mobile}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Portal Access CTA Button -->
          <tr>
            <td style='padding: 0 32px 32px; text-align: center;'>
              <a href='{$portalLoginUrl}' target='_blank' style='display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 38px; border-radius: 12px; box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);'>
                🚀 Login to Student Portal &rarr;
              </a>
              <p style='margin: 12px 0 0; color: #64748b; font-size: 12px;'>
                Direct Portal Link: <a href='{$portalLoginUrl}' style='color: #059669; font-weight: 700; text-decoration: underline;'>{$portalLoginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Need Help / Support Footer -->
          <tr>
            <td style='background-color: #f8fafc; padding: 24px 32px; border-top: 1.5px solid #e2e8f0; text-align: center;'>
              <p style='margin: 0; color: #475569; font-size: 13px; line-height: 1.5;'>
                Need assistance? Contact our Admissions Office at <strong>support@xl-education.co.uk</strong> or call <strong>0118 907 9200</strong>.
              </p>
              <p style='margin: 10px 0 0; color: #94a3b8; font-size: 11px;'>
                &copy; " . date('Y') . " {$appName} Ltd. All rights reserved. Registered in England &amp; Wales.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

            \Illuminate\Support\Facades\Mail::html($emailHtml, function ($message) use ($primaryEmail, $registration, $appName, $refNumber, $studentName) {
                $message->to($primaryEmail)
                        ->subject("🎉 Enrollment Confirmed: {$studentName} [{$refNumber}] - Welcome to {$appName}!");

                if (!empty($registration->secondary_email) && filter_var(trim($registration->secondary_email), FILTER_VALIDATE_EMAIL)) {
                    $message->cc(trim($registration->secondary_email));
                }
            });

            Log::info('sendRegistrationConfirmationEmail: Confirmation email sent successfully to parent', [
                'primary_email' => $primaryEmail,
                'ref_number'    => $refNumber,
                'roll_no'       => $newRollNo,
            ]);

            // Dispatch Admin Notification Email
            $this->sendAdminRegistrationAlertEmail($registration, $student, $newRollNo, $courseName, $centreName);

        } catch (\Exception $e) {
            Log::error('sendRegistrationConfirmationEmail: Failed to send confirmation email', [
                'error'         => $e->getMessage(),
                'primary_email' => $primaryEmail,
            ]);
        }
    }

    /**
     * Send Admin Alert Email for New Student Registration
     */
    protected function sendAdminRegistrationAlertEmail($registration, $student, $newRollNo, $courseName, $centreName)
    {
        try {
            $appName = config('app.name', 'XL Education');
            $adminEmail = env('ADMIN_ALERT_EMAIL', 'mrrashidsaikh0365@gmail.com');
            $studentName = trim($registration->first_name . ' ' . $registration->surname);
            $parentName = trim($registration->parent_first_name . ' ' . $registration->parent_surname);
            $refNumber = $registration->ref_number;
            $schoolYear = $registration->school_year ?: 'N/A';
            $learningStyle = $registration->learning_style ?: 'Classroom';
            $preferredDay = $registration->preferred_day ?: 'N/A';
            $preferredSession = $registration->preferred_session ?: 'N/A';
            $mobile = $registration->mobile ?: 'N/A';
            $primaryEmail = $registration->primary_email;
            $adminStudentsUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/admin';

            $adminHtml = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <title>New Student Registration Alert</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f8fafc; padding: 32px 12px;'>
    <tr>
      <td align='center'>
        <table width='100%' cellpadding='0' cellspacing='0' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06); border: 1.5px solid #cbd5e1;'>
          
          <tr>
            <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 30px; text-align: left;'>
              <span style='background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; text-transform: uppercase;'>NEW ENROLLMENT RECEIVED</span>
              <h2 style='color: #ffffff; margin: 10px 0 0; font-size: 20px; font-weight: 800;'>
                New Student: {$studentName}
              </h2>
              <p style='color: #94a3b8; margin: 4px 0 0; font-size: 13px;'>
                Course: <strong style='color: #38bdf8;'>{$courseName}</strong> &middot; Roll No: <strong style='color: #4ade80;'>{$newRollNo}</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style='padding: 24px 30px;'>
              <table width='100%' cellpadding='0' cellspacing='0' style='border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;'>
                <tr style='background: #f8fafc;'>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;' width='35%'>Student Full Name</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$studentName}</td>
                </tr>
                <tr>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Assigned Roll No</td>
                  <td style='padding: 10px 14px; color: #059669; font-size: 13px; font-weight: 800; border-bottom: 1px solid #e2e8f0;'>{$newRollNo}</td>
                </tr>
                <tr style='background: #f8fafc;'>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Parent Name</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$parentName}</td>
                </tr>
                <tr>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Parent Email</td>
                  <td style='padding: 10px 14px; color: #0284c7; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$primaryEmail}</td>
                </tr>
                <tr style='background: #f8fafc;'>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Parent Mobile</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$mobile}</td>
                </tr>
                <tr>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>School Year</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$schoolYear}</td>
                </tr>
                <tr style='background: #f8fafc;'>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Course &amp; Mode</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$courseName} ({$learningStyle})</td>
                </tr>
                <tr>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>Location &amp; Batch</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;'>{$centreName} &middot; {$preferredDay} {$preferredSession}</td>
                </tr>
                <tr style='background: #f8fafc;'>
                  <td style='padding: 10px 14px; color: #64748b; font-size: 12px; font-weight: 700;'>Registration Ref</td>
                  <td style='padding: 10px 14px; color: #0f172a; font-size: 13px; font-weight: 700;'>{$refNumber}</td>
                </tr>
              </table>

              <div style='margin-top: 24px; text-align: center;'>
                <a href='{$adminStudentsUrl}' style='display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700;'>
                  Open Admin Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

            \Illuminate\Support\Facades\Mail::html($adminHtml, function ($message) use ($adminEmail, $studentName, $courseName, $newRollNo, $appName) {
                $message->to($adminEmail)
                        ->subject("🔔 [NEW STUDENT] {$studentName} enrolled in {$courseName} (Roll: {$newRollNo})");
            });

            Log::info('sendAdminRegistrationAlertEmail: Alert email sent to admin successfully', [
                'admin_email' => $adminEmail,
                'student'     => $studentName,
                'roll_no'     => $newRollNo,
            ]);
        } catch (\Exception $e) {
            Log::error('sendAdminRegistrationAlertEmail: Failed to send admin alert', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
