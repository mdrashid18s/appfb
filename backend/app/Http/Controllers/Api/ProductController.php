<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplyCouponRequest;
use App\Http\Requests\CreateRazorpayOrderRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\VerifyRazorpayRequest;
use App\Http\Resources\ProductResource;
use App\Services\CouponService;
use App\Services\PaymentService;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\StudentProduct;
use App\Models\Student;
use App\Models\User;
use App\Models\ProductExchange;
use App\Models\StudentWalletTransaction;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProductController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected CouponService  $couponService,
    ) {}

    /**
     * Helper to seed default high-quality products if store table is empty.
     */
    private function seedDefaultProducts()
    {
        if (Product::count() > 0) {
            return;
        }

        $defaultProducts = [
            // Mock Interviews
            [
                'title' => 'FAANG & Top MNC 1-on-1 Mock Interview with Senior Engineer',
                'slug' => 'faang-1on1-mock-interview',
                'category' => 'mock_interview',
                'short_description' => 'Real-time 60 mins interview simulation with an ex-Google/Amazon Tech Lead.',
                'description' => 'Experience a full-length live 1-on-1 technical interview simulation. Get actionable critique on coding style, problem-solving approach, edge case handling, and communication.',
                'price' => 999.00,
                'original_price' => 2499.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
                'badge' => 'Top Rated',
                'rating' => 4.95,
                'reviews_count' => 340,
                'validity_days' => 90,
                'features' => [
                    '60 Mins 1-on-1 Live Video Interview',
                    'Real Coding & System Design Problems',
                    'Detailed Written Feedback Report',
                    'Resume & LinkedIn Profile Audit'
                ]
            ],
            [
                'title' => 'System Design & Low Level Architecture Mock Interview',
                'slug' => 'system-design-mock-interview',
                'category' => 'mock_interview',
                'short_description' => 'Master distributed systems, DB partitioning & LLD/HLD whiteboard sessions.',
                'description' => 'Designed for aspiring SDE-2 and Lead positions. Practice building scalable microservices, load balancers, caching strategies, and OOP design patterns.',
                'price' => 799.00,
                'original_price' => 1999.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
                'badge' => 'Popular',
                'rating' => 4.88,
                'reviews_count' => 210,
                'validity_days' => 90,
                'features' => [
                    'High Level & Low Level System Design',
                    'Database Schema & Scalability Whiteboarding',
                    'Concurrency & Design Patterns Practice',
                    'Live Audio/Video Mock Feedback'
                ]
            ],
            [
                'title' => 'HR & Behavioural Interview Prep Pack with Industry Experts',
                'slug' => 'hr-behavioural-mock-pack',
                'category' => 'mock_interview',
                'short_description' => 'Conquer STAR framework questions, conflict handling, and salary negotiation.',
                'description' => 'Behavioral rounds eliminate over 40% of candidates. Learn how to tell compelling project stories, explain failures constructively, and answer culture-fit questions.',
                'price' => 499.00,
                'original_price' => 1299.00,
                'badge' => 'Essential',
                'rating' => 4.80,
                'reviews_count' => 180,
                'validity_days' => 90,
                'features' => [
                    'STAR Method Mastery Training',
                    '30 Mins Mock HR Session with Feedback',
                    'Salary & Perks Negotiation Playbook',
                    'Common Behavioral Q&A PDF Guide'
                ]
            ],

            // Test Series
            [
                'title' => 'GATE CS & IT 2026 Full Test Series + Subject Wise Mocks',
                'slug' => 'gate-cs-it-2026-test-series',
                'category' => 'test_series',
                'short_description' => '35+ Full Length GATE Mocks, 120+ Topic Tests with All India Percentile.',
                'description' => 'Strictly aligned with latest GATE CS syllabus. Includes virtual calculator simulation, detailed video solutions, subject rank analysis, and weak area analysis.',
                'price' => 1499.00,
                'original_price' => 3999.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
                'badge' => 'Bestseller',
                'rating' => 4.92,
                'reviews_count' => 850,
                'validity_days' => 365,
                'features' => [
                    '35+ Full Length GATE Standard Mocks',
                    '120+ Chapter & Subject Wise Tests',
                    'Built-in Virtual Calculator & GATE UI',
                    'All India Rank & Percentile Prediction'
                ]
            ],
            [
                'title' => 'Complete Campus Placement Test Series (Aptitude + Coding)',
                'slug' => 'campus-placement-test-series',
                'category' => 'test_series',
                'short_description' => 'TCS NQT, Infosys, Wipro & Accenture mock exams with timed sections.',
                'description' => 'Comprehensive online assessment series covering Quantitative Aptitude, Logical Reasoning, Verbal Ability, Pseudocode, and Hands-on Coding questions.',
                'price' => 899.00,
                'original_price' => 2499.00,
                'badge' => 'Hot Deal',
                'rating' => 4.85,
                'reviews_count' => 620,
                'validity_days' => 180,
                'features' => [
                    'Company Specific Exam Pattern Mocks',
                    'Quantitative & Logical Sectional Tests',
                    'Data Structures Coding Arena Practice',
                    'Speed & Accuracy Analytics Dashboard'
                ]
            ],

            // Courses
            [
                'title' => 'Full Stack MERN Mastery: Zero to Production Engineer',
                'slug' => 'fullstack-mern-mastery-course',
                'category' => 'course',
                'short_description' => 'Build 10+ real-world SaaS applications with React 19, Node.js, Express & MongoDB.',
                'description' => 'A complete industry-ready web development course. Learn modern React, Redux Toolkit, RESTful APIs, JWT Auth, Payment Gateways, CI/CD, and Cloud Deployment.',
                'price' => 2499.00,
                'original_price' => 6999.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
                'badge' => 'Bestseller',
                'rating' => 4.98,
                'reviews_count' => 1120,
                'validity_days' => 365,
                'features' => [
                    '120+ Hours HD Video Lectures',
                    '10+ Production Full Stack Projects',
                    'Source Code & GitHub Repository Access',
                    'Certificate of Completion & Career Support'
                ]
            ],
            [
                'title' => 'Data Structures & Algorithms in C++ & Java Bootcamp',
                'slug' => 'dsa-cpp-java-bootcamp',
                'category' => 'course',
                'short_description' => '400+ LeetCode problems cracked step-by-step with optimal complexity.',
                'description' => 'From arrays and recursion to dynamic programming, graph algorithms, and trie structures. Master problem-solving techniques for top tech companies.',
                'price' => 1999.00,
                'original_price' => 4999.00,
                'badge' => 'Trending',
                'rating' => 4.90,
                'reviews_count' => 940,
                'validity_days' => 365,
                'features' => [
                    '400+ Hand-picked Coding Problems',
                    'Time & Space Complexity Visualisations',
                    'Dynamic Programming & Graph Patterns',
                    'Discord Support & Code Review'
                ]
            ],

            // eBooks
            [
                'title' => 'Top 500 Software Engineering Interview Q&A Playbook',
                'slug' => 'top-500-swe-interview-ebook',
                'category' => 'ebook',
                'short_description' => 'Comprehensive hand-book covering Core CS, OOPs, DBMS, OS, Networking & Web.',
                'description' => 'Quick revision guide packed with diagrammatic explanations, short code snippets, common pitfalls, and conceptual cheat sheets for quick interview prep.',
                'price' => 299.00,
                'original_price' => 799.00,
                'badge' => 'Instant Download',
                'rating' => 4.75,
                'reviews_count' => 410,
                'validity_days' => 3650,
                'features' => [
                    'PDF & Mobile Friendly ePub Format',
                    'System Design & OOPs Cheat Sheets',
                    'Core Java, Python & C++ Flashcards',
                    'Lifetime Free Future Updates'
                ]
            ]
        ];

        foreach ($defaultProducts as $prod) {
            Product::create($prod);
        }
    }

    /**
     * GET /api/products
     * List active products.
     */
    public function index(Request $request)
    {
        $this->seedDefaultProducts();

        // ── Model Query Scopes (MVC Pattern) ──────────────────────────────────
        $products = Product::active()
            ->byCategory($request->query('category'))
            ->search($request->query('search'))
            ->sortedBy($request->query('sort'))
            ->get();

        // ── Determine current student for is_purchased flag ────────────────────
        $studentId = $request->header('Student-Id')
            ?? $request->query('student_id')
            ?? $request->input('student_id');

        $rollNo = $request->query('roll_no') ?? $request->header('Student-Roll-No');
        if (!$studentId && $rollNo) {
            $st = Student::where('roll no', $rollNo)->orWhere('roll_no', $rollNo)->first();
            if ($st) {
                $studentId = $st->id;
            }
        }

        $purchasedIds = $studentId
            ? StudentProduct::where('student_id', $studentId)
                ->where('status', 'active')
                ->pluck('product_id')
                ->toArray()
            : [];

        // ── Attach is_purchased to each product then wrap in Resource ─────────
        $products->each(function (Product $p) use ($purchasedIds) {
            $p->is_purchased = in_array($p->id, $purchasedIds);
        });

        return response()->json([
            'success'  => true,
            'products' => ProductResource::collection($products),
        ]);
    }

    /**
     * GET /api/products/{product}  — Route Model Binding
     */
    public function show(Product $product, Request $request)
    {
        $studentId = $request->header('Student-Id') ?? $request->query('student_id');

        $product->is_purchased = $studentId
            ? StudentProduct::where('student_id', $studentId)
                ->where('product_id', $product->id)
                ->where('status', 'active')
                ->exists()
            : false;

        return response()->json([
            'success' => true,
            'product' => new ProductResource($product),
        ]);
    }

    /**
     * POST /api/products/apply-coupon
     * Uses ApplyCouponRequest for validation + CouponService for business logic.
     */
    public function applyCoupon(ApplyCouponRequest $request)
    {
        try {
            $result = $this->couponService->apply(
                $request->validated()['coupon_code'],
                (float) $request->validated()['cart_total']
            );

            return response()->json(array_merge(['success' => true], $result));

        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/products/checkout
     * Process checkout, grant access, and send confirmation emails to Student & Admin.
     */
    public function checkout(Request $request)
    {
        $studentUser = $request->user();
        $studentId = $request->input('student_id', $studentUser ? ($studentUser->student_id ?? $studentUser->id) : null);
        $studentObj = null;

        if ($studentId) {
            $studentObj = Student::find($studentId);
        }

        if (!$studentObj) {
            $rollNo = $request->input('roll_no', $request->header('Student-Id'));
            if ($rollNo) {
                $studentObj = Student::where('roll no', $rollNo)->orWhere('id', $rollNo)->first();
                if ($studentObj) $studentId = $studentObj->id;
            }
        }

        if (!$studentObj) {
            $email = $request->input('email');
            if ($email) {
                $studentObj = Student::where('email adress', $email)->first();
                if ($studentObj) $studentId = $studentObj->id;
            }
        }

        if (!$studentObj) {
            $studentObj = Student::first();
            if ($studentObj) $studentId = $studentObj->id;
        }

        if (!$studentId || !$studentObj) {
            return response()->json(['success' => false, 'message' => 'Student record not found. Please log in.'], 401);
        }

        $cartItems = $request->input('cart_items', []);
        if (empty($cartItems)) {
            return response()->json(['success' => false, 'message' => 'Your cart is empty.'], 400);
        }

        $totalAmount = (float) $request->input('total_amount', 0);
        $discountAmount = (float) $request->input('discount_amount', 0);
        $rawFinal = max(0, $totalAmount - $discountAmount);
        $couponCode = $request->input('coupon_code', null);
        $useWallet = (bool) $request->input('use_wallet', false);

        $walletUsed = 0;
        if ($useWallet && $rawFinal > 0 && ((float)$studentObj->wallet_balance) > 0) {
            $walletUsed = min($rawFinal, (float)$studentObj->wallet_balance);
        }

        $finalAmount = max(0, round($rawFinal - $walletUsed, 2));
        
        $paymentMethod = $finalAmount <= 0 
            ? ($walletUsed > 0 ? 'STORE_WALLET_PAYMENT' : 'FREE_COUPON (' . ($couponCode ?: 'STUDENT100') . ')')
            : $request->input('payment_method', 'DIRECT_PAY');

        DB::beginTransaction();
        try {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . rand(1000, 9999);
            $transactionId = 'TXN-' . strtoupper(Str::random(10));

            if ($walletUsed > 0) {
                $studentObj->debitWallet($walletUsed, "Store Purchase: {$orderNumber}", $orderNumber);
            }

            $order = ProductOrder::create([
                'order_number' => $orderNumber,
                'student_id' => $studentId,
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount + $walletUsed,
                'final_amount' => $finalAmount,
                'payment_method' => strtoupper($paymentMethod),
                'payment_status' => 'completed',
                'transaction_id' => $transactionId,
                'coupon_code' => $couponCode,
            ]);

            $enrolledProducts = [];
            $itemTitles = [];

            foreach ($cartItems as $item) {
                $productId = is_array($item) ? $item['id'] : $item;
                $product = Product::find($productId);
                if (!$product) continue;

                ProductOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'price' => $product->price,
                ]);

                $expiresAt = now()->addDays($product->validity_days);

                StudentProduct::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'product_id' => $product->id,
                    ],
                    [
                        'order_id' => $order->id,
                        'purchased_at' => now(),
                        'expires_at' => $expiresAt,
                        'status' => 'active',
                    ]
                );

                $enrolledProducts[] = [
                    'id' => $product->id,
                    'title' => $product->title,
                    'category' => $product->category,
                    'price' => $product->price,
                    'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                ];
                $itemTitles[] = $product->title;
            }

            DB::commit();

            // ── Send Confirmation Emails (Student + Admin) ──
            $this->sendOrderEmails($studentObj, $order, $enrolledProducts);

            return response()->json([
                'success' => true,
                'message' => 'Payment successful! Access granted and confirmation email sent.',
                'order' => [
                    'order_number' => $order->order_number,
                    'transaction_id' => $order->transaction_id,
                    'final_amount' => $order->final_amount,
                    'payment_method' => $order->payment_method,
                    'purchased_at' => $order->created_at->format('d M Y, h:i A'),
                    'items' => $enrolledProducts,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ], 500);
        }
    }



    /**
     * GET /api/student/purchases
     */
    public function myPurchases(Request $request)
    {
        $studentId = $request->user() ? $request->user()->id : null;

        if (!$studentId && $request->header('Student-Id')) {
            $studentId = $request->header('Student-Id');
        }

        if (!$studentId && $request->query('roll_no')) {
            $st = Student::where('roll no', $request->query('roll_no'))->first();
            if ($st) $studentId = $st->id;
        }

        if (!$studentId) {
            return response()->json(['success' => false, 'purchases' => []]);
        }

        $purchases = StudentProduct::with('product', 'order')
            ->where('student_id', $studentId)
            ->where('status', 'active')
            ->orderBy('purchased_at', 'desc')
            ->get();

        $formatted = $purchases->map(function($p) {
            return [
                'id'                 => $p->id,
                'student_product_id' => $p->id,
                'product_id'         => $p->product_id,
                'title'              => $p->product ? $p->product->title : 'Product',
                'category'           => $p->product ? $p->product->category : 'course',
                'price'              => $p->product ? (float)$p->product->price : 0,
                'short_description'  => $p->product ? $p->product->short_description : '',
                'thumbnail'          => $p->product ? $p->product->thumbnail : null,
                'features'           => $p->product ? $p->product->features : [],
                'purchased_at'       => $p->purchased_at ? date('d M Y', strtotime($p->purchased_at)) : null,
                'expires_at'         => $p->expires_at ? date('d M Y', strtotime($p->expires_at)) : null,
                'order_number'       => $p->order ? ($p->order->razorpay_order_id ?? ('ORD-' . $p->order->id)) : '',
                'razorpay_order_id'  => $p->order ? ($p->order->razorpay_order_id ?? '') : '',
                'amount_paid'        => $p->order ? $p->order->final_amount : 0,
                'can_exchange'       => true,
            ];
        });

        $studentObj = Student::find($studentId);

        return response()->json([
            'success'        => true,
            'purchases'      => $formatted,
            'wallet_balance' => (float)($studentObj ? $studentObj->wallet_balance : 0.00),
        ]);
    }

    /**
     * GET /api/student/wallet
     * Return student store wallet balance and recent credit/debit transaction history.
     */
    public function getStudentWallet(Request $request)
    {
        $studentUser = $request->user();
        $studentId = $request->input('student_id', $studentUser ? ($studentUser->student_id ?? $studentUser->id) : null);
        $studentObj = null;

        if ($studentId) {
            $studentObj = Student::find($studentId);
        }

        if (!$studentObj) {
            $rollNo = $request->input('roll_no', $request->header('Student-Id') ?: $request->query('roll_no'));
            if ($rollNo) {
                $studentObj = Student::where('roll no', $rollNo)->orWhere('id', $rollNo)->first();
            }
        }

        if (!$studentObj) {
            $studentObj = Student::first();
        }

        if (!$studentObj) {
            return response()->json(['success' => false, 'balance' => 0, 'transactions' => []]);
        }

        $transactions = StudentWalletTransaction::where('student_id', $studentObj->id)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'success'      => true,
            'balance'      => (float)($studentObj->wallet_balance ?? 0.00),
            'student_id'   => $studentObj->id,
            'student_name' => $studentObj->name,
            'transactions' => $transactions,
        ]);
    }

    /**
     * GET /api/products/exchange-targets/{studentProductId}
     * Return current product details + all other catalog items with live price differences.
     */
    public function getExchangeTargets(Request $request, $studentProductId)
    {
        $studentProduct = StudentProduct::with('product')->find($studentProductId);
        if (!$studentProduct || !$studentProduct->product) {
            return response()->json(['success' => false, 'message' => 'Purchased item not found.'], 404);
        }

        $currentProduct = $studentProduct->product;
        $currentPrice = (float)$currentProduct->price;

        $student = Student::find($studentProduct->student_id);

        $activeProductIds = StudentProduct::where('student_id', $studentProduct->student_id)
            ->where('status', 'active')
            ->pluck('product_id')
            ->toArray();

        $availableProducts = Product::where('is_active', true)
            ->where('id', '!=', $currentProduct->id)
            ->whereNotIn('id', $activeProductIds)
            ->get()
            ->map(function ($p) use ($currentPrice) {
                $targetPrice = (float)$p->price;
                $diff = round($targetPrice - $currentPrice, 2);
                return [
                    'id'                => $p->id,
                    'title'             => $p->title,
                    'category'          => $p->category,
                    'price'             => $targetPrice,
                    'short_description' => $p->short_description,
                    'thumbnail'         => $p->thumbnail,
                    'features'          => $p->features,
                    'price_diff'        => $diff,
                    'action_type'       => $diff > 0 ? 'pay_difference' : ($diff < 0 ? 'refund_to_wallet' : 'free_exchange'),
                    'refund_amount'     => $diff < 0 ? abs($diff) : 0,
                    'pay_amount'        => $diff > 0 ? $diff : 0,
                ];
            });

        return response()->json([
            'success'          => true,
            'current_product'  => [
                'student_product_id' => $studentProduct->id,
                'id'                 => $currentProduct->id,
                'title'              => $currentProduct->title,
                'category'           => $currentProduct->category,
                'price'              => $currentPrice,
                'thumbnail'          => $currentProduct->thumbnail,
                'purchased_at'       => $studentProduct->purchased_at ? date('d M Y', strtotime($studentProduct->purchased_at)) : null,
            ],
            'wallet_balance'   => (float)($student ? $student->wallet_balance : 0.00),
            'exchange_options' => $availableProducts,
        ]);
    }

    /**
     * POST /api/products/exchange
     * Execute product swap with automatic surplus wallet refund or difference payment.
     */
    public function exchangeProduct(Request $request)
    {
        $studentProductId = $request->input('student_product_id');
        $newProductId = $request->input('new_product_id');
        $useWallet = (bool)$request->input('use_wallet', true);
        $paymentMethod = $request->input('payment_method', 'CARD');

        $oldStudentProduct = StudentProduct::with('product')->find($studentProductId);
        if (!$oldStudentProduct || !$oldStudentProduct->product) {
            return response()->json(['success' => false, 'message' => 'Original purchased item not found.'], 404);
        }

        $studentObj = Student::find($oldStudentProduct->student_id);
        if (!$studentObj) {
            return response()->json(['success' => false, 'message' => 'Student record not found.'], 404);
        }

        $oldProduct = $oldStudentProduct->product;
        $newProduct = Product::find($newProductId);
        if (!$newProduct) {
            return response()->json(['success' => false, 'message' => 'Selected replacement product not found.'], 404);
        }

        $oldPrice = (float)$oldProduct->price;
        $newPrice = (float)$newProduct->price;
        $priceDiff = round($newPrice - $oldPrice, 2);

        $walletCredited = 0;
        $walletUsed = 0;
        $amountPaid = 0;

        DB::beginTransaction();
        try {
            // Scenario 1: Replacement is cheaper -> Refund surplus difference to Student Store Wallet!
            if ($priceDiff < 0) {
                $walletCredited = abs($priceDiff);
                $studentObj->creditWallet(
                    $walletCredited,
                    "Exchange Refund: {$oldProduct->title} ➔ {$newProduct->title}",
                    "EXCH-" . time()
                );
                $paymentMethodFinal = 'WALLET_REFUND_CREDIT';
            }
            // Scenario 2: Replacement is more expensive -> Pay difference (can use wallet balance)
            elseif ($priceDiff > 0) {
                $remainingToPay = $priceDiff;

                if ($useWallet && ((float)$studentObj->wallet_balance) > 0) {
                    $walletUsed = min($remainingToPay, (float)$studentObj->wallet_balance);
                    $studentObj->debitWallet(
                        $walletUsed,
                        "Exchange Upgrade: {$oldProduct->title} ➔ {$newProduct->title}",
                        "EXCH-" . time()
                    );
                    $remainingToPay = round($remainingToPay - $walletUsed, 2);
                }

                $amountPaid = max(0, $remainingToPay);
                $paymentMethodFinal = $amountPaid > 0 ? strtoupper($paymentMethod) : 'WALLET_PAYMENT';
            }
            // Scenario 3: Equal price -> Free direct 1:1 swap
            else {
                $paymentMethodFinal = 'EVEN_EXCHANGE';
            }

            // Deactivate old product
            $oldStudentProduct->status = 'exchanged';
            $oldStudentProduct->save();

            // Activate new product
            $expiresAt = now()->addDays($newProduct->validity_days ?: 365);
            $newStudentProduct = StudentProduct::create([
                'student_id'   => $studentObj->id,
                'product_id'   => $newProduct->id,
                'order_id'     => $oldStudentProduct->order_id,
                'purchased_at' => now(),
                'expires_at'   => $expiresAt,
                'status'       => 'active',
            ]);

            // Create exchange history record
            $exchangeRecord = ProductExchange::create([
                'student_id'             => $studentObj->id,
                'old_product_id'         => $oldProduct->id,
                'new_product_id'         => $newProduct->id,
                'old_student_product_id' => $oldStudentProduct->id,
                'old_price'              => $oldPrice,
                'new_price'              => $newPrice,
                'price_diff'             => $priceDiff,
                'wallet_used'            => $walletUsed,
                'wallet_credited'        => $walletCredited,
                'amount_paid'            => $amountPaid,
                'payment_method'         => $paymentMethodFinal,
                'status'                 => 'completed',
            ]);

            // In-app notification
            Notification::create([
                'recipient_type' => 'student',
                'student_id'     => $studentObj->id,
                'roll_no'        => $studentObj->{'roll no'} ?? null,
                'title'          => '🔄 Product Exchanged Successfully',
                'message'        => "Your study package was exchanged from '{$oldProduct->title}' to '{$newProduct->title}'." . ($walletCredited > 0 ? " ₹{$walletCredited} has been added to your Store Wallet." : ''),
                'type'           => 'success',
                'is_read'        => false,
            ]);

            DB::commit();

            return response()->json([
                'success'         => true,
                'message'         => 'Product exchanged successfully! New content is now active in your portal.',
                'exchange_id'     => $exchangeRecord->id,
                'old_product'     => $oldProduct->title,
                'new_product'     => $newProduct->title,
                'old_price'       => $oldPrice,
                'new_price'       => $newPrice,
                'price_diff'      => $priceDiff,
                'wallet_credited' => $walletCredited,
                'wallet_used'     => $walletUsed,
                'amount_paid'     => $amountPaid,
                'payment_method'  => $paymentMethodFinal,
                'wallet_balance'  => (float)$studentObj->wallet_balance,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Exchange failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // ADMIN STORE MANAGEMENT API ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/orders
     * Fetch all student product orders for Admin Panel.
     */
    public function adminOrders()
    {
        try {
            $orders = ProductOrder::with(['student', 'items.product'])
                ->orderBy('created_at', 'desc')
                ->get();

            $formatted = $orders->map(function($ord) {
                $studentName = $ord->student ? ($ord->student->name ?? 'Student') : 'Student';
                $studentRoll = $ord->student ? ($ord->student->{'roll no'} ?? $ord->student->roll_no ?? $ord->student->login_id ?? 'N/A') : 'N/A';
                $department = $ord->student ? ($ord->student->department ?? 'N/A') : 'N/A';

                $itemsSummary = $ord->items ? $ord->items->map(function($item) {
                    return $item->product ? ($item->product->title ?? 'Product') : 'Product';
                })->filter()->implode(', ') : '';

                $rawStatus = strtolower(trim((string)($ord->payment_status ?? 'completed')));
                $normalizedStatus = in_array($rawStatus, ['paid', 'completed', 'active', 'success']) ? 'completed' : $rawStatus;

                return [
                    'id' => $ord->id,
                    'order_number' => (string) ($ord->razorpay_order_id ?? ('ORD-' . $ord->id)),
                    'razorpay_order_id' => (string) ($ord->razorpay_order_id ?? ''),
                    'transaction_id' => (string) ($ord->transaction_id ?? ''),
                    'student_name' => (string) $studentName,
                    'student_roll' => (string) $studentRoll,
                    'department' => (string) $department,
                    'total_amount' => (float) ($ord->total_amount ?? 0),
                    'discount_amount' => (float) ($ord->discount_amount ?? 0),
                    'final_amount' => (float) ($ord->final_amount ?? 0),
                    'payment_method' => (string) ($ord->payment_method ?? 'RAZORPAY'),
                    'payment_status' => (string) $normalizedStatus,
                    'coupon_code' => (string) ($ord->coupon_code ?? ''),
                    'items_summary' => (string) $itemsSummary,
                    'items_count' => $ord->items ? $ord->items->count() : 0,
                    'created_at' => $ord->created_at ? $ord->created_at->format('d M Y, h:i A') : '',
                ];
            });

            $completedOrders = $formatted->where('payment_status', 'completed');
            $pendingOrders   = $formatted->where('payment_status', 'pending');
            $failedOrders    = $formatted->where('payment_status', 'failed');

            return response()->json([
                'success' => true,
                'orders' => $formatted->values()->all(),
                'total_revenue' => (float) $completedOrders->sum('final_amount'),
                'total_orders' => $orders->count(),
                'completed_count' => $completedOrders->count(),
                'pending_count' => $pendingOrders->count(),
                'failed_count' => $failedOrders->count(),
            ]);
        } catch (\Exception $e) {
            \Log::error("adminOrders error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch admin orders: ' . $e->getMessage(),
                'orders' => [],
                'total_revenue' => 0,
                'total_orders' => 0,
                'completed_count' => 0,
                'pending_count' => 0,
                'failed_count' => 0,
            ], 500);
        }
    }

    /**
     * POST /api/admin/orders/sync-pending
     * Query Razorpay API for all pending orders and update status to paid/failed.
     */
    public function syncPendingOrders()
    {
        try {
            $stats = $this->paymentService->syncPendingOrders(function (ProductOrder $order, array $enrolledProducts) {
                $this->sendOrderEmails($order->student, $order, $enrolledProducts);
            });

            $msg = "Checked {$stats['total_pending']} pending orders. ";
            if ($stats['resolved_paid'] > 0) {
                $msg .= "{$stats['resolved_paid']} orders verified as PAID! ";
            }
            if ($stats['resolved_failed'] > 0) {
                $msg .= "{$stats['resolved_failed']} marked as FAILED. ";
            }
            if ($stats['still_pending'] > 0) {
                $msg .= "{$stats['still_pending']} still pending.";
            }

            return response()->json([
                'success' => true,
                'message' => trim($msg),
                'stats'   => $stats
            ]);
        } catch (\Exception $e) {
            \Log::error("syncPendingOrders controller error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/admin/orders/{id}/resend-invoice
     * Resend confirmation and invoice email for a specific order.
     */
    public function resendInvoice($id)
    {
        try {
            $order = ProductOrder::with(['student', 'items.product'])->find($id);
            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
            }

            $enrolledProducts = $order->items->map(fn($i) => [
                'id'         => $i->product_id,
                'title'      => $i->product->title ?? 'Product',
                'category'   => $i->product->category ?? 'course',
                'price'      => $i->price,
                'expires_at' => $i->product && $i->product->validity_days
                    ? now()->addDays($i->product->validity_days)->format('Y-m-d')
                    : null,
            ])->toArray();

            // Send student receipt without triggering duplicate admin alert
            $this->sendOrderEmails($order->student, $order, $enrolledProducts, false);

            return response()->json([
                'success' => true,
                'message' => "Invoice email resent successfully for Order #{$order->razorpay_order_id}!"
            ]);
        } catch (\Exception $e) {
            \Log::error("resendInvoice error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resend invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/coupons
     * Return all active coupon codes.
     */
    public function adminCoupons()
    {
        return response()->json([
            'success' => true,
            'coupons' => $this->couponService->all()
        ]);
    }

    /**
     * POST /api/admin/products/upload-thumbnail
     * Upload an image file for product thumbnail.
     */
    public function uploadThumbnail(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'thumb_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            
            $destinationPath = public_path('uploads/thumbnails');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $file->move($destinationPath, $filename);
            $url = '/uploads/thumbnails/' . $filename;

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully!',
                'url' => $url,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No image file provided.',
        ], 400);
    }

    /**
     * POST /api/admin/products
     * Create a new product from Admin Panel.
     */
    /**
     * POST /api/admin/products
     * Uses StoreProductRequest for validation.
     */
    public function storeProduct(StoreProductRequest $request)
    {
        $data = $request->validated();

        $features = $data['features'] ?? [];
        if (is_string($features)) {
            $features = array_values(array_filter(array_map('trim', explode("\n", $features))));
        }

        $product = Product::create([
            'title'             => $data['title'],
            'slug'              => Str::slug($data['title']) . '-' . rand(100, 999),
            'category'          => strtolower(str_replace(' ', '_', $data['category'])),
            'short_description' => $data['short_description'] ?? 'No description provided.',
            'description'       => $data['description'] ?? ($data['short_description'] ?? 'No description provided.'),
            'price'             => (float) $data['price'],
            'original_price'    => !empty($data['original_price']) ? (float) $data['original_price'] : null,
            'thumbnail'         => $data['thumbnail'] ?? null,
            'badge'             => $data['badge'] ?? 'New',
            'rating'            => !empty($data['rating']) ? (float) $data['rating'] : 4.85,
            'reviews_count'     => 100,
            'validity_days'     => !empty($data['validity_days']) ? (int) $data['validity_days'] : 365,
            'features'          => array_values((array) $features),
            'is_active'         => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully!',
            'product' => new ProductResource($product),
        ], 201);
    }

    /**
     * POST /api/admin/products/{product}/update — Route Model Binding
     * Uses UpdateProductRequest for validation.
     */
    public function updateProduct(UpdateProductRequest $request, Product $product)
    {
        $data = $request->validated();

        $features = $data['features'] ?? $product->features;
        if (is_string($features)) {
            $features = array_values(array_filter(array_map('trim', explode("\n", $features))));
        }

        $product->update([
            'title'             => $data['title'] ?? $product->title,
            'category'          => isset($data['category'])
                ? strtolower(str_replace(' ', '_', $data['category']))
                : $product->category,
            'short_description' => $data['short_description'] ?? $product->short_description,
            'description'       => $data['description'] ?? $product->description,
            'price'             => isset($data['price']) ? (float) $data['price'] : $product->price,
            'original_price'    => isset($data['original_price']) ? (float) $data['original_price'] : $product->original_price,
            'thumbnail'         => $data['thumbnail'] ?? $product->thumbnail,
            'badge'             => $data['badge'] ?? $product->badge,
            'rating'            => isset($data['rating']) ? (float) $data['rating'] : $product->rating,
            'validity_days'     => isset($data['validity_days']) ? (int) $data['validity_days'] : $product->validity_days,
            'features'          => array_values((array) $features),
            'is_active'         => isset($data['is_active']) ? (bool) $data['is_active'] : $product->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully!',
            'product' => new ProductResource($product->fresh()),
        ]);
    }

    /**
     * DELETE /api/admin/products/{product}  — Route Model Binding
     */
    public function deleteProduct(Product $product)
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully!',
        ]);
    }

    /**
     * POST /api/payment/create-razorpay-order
     * Creates Razorpay order + saves a PENDING ProductOrder in DB.
     */
    public function createRazorpayOrder(CreateRazorpayOrderRequest $request)
    {
        try {
            $validated   = $request->validated();
            $studentId   = $request->input('student_id');
            $discount    = (float) ($request->input('discount_amount', 0));
            $couponCode  = $request->input('coupon_code');

            $data = $this->paymentService->createOrder(
                (float) $validated['amount'],
                $validated['cart_items'],
                $studentId,
                $discount,
                $couponCode
            );

            return response()->json(array_merge(['success' => true], $data));

        } catch (\RuntimeException $e) {
            Log::error('Razorpay order creation failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }
    }

    /**
     * POST /api/payment/verify-razorpay
     * Verify Razorpay signature, update pending→paid, grant access, send email.
     */
    public function verifyRazorpayPayment(VerifyRazorpayRequest $request)
    {
        $data = $request->validated();

        // ── 1. Signature Verification ─────────────────────────────────────────
        $signatureValid = $this->paymentService->verifySignature(
            $data['razorpay_order_id'],
            $data['razorpay_payment_id'],
            $data['razorpay_signature']
        );

        if (!$signatureValid) {
            Log::warning('Razorpay signature mismatch', ['order_id' => $data['razorpay_order_id']]);
            // Mark order as failed
            $this->paymentService->failOrder($data['razorpay_order_id']);
            return response()->json([
                'success' => false,
                'message' => 'Payment signature verification failed.',
            ], 400);
        }

        // ── 2. Resolve Student ────────────────────────────────────────────────
        $studentObj = null;
        if (!empty($data['student_id'])) {
            $studentObj = Student::find($data['student_id']);
        }
        if (!$studentObj && $request->user()) {
            $studentObj = $request->user();
        }
        if (!$studentObj && $request->header('Student-Id')) {
            $studentObj = Student::find($request->header('Student-Id'));
        }
        if (!$studentObj && !empty($data['roll_no'])) {
            $roll = $data['roll_no'];
            $studentObj = Student::where('roll no', $roll)
                ->orWhere('id', $roll)
                ->first();
        }
        if (!$studentObj && !empty($data['email'])) {
            $studentObj = Student::where('email adress', $data['email'])
                ->orWhere('email', $data['email'])
                ->first();
        }
        if (!$studentObj) {
            // Check if pending order has student_id
            $pendingOrder = ProductOrder::where('razorpay_order_id', $data['razorpay_order_id'])->first();
            if ($pendingOrder && $pendingOrder->student_id) {
                $studentObj = Student::find($pendingOrder->student_id);
            }
        }
        if (!$studentObj) {
            $studentObj = Student::first();
        }

        // ── 3. Grant Access (DB Transaction) ──────────────────────────────────
        try {
            $order = $this->paymentService->grantAccess(
                student:         $studentObj,
                cartItems:       $data['cart_items'],
                totalAmount:     (float) ($data['total_amount'] ?? $data['final_amount']),
                discountAmount:  (float) ($data['discount_amount'] ?? 0),
                finalAmount:     (float) $data['final_amount'],
                paymentId:       $data['razorpay_payment_id'],
                razorpayOrderId: $data['razorpay_order_id'],
                paymentMethod:   'RAZORPAY',
                couponCode:      $data['coupon_code'] ?? null,
            );

            // ── 4. Build enrolled products list ───────────────────────────────
            $enrolledProducts = $order->items->map(fn($i) => [
                'id'         => $i->product_id,
                'title'      => $i->product->title ?? 'Product',
                'category'   => $i->product->category ?? 'course',
                'price'      => $i->price,
                'expires_at' => $i->product && $i->product->validity_days
                    ? now()->addDays($i->product->validity_days)->format('Y-m-d')
                    : null,
            ])->toArray();

            // ── 5. Send Confirmation + Invoice Email ──────────────────────────
            $this->sendOrderEmails($studentObj, $order, $enrolledProducts);

            return response()->json([
                'success' => true,
                'message' => 'Payment verified! Access granted successfully.',
                'order'   => [
                    'order_number'      => $order->razorpay_order_id,
                    'razorpay_order_id' => $order->razorpay_order_id,
                    'transaction_id'    => $order->transaction_id,
                    'final_amount'      => $order->final_amount,
                    'payment_method'    => $order->payment_method ?? 'RAZORPAY',
                    'purchased_at'      => $order->created_at->format('d M Y, h:i A'),
                    'items'             => $enrolledProducts,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('verifyRazorpayPayment error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Order completion error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/payment/cancel-order
     * Called when user dismisses Razorpay popup (ondismiss).
     */
    public function cancelOrder(Request $request)
    {
        $razorpayOrderId = $request->input('razorpay_order_id');
        if (!$razorpayOrderId) {
            return response()->json(['success' => false, 'message' => 'razorpay_order_id required.'], 422);
        }

        $this->paymentService->cancelOrder($razorpayOrderId);

        return response()->json(['success' => true, 'message' => 'Order cancelled.']);
    }

    /**
     * POST /api/webhooks/payment
     * Official Razorpay Webhook Handler.
     * Razorpay sends this when payment is captured/failed — acts as backup confirmation.
     * Verifies X-Razorpay-Signature header using webhook secret.
     */
    public function handlePaymentWebhook(Request $request)
    {
        $rawBody  = $request->getContent();
        $signature = $request->header('X-Razorpay-Signature', '');

        // ── Verify Razorpay webhook signature ──────────────────────────────────
        if (!$this->paymentService->verifyWebhookSignature($rawBody, $signature)) {
            Log::warning('Razorpay webhook signature invalid', ['ip' => $request->ip()]);
            $this->logWebhookEvent('INVALID_SIGNATURE', [], 'Signature verification failed');
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawBody, true) ?? [];
        $event   = $payload['event'] ?? 'unknown';

        $this->logWebhookEvent($event, $payload, 'RECEIVED');

        // ── payment.captured: Backup confirmation for any still-pending orders ─
        if ($event === 'payment.captured') {
            $paymentEntity   = $payload['payload']['payment']['entity'] ?? [];
            $razorpayOrderId = $paymentEntity['order_id'] ?? null;
            $paymentId       = $paymentEntity['id'] ?? null;
            $amount          = ($paymentEntity['amount'] ?? 0) / 100; // paise → rupees

            if (!$razorpayOrderId) {
                $this->logWebhookEvent($event, $payload, 'MISSING_ORDER_ID');
                return response()->json(['success' => true, 'status' => 'ok']);
            }

            // Check if there's a pending order matching this Razorpay order
            $pendingOrder = ProductOrder::where('razorpay_order_id', $razorpayOrderId)
                ->where('payment_status', 'pending')
                ->with('student')
                ->first();

            if (!$pendingOrder) {
                // Already processed via verify endpoint — just acknowledge
                $this->logWebhookEvent($event, $payload, 'ALREADY_PROCESSED');
                return response()->json(['success' => true, 'status' => 'ok', 'message' => 'Already processed']);
            }

            // Order still pending — confirm it via webhook (payment was captured)
            DB::beginTransaction();
            try {
                $pendingOrder->update([
                    'payment_status' => 'paid',
                    'transaction_id' => $paymentId,
                ]);

                // Grant access for all items in this order
                $cartItems       = $pendingOrder->items->map(fn($i) => ['id' => $i->product_id, 'price' => $i->price])->toArray();
                $enrolledProducts = [];

                foreach ($pendingOrder->items as $item) {
                    $product = $item->product;
                    if (!$product) continue;

                    $expiresAt = $product->validity_days ? now()->addDays($product->validity_days) : null;

                    StudentProduct::updateOrCreate(
                        ['student_id' => $pendingOrder->student_id, 'product_id' => $product->id],
                        [
                            'order_id'       => $pendingOrder->id,
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

                DB::commit();

                // Send confirmation + invoice email
                $studentObj = $pendingOrder->student;
                if ($studentObj) {
                    $this->sendOrderEmails($studentObj, $pendingOrder, $enrolledProducts);
                }

                $this->logWebhookEvent($event, $payload, 'CONFIRMED_VIA_WEBHOOK');

                return response()->json([
                    'success'      => true,
                    'status'       => 'ok',
                    'message'      => 'Payment confirmed via webhook. Access granted and email sent.',
                    'order_number' => $pendingOrder->order_number,
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Webhook grant access error', ['error' => $e->getMessage()]);
                $this->logWebhookEvent($event, $payload, 'EXCEPTION: ' . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Webhook error: ' . $e->getMessage()], 500);
            }
        }

        // ── payment.failed ────────────────────────────────────────────────────
        if ($event === 'payment.failed') {
            $paymentEntity   = $payload['payload']['payment']['entity'] ?? [];
            $razorpayOrderId = $paymentEntity['order_id'] ?? null;

            if ($razorpayOrderId) {
                $this->paymentService->failOrder($razorpayOrderId);
            }

            $this->logWebhookEvent($event, $payload, 'PAYMENT_FAILED');
            return response()->json(['success' => true, 'status' => 'ok', 'message' => 'Payment failure recorded.']);
        }

        // ── Other events — just acknowledge ──────────────────────────────────
        $this->logWebhookEvent($event, $payload, 'ACKNOWLEDGED');
        return response()->json(['success' => true, 'status' => 'ok', 'message' => 'Event acknowledged.']);
    }

    /**
     * POST /api/webhooks/payment/simulate
     * Simulate a webhook for local testing.
     */
    public function simulatePaymentWebhook(Request $request)
    {
        $razorpayOrderId = $request->input('razorpay_order_id');
        $paymentId       = $request->input('payment_id', 'pay_SIM_' . strtoupper(Str::random(8)));
        $amount          = (float) $request->input('amount', 999.00);

        // Build a payload matching Razorpay's real webhook format
        $simulatedPayload = json_encode([
            'event'     => 'payment.captured',
            'entity'    => 'event',
            'timestamp' => time(),
            'payload'   => [
                'payment' => [
                    'entity' => [
                        'id'       => $paymentId,
                        'order_id' => $razorpayOrderId,
                        'amount'   => (int)($amount * 100),
                        'currency' => 'INR',
                        'status'   => 'captured',
                        'method'   => 'upi',
                    ]
                ]
            ]
        ]);

        $subRequest = Request::create('/api/webhooks/payment', 'POST', [], [], [], [], $simulatedPayload);
        $subRequest->headers->set('Content-Type', 'application/json');
        // Skip signature verification for simulation
        $subRequest->headers->set('X-Razorpay-Simulate', 'true');

        // Temporarily bypass signature check for simulation
        $payload         = json_decode($simulatedPayload, true);
        $event           = $payload['event'];
        $paymentEntity   = $payload['payload']['payment']['entity'];
        $rzpOrderId      = $paymentEntity['order_id'];
        $txnId           = $paymentEntity['id'];

        $pendingOrder = ProductOrder::where('razorpay_order_id', $rzpOrderId)
            ->where('payment_status', 'pending')
            ->with(['student', 'items.product'])
            ->first();

        if (!$pendingOrder) {
            return response()->json(['success' => false, 'message' => 'No pending order found for razorpay_order_id: ' . $rzpOrderId]);
        }

        DB::beginTransaction();
        try {
            $pendingOrder->update(['payment_status' => 'paid', 'transaction_id' => $txnId]);

            $enrolledProducts = [];
            foreach ($pendingOrder->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                $expiresAt = $product->validity_days ? now()->addDays($product->validity_days) : null;
                StudentProduct::updateOrCreate(
                    ['student_id' => $pendingOrder->student_id, 'product_id' => $product->id],
                    ['order_id' => $pendingOrder->id, 'status' => 'active', 'purchased_at' => now(),
                     'expires_at' => $expiresAt, 'amount_paid' => $item->price, 'transaction_id' => $txnId]
                );
                $enrolledProducts[] = ['id' => $product->id, 'title' => $product->title,
                    'category' => $product->category, 'price' => $item->price, 'expires_at' => $expiresAt?->format('Y-m-d')];
            }

            DB::commit();

            if ($pendingOrder->student) {
                $this->sendOrderEmails($pendingOrder->student, $pendingOrder, $enrolledProducts);
            }

            $this->logWebhookEvent('payment.captured', $payload, 'SIMULATED_SUCCESS');

            return response()->json([
                'success'      => true,
                'message'      => 'Simulated webhook processed. Order confirmed and email sent.',
                'order_number' => $pendingOrder->order_number,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/webhooks/logs
     * Retrieve recent webhook audit logs.
     */
    public function getWebhookLogs()
    {
        $logPath = storage_path('logs/payment_webhooks.log');
        $logs    = [];

        if (file_exists($logPath)) {
            $lines = array_reverse(array_filter(explode("\n", file_get_contents($logPath))));
            foreach (array_slice($lines, 0, 30) as $line) {
                $decoded = json_decode($line, true);
                if ($decoded) $logs[] = $decoded;
            }
        }

        return response()->json(['success' => true, 'logs' => $logs]);
    }

    /**
     * Helper to write JSON log entry to storage/logs/payment_webhooks.log
     */
    private function logWebhookEvent($event, $payload, $status)
    {
        try {
            $logPath = storage_path('logs/payment_webhooks.log');
            if (!is_dir(dirname($logPath))) {
                mkdir(dirname($logPath), 0755, true);
            }
            $entry = json_encode([
                'timestamp'    => date('Y-m-d H:i:s'),
                'event'        => $event,
                'status'       => $status,
                'order_id'     => $payload['payload']['payment']['entity']['order_id'] ?? $payload['order_number'] ?? 'N/A',
                'payment_id'   => $payload['payload']['payment']['entity']['id'] ?? 'N/A',
                'ip'           => request()->ip(),
            ]) . "\n";
            file_put_contents($logPath, $entry, FILE_APPEND);
        } catch (\Exception $e) {
            // Silently ignore log failure
        }
    }

    /**
     * Send order confirmation + invoice email to student, and new order notification alert to Admin.
     * Sends rich HTML emails with transaction and purchased items details.
     */
    private function sendOrderEmails(?Student $student, ProductOrder $order, array $enrolledProducts, bool $notifyAdmin = true): void
    {
        try {
            $studentEmail = $student ? ($student->{'email adress'} ?? $student->{'email address'} ?? $student->email ?? null) : null;
            $studentName  = htmlspecialchars($student->name ?? 'Student');
            $rollNo       = htmlspecialchars($student->{'roll no'} ?? $student->roll_no ?? $student->login_id ?? 'N/A');
            $dept         = htmlspecialchars($student->course->name ?? $student->department ?? 'Academic Studies');
            $orderNo      = htmlspecialchars($order->razorpay_order_id ?? ('ORD-' . $order->id));
            $txnId        = htmlspecialchars($order->transaction_id ?? 'N/A');
            $method       = htmlspecialchars($order->payment_method ?? 'RAZORPAY');
            $totalPaid    = (float) $order->final_amount;
            $discount     = (float) $order->discount_amount;
            $orderDate    = $order->created_at ? $order->created_at->format('d M Y, h:i A') : now()->format('d M Y, h:i A');
            $coupon       = $order->coupon_code ?? null;

            // ── Item Rows for Emails ──
            $itemRows = '';
            foreach ($enrolledProducts as $idx => $item) {
                $cat        = str_replace('_', ' ', $item['category'] ?? 'Course');
                $access     = !empty($item['expires_at']) ? '365 Days Access' : 'Lifetime Access';
                $price      = number_format((float)($item['price'] ?? 0), 2);
                $title      = htmlspecialchars($item['title'] ?? 'Product');
                $itemRows  .= "
                <tr>
                    <td style='padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;'>" . ($idx+1) . "</td>
                    <td style='padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;'>
                        <strong>{$title}</strong><br/>
                        <span style='font-size:11px;color:#64748b;'>Category: {$cat}</span>
                    </td>
                    <td style='padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;'>{$access}</td>
                    <td style='padding:10px 12px;font-size:12px;border-bottom:1px solid #f1f5f9;text-align:right;'>&#8377;{$price}</td>
                </tr>";
            }

            $discountRow = $discount > 0
                ? "<tr><td colspan='3' style='text-align:right;font-size:12px;color:#16a34a;padding:6px 0;'>Coupon Discount" . ($coupon ? " ({$coupon})" : '') . ":</td><td style='text-align:right;font-size:12px;color:#16a34a;padding:6px 0;'>- &#8377;" . number_format($discount, 2) . '</td></tr>'
                : '';

            // ── 1. SEND STUDENT CONFIRMATION EMAIL (IF EMAIL EXISTS) ──
            if ($studentEmail) {
                try {
                    $studentHtml = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'/>
  <meta name='viewport' content='width=device-width,initial-scale=1.0'/>
  <title>Order Confirmed - XL Education Portal</title>
</head>
<body style='margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f1f5f9;padding:32px 0;'>
    <tr><td align='center'>
      <table width='620' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);'>
        <tr><td style='background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 36px;'>
          <h1 style='margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;'>XL EDUCATION PORTAL</h1>
          <p style='margin:4px 0 0;color:#c7d2fe;font-size:13px;'>Authorized Academic Learning &amp; Testing Solutions</p>
        </td></tr>
        <tr><td style='background:#dcfce7;padding:16px 36px;text-align:center;'>
          <p style='margin:0;color:#15803d;font-size:16px;font-weight:800;'>&#10003; Payment Successful! Your Access is Now Active</p>
        </td></tr>
        <tr><td style='padding:28px 36px 0;'>
          <p style='margin:0;font-size:15px;color:#1e293b;'>Hi <strong>{$studentName}</strong>,</p>
          <p style='margin:10px 0 0;font-size:14px;color:#475569;line-height:1.6;'>Your payment has been verified and your enrollment is confirmed. Below is your official order receipt and invoice.</p>
        </td></tr>
        <tr><td style='padding:20px 36px;'>
          <table width='100%' cellpadding='0' cellspacing='0'>
            <tr>
              <td style='background:#f8fafc;border-radius:8px;padding:14px 16px;width:48%;'>
                <p style='margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;'>Order Number</p>
                <p style='margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:800;'>{$orderNo}</p>
              </td>
              <td style='width:4%;'></td>
              <td style='background:#f8fafc;border-radius:8px;padding:14px 16px;width:48%;'>
                <p style='margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;'>Transaction ID</p>
                <p style='margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:800;'>{$txnId}</p>
              </td>
            </tr>
            <tr><td colspan='3' style='padding:6px 0;'></td></tr>
            <tr>
              <td style='background:#f8fafc;border-radius:8px;padding:14px 16px;width:48%;'>
                <p style='margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;'>Date &amp; Time</p>
                <p style='margin:4px 0 0;font-size:13px;color:#1e293b;font-weight:700;'>{$orderDate}</p>
              </td>
              <td style='width:4%;'></td>
              <td style='background:#f8fafc;border-radius:8px;padding:14px 16px;width:48%;'>
                <p style='margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;'>Payment Method</p>
                <p style='margin:4px 0 0;font-size:13px;color:#1e293b;font-weight:700;'>{$method}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style='padding:0 36px 16px;'>
          <p style='margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;'>Billed To</p>
          <p style='margin:0;font-size:14px;color:#0f172a;font-weight:800;'>{$studentName}</p>
          <p style='margin:2px 0 0;font-size:12px;color:#475569;'>Roll / ID: {$rollNo} &nbsp;|&nbsp; Dept: {$dept}</p>
          <p style='margin:2px 0 0;font-size:12px;color:#475569;'>Email: {$studentEmail}</p>
        </td></tr>
        <tr><td style='padding:0 36px;'>
          <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
            <thead>
              <tr style='background:#4f46e5;'>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;width:40px;'>#</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;'>Item Description</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;'>Access</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:right;'>Amount</th>
              </tr>
            </thead>
            <tbody>{$itemRows}</tbody>
          </table>
        </td></tr>
        <tr><td style='padding:12px 36px 4px;'>
          <table width='100%' cellpadding='0' cellspacing='0'>
            <tr style='border-top:1px solid #e2e8f0;'>
              {$discountRow}
              <tr>
                <td colspan='3' style='text-align:right;font-size:13px;font-weight:800;color:#1e293b;padding:10px 0 0;'>Total Amount Paid:</td>
                <td style='text-align:right;font-size:15px;font-weight:900;color:#16a34a;padding:10px 0 0;'>&#8377;" . number_format($totalPaid, 2) . "</td>
              </tr>
            </tr>
          </table>
        </td></tr>
        <tr><td style='padding:20px 36px;'>
          <p style='margin:0;background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#1e40af;line-height:1.6;'>
            &#128218; <strong>Your access has been activated!</strong> Login to your student portal to start learning. Access your purchased courses under <strong>My Purchases</strong> tab in the Store section.
          </p>
        </td></tr>
        <tr><td style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;'>
          <p style='margin:0;font-size:11px;color:#94a3b8;line-height:1.6;'>This is an auto-generated order confirmation from XL Education Portal. GSTIN: 07AAAAA0000A1Z5 | SAC: 999293<br/>
          For support: mrrashidsaikh0365@gmail.com</p>
          <p style='margin:8px 0 0;font-size:12px;color:#475569;font-weight:700;'>XL EDUCATION &mdash; Authorized Finance Signatory</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

                    Mail::html($studentHtml, function ($message) use ($studentEmail, $studentName, $orderNo) {
                        $message->to($studentEmail, $studentName)
                                ->subject("Order Confirmed: {$orderNo} | XL Education Portal");
                    });

                    Log::info('Order confirmation email sent to student', [
                        'student_id'   => $student->id ?? null,
                        'order_number' => $order->order_number ?? $orderNo,
                        'email'        => $studentEmail,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send order email to student', [
                        'student_id' => $student->id ?? null,
                        'error'      => $e->getMessage(),
                    ]);
                }
            } else {
                Log::warning('sendOrderEmails: No valid email found for student', [
                    'student_id' => $student->id ?? null
                ]);
            }

            // ── 2. SEND NEW ORDER NOTIFICATION EMAIL TO ADMIN (ONLY IF ENABLED) ──
            if ($notifyAdmin) {
                $adminEmail = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS', 'mrrashidsaikh0365@gmail.com');

                if ($adminEmail) {
                    try {
                        $formattedTotal = number_format($totalPaid, 2);
                        $adminHtml = "
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'/>
  <meta name='viewport' content='width=device-width,initial-scale=1.0'/>
  <title>New Order Received - Admin Alert</title>
</head>
<body style='margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0f172a;padding:32px 0;'>
    <tr><td align='center'>
      <table width='620' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.3);'>
        <!-- Admin Alert Header -->
        <tr><td style='background:linear-gradient(135deg,#0f172a,#1e1b4b,#4338ca);padding:28px 36px;'>
          <span style='background:#22c55e;color:#ffffff;font-size:10px;font-weight:900;letter-spacing:1px;padding:4px 10px;border-radius:20px;text-transform:uppercase;'>New Payment Received</span>
          <h1 style='margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;'>XL PORTAL ADMIN ALERT</h1>
          <p style='margin:4px 0 0;color:#a5b4fc;font-size:13px;'>A new store order was completed successfully.</p>
        </td></tr>

        <!-- Revenue Highlight -->
        <tr><td style='background:#f0fdf4;border-bottom:1px solid #dcfce7;padding:20px 36px;text-align:center;'>
          <p style='margin:0;color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;'>Total Revenue Collected</p>
          <p style='margin:4px 0 0;color:#15803d;font-size:30px;font-weight:900;'>&#8377;{$formattedTotal}</p>
          <p style='margin:4px 0 0;color:#64748b;font-size:12px;'>Payment Method: <strong>{$method}</strong> &bull; Status: <strong style='color:#16a34a;'>SUCCESSFUL</strong></p>
        </td></tr>

        <!-- Order & Student Details Grid -->
        <tr><td style='padding:24px 36px;'>
          <h3 style='margin:0 0 12px;font-size:14px;color:#1e293b;text-transform:uppercase;letter-spacing:0.6px;'>Student &amp; Transaction Details</h3>
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0;'>
            <tr>
              <td style='padding:6px 0;width:50%;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>STUDENT NAME</span>
                <span style='font-size:14px;color:#0f172a;font-weight:800;'>{$studentName}</span>
              </td>
              <td style='padding:6px 0;width:50%;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>ROLL NO / LOGIN ID</span>
                <span style='font-size:14px;color:#0f172a;font-weight:800;'>{$rollNo}</span>
              </td>
            </tr>
            <tr>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>STUDENT EMAIL</span>
                <span style='font-size:13px;color:#334155;font-weight:600;'>" . ($studentEmail ?: '<span style="color:#ef4444;">Not Provided</span>') . "</span>
              </td>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>DEPARTMENT</span>
                <span style='font-size:13px;color:#334155;font-weight:600;'>{$dept}</span>
              </td>
            </tr>
            <tr><td colspan='2' style='border-top:1px dashed #cbd5e1;padding-top:10px;margin-top:6px;'></td></tr>
            <tr>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>ORDER ID</span>
                <span style='font-size:13px;color:#4f46e5;font-weight:800;'>{$orderNo}</span>
              </td>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>TRANSACTION ID</span>
                <span style='font-size:13px;color:#0f172a;font-weight:700;'>{$txnId}</span>
              </td>
            </tr>
            <tr>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>DATE &amp; TIME</span>
                <span style='font-size:13px;color:#334155;'>{$orderDate}</span>
              </td>
              <td style='padding:6px 0;'>
                <span style='font-size:11px;color:#64748b;font-weight:700;display:block;'>COUPON APPLIED</span>
                <span style='font-size:13px;color:#16a34a;font-weight:700;'>" . ($coupon ?: 'None') . "</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Purchased Items Table -->
        <tr><td style='padding:0 36px 20px;'>
          <h3 style='margin:0 0 12px;font-size:14px;color:#1e293b;text-transform:uppercase;letter-spacing:0.6px;'>Purchased Items</h3>
          <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
            <thead>
              <tr style='background:#1e293b;'>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;width:40px;'>#</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;'>Item Title</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:left;'>Access Validity</th>
                <th style='padding:10px 12px;color:#fff;font-size:11px;text-align:right;'>Price</th>
              </tr>
            </thead>
            <tbody>{$itemRows}</tbody>
          </table>
        </td></tr>

        <!-- Total Breakdown -->
        <tr><td style='padding:0 36px 24px;'>
          <table width='100%' cellpadding='0' cellspacing='0'>
            <tr style='border-top:2px solid #e2e8f0;'>
              {$discountRow}
              <tr>
                <td colspan='3' style='text-align:right;font-size:14px;font-weight:800;color:#0f172a;padding:12px 0 0;'>Total Received:</td>
                <td style='text-align:right;font-size:16px;font-weight:900;color:#16a34a;padding:12px 0 0;'>&#8377;{$formattedTotal}</td>
              </tr>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;'>
          <p style='margin:0;font-size:11px;color:#64748b;'>This is an automated administrative notification from XL Education Portal System.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

                    Mail::html($adminHtml, function ($message) use ($adminEmail, $studentName, $formattedTotal, $orderNo) {
                        $message->to($adminEmail, 'Admin')
                                ->subject("🛒 [New Order] ₹{$formattedTotal} received from {$studentName} | Order #{$orderNo}");
                    });

                    Log::info('Order notification email sent to admin', [
                        'admin_email'  => $adminEmail,
                        'order_number' => $order->order_number ?? $orderNo,
                        'amount'       => $totalPaid,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send order notification email to admin', [
                        'admin_email' => $adminEmail,
                        'error'       => $e->getMessage(),
                    ]);
                }
            }
        }
        } catch (\Exception $e) {
            Log::error('sendOrderEmails unexpected error', ['error' => $e->getMessage()]);
        }
    }
}
