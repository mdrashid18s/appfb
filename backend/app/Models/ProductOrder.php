<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOrder extends Model
{
    use HasFactory;

    protected $table = 'product_orders';

    protected $fillable = [
        'student_id',
        'total_amount',
        'discount_amount',
        'final_amount',
        'payment_method',
        'payment_status',
        'transaction_id',
        'coupon_code',
        'razorpay_order_id',
    ];

    protected $casts = [
        'total_amount'    => 'float',
        'discount_amount' => 'float',
        'final_amount'    => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function items()
    {
        return $this->hasMany(ProductOrderItem::class, 'order_id', 'id');
    }

    // ─── Query Scopes (MVC Pattern) ─────────────────────────────────────────────

    /** Scope: Only completed/paid orders */
    public function scopeCompleted($query)
    {
        return $query->where('payment_status', 'completed');
    }

    /** Scope: Filter by student ID */
    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /** Scope: Order by latest first */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
