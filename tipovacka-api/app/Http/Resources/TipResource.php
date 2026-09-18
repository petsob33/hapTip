<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TipResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            't_id' => $this->t_id,
            't_zapas' => $this->t_zapas,
            // Stejná pojmenování jako MatchResource, aby frontend mohl zápas
            // zobrazit bez dalšího requestu na GET /api/matches.
            'home_team' => $this->match?->homeTeam?->m_nazev,
            'away_team' => $this->match?->awayTeam?->m_nazev,
            'date' => $this->match?->z_datum,
            'round' => $this->match?->z_kolo,
            't_hrac' => $this->t_hrac,
            // Přezdívka hráče, stejné pojmenování jako LeaderboardEntry.h_nick.
            'h_nick' => $this->player?->h_nick,
            't_tip_d' => $this->t_tip_d,
            't_tip_h' => $this->t_tip_h,
            't_body' => $this->t_body,
            't_datum' => $this->t_datum,
            't_rocnik' => $this->t_rocnik,
            't_joker' => $this->t_joker,
        ];
    }
}
