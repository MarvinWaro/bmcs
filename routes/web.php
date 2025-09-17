<?php

use App\Http\Controllers\ClientSatisfactionSurveyController;
use App\Http\Controllers\SchoolController;
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

    // Admin routes for client reviews management
    Route::get('/client-reviews', [ClientSatisfactionSurveyController::class, 'index'])
        ->name('client-reviews');

    // Additional admin routes for managing surveys - use clientSatisfactionSurvey as parameter name
    Route::patch('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'update'])
        ->name('client-reviews.update');

    Route::delete('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'destroy'])
        ->name('client-reviews.destroy');

    // School management routes
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
    Route::patch('/schools/{school}', [SchoolController::class, 'update'])->name('schools.update');
    Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
