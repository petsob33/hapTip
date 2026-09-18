<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExtraController;
use App\Http\Controllers\ExtraTipController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PlayerStatsController;
use App\Http\Controllers\ResultsImportController;
use App\Http\Controllers\RocnikController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TipsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// throttle:10,1 — 10 pokusů za minutu na kombinaci IP+route. Login navíc
// zkouší legacy plaintext heslo (viz AuthService::login), takže limit tu brzdí
// hrubou silou zkoušené uniklé plaintext hodnoty stejně jako běžný bcrypt guess.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/matches', [MatchController::class, 'index']);
    Route::post('/matches', [MatchController::class, 'store'])->middleware('admin');
    Route::put('/matches/{match}', [MatchController::class, 'update'])->middleware('admin');
    Route::delete('/matches/{match}', [MatchController::class, 'destroy'])->middleware('admin');
    Route::get('/matches/import-results/preview', [ResultsImportController::class, 'preview'])->middleware('admin');
    Route::post('/matches/import-results/apply', [ResultsImportController::class, 'apply'])->middleware('admin');
    Route::post('/matches/import-results/manual-preview', [ResultsImportController::class, 'manualPreview'])->middleware('admin');
    Route::post('/matches/import-results/manual-apply', [ResultsImportController::class, 'manualApply'])->middleware('admin');

    Route::get('/untipped', [MatchController::class, 'untipped']);
    Route::get('/tips', [TipsController::class, 'index']);
    Route::post('/tips', [TipsController::class, 'store']);
    Route::put('/tips/{id}', [TipsController::class, 'update']);
    Route::delete('/tips/{id}', [TipsController::class, 'destroy']);
    Route::get('/myTips', [TipsController::class, 'myTips']);
    Route::post('/team', [TeamController::class, 'store'])->middleware('admin');
    Route::get('/team', [TeamController::class, 'index']);
    Route::get('/leadboard', [LeaderboardController::class, 'index']);
    Route::get('/leadboard/podiums', [LeaderboardController::class, 'podiums']);
    Route::get('/players/h2h', [PlayerStatsController::class, 'h2h']);
    Route::get('/players/{player}/stats', [PlayerStatsController::class, 'show']);
    Route::get('/rocniky', [RocnikController::class, 'index']);
    Route::get('/ExtraTip', [ExtraTipController::class, 'index']);
    Route::post('/ExtraTip', [ExtraTipController::class, 'store']);
    Route::put('/ExtraTip/{id}', [ExtraTipController::class, 'update']);
    Route::delete('/ExtraTip/{id}', [ExtraTipController::class, 'destroy']);

    Route::get('/extra', [ExtraController::class, 'index']);
    Route::post('/extra', [ExtraController::class, 'store'])->middleware('admin');
    Route::put('/extra/{extra}', [ExtraController::class, 'update'])->middleware('admin');
    Route::delete('/extra/{extra}', [ExtraController::class, 'destroy'])->middleware('admin');

});
