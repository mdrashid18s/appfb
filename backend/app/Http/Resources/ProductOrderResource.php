<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class ProductOrderResource
 * 
 * Yeh Laravel API Resource Store Orders / Purchases ke database records ko Frontend
 * ke liye clean, formatted aur secure JSON array me transform karta hai.
 * 
 * Main Responsibilities:
 *   1. Data Type Casting: Amounts ko float me convert karna (e.g. total_amount, final_amount).
 *   2. Eager Loading Relationships: `whenLoaded('student')` aur `whenLoaded('items')` ka use karke
 *      sirf tab relations serialize karna jab query me load hui hon (N+1 query problem se bachata hai).
 *   3. Nested Items Mapping: Order ke andar ke products (id, title, category, price) ko format karna.
 *   4. Readable Dates: `purchased_at` ko frontend ke liye formatted date string ('25 Aug 2026') banana.
 */
class ProductOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array for frontend JSON response.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Order Basic Identifiers
            'id'             => $this->id,
            'order_number'   => $this->order_number,
            'transaction_id' => $this->transaction_id,

            // Student Name (Sirf tab load hoga jab student relation loaded ho)
            'student_name'   => $this->whenLoaded('student', fn() => $this->student->name ?? 'N/A', 'N/A'),

            // Financial Calculations (Strict Float Casting)
            'total_amount'   => (float) $this->total_amount,
            'discount_amount'=> (float) ($this->discount_amount ?? 0),
            'final_amount'   => (float) $this->final_amount,

            // Payment & Coupon Meta
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'coupon_code'    => $this->coupon_code,

            // Order Items & Nested Purchased Products Mapping
            'items'          => $this->whenLoaded('items', function () {
                return $this->items->map(fn($item) => [
                    'id'       => $item->id,
                    'title'    => $item->product->title ?? 'N/A',
                    'category' => $item->product->category ?? 'N/A',
                    'price'    => (float) $item->price,
                ]);
            }, []),

            // Timestamps
            'created_at'     => $this->created_at?->toDateTimeString(),
            'purchased_at'   => $this->created_at?->format('d M Y'), // Readable format (e.g. 25 Aug 2026)
        ];
    }
}
