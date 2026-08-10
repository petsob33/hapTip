<?php
namespace App\Http\Controllers;


use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;


class TeamController extends Controller
{
    public function index(): JsonResponse
    {
        $teams = Team::orderByDesc('m_liga')->paginate(10);

        // Vrátíme data jako JSON s HTTP kódem 200 (OK)
        return response()->json($teams, 200);
    }
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'm_nazev' => 'required|string',
            'm_mesto' => 'required|string',
            'm_znak' => 'required|string',
            'm_platnost' => 'required|string',
            'm_liga' => 'required|integer',

        ]);
        $newTeam = Team::create($validatedData);
        return response()->json($newTeam, 201);
    }


}


