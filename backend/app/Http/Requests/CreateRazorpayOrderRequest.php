<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CreateRazorpayOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'            => ['required', 'numeric', 'min:1'],
            'cart_items'        => ['required', 'array', 'min:1'],
            'cart_items.*.id'   => ['required', 'integer'],
            'cart_items.*.price'=> ['required', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required'         => 'Payment amount is required.',
            'amount.min'              => 'Payment amount must be at least ₹1.',
            'cart_items.required'     => 'Cart items are required.',
            'cart_items.min'          => 'Cart must have at least one item.',
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
