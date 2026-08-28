<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class CouponService
{
    /**
     * Available coupons: code => [type, value, max_discount]
     * type: 'percent' | 'flat'
     */
    protected array $coupons = [
        'STUDENT100' => ['type' => 'percent', 'value' => 100, 'max_discount' => null,  'label' => '100% Student Full Free Access (100% Off)'],
        'STUDENT50'  => ['type' => 'percent', 'value' => 50,  'max_discount' => 1000, 'label' => '50% Student Special Discount'],
        'WELCOME20'  => ['type' => 'percent', 'value' => 20,  'max_discount' => null,  'label' => '20% Welcome Discount'],
        'MOCKFREE'   => ['type' => 'flat',    'value' => 100, 'max_discount' => null,  'label' => '₹100 Off on Mock Interviews'],
        'FREE100'    => ['type' => 'flat',    'value' => 100, 'max_discount' => null,  'label' => '₹100 Flat Discount'],
        'GATE2026'   => ['type' => 'percent', 'value' => 30,  'max_discount' => 500,   'label' => '30% GATE Special Discount'],
        'NEWJOIN'    => ['type' => 'flat',    'value' => 50,  'max_discount' => null,  'label' => '₹50 New Student Discount'],
    ];

    /**
     * Validate if a coupon code exists.
     */
    public function isValid(string $code): bool
    {
        return array_key_exists(strtoupper(trim($code)), $this->coupons);
    }

    /**
     * Apply coupon to cart total and return discount details.
     *
     * @throws \InvalidArgumentException if coupon is invalid
     */
    public function apply(string $code, float $cartTotal): array
    {
        $code   = strtoupper(trim($code));
        $coupon = $this->coupons[$code] ?? null;

        if (!$coupon) {
            Log::warning('Invalid coupon attempted', ['code' => $code]);
            throw new \InvalidArgumentException(
                'Invalid or expired coupon code. Try STUDENT50 or WELCOME20.'
            );
        }

        if ($coupon['type'] === 'percent') {
            $discount = ($cartTotal * $coupon['value']) / 100;
            if ($coupon['max_discount']) {
                $discount = min($discount, $coupon['max_discount']);
            }
        } else {
            // flat discount
            $discount = min((float) $coupon['value'], $cartTotal);
        }

        $discount    = round($discount, 2);
        $finalAmount = max(0, round($cartTotal - $discount, 2));

        Log::info('Coupon applied', [
            'code'       => $code,
            'cart_total' => $cartTotal,
            'discount'   => $discount,
        ]);

        return [
            'coupon_code'     => $code,
            'discount_amount' => $discount,
            'final_amount'    => $finalAmount,
            'message'         => $coupon['label'] . ' Applied!',
            'label'           => $coupon['label'],
        ];
    }

    /**
     * Get all available coupon codes (for admin listing).
     */
    public function all(): array
    {
        return collect($this->coupons)->map(fn($c, $code) => [
            'code'     => $code,
            'type'     => $c['type'],
            'value'    => $c['value'],
            'label'    => $c['label'],
        ])->values()->all();
    }
}
