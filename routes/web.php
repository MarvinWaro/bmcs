<?php

use App\Http\Controllers\ClientSatisfactionSurveyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Client Satisfaction Survey Route (accessible to everyone)
Route::post('/client-satisfaction-survey', [ClientSatisfactionSurveyController::class, 'store'])
    ->name('client-satisfaction-survey.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
