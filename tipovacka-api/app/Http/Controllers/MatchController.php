<?php

namespace App\Http\Controllers;

use App\Http\Resources\MatchResource;
use App\Models\GameMatch;
use Illuminate\Http\JsonResponse;

class MatchController extends Controller
{
    public function index(): JsonResponse
    {
        $matches = GameMatch::with(['homeTeam', 'awayTeam'])
            ->orderByDesc('z_id')
            ->paginate(10);

        return MatchResource::collection($matches)
            ->response()
            ->setStatusCode(200);
    }
}
