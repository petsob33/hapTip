<?php

use App\Http\Controllers\Dev\ApiExplorerController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Dev-only API explorer — gated to APP_ENV=local inside the controller.
Route::get('/dev/api', [ApiExplorerController::class, 'index'])->name('dev.api');
