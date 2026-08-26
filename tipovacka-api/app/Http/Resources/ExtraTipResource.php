<?php

namespace App\Http\Resources;

use App\Enums\ExtraType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExtraTipResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = $this->extra?->type();

        return [
            'ex_id' => $this->ex_id,
            'ex_extra' => $this->ex_extra,
            'ex_hrac' => $this->ex_hrac,
            'ex_tip' => $this->ex_tip,
            'ex_tip_d' => $this->ex_tip_d,
            'ex_tip_h' => $this->ex_tip_h,
            // Pro extra typu muzstvo je ex_tip jen ID týmu — sem přidáme celý tým.
            'ex_tip_tym' => $type === ExtraType::Team && $this->team
                ? ['m_id' => $this->team->m_id, 'm_nazev' => $this->team->m_nazev]
                : null,
            'ex_body' => $this->ex_body,
            'ex_datum' => $this->ex_datum,
            'ex_rocnik' => $this->ex_rocnik,
        ];
    }
}
