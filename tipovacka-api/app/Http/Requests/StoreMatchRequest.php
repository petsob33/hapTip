<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchRequest extends FormRequest
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
            'home_team' => 'required|string|max:255',
            'away_team' => 'required|string|max:255',
            'kickoff_time' => 'required|date',
        ];
    }
}
