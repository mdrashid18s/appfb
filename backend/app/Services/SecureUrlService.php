<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\Request;

/**
 * Class SecureUrlService
 * 
 * Yeh service 3 alag-alag tareeqon se URLs aur URL parameters ko encrypt aur secure karti hai:
 * 1. Crypt Encryption: Two-Way AES-256 encrypted query parameter (e.g. token=eyJpdiI6...)
 * 2. Signed URLs: Laravel Cryptographic Signature jo URL tampered ya expired hone par reject kar deta hai.
 * 3. ID Obfuscation (Hash IDs): Clean hashed IDs taaki sequential database IDs (1, 2, 3) URL me leak na hon.
 */
class SecureUrlService
{
    // ══════════════════════════════════════════════════════════════════
    // METHOD 1: TWO-WAY AES-256 URL PARAMETER ENCRYPTION
    // ══════════════════════════════════════════════════════════════════

    /**
     * Kisi bhi value ya array ko URL-safe encrypted string mein convert karta hai.
     *
     * @param mixed $data (ID, email, array, etc.)
     * @return string
     */
    public static function encryptParam($data): string
    {
        $serialized = is_array($data) ? json_encode($data) : strval($data);
        $encrypted = Crypt::encryptString($serialized);
        
        // URL-safe base64 encoding (slashes aur plus signs ko safe banana)
        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    /**
     * Encrypted URL parameter ko decrypt karke original value return karta hai.
     *
     * @param string $encryptedParam
     * @return mixed
     */
    public static function decryptParam(string $encryptedParam)
    {
        try {
            // URL-safe base64 decoding
            $decoded = base64_decode(strtr($encryptedParam, '-_', '+/'));
            $decrypted = Crypt::decryptString($decoded);

            // Agar JSON array tha toh decode karein, warna original string return karein
            $json = json_decode($decrypted, true);
            return (json_last_error() === JSON_ERROR_NONE && is_array($json)) ? $json : $decrypted;
        } catch (\Exception $e) {
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // METHOD 2: LARAVEL SIGNED TAMPER-PROOF URLS
    // ══════════════════════════════════════════════════════════════════

    /**
     * Tamper-proof Temporary Signed URL create karta hai jo specified minutes ke baad expire ho jayegi.
     *
     * @param string $routeName (Named route name in api.php or web.php)
     * @param array $parameters (e.g. ['student_id' => 15, 'test_id' => 101])
     * @param int $expirationMinutes (Default 30 minutes)
     * @return string
     */
    public static function createSignedLink(string $routeName, array $parameters = [], int $expirationMinutes = 30): string
    {
        return URL::temporarySignedRoute(
            $routeName,
            now()->addMinutes($expirationMinutes),
            $parameters
        );
    }

    /**
     * Check karta hai ki incoming request ki Signed URL valid hai ya nahi (tampered ya expired check).
     *
     * @param Request $request
     * @return bool
     */
    public static function validateSignedLink(Request $request): bool
    {
        return $request->hasValidSignature();
    }

    // ══════════════════════════════════════════════════════════════════
    // METHOD 3: OBFUSCATED HASH IDS (CLEAN SHORT URLS)
    // ══════════════════════════════════════════════════════════════════

    /**
     * Database ID (e.g. 15) ko clean short hash (e.g. 'aB8x9Q') me convert karta hai.
     *
     * @param int|string $id
     * @param string $prefix
     * @return string
     */
    public static function hashId($id, string $prefix = 'XL'): string
    {
        $hash = substr(hash_hmac('sha256', strval($id), config('app.key', 'xleducation_secret_key')), 0, 8);
        return strtoupper($prefix . '-' . dechex(intval($id) + 1048576) . '-' . $hash);
    }

    /**
     * Obfuscated hash se original Database ID decode karta hai.
     *
     * @param string $hashString
     * @param string $prefix
     * @return int|null
     */
    public static function decodeHashId(string $hashString, string $prefix = 'XL'): ?int
    {
        $parts = explode('-', $hashString);
        if (count($parts) !== 3 || strtoupper($parts[0]) !== strtoupper($prefix)) {
            return null;
        }

        $rawHex = $parts[1];
        $expectedHash = $parts[2];

        $id = hexdec($rawHex) - 1048576;
        if ($id <= 0) {
            return null;
        }

        // Verify checksum integrity
        $actualHash = substr(hash_hmac('sha256', strval($id), config('app.key', 'xleducation_secret_key')), 0, 8);
        if (strtoupper($actualHash) !== strtoupper($expectedHash)) {
            return null; // Tampered hash
        }

        return $id;
    }
}
