<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class VerifyRazorpayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_order_id'   => ['required', 'string'],
            'razorpay_signature'  => ['required', 'string'],
            'cart_items'          => ['required', 'array', 'min:1'],
            'cart_items.*.id'     => ['required', 'integer'],
            'final_amount'        => ['required', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'razorpay_payment_id.required' => 'Razorpay payment ID is required.',
            'razorpay_order_id.required'   => 'Razorpay order ID is required.',
            'razorpay_signature.required'  => 'Razorpay signature is required.',
            'cart_items.required'          => 'Cart items are required.',
            'final_amount.required'        => 'Final amount is required.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422));
    }
}
