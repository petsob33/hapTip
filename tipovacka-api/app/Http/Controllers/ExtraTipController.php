<?php

namespace App\Http\Controllers;

use App\Models\ExtraTip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class ExtraTipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $extraTips = ExtraTip::query()
            ->when($request->has('rocnik'), function ($query) use ($request) {
                $query->where('ex_rocnik', $request->input('rocnik'));
            })
            ->orderByDesc('ex_datum')
            ->paginate(10);

        return response()->json($extraTips, 200);

    }
}

