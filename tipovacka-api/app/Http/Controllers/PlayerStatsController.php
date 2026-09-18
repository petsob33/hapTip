<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Tips;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlayerStatsController extends Controller
{
    // Sezónní statistiky jednoho hráče: forma (body v posledních kolech) a
    // průměr bodů na kolo, počítáno jen z kol, kde už má aspoň jeden
    // obodovaný tip (t_body not null).
    public function show(Request $request, Player $player): JsonResponse
    {
        $rocnik = $request->input('rocnik');

        $rounds = Tips::join('zapasy', 'zapasy.z_id', '=', 'tipy.t_zapas')
            ->where('tipy.t_hrac', $player->getKey())
            ->when($rocnik, fn ($query) => $query->where('tipy.t_rocnik', $rocnik))
            ->whereNotNull('tipy.t_body')
            ->select('zapasy.z_kolo as round', DB::raw('SUM(tipy.t_body) as points'))
            ->groupBy('zapasy.z_kolo')
            ->orderBy('zapasy.z_kolo')
            ->get();

        $roundsPlayed = $rounds->count();
        $totalPoints = (int) $rounds->sum('points');
        // slice(-0) by vrátilo celou kolekci místo posledních N kol, proto
        // min 1; bez horní meze slice() sama ořízne na $rounds->count().
        $formLimit = max(1, (int) $request->input('posledni', 5));

        // Přesnost tipů podle bodování v TipScoringService: 5 = přesné skóre,
        // 1 = trefený výsledek (výhra/remíza/prohra) bez přesného skóre, 0 = mimo.
        $scoredTips = Tips::where('t_hrac', $player->getKey())
            ->when($rocnik, fn ($query) => $query->where('t_rocnik', $rocnik))
            ->whereNotNull('t_body')
            ->get(['t_body']);

        $tipsScored = $scoredTips->count();
        $exact = $scoredTips->where('t_body', 5)->count();
        $outcome = $scoredTips->where('t_body', 1)->count();
        $miss = $scoredTips->where('t_body', 0)->count();

        return response()->json([
            'rocnik' => $rocnik,
            'player' => [
                'h_id' => $player->getKey(),
                'h_nick' => $player->h_nick,
            ],
            'rounds_played' => $roundsPlayed,
            'total_points' => $totalPoints,
            'avg_points_per_round' => $roundsPlayed > 0 ? round($totalPoints / $roundsPlayed, 2) : null,
            // Chronologicky od nejstaršího k nejnovějšímu kolu, pro vykreslení trendu.
            'form' => $rounds->slice(-$formLimit)->values(),
            'accuracy' => [
                'tips_scored' => $tipsScored,
                'exact' => $exact,
                'exact_pct' => $tipsScored > 0 ? round($exact / $tipsScored * 100, 1) : null,
                'outcome' => $outcome,
                'outcome_pct' => $tipsScored > 0 ? round($outcome / $tipsScored * 100, 1) : null,
                'miss' => $miss,
                'miss_pct' => $tipsScored > 0 ? round($miss / $tipsScored * 100, 1) : null,
            ],
        ]);
    }

    // Vzájemné srovnání dvou hráčů — jen na zápasech, které oba obodovaně
    // otipovali (aby šlo o srovnání "kolo proti kolu", ne o celkové součty
    // včetně zápasů, které tipoval jen jeden z nich).
    public function h2h(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'player1' => 'required|integer|exists:hraci,h_id',
            'player2' => 'required|integer|different:player1|exists:hraci,h_id',
            'rocnik' => 'nullable|integer',
        ]);

        $player1 = Player::findOrFail($validated['player1']);
        $player2 = Player::findOrFail($validated['player2']);
        $rocnik = $validated['rocnik'] ?? null;

        $tips1 = Tips::where('t_hrac', $player1->getKey())
            ->when($rocnik, fn ($query) => $query->where('t_rocnik', $rocnik))
            ->whereNotNull('t_body')
            ->pluck('t_body', 't_zapas');

        $tips2 = Tips::where('t_hrac', $player2->getKey())
            ->when($rocnik, fn ($query) => $query->where('t_rocnik', $rocnik))
            ->whereNotNull('t_body')
            ->pluck('t_body', 't_zapas');

        $commonMatchIds = $tips1->keys()->intersect($tips2->keys());

        $wins1 = 0;
        $wins2 = 0;
        $draws = 0;
        $totalPoints1 = 0;
        $totalPoints2 = 0;

        foreach ($commonMatchIds as $matchId) {
            $points1 = $tips1[$matchId];
            $points2 = $tips2[$matchId];

            $totalPoints1 += $points1;
            $totalPoints2 += $points2;

            if ($points1 > $points2) {
                $wins1++;
            } elseif ($points2 > $points1) {
                $wins2++;
            } else {
                $draws++;
            }
        }

        return response()->json([
            'rocnik' => $rocnik,
            'player1' => ['h_id' => $player1->getKey(), 'h_nick' => $player1->h_nick],
            'player2' => ['h_id' => $player2->getKey(), 'h_nick' => $player2->h_nick],
            'matches_compared' => $commonMatchIds->count(),
            'wins' => [
                'player1' => $wins1,
                'player2' => $wins2,
                'draws' => $draws,
            ],
            'total_points' => [
                'player1' => $totalPoints1,
                'player2' => $totalPoints2,
            ],
        ]);
    }
}
