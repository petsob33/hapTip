<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TipsController;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/matches', [MatchController::class, 'index']);
    Route::post('/matches', [MatchController::class, 'store'])->middleware('admin');
    Route::put('/matches/{match}', [MatchController::class, 'update'])->middleware('admin');
    Route::get('/untipped', [MatchController::class,'untipped']);
    Route::get('/tips', [TipsController::class, 'index']);
    Route::post('/tips', [TipsController::class, 'store']);

    Route::post('/team', [TeamController::class, 'store']);
    Route::get('/team', [TeamController::class, 'index']);
    Route::get('/leadboard', [LeaderboardController::class, 'index']);

});
