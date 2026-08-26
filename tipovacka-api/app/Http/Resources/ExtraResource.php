<?php

namespace App\Http\Resources;

use App\Enums\ExtraType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExtraResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = $this->type();

        return [
            'e_id' => $this->e_id,
            'e_pril' => $this->e_pril,
            'e_typ' => $type->value,
            'e_goly_d' => $this->e_goly_d,
            'e_goly_h' => $this->e_goly_h,
            'e_vysledek' => $this->e_vysledek,
            // Pro e_typ=muzstvo je e_vysledek jen ID týmu — sem přidáme celý tým.
            'e_vysledek_tym' => $type === ExtraType::Team && $this->winningTeam
                ? ['m_id' => $this->winningTeam->m_id, 'm_nazev' => $this->winningTeam->m_nazev]
                : null,
            'e_rocnik' => $this->e_rocnik,
            'e_platnost' => $this->e_platnost,
            'e_datum_pl' => $this->e_datum_pl,
            'e_autor' => $this->e_autor,
            'tips' => ExtraTipResource::collection($this->whenLoaded('tips')),
        ];
    }
}
