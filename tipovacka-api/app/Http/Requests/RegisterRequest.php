<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// A FormRequest runs BEFORE the controller. If rules() fails, Laravel
// auto-returns a 422 response and the controller code never even runs.
class RegisterRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            // "unique:hraci,h_email" checks the `h_email` column of the
            // `hraci` table. Without this, two accounts could share an email
            // and login() below would not know which one to check the
            // password against.
            'email' => 'required|email|unique:hraci,h_email',
            // min:8 is a deliberately low bar just to have *some* rule.
            'password' => 'required|string|min:8',
        ];
    }
}
