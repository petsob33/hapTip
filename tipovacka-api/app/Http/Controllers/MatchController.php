<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatchRequest;
use App\Http\Resources\MatchResource;
use App\Models\GameMatch;
use Illuminate\Http\JsonResponse;

class MatchController extends Controller
{
    public function store(StoreMatchRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $match = GameMatch::create([
            'tym_domaci' => $validated['home_team'],
            'tym_hoste' => $validated['away_team'],
            'cas_vykopu' => $validated['kickoff_time'],
        ]);

        return (new MatchResource($match))
            ->response()
            ->setStatusCode(201);
    }

    public function index(): JsonResponse
    {
        // In practice, pagination like this is the usual way to fetch a list.
        $matches = GameMatch::paginate(10);

        return MatchResource::collection($matches)
            ->response()
            ->setStatusCode(200);
    }
}
