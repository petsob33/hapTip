<?php

namespace App\Http\Controllers;

use App\Models\Tips;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TipsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Začneme stavět dotaz
        $query = Tips::query();

        // Pokud URL obsahuje parametr ?rocnik=..., přidáme ho do filtrování
        if ($request->has('rocnik')) {
            $query->where('t_rocnik', $request->input('rocnik'));
        }

        // Dokončíme dotaz (seřazení a stránkování) a spustíme ho do databáze
        $tipy = $query->orderByDesc('t_datum')->paginate(10);

        return response()->json($tipy, 200);
    }
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            't_zapas' => 'required|integer',
            't_tip_d' => 'required|integer',
            't_tip_h' => 'required|integer',
            't_rocnik' => 'required|string',
        ]);
        $validatedData['t_hrac'] = $request->user()->id;
        $validatedData['t_datum'] = now();
        $novyTip = Tips::create($validatedData);
        return response()->json($novyTip, 201);
    }

    public function myTips(Request $request): JsonResponse
    {
        $tipy = Tips::query()
            ->when($request->has('player'), function ($query) use ($request) {
                $query->where('t_hrac', $request->input('player'));
            })
            ->when($request->has('year'), function ($query) use ($request) {
                $query->where('t_rocnik', $request->input('year'));
            })
            ->orderByDesc('t_datum')
            ->paginate(10);

        return response()->json($tipy, 200);
    }
    public function update(Request $request, $id): JsonResponse
    {
        $tip = Tips::findOrFail($id);

        // 2. Kontrola oprávnění: Může tip upravit tento uživatel?
        if ($tip->t_hrac !== $request->user()->id) {
            return response()->json(['message' => 'K úpravě tohoto tipu nemáte oprávnění.'], 403);
        }

        // 3. Validace dat. Pravidlo 'sometimes' znamená, že se pole validuje 
        // pouze tehdy, když je v requestu (hodí se pro částečné updaty - PATCH).
        $validatedData = $request->validate([
            't_zapas' => 'sometimes|required|integer',
            't_tip_d' => 'sometimes|required|integer',
            't_tip_h' => 'sometimes|required|integer',
            't_rocnik' => 'sometimes|required|string',
        ]);

        // 4. Aktualizace tipu
        $tip->update($validatedData);

        return response()->json($tip, 200);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        // 1. Najdeme tip
        $tip = Tips::findOrFail($id);

        // 2. Kontrola oprávnění
        if ($tip->t_hrac !== $request->user()->id) {
            return response()->json(['message' => 'K smazání tohoto tipu nemáte oprávnění.'], 403);
        }

        // 3. Smazání z databáze
        $tip->delete();

        // 4. Odpověď pro frontend
        return response()->json(['message' => 'Tip byl úspěšně smazán.'], 200);
        // Alternativně můžeš použít kód 204 (No Content) bez těla odpovědi:
        // return response()->json(null, 204);
    }


}
