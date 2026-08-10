<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// A FormRequest runs BEFORE the controller. If rules() fails, Laravel
// auto-returns a 422 response and the controller code never even runs.
class StoreMatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authentication vs authorization: at this point the user isn't
        // logged in yet (they're trying to create an account), so there is
        // nothing to authorize against. Always allow the request through.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'z_domaci' => 'required|integer|exists:muzstva,m_id',
            'z_hoste' => 'required|integer|exists:muzstva,m_id|different:z_domaci',
            'z_datum' => 'required|date',
            'z_kolo' => 'required|integer',
            'z_rocnik' => 'nullable|integer',
        ];

    }
}
