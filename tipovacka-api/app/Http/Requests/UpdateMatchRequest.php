<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'z_domaci' => 'sometimes|required|integer|exists:muzstva,m_id',
            'z_hoste' => 'sometimes|required|integer|exists:muzstva,m_id|different:z_domaci',
            'z_datum' => 'sometimes|required|date',
            'z_kolo' => 'sometimes|required|integer',
            'z_rocnik' => 'nullable|integer',
        ];
    }
}
