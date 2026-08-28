<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductExchange extends Model
{
    use HasFactory;

    protected $table = 'product_exchanges';

    protected $fillable = [
        'student_id',
        'old_product_id',
        'new_product_id',
        'old_student_product_id',
        'old_price',
        'new_price',
        'price_diff',
        'wallet_used',
        'wallet_credited',
        'amount_paid',
        'payment_method',
        'status',
    ];

    protected $casts = [
        'old_price'       => 'float',
        'new_price'       => 'float',
        'price_diff'      => 'float',
        'wallet_used'     => 'float',
        'wallet_credited' => 'float',
        'amount_paid'     => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function oldProduct()
    {
        return $this->belongsTo(Product::class, 'old_product_id', 'id');
    }

    public function newProduct()
    {
        return $this->belongsTo(Product::class, 'new_product_id', 'id');
    }
}
