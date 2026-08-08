<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Tip;

class TipService
{
    public function createTip(int $userId, array $data): Tip
    {
        $match = GameMatch::findOrFail($data['match_id']);

        if (now()->greaterThan($match->cas_vykopu)) {
            throw new \Exception('The match has already started, betting is closed.');
        }

        // Repository/Model layer: write to the database
        return Tip::create([
            'uzivatel_id' => $userId,
            'zapas_id' => $data['match_id'],
            'goly_domaci' => $data['home_goals'],
            'goly_hoste' => $data['away_goals'],
        ]);
    }
}
