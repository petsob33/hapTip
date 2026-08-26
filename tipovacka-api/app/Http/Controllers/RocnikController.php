<?php

namespace App\Http\Controllers;

use App\Models\Rocnik;
use Illuminate\Http\JsonResponse;

class RocnikController extends Controller
{
    // Číselník, ne data k procházení — ~40 řádků a přibývá pomalu (typicky
    // jeden nový ročník za sezónu), takže záměrně bez ->paginate() jako
    // u ostatních seznamů. Frontend z toho staví select pro výběr sezóny.
    public function index(): JsonResponse
    {
        $rocniky = Rocnik::orderBy('r_id')->get();

        return response()->json($rocniky, 200);
    }
}
