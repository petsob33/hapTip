<?php

namespace App\Http\Controllers;

use App\Enums\ExtraType;
use App\Http\Resources\ExtraTipResource;
use App\Models\Extra;
use App\Models\ExtraTip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExtraTipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $extraTips = ExtraTip::query()
            ->with(['extra', 'team'])
            ->when($request->has('rocnik'), function ($query) use ($request) {
                $query->where('ex_rocnik', $request->input('rocnik'));
            })
            ->orderByDesc('ex_datum')
            ->paginate(10);

        return ExtraTipResource::collection($extraTips)->response()->setStatusCode(200);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['ex_extra' => 'required|integer|exists:extra,e_id']);

        $extra = Extra::findOrFail($request->input('ex_extra'));

        if ($extra->hasResult()) {
            return response()->json(['message' => 'Tato extra otázka už má výsledek, tip už nelze podat.'], 422);
        }

        $type = $extra->type();

        $validated = $request->validate($this->tipRules($type, requireTip: true));

        $data = [
            'ex_extra' => $extra->e_id,
            'ex_hrac' => $request->user()->getKey(),
            'ex_rocnik' => $validated['ex_rocnik'],
            'ex_datum' => now(),
            ...$this->tipFields($type, $validated),
        ];

        $tip = ExtraTip::create($data);
        $tip->setRelation('extra', $extra);
        $tip->load('team');

        return (new ExtraTipResource($tip))->response()->setStatusCode(201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $tip = ExtraTip::findOrFail($id);

        if ($tip->ex_hrac !== $request->user()->getKey()) {
            return response()->json(['message' => 'K úpravě tohoto tipu nemáte oprávnění.'], 403);
        }

        if ($tip->extra->hasResult()) {
            return response()->json(['message' => 'Tato extra otázka už má výsledek, tip už nelze upravit.'], 422);
        }

        $type = $tip->extra->type();

        $validated = $request->validate($this->tipRules($type, requireTip: false));

        $data = array_key_exists('ex_rocnik', $validated) ? ['ex_rocnik' => $validated['ex_rocnik']] : [];

        if ($this->tipFieldsProvided($type, $validated)) {
            $data = [...$data, ...$this->tipFields($type, $validated)];
        }

        $tip->update($data);
        $tip->load('team');

        return (new ExtraTipResource($tip))->response()->setStatusCode(200);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $tip = ExtraTip::findOrFail($id);

        if ($tip->ex_hrac !== $request->user()->getKey()) {
            return response()->json(['message' => 'K smazání tohoto tipu nemáte oprávnění.'], 403);
        }

        $tip->delete();

        return response()->json(['message' => 'Tip byl úspěšně smazán.'], 200);
    }

    /**
     * @return array<string, mixed>
     */
    private function tipRules(ExtraType $type, bool $requireTip): array
    {
        return [
            'ex_rocnik' => $requireTip ? 'required|integer' : 'sometimes|required|integer',
            'ex_tip_d' => [$requireTip && $type === ExtraType::Match ? 'required' : 'nullable', 'integer', 'min:0'],
            'ex_tip_h' => [$requireTip && $type === ExtraType::Match ? 'required' : 'nullable', 'integer', 'min:0'],
            'ex_tip_tym' => [$requireTip && $type === ExtraType::Team ? 'required' : 'nullable', 'integer', 'exists:muzstva,m_id'],
            'ex_tip_text' => [$requireTip && $type === ExtraType::Free ? 'required' : 'nullable', 'string', 'max:250'],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{ex_tip_d: ?int, ex_tip_h: ?int, ex_tip: ?string}
     */
    private function tipFields(ExtraType $type, array $validated): array
    {
        return [
            'ex_tip_d' => $type === ExtraType::Match ? ($validated['ex_tip_d'] ?? null) : null,
            'ex_tip_h' => $type === ExtraType::Match ? ($validated['ex_tip_h'] ?? null) : null,
            // `extratipy.ex_tip` je NOT NULL ve schématu (legacy), takže pro typ
            // Match, kde se tip ukládá do ex_tip_d/ex_tip_h, sem patří prázdný string.
            'ex_tip' => match ($type) {
                ExtraType::Team => isset($validated['ex_tip_tym']) ? (string) $validated['ex_tip_tym'] : '',
                ExtraType::Free => $validated['ex_tip_text'] ?? '',
                ExtraType::Match => '',
            },
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function tipFieldsProvided(ExtraType $type, array $validated): bool
    {
        return match ($type) {
            ExtraType::Match => array_key_exists('ex_tip_d', $validated) || array_key_exists('ex_tip_h', $validated),
            ExtraType::Team => array_key_exists('ex_tip_tym', $validated),
            ExtraType::Free => array_key_exists('ex_tip_text', $validated),
        };
    }
}
