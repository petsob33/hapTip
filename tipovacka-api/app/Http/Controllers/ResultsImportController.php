<?php

namespace App\Http\Controllers;

use App\Models\Rocnik;
use App\Services\ManualResultsImportService;
use App\Services\ResultsImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ResultsImportController extends Controller
{
    public function __construct(
        private readonly ResultsImportService $importService,
        private readonly ManualResultsImportService $manualImportService,
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rocnik' => 'required|integer|exists:rocniky,r_id',
        ]);

        $rocnik = Rocnik::findOrFail($validated['rocnik']);

        return response()->json($this->wrap(fn () => $this->importService->preview($rocnik)), 200);
    }

    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rocnik' => 'required|integer|exists:rocniky,r_id',
            'match_ids' => 'required|array|min:1',
            'match_ids.*' => 'integer|exists:zapasy,z_id',
        ]);

        $rocnik = Rocnik::findOrFail($validated['rocnik']);

        return response()->json(
            $this->wrap(fn () => $this->importService->apply($rocnik, $validated['match_ids'])),
            200,
        );
    }

    public function manualPreview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rocnik' => 'required|integer|exists:rocniky,r_id',
            'text' => 'required|string',
        ]);

        $rocnik = Rocnik::findOrFail($validated['rocnik']);

        return response()->json($this->manualImportService->preview($rocnik, $validated['text']), 200);
    }

    public function manualApply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rocnik' => 'required|integer|exists:rocniky,r_id',
            'text' => 'required|string',
            'match_ids' => 'required|array|min:1',
            'match_ids.*' => 'integer|exists:zapasy,z_id',
        ]);

        $rocnik = Rocnik::findOrFail($validated['rocnik']);

        return response()->json(
            $this->manualImportService->apply($rocnik, $validated['text'], $validated['match_ids']),
            200,
        );
    }

    /**
     * Chyby konfigurace/dostupnosti API-Football (chybějící klíč, nenamapovaná
     * liga, HTTP chyba) hlásí ResultsImportService jako RuntimeException —
     * sem se převedou na standardní 422 validační odpověď (stejný tvar chyby
     * jako u ostatních admin endpointů, viz docs/api.md).
     */
    private function wrap(callable $callback): mixed
    {
        try {
            return $callback();
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['rocnik' => [$e->getMessage()]]);
        }
    }
}
