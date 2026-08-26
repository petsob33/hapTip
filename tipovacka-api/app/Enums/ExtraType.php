<?php

namespace App\Enums;

// `extra.e_zapas`/`e_muzstva` jsou v DB dva samostatné char(1) sloupce
// ("A"/"N"), ale ve skutečnosti fungují jako jeden exkluzivní přepínač typu
// sázky: právě jeden z nich je "A". Tenhle enum tu kombinaci pojmenovává,
// aby zbytek aplikace nepracoval přímo s dvojicí vlajek.
enum ExtraType: string
{
    // Tip na skóre zápasu. Výsledek: e_goly_d/e_goly_h. Tip hráče: ex_tip_d/ex_tip_h.
    case Match = 'zapas';

    // Tip na konkrétní mužstvo (např. "kdo skončí na 1. místě?"). Výsledek i tip
    // jsou ID záznamu v `muzstva` (uložené jako string v e_vysledek / ex_tip).
    case Team = 'muzstvo';

    // Volná odpověď (text nebo číslo, např. "kolik gólů dá král střelců?").
    // Výsledek i tip jsou string v e_vysledek / ex_tip.
    case Free = 'volna';

    public static function fromFlags(string $zapas, string $muzstva): self
    {
        return match (true) {
            $zapas === 'A' && $muzstva === 'N' => self::Match,
            $zapas === 'N' && $muzstva === 'A' => self::Team,
            $zapas === 'N' && $muzstva === 'N' => self::Free,
            default => throw new \UnexpectedValueException(
                "Neplatná kombinace e_zapas={$zapas}, e_muzstva={$muzstva}."
            ),
        };
    }

    /**
     * @return array{e_zapas: string, e_muzstva: string}
     */
    public function toFlags(): array
    {
        return match ($this) {
            self::Match => ['e_zapas' => 'A', 'e_muzstva' => 'N'],
            self::Team => ['e_zapas' => 'N', 'e_muzstva' => 'A'],
            self::Free => ['e_zapas' => 'N', 'e_muzstva' => 'N'],
        };
    }
}
