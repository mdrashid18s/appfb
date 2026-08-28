<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Class StoreProductRequest
 * 
 * Yeh Form Request Naye Product ko create karte waqt aane wale form data ko validate karta hai.
 * 
 * Kaam:
 *   1. Authorization: Check karta hai ki user product create karne ke liye authorized hai ya nahi.
 *   2. Validation Rules: Title, category, price, discount etc. ke strict rules verify karta hai.
 *   3. Custom Messages: Validation fail hone par clean error messages return karta hai.
 *   4. JSON API Error Response: 422 Unprocessable Entity status ke sath error format karta hai.
 */
class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title'             => ['required', 'string', 'max:255'],
            'category'          => ['required', 'string'],
            'price'             => ['required', 'numeric', 'min:0'],
            'original_price'    => ['nullable', 'numeric', 'min:0'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description'       => ['nullable', 'string'],
            'thumbnail'         => ['nullable', 'string'],
            'badge'             => ['nullable', 'string', 'max:50'],
            'rating'            => ['nullable', 'numeric', 'min:0', 'max:5'],
            'validity_days'     => ['nullable', 'integer', 'min:1'],
            'features'          => ['nullable'],
        ];
    }

    /**
     * Custom validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required'    => 'Product title is required.',
            'category.required' => 'Category is required.',
            'price.required'    => 'Price is required.',
            'price.numeric'     => 'Price must be a valid number.',
            'price.min'         => 'Price cannot be negative.',
        ];
    }

    /**
     * Validation fail hone par clean JSON error response return karna.
     *
     * @param Validator $validator
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422));
    }
}
