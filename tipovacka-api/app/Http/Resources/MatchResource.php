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
        // 'tips' je jen tehdy loadovaná, když ji controller explicitně eager
        // loadne (viz MatchController::index) a omezí na tipy přihlášeného
        // hráče — jinde (store/update/untipped) klíč zůstává null.
        $myTip = $this->relationLoaded('tips') ? $this->tips->first() : null;

        return [
            'id' => $this->z_id,
            'home_team' => $this->homeTeam?->m_nazev,
            'away_team' => $this->awayTeam?->m_nazev,
            'date' => $this->z_datum,
            'round' => $this->z_kolo,
            'season' => $this->z_rocnik,
            'home_goals' => $this->z_goly_d,
            'away_goals' => $this->z_goly_h,
            'my_tip' => $myTip ? [
                't_id' => $myTip->t_id,
                't_tip_d' => $myTip->t_tip_d,
                't_tip_h' => $myTip->t_tip_h,
                't_body' => $myTip->t_body,
            ] : null,
        ];
    }
}
