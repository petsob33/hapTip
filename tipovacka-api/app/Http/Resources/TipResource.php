<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TipResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'match_id' => $this->zapas_id,
            'home_goals' => $this->goly_domaci,
            'away_goals' => $this->goly_hoste,
            'created_at' => $this->created_at,
        ];
    }
}
