<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\Student;
use App\Models\StudentProduct;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentService
{
    protected string $keyId;
    protected string $keySecret;
    protected string $webhookSecret;

    public function __construct()
    {
        $this->keyId        = config('services.razorpay.key_id', env('RAZORPAY_KEY_ID', ''));
        $this->keySecret    = config('services.razorpay.key_secret', env('RAZORPAY_KEY_SECRET', ''));
        $this->webhookSecret = config('services.razorpay.webhook_secret', env('RAZORPAY_WEBHOOK_SECRET', ''));
    }

    /**
     * Create a Razorpay Order via official REST API.
     * Also persists a pending ProductOrder record so we can track it.
     */
    public function createOrder(
        float $amount,
        array $cartItems,
        ?int $studentId = null,
        float $discountAmount = 0,
        ?string $couponCode = null
    ): array {
        // ── 0. Handle 100% Free Coupon Order (STUDENT100) ───────────────────
        if ($amount <= 0) {
            $freeOrderId = 'FREE_' . strtoupper(Str::random(10));
            $subtotal = array_reduce($cartItems, fn($carry, $item) => $carry + (float)($item['price'] ?? 0), 0);

            $paidOrder = ProductOrder::create([
                'student_id'        => $studentId,
                'total_amount'      => $subtotal,
                'discount_amount'   => $subtotal,
                'final_amount'      => 0,
                'payment_method'    => 'FREE_COUPON',
                'payment_status'    => 'paid',
                'razorpay_order_id' => $freeOrderId,
                'coupon_code'       => $couponCode,
            ]);

            foreach ($cartItems as $item) {
                $productId = $item['id'] ?? null;
                if ($productId) {
                    ProductOrderItem::create([
                        'order_id'   => $paidOrder->id,
                        'product_id' => $productId,
                        'price'      => (float)($item['price'] ?? 0),
                        'quantity'   => (int)($item['quantity'] ?? 1),
                    ]);

                    if ($studentId) {
                        StudentProduct::firstOrCreate([
                            'student_id' => $studentId,
                            'product_id' => $productId,
                        ], [
                            'access_granted_at' => now(),
                            'is_active'         => true,
                        ]);
                    }
                }
            }

            Log::info('100% Free coupon order processed successfully', [
                'order_id'   => $paidOrder->id,
                'student_id' => $studentId,
                'coupon'     => $couponCode,
            ]);

            return [
                'is_free'           => true,
                'order_id'          => $paidOrder->id,
                'razorpay_order_id' => $freeOrderId,
                'amount'            => 0,
                'currency'          => 'INR',
                'key_id'            => $this->keyId,
                'message'           => '100% Free Coupon Applied! Products have been unlocked in your portal.',
            ];
        }

        $amountInPaise = (int) round($amount * 100);

        $payload = json_encode([
            'amount'          => $amountInPaise,
            'currency'        => 'INR',
            'receipt'         => 'rcpt_' . uniqid(),
            'payment_capture' => 1,
        ]);

        $ch = curl_init('https://api.razorpay.com/v1/orders');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_USERPWD        => $this->keyId . ':' . $this->keySecret,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            Log::error('Razorpay cURL error', ['error' => $curlErr]);
            throw new \RuntimeException('Network error connecting to Razorpay: ' . $curlErr);
        }

        $data = json_decode($response, true);

        if ($httpCode !== 200 || empty($data['id'])) {
            Log::error('Razorpay order creation failed', ['http_code' => $httpCode, 'response' => $data]);
            throw new \RuntimeException($data['error']['description'] ?? 'Failed to create Razorpay order.');
        }

        $razorpayOrderId = $data['id'];

        // ── Save a PENDING order in our DB immediately ──────────────────────
        $subtotal = array_reduce($cartItems, fn($carry, $item) => $carry + (float)($item['price'] ?? 0), 0);

        $pendingOrder = ProductOrder::create([
            'student_id'       => $studentId,
            'total_amount'     => $subtotal,
            'discount_amount'  => $discountAmount,
            'final_amount'     => $amount,
            'payment_method'   => 'RAZORPAY',
            'payment_status'   => 'pending',
            'razorpay_order_id'=> $razorpayOrderId,
            'coupon_code'      => $couponCode,
        ]);

        Log::info('Pending order created', [
            'razorpay_order_id' => $razorpayOrderId,
            'student_id'        => $studentId,
            'amount'            => $amount,
        ]);

        return [
            'razorpay_order_id' => $razorpayOrderId,
            'amount'            => $data['amount'],
            'currency'          => $data['currency'],
            'key_id'            => $this->keyId,
        ];
    }

    /**
     * Verify Razorpay payment HMAC signature.
     */
    public function verifySignature(string $razorpayOrderId, string $razorpayPaymentId, string $signature): bool
    {
        $expectedSignature = hash_hmac(
            'sha256',
            $razorpayOrderId . '|' . $razorpayPaymentId,
            $this->keySecret
        );

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Verify Razorpay Webhook signature.
     */
    public function verifyWebhookSignature(string $rawBody, string $signature): bool
    {
        if (empty($this->webhookSecret)) {
            return true; // Skip verification if no secret configured (dev mode)
        }

        $expectedSignature = hash_hmac('sha256', $rawBody, $this->webhookSecret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Grant product access to student after successful payment.
     * Finds the existing pending order by razorpay_order_id and updates it to paid.
     * Wrapped in DB transaction for atomicity.
     */
    public function grantAccess(
        ?Student $student,
        array $cartItems,
        float $totalAmount,
        float $discountAmount,
        float $finalAmount,
        string $paymentId,
        string $razorpayOrderId,
        string $paymentMethod = 'RAZORPAY',
        ?string $couponCode = null
    ): ProductOrder {
        return DB::transaction(function () use (
            $student, $cartItems, $totalAmount, $discountAmount,
            $finalAmount, $paymentId, $razorpayOrderId, $paymentMethod, $couponCode
        ) {
            // Find the pending order we created during createOrder step
            $order = ProductOrder::where('razorpay_order_id', $razorpayOrderId)
                ->where('payment_status', 'pending')
                ->first();

            if ($order) {
                // Update existing pending → paid
                $order->update([
                    'payment_status' => 'paid',
                    'transaction_id' => $paymentId,
                    'payment_method' => $paymentMethod,
                ]);
            } else {
                // Fallback: create fresh order (safety net)
                $order = ProductOrder::create([
                    'student_id'       => $student?->id,
                    'total_amount'     => $totalAmount,
                    'discount_amount'  => $discountAmount,
                    'final_amount'     => $finalAmount,
                    'payment_method'   => $paymentMethod,
                    'payment_status'   => 'paid',
                    'transaction_id'   => $paymentId,
                    'coupon_code'      => $couponCode,
                    'razorpay_order_id'=> $razorpayOrderId,
                ]);
            }

            foreach ($cartItems as $item) {
                $product = Product::find($item['id']);
                if (!$product) continue;

                // Create order line item (avoid duplicates)
                ProductOrderItem::firstOrCreate(
                    ['order_id' => $order->id, 'product_id' => $product->id],
                    ['price'    => $item['price'] ?? $product->price]
                );

                // Grant student access (upsert to avoid duplicates)
                StudentProduct::updateOrCreate(
                    [
                        'student_id' => $student?->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'order_id'       => $order->id,
                        'status'         => 'active',
                        'purchased_at'   => now(),
                        'expires_at'     => $product->validity_days
                            ? now()->addDays($product->validity_days)
                            : null,
                        'amount_paid'    => $item['price'] ?? $product->price,
                        'transaction_id' => $paymentId,
                    ]
                );
            }

            Log::info('Payment access granted', [
                'razorpay_order_id' => $order->razorpay_order_id,
                'student_id'        => $student?->id,
                'items_count'       => count($cartItems),
                'final_amount'      => $finalAmount,
            ]);

            return $order->load('items.product', 'student');
        });
    }

    /**
     * Mark a pending order as cancelled (user dismissed payment popup).
     */
    public function cancelOrder(string $razorpayOrderId): void
    {
        ProductOrder::where('razorpay_order_id', $razorpayOrderId)
            ->where('payment_status', 'pending')
            ->update(['payment_status' => 'cancelled']);

        Log::info('Order cancelled by user', ['razorpay_order_id' => $razorpayOrderId]);
    }

    /**
     * Mark a pending order as failed.
     */
    public function failOrder(string $razorpayOrderId): void
    {
        ProductOrder::where('razorpay_order_id', $razorpayOrderId)
            ->where('payment_status', 'pending')
            ->update(['payment_status' => 'failed']);

        Log::warning('Order failed', ['razorpay_order_id' => $razorpayOrderId]);
    }

    /**
     * Query Razorpay API for payments associated with a Razorpay Order ID.
     */
    public function fetchRazorpayPayments(string $razorpayOrderId): array
    {
        if (empty($this->keyId) || empty($this->keySecret)) {
            return [];
        }

        $ch = curl_init("https://api.razorpay.com/v1/orders/{$razorpayOrderId}/payments");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET        => true,
            CURLOPT_USERPWD        => $this->keyId . ':' . $this->keySecret,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr || $httpCode !== 200) {
            Log::warning('Failed to fetch Razorpay payments for order', [
                'order_id'  => $razorpayOrderId,
                'http_code' => $httpCode,
                'error'     => $curlErr,
            ]);
            return [];
        }

        $data = json_decode($response, true);
        
        return $data['items'] ?? [];
    }

    /**
     * Reconcile all pending orders against Razorpay API.
     * Updates orders to 'completed' / 'paid' or 'failed' and grants product access.
     */
    public function syncPendingOrders(?callable $onOrderCompleted = null): array
    {
        $pendingOrders = ProductOrder::with(['items.product', 'student'])
            ->where('payment_status', 'pending')
            ->whereNotNull('razorpay_order_id')
            ->get();

        $stats = [
            'total_pending'   => $pendingOrders->count(),
            'resolved_paid'   => 0,
            'resolved_failed' => 0,
            'still_pending'   => 0,
        ];

        foreach ($pendingOrders as $order) {
            $rzpOrderId = $order->razorpay_order_id;
            $payments   = $this->fetchRazorpayPayments($rzpOrderId);
            
            if (empty($payments)) {
                // If order was created more than 48 hours ago with 0 payment attempts, mark failed
                if ($order->created_at && $order->created_at->diffInHours(now()) >= 48) {
                    $order->update(['payment_status' => 'failed']);
                    $stats['resolved_failed']++;
                } else {
                    $stats['still_pending']++;
                }
                continue;
            }

            // Check if any payment was captured or authorized
            $successfulPayment = collect($payments)->first(function ($p) {
                return in_array($p['status'] ?? '', ['captured', 'authorized']);
            });

            if ($successfulPayment) {
                DB::transaction(function () use ($order, $successfulPayment, $onOrderCompleted, &$stats) {
                    $paymentId = $successfulPayment['id'];
                    $method    = strtoupper($successfulPayment['method'] ?? 'RAZORPAY');

                    $order->update([
                        'payment_status' => 'paid',
                        'transaction_id' => $paymentId,
                        'payment_method' => $method,
                    ]);

                    // Grant access to all products in order
                    $enrolledProducts = [];
                    foreach ($order->items as $item) {
                        $product = $item->product;
                        if (!$product) continue;

                        $expiresAt = $product->validity_days ? now()->addDays($product->validity_days) : null;

                        StudentProduct::updateOrCreate(
                            [
                                'student_id' => $order->student_id,
                                'product_id' => $product->id,
                            ],
                            [
                                'order_id'       => $order->id,
                                'status'         => 'active',
                                'purchased_at'   => now(),
                                'expires_at'     => $expiresAt,
                                'amount_paid'    => $item->price,
                                'transaction_id' => $paymentId,
                            ]
                        );

                        $enrolledProducts[] = [
                            'id'         => $product->id,
                            'title'      => $product->title,
                            'category'   => $product->category,
                            'price'      => $item->price,
                            'expires_at' => $expiresAt?->format('Y-m-d'),
                        ];
                    }

                    if (is_callable($onOrderCompleted)) {
                        $onOrderCompleted($order, $enrolledProducts);
                    }

                    $stats['resolved_paid']++;
                    Log::info('Pending order synced to PAID via Razorpay check', [
                        'order_id'   => $order->id,
                        'rzp_order'  => $order->razorpay_order_id,
                        'payment_id' => $paymentId,
                    ]);
                });
            } else {
                // All attempts failed
                $allFailed = collect($payments)->every(fn($p) => ($p['status'] ?? '') === 'failed');
                if ($allFailed) {
                    $order->update(['payment_status' => 'failed']);
                    $stats['resolved_failed']++;
                } else {
                    $stats['still_pending']++;
                }
            }
        }

        return $stats;
    }
}
