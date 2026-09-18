<?php

namespace App\Http\Controllers;

use App\Http\Resources\TipResource;
use App\Models\GameMatch;
use App\Models\Tips;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TipsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();

        // Cizí tip na zápas, který ještě nezačal (a nemá výsledek), by prozradil
        // soupeřovu predikci předem — takové tipy smí vidět jen jejich autor.
        $query = Tips::with(['match.homeTeam', 'match.awayTeam', 'player'])
            ->where(function ($query) use ($userId) {
                $query->where('t_hrac', $userId)
                    ->orWhereHas('match', function ($matchQuery) {
                        $matchQuery->where('z_datum', '<=', now())
                            ->orWhere(function ($q) {
                                $q->whereNotNull('z_goly_d')->whereNotNull('z_goly_h');
                            });
                    });
            });

        // Pokud URL obsahuje parametr ?rocnik=..., přidáme ho do filtrování
        if ($request->has('rocnik')) {
            $query->where('t_rocnik', $request->input('rocnik'));
        }

        // Dokončíme dotaz (seřazení a stránkování) a spustíme ho do databáze
        $tipy = $query->orderByDesc('t_datum')->paginate($request->input('per_page', 10));

        return TipResource::collection($tipy)->response()->setStatusCode(200);
    }

    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            't_zapas' => 'required|integer|exists:zapasy,z_id',
            't_tip_d' => 'required|integer',
            't_tip_h' => 'required|integer',
            't_rocnik' => 'required|string',
        ]);

        $match = GameMatch::findOrFail($validatedData['t_zapas']);
        $this->ensureTippable($match);

        $playerId = $request->user()->getKey();

        $alreadyTipped = Tips::where('t_zapas', $match->z_id)
            ->where('t_hrac', $playerId)
            ->exists();

        if ($alreadyTipped) {
            return response()->json(['message' => 'Na tento zápas už tip máte, upravte prosím ten stávající.'], 409);
        }

        $validatedData['t_hrac'] = $playerId;
        $validatedData['t_datum'] = now();
        $novyTip = Tips::create($validatedData);
        $novyTip->load(['match.homeTeam', 'match.awayTeam']);

        return (new TipResource($novyTip))->response()->setStatusCode(201);
    }

    public function myTips(Request $request): JsonResponse
    {
        $tipy = Tips::query()
            ->with(['match.homeTeam', 'match.awayTeam', 'player'])
            ->when($request->has('player'), function ($query) use ($request) {
                $query->where('t_hrac', $request->input('player'));
            })
            ->when($request->has('year'), function ($query) use ($request) {
                $query->where('t_rocnik', $request->input('year'));
            })
            ->orderByDesc('t_datum')
            ->paginate(10);

        return TipResource::collection($tipy)->response()->setStatusCode(200);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $tip = Tips::findOrFail($id);

        if ($tip->t_hrac !== $request->user()->getKey()) {
            return response()->json(['message' => 'K úpravě tohoto tipu nemáte oprávnění.'], 403);
        }

        $this->ensureTippable($tip->match);

        $validatedData = $request->validate([
            't_zapas' => 'sometimes|required|integer|exists:zapasy,z_id',
            't_tip_d' => 'sometimes|required|integer',
            't_tip_h' => 'sometimes|required|integer',
            't_rocnik' => 'sometimes|required|string',
        ]);

        if (isset($validatedData['t_zapas']) && $validatedData['t_zapas'] !== $tip->t_zapas) {
            $this->ensureTippable(GameMatch::findOrFail($validatedData['t_zapas']));
        }

        $tip->update($validatedData);
        $tip->load(['match.homeTeam', 'match.awayTeam']);

        return (new TipResource($tip))->response()->setStatusCode(200);
    }

    /**
     * Tip lze podat nebo upravit, jen dokud zápas nezačal a nemá výsledek —
     * jinak by hráč mohl tipovat se znalostí výsledku.
     */
    private function ensureTippable(GameMatch $match): void
    {
        if ($match->z_goly_d !== null && $match->z_goly_h !== null) {
            abort(422, 'Zápas už má výsledek, tip už nelze podat ani upravit.');
        }

        if ($match->z_datum <= now()) {
            abort(422, 'Zápas už začal, tip už nelze podat ani upravit.');
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $tip = Tips::findOrFail($id);

        if ($tip->t_hrac !== $request->user()->getKey()) {
            return response()->json(['message' => 'K smazání tohoto tipu nemáte oprávnění.'], 403);
        }

        $tip->delete();

        return response()->json(['message' => 'Tip byl úspěšně smazán.'], 200);

    }
}
