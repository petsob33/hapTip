<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatchRequest;
use App\Http\Requests\UpdateMatchRequest;
use App\Http\Resources\MatchResource;
use App\Models\GameMatch;
use App\Services\MatchService;
use App\Services\TipScoringService;
use Illuminate\Http\JsonResponse;

class MatchController extends Controller
{
    public function __construct(
        private readonly MatchService $matchRepository,
        private readonly TipScoringService $tipScoringService,
    ) {
    }

    public function index(): JsonResponse
    {
        $matches = GameMatch::with(['homeTeam', 'awayTeam'])
            ->orderByDesc('z_id')
            ->paginate(10);

        return MatchResource::collection($matches)
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreMatchRequest $request): JsonResponse
    {
        $match = $this->matchRepository->create($request->validated());
        return (new MatchResource($match))
            ->response()
            ->setStatusCode(201);

    }

    public function update(UpdateMatchRequest $request, GameMatch $match): JsonResponse
    {
        $match = $this->matchRepository->update($match, $request->validated());

        if ($match->z_goly_d !== null && $match->z_goly_h !== null) {
            $this->tipScoringService->scoreMatch($match);
        }

        return (new MatchResource($match))->response()->setStatusCode(200);
    }

}
