<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            // Deliberately NOT "exists:users,email" here. If we validated
            // that the email must exist, a wrong email would fail with a
            // different message/timing than a wrong password — that lets an
            // attacker figure out which emails are registered. Instead we
            // check both together in AuthService::login() and return
            // one generic error for both cases.
            'email' => 'required|email',
            'password' => 'required|string',
        ];
    }
}
