<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatchRequest;
use App\Http\Requests\UpdateMatchRequest;
use App\Http\Resources\MatchResource;
use App\Models\GameMatch;
use App\Services\MatchService;
use App\Services\TipScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function __construct(
        private readonly MatchService $matchRepository,
        private readonly TipScoringService $tipScoringService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();

        $query = GameMatch::with(['homeTeam', 'awayTeam', 'tips' => function ($query) use ($userId) {
            $query->where('t_hrac', $userId);
        }]);

        if ($request->has('rocnik')) {
            $query->where('z_rocnik', $request->input('rocnik'));
            // Sezónní přehled (Moje tipy) chce zápasy od nejnovějších po
            // nejstarší; výchozí pořadí (nejnovější z_id první) zůstává pro
            // nefiltrovaný admin výpis beze změny.
            $query->orderByDesc('z_datum');
        } else {
            $query->orderByDesc('z_id');
        }

        $matches = $query->paginate($request->input('per_page', 10));

        return MatchResource::collection($matches)
            ->response()
            ->setStatusCode(200);
    }

    public function untipped(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();

        $matches = GameMatch::with(['homeTeam', 'awayTeam'])
            ->where('z_datum', '>', now())
            ->whereDoesntHave('tips', function ($query) use ($userId) {
                $query->where('t_hrac', $userId);
            })
            ->orderBy('z_kolo', 'asc')
            ->orderBy('z_datum', 'asc')
            ->paginate($request->input('per_page', 10));

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

    public function destroy(GameMatch $match): JsonResponse
    {
        $match->delete();

        return response()->json(['message' => 'Zápas byl úspěšně smazán.'], 200);
    }
}
