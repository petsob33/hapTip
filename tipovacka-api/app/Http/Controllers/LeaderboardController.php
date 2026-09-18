<?php

namespace App\Http\Controllers;

use App\Models\Tips;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        // `rocnik` je rocniky.r_id, ne kalendářní rok (viz Rocnik model) — bez
        // parametru vracíme žebříček přes všechny ročníky, stejně jako
        // PlayerStatsController dělá pro tipy bez zadaného ročníku.
        $year = $request->input('rocnik');
        $leaderboard = Tips::join('hraci', 'hraci.h_id', '=', 'tipy.t_hrac')
            ->select(
                'hraci.h_nick',
                DB::raw('SUM(tipy.t_body) as total_points')
            )
            ->when($year, fn ($query) => $query->where('tipy.t_rocnik', $year))
            ->groupBy('hraci.h_id', 'hraci.h_nick')
            ->orderByDesc('total_points')
            ->get();

        return response()->json([
            'status' => 'success',
            'rocnik' => $year,
            'data' => $leaderboard,
        ]);
    }

    // Umístění (1.–3. místo) každého hráče napříč VŠEMI ročníky, jedním
    // dotazem. Nahrazuje frontendový vzor "zavolej /leadboard pro každý
    // ročník zvlášť" (viz useTrophyCounts.ts) — s desítkami ročníků to byly
    // desítky paralelních requestů na jednu stránku.
    //
    // Vnitřní dotaz spočítá total_points per hráč+ročník úplně stejně jako
    // index() výše a k tomu pořadí uvnitř ročníku. RANK() (ne ROW_NUMBER())
    // dává remízujícím hráčům stejné pořadí — dva hráči na 1. místě jsou oba
    // "1", další hráč pak "3", ne "2" (žádné umístění se "nespotřebuje").
    // Vnější dotaz pak jen sečte, kolikrát byl který hráč na 1./2./3. místě.
    public function podiums()
    {
        $ranked = DB::table('tipy')
            ->join('hraci', 'hraci.h_id', '=', 'tipy.t_hrac')
            ->select(
                'hraci.h_nick',
                'tipy.t_rocnik',
                DB::raw('SUM(tipy.t_body) as total_points'),
                DB::raw('RANK() OVER (PARTITION BY tipy.t_rocnik ORDER BY SUM(tipy.t_body) DESC) as rn')
            )
            ->groupBy('tipy.t_rocnik', 'hraci.h_id', 'hraci.h_nick');

        $podiums = DB::query()
            ->fromSub($ranked, 'ranked')
            // total_points IS NOT NULL: sezóna bez jediného obodovaného tipu
            // (viz index() výše) nemá reálné umístění, i kdyby ROW_NUMBER
            // někomu přiřadil rn 1.
            ->whereNotNull('total_points')
            ->whereIn('rn', [1, 2, 3])
            ->select(
                'h_nick',
                DB::raw('SUM(CASE WHEN rn = 1 THEN 1 ELSE 0 END) as first'),
                DB::raw('SUM(CASE WHEN rn = 2 THEN 1 ELSE 0 END) as second'),
                DB::raw('SUM(CASE WHEN rn = 3 THEN 1 ELSE 0 END) as third')
            )
            ->groupBy('h_nick')
            ->get();

        return response()->json([
            'data' => $podiums,
        ]);
    }
}
