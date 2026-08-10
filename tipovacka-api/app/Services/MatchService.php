<?php

namespace App\Services;

use App\Models\GameMatch;

class MatchService
{
    public function create(array $data): GameMatch
    {
        return GameMatch::create($data);
    }

    public function update(GameMatch $match, array $data): GameMatch
    {
        $match->update($data);

        return $match;
    }
}