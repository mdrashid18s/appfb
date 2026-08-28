<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Class ProductResource
 * 
 * Yeh Laravel API Resource Store/Products ke database records ko Frontend ke liye
 * clean, formatted aur secure JSON array me transform karta hai.
 * 
 * Main Features:
 *   - Category Label: Underscores hata kar readable title banata hai (e.g. 'test_series' -> 'Test Series').
 *   - Number Casting: Price, rating, validity days ko strict float/integer me badalta hai.
 *   - Live Discount Calculation: Original price aur discounted price ke difference se discount % calculate karta hai.
 *   - Purchase Status: Check karta hai ki logged-in student ne yeh product pehle se purchase kiya hai ya nahi.
 */
class ProductResource extends JsonResource
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
            'id'                => $this->id,
            'title'             => $this->title,
            'slug'              => $this->slug,
            'category'          => $this->category,
            // Readable category label (e.g. mock_exam -> Mock Exam)
            'category_label'    => ucwords(str_replace('_', ' ', $this->category)),
            'short_description' => $this->short_description,
            'description'       => $this->description,
            // Price casting (Decimal to Float)
            'price'             => (float) $this->price,
            'original_price'    => $this->original_price ? (float) $this->original_price : null,
            // Discount percentage calculate karna (agar original price available ho)
            'discount_percent'  => $this->original_price && $this->original_price > 0
                ? round((($this->original_price - $this->price) / $this->original_price) * 100)
                : null,
            'thumbnail'         => $this->thumbnail,
            'badge'             => $this->badge,
            'rating'            => (float) $this->rating,
            'reviews_count'     => (int) $this->reviews_count,
            'validity_days'     => (int) $this->validity_days,
            'features'          => is_array($this->features) ? $this->features : [],
            'is_active'         => (bool) $this->is_active,
            // Check if product is already purchased by current student
            'is_purchased'      => $this->when(
                isset($this->is_purchased),
                fn() => (bool) $this->is_purchased,
                false
            ),
            'created_at'        => $this->created_at?->toDateTimeString(),
            'updated_at'        => $this->updated_at?->toDateTimeString(),
        ];
    }
}
