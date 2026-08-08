<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'home_team' => $this->tym_domaci,
            'away_team' => $this->tym_hoste,
            'kickoff_time' => $this->cas_vykopu,
        ];
    }
}
