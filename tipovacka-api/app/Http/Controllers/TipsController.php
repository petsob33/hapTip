<?php

namespace App\Http\Controllers;

use App\Http\Resources\TipResource;
use App\Models\Tips;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TipsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Začneme stavět dotaz
        $query = Tips::with(['match.homeTeam', 'match.awayTeam']);

        // Pokud URL obsahuje parametr ?rocnik=..., přidáme ho do filtrování
        if ($request->has('rocnik')) {
            $query->where('t_rocnik', $request->input('rocnik'));
        }

        // Dokončíme dotaz (seřazení a stránkování) a spustíme ho do databáze
        $tipy = $query->orderByDesc('t_datum')->paginate(10);

        return TipResource::collection($tipy)->response()->setStatusCode(200);
    }
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            't_zapas' => 'required|integer',
            't_tip_d' => 'required|integer',
            't_tip_h' => 'required|integer',
            't_rocnik' => 'required|string',
        ]);
        $validatedData['t_hrac'] = $request->user()->getKey();
        $validatedData['t_datum'] = now();
        $novyTip = Tips::create($validatedData);
        $novyTip->load(['match.homeTeam', 'match.awayTeam']);

        return (new TipResource($novyTip))->response()->setStatusCode(201);
    }

    public function myTips(Request $request): JsonResponse
    {
        $tipy = Tips::query()
            ->with(['match.homeTeam', 'match.awayTeam'])
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

        $validatedData = $request->validate([
            't_zapas' => 'sometimes|required|integer',
            't_tip_d' => 'sometimes|required|integer',
            't_tip_h' => 'sometimes|required|integer',
            't_rocnik' => 'sometimes|required|string',
        ]);

        $tip->update($validatedData);
        $tip->load(['match.homeTeam', 'match.awayTeam']);

        return (new TipResource($tip))->response()->setStatusCode(200);
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
