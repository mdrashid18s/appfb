<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\SecureUrlService;

/**
 * Class SecurityDemoController
 * 
 * Yeh controller URL Encryption, Signed URLs aur Hashed IDs ke 3 methods ka working demo provide karta hai.
 */
class SecurityDemoController extends Controller
{
    /**
     * Demo 1: Generate & Test Encrypted URL Parameter
     * GET /api/security/demo-encrypt?student_id=15
     */
    public function demoEncrypt(Request $request)
    {
        $studentId = $request->query('student_id', 15);
        $payload = [
            'student_id' => $studentId,
            'role'       => 'student',
            'timestamp'  => now()->toDateTimeString()
        ];

        // 1. Encrypt parameter:
        $token = SecureUrlService::encryptParam($payload);

        // 2. Decrypt parameter:
        $decryptedData = SecureUrlService::decryptParam($token);

        return response()->json([
            'success'        => true,
            'method'         => '1. AES-256 Two-Way Crypt Encryption',
            'original_data'  => $payload,
            'encrypted_url'  => url("/api/student/report?token={$token}"),
            'token'          => $token,
            'decrypted_data' => $decryptedData,
        ]);
    }

    /**
     * Demo 2: Generate & Test Laravel Signed URL
     * GET /api/security/demo-signed?student_id=15
     */
    public function demoSigned(Request $request)
    {
        $studentId = $request->query('student_id', 15);

        // 1. Create a 30-minute signed URL
        $signedUrl = SecureUrlService::createSignedLink('api.security.verify-signed', [
            'student_id' => $studentId,
            'test_id'    => 101,
        ], 30);

        return response()->json([
            'success'    => true,
            'method'     => '2. Laravel Tamper-Proof Signed URL',
            'signed_url' => $signedUrl,
            'expires_in' => '30 minutes',
            'info'       => 'Agar is URL me student_id ya parameters change karenge, toh URL reject ho jayegi.'
        ]);
    }

    /**
     * Demo 2 (Verification Endpoint for Signed URL):
     * GET /api/security/verify-signed
     */
    public function verifySigned(Request $request)
    {
        if (!SecureUrlService::validateSignedLink($request)) {
            return response()->json([
                'success' => false,
                'message' => '403 Forbidden: Invalid or Expired Signed URL!'
            ], 403);
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Signature Validated Successfully!',
            'student_id' => $request->query('student_id'),
            'test_id'    => $request->query('test_id'),
        ]);
    }

    /**
     * Demo 3: Generate & Test Obfuscated Hash IDs
     * GET /api/security/demo-hashid?id=15
     */
    public function demoHashId(Request $request)
    {
        $id = intval($request->query('id', 15));

        // 1. Convert simple ID to secure hash ID:
        $hashedId = SecureUrlService::hashId($id);

        // 2. Decode back to original ID:
        $decodedId = SecureUrlService::decodeHashId($hashedId);

        return response()->json([
            'success'      => true,
            'method'       => '3. Clean Obfuscated Hash IDs (ID Hiding)',
            'original_id'  => $id,
            'clean_url'    => url("/student/report/{$hashedId}"),
            'hashed_id'    => $hashedId,
            'decoded_back' => $decodedId,
        ]);
    }
}
