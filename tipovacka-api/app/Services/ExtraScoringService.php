<?php

namespace App\Services;

use App\Enums\ExtraType;
use App\Models\Extra;
use App\Models\ExtraTip;

class ExtraScoringService
{
    public function scoreExtra(Extra $extra): void
    {
        if (!$extra->hasResult()) {
            return;
        }

        $type = $extra->type();

        foreach ($extra->tips as $tip) {
            $tip->ex_body = match ($type) {
                ExtraType::Match => $this->scoreMatch($extra, $tip),
                ExtraType::Team => $this->scoreExact($extra->e_vysledek, $tip->ex_tip),
                ExtraType::Free => $this->scoreFreeText($extra->e_vysledek, $tip->ex_tip),
            };
            $tip->save();
        }
    }

    private function scoreMatch(Extra $extra, ExtraTip $tip): int
    {
        if ($tip->ex_tip_d === null || $tip->ex_tip_h === null) {
            return 0;
        }

        if ($tip->ex_tip_d == $extra->e_goly_d && $tip->ex_tip_h == $extra->e_goly_h) {
            return 4;
        }

        $realDiff = $extra->e_goly_d - $extra->e_goly_h;
        $tipDiff = $tip->ex_tip_d - $tip->ex_tip_h;

        return ($tipDiff <=> 0) === ($realDiff <=> 0) ? 1 : 0;
    }

    private function scoreExact(?string $result, ?string $tip): int
    {
        return $result !== null && $tip !== null && $result === $tip ? 5 : 0;
    }

    private function scoreFreeText(?string $result, ?string $tip): int
    {
        if ($result === null || $tip === null) {
            return 0;
        }

        return $this->normalize($result) === $this->normalize($tip) ? 4 : 0;
    }

    private function normalize(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $value)));
    }
}
