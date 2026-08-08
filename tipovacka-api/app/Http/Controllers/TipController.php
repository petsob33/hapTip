<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTipRequest;
use App\Http\Resources\TipResource;
use App\Services\TipService;
use Illuminate\Http\JsonResponse;

class TipController extends Controller
{
    public function __construct(private readonly TipService $tipService)
    {
    }

    public function store(StoreTipRequest $request): JsonResponse
    {
        $tip = $this->tipService->createTip(
            $request->user()->id,
            $request->validated(),
        );

        return (new TipResource($tip))
            ->response()
            ->setStatusCode(201);
    }
}
