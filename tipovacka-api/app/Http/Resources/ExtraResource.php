<?php

namespace App\Http\Resources;

use App\Enums\ExtraType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use UnexpectedValueException;

class ExtraResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // extra.e_zapas/e_muzstva nemají v DB CHECK constraint, takže starý/
        // poškozený řádek může nést neplatnou kombinaci flagů — ExtraType::
        // fromFlags() na ni vyhazuje. Bez try/catch by to shodilo celý
        // paginovaný listing kvůli jednomu řádku; místo toho ten řádek
        // vrátíme s e_typ null a bez odvozených polí.
        try {
            $type = $this->type();
        } catch (UnexpectedValueException) {
            return [
                'e_id' => $this->e_id,
                'e_pril' => $this->e_pril,
                'e_typ' => null,
                'e_goly_d' => $this->e_goly_d,
                'e_goly_h' => $this->e_goly_h,
                'e_vysledek' => $this->e_vysledek,
                'e_vysledek_tym' => null,
                'e_rocnik' => $this->e_rocnik,
                'e_platnost' => $this->e_platnost,
                'e_datum_pl' => $this->e_datum_pl,
                'e_autor' => $this->e_autor,
                'tips' => [],
                'my_tip' => null,
            ];
        }

        // 'tips' je jen tehdy loadovaná, když ji controller explicitně eager
        // loadne (viz ExtraController::index) a omezí na tipy přihlášeného
        // hráče — jinde (store/destroy) klíč zůstává null. V ExtraController::
        // update se 'tips' loaduje bez omezení (všichni hráči, pro admina),
        // proto tam 'my_tip' nemusí odpovídat aktuálnímu uživateli.
        $myTip = $this->relationLoaded('tips') ? $this->tips->first() : null;

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
            'my_tip' => $myTip ? [
                'ex_id' => $myTip->ex_id,
                'ex_tip' => $myTip->ex_tip,
                'ex_tip_d' => $myTip->ex_tip_d,
                'ex_tip_h' => $myTip->ex_tip_h,
                'ex_tip_tym' => $type === ExtraType::Team && $myTip->team
                    ? ['m_id' => $myTip->team->m_id, 'm_nazev' => $myTip->team->m_nazev]
                    : null,
                'ex_body' => $myTip->ex_body,
            ] : null,
        ];
    }
}
