<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'title',
        'slug',
        'category',
        'short_description',
        'description',
        'price',
        'original_price',
        'thumbnail',
        'badge',
        'rating',
        'reviews_count',
        'validity_days',
        'features',
        'is_active',
    ];

    protected $casts = [
        'features'       => 'array',
        'price'          => 'float',
        'original_price' => 'float',
        'rating'         => 'float',
        'reviews_count'  => 'integer',
        'validity_days'  => 'integer',
        'is_active'      => 'boolean',
    ];

    // ─── Relationships ─────────────────────────────────────────────────────────

    public function orderItems()
    {
        return $this->hasMany(ProductOrderItem::class, 'product_id', 'id');
    }

    public function studentProducts()
    {
        return $this->hasMany(StudentProduct::class, 'product_id', 'id');
    }

    // ─── Query Scopes ──────────────────────────────────────────────────────────

    /** Only return active products */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Filter by category (case-insensitive slug match) */
    public function scopeByCategory(Builder $query, ?string $category): Builder
    {
        if (empty($category) || $category === 'All') {
            return $query;
        }
        $cat = strtolower(trim($category));
        if (str_contains($cat, '11+') || str_contains($cat, '11plus')) {
            return $query->where('category', '11plus_mock');
        }
        if (str_contains($cat, 'mentor') || str_contains($cat, 'interview')) {
            return $query->where('category', 'mock_interview');
        }
        if (str_contains($cat, 'test')) {
            return $query->where('category', 'test_series');
        }
        if (str_contains($cat, 'course')) {
            return $query->where('category', 'course');
        }
        if (str_contains($cat, 'ebook') || str_contains($cat, 'book')) {
            return $query->where('category', 'ebook');
        }
        $slug = strtolower(str_replace(' ', '_', $category));
        return $query->where('category', $slug);
    }

    /** Full-text search on title and description */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }
        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'LIKE', "%{$term}%")
              ->orWhere('short_description', 'LIKE', "%{$term}%")
              ->orWhere('category', 'LIKE', "%{$term}%");
        });
    }

    /** Dynamic sorting by price, rating, or newest */
    public function scopeSortedBy(Builder $query, ?string $sortBy): Builder
    {
        if ($sortBy === 'price_asc' ) {
            return $query->orderBy('price', 'asc');
        }
        if ($sortBy === 'price_desc' ) {
            return $query->orderBy('price', 'desc');
        }
        if ($sortBy === 'newest' ) {
            return $query->orderBy('created_at', 'desc');
        }
        return $query->orderBy('rating', 'desc');
    }

    // ─── Accessors ─────────────────────────────────────────────────────────────

    /** Calculate discount percentage */
    public function getDiscountPercentAttribute(): ?int
    {
        if (!$this->original_price || $this->original_price <= $this->price) {
            return null;
        }
        return (int) round((($this->original_price - $this->price) / $this->original_price) * 100);
    }
}
