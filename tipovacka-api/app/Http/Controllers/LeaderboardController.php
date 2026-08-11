<?php

namespace App\Http\Controllers;

use App\Models\Tips;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->input('rocnik', date('Y'));
        $leaderboard = Tips::join('hraci', 'hraci.h_id', '=', 'tipy.t_hrac')
            ->select(
                'hraci.h_nick',
                DB::raw('SUM(tipy.t_body) as total_points')
            )
            ->where('tipy.t_rocnik', $year)
            ->groupBy('hraci.h_id', 'hraci.h_nick')
            ->orderByDesc('total_points')
            ->get();

        return response()->json([
            'status' => 'success',
            'rocnik' => $year,
            'data' => $leaderboard
        ]);
    }
}