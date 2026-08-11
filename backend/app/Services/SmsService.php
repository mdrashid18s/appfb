<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an OTP via SMS
     *
     * @param string $mobileNumber
     * @param string $otp
     * @return bool
     */
    public static function sendOtp($mobileNumber, $otp)
    {
        // For local development or missing API key, we will log the OTP
        $apiKey = env('FAST2SMS_API_KEY');
        
        $message = "Your XL Education password reset OTP is {$otp}. Do not share this with anyone. Valid for 10 minutes.";

        if (!$apiKey || $apiKey === 'your_fast2sms_api_key_here') {
            Log::info("SMS Mock: To {$mobileNumber} - {$message}");
            return true; // Pretend it succeeded
        }

        try {
            // Fast2SMS integration via their Route API
            $response = Http::withHeaders([
                'authorization' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post('https://www.fast2sms.com/dev/bulkV2', [
                'route' => 'v3',
                'sender_id' => 'TXTIND', // Default sender ID
                'message' => $message,
                'language' => 'english',
                'flash' => 0,
                'numbers' => $mobileNumber
            ]);

            $result = $response->json();

            if ($response->successful() && isset($result['return']) && $result['return'] === true) {
                return true;
            }

            Log::error("Fast2SMS Error: " . json_encode($result));
            return false;
        } catch (\Exception $e) {
            Log::error("SMS Service Exception: " . $e->getMessage());
            return false;
        }
    }
}
