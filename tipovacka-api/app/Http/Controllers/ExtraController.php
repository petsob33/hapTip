<?php

namespace App\Http\Controllers;

use App\Enums\ExtraType;
use App\Http\Resources\ExtraResource;
use App\Models\Extra;
use App\Services\ExtraScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExtraController extends Controller
{
    public function __construct(
        private readonly ExtraScoringService $extraScoringService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $extras = Extra::query()
            ->with('winningTeam')
            ->when($request->has('rocnik'), function ($query) use ($request) {
                $query->where('e_rocnik', $request->input('rocnik'));
            })
            ->orderByDesc('e_id')
            ->paginate(10);

        return ExtraResource::collection($extras)->response()->setStatusCode(200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'e_pril' => 'required|string|max:250',
            'e_typ' => ['required', Rule::enum(ExtraType::class)],
            'e_goly_d' => 'nullable|integer|min:0',
            'e_goly_h' => 'nullable|integer|min:0',
            'e_vysledek_tym' => 'nullable|integer|exists:muzstva,m_id',
            'e_vysledek_text' => 'nullable|string|max:250',
            'e_rocnik' => 'required|integer',
            'e_platnost' => 'required|in:A,N',
            'e_datum_pl' => 'nullable|date',
        ]);

        $type = ExtraType::from($validated['e_typ']);

        $data = [
            'e_pril' => $validated['e_pril'],
            'e_rocnik' => $validated['e_rocnik'],
            'e_platnost' => $validated['e_platnost'],
            'e_datum_pl' => $validated['e_datum_pl'] ?? null,
            'e_autor' => $request->user()->getKey(),
            ...$type->toFlags(),
            ...$this->resultFields($type, $validated),
        ];

        $extra = Extra::create($data);

        return (new ExtraResource($extra))->response()->setStatusCode(201);
    }

    public function update(Request $request, Extra $extra): JsonResponse
    {
        $validated = $request->validate([
            'e_pril' => 'sometimes|required|string|max:250',
            'e_typ' => ['sometimes', Rule::enum(ExtraType::class)],
            'e_goly_d' => 'nullable|integer|min:0',
            'e_goly_h' => 'nullable|integer|min:0',
            'e_vysledek_tym' => 'nullable|integer|exists:muzstva,m_id',
            'e_vysledek_text' => 'nullable|string|max:250',
            'e_rocnik' => 'sometimes|required|integer',
            'e_platnost' => 'sometimes|required|in:A,N',
            'e_datum_pl' => 'nullable|date',
        ]);

        $type = isset($validated['e_typ']) ? ExtraType::from($validated['e_typ']) : $extra->type();

        $data = array_intersect_key($validated, array_flip(['e_pril', 'e_rocnik', 'e_platnost', 'e_datum_pl']));
        $data = [...$data, ...$type->toFlags()];

        // Výsledková pole (e_goly_d/h, e_vysledek) přepisujeme jen když se mění typ
        // nebo když je admin poslal explicitně — jinak by je jiná dílčí aktualizace
        // (např. jen e_platnost) vynulovala.
        $resultProvided = isset($validated['e_typ'])
            || array_key_exists('e_goly_d', $validated)
            || array_key_exists('e_goly_h', $validated)
            || array_key_exists('e_vysledek_tym', $validated)
            || array_key_exists('e_vysledek_text', $validated);

        if ($resultProvided) {
            $data = [...$data, ...$this->resultFields($type, $validated)];
        }

        $extra->update($data);

        $this->extraScoringService->scoreExtra($extra);

        $extra->load(['winningTeam', 'tips.team']);
        $extra->tips->each(fn ($tip) => $tip->setRelation('extra', $extra));

        return (new ExtraResource($extra))->response()->setStatusCode(200);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{e_goly_d: ?int, e_goly_h: ?int, e_vysledek: ?string}
     */
    private function resultFields(ExtraType $type, array $validated): array
    {
        return [
            'e_goly_d' => $type === ExtraType::Match ? ($validated['e_goly_d'] ?? null) : null,
            'e_goly_h' => $type === ExtraType::Match ? ($validated['e_goly_h'] ?? null) : null,
            'e_vysledek' => match ($type) {
                ExtraType::Team => isset($validated['e_vysledek_tym']) ? (string) $validated['e_vysledek_tym'] : null,
                ExtraType::Free => $validated['e_vysledek_text'] ?? null,
                ExtraType::Match => null,
            },
        ];
    }

    public function destroy(Extra $extra): JsonResponse
    {
        $extra->delete();

        return response()->json(['message' => 'Extra byla úspěšně smazána.'], 200);
    }
}
