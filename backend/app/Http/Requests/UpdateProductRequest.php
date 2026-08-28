<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'             => ['sometimes', 'required', 'string', 'max:255'],
            'category'          => ['sometimes', 'required', 'string'],
            'price'             => ['sometimes', 'required', 'numeric', 'min:0'],
            'original_price'    => ['nullable', 'numeric', 'min:0'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description'       => ['nullable', 'string'],
            'thumbnail'         => ['nullable', 'string'],
            'badge'             => ['nullable', 'string', 'max:50'],
            'rating'            => ['nullable', 'numeric', 'min:0', 'max:5'],
            'validity_days'     => ['nullable', 'integer', 'min:1'],
            'features'          => ['nullable'],
            'is_active'         => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'  => 'Product title is required.',
            'price.numeric'   => 'Price must be a valid number.',
            'price.min'       => 'Price cannot be negative.',
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
