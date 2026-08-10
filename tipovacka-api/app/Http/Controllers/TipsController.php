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
}
