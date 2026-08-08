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
            'id' => $this->z_id,
            'home_team' => $this->homeTeam?->m_nazev,
            'away_team' => $this->awayTeam?->m_nazev,
            'date' => $this->z_datum,
            'round' => $this->z_kolo,
            'season' => $this->z_rocnik,
            'home_goals' => $this->z_goly_d,
            'away_goals' => $this->z_goly_h,
        ];
    }
}
