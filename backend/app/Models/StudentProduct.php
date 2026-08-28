<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProduct extends Model
{
    use HasFactory;

    protected $table = 'student_products';

    protected $fillable = [
        'student_id',
        'product_id',
        'order_id',
        'purchased_at',
        'expires_at',
        'status',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function order()
    {
        return $this->belongsTo(ProductOrder::class, 'order_id', 'id');
    }
}
