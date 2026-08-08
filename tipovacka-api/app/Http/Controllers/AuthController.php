<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

// Deliberately thin: no password hashing, no DB queries, no token logic
// here — that all lives in AuthService. This controller only exists to
// connect "an HTTP request came in" to "the auth business logic runs".
class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        // $request->validated() only returns the fields declared in
        // RegisterRequest::rules() — even if the client sent extra fields
        // in the JSON body, they're silently dropped here.
        $token = $this->authService->register($request->validated());

        return response()->json([
            'token' => $token->plainTextToken,
        ], 201); // 201 Created: a new user resource was created.
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->authService->login($request->validated());

        return response()->json([
            'token' => $token->plainTextToken,
        ]); // 200 OK (default): no new resource created, just a new token.
    }
}
