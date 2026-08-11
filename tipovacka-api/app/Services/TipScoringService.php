<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Tips;


class TipScoringService
{

    public function scoreMatch(GameMatch $gameMatch): void
    {
        $tips = Tips::where('t_zapas', $gameMatch->z_id)->get();

        foreach ($tips as $tip) {
            $realDiff = $gameMatch->z_goly_d - $gameMatch->z_goly_h;
            $tipDiff = $tip->t_tip_d - $tip->t_tip_h;

            if ($tip->t_tip_d == $gameMatch->z_goly_d && $tip->t_tip_h == $gameMatch->z_goly_h) {
                $points = 5;
            } elseif (($tipDiff <=> 0) === ($realDiff <=> 0)) {
                $points = 1;
            } else {
                $points = 0;
            }

            $tip->t_body = $points;
            $tip->save();
        }
    }
}