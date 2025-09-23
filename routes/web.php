<?php

use App\Http\Controllers\ClientSatisfactionSurveyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchoolController;
use App\Models\School;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public home page (loads schools for the form)
Route::get('/', function () {
    $schools = School::orderBy('name')->get(['id', 'name']);

    return Inertia::render('welcome', [
        'schools' => $schools,
    ]);
})->name('home');

// Public: submit client satisfaction survey
Route::post('/client-satisfaction-survey', [ClientSatisfactionSurveyController::class, 'store'])
    ->name('client-satisfaction-survey.store');

// Authenticated area
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Reviews list (filters + pagination)
    Route::get('/client-reviews', [ClientSatisfactionSurveyController::class, 'index'])
        ->name('client-reviews');

    // --- EXPORT ROUTES (PUT THESE BEFORE THE {clientSatisfactionSurvey} ROUTES) ---
    // Generic export (xlsx by default, ?format=csv for CSV)
    Route::get('/client-reviews/export', [ClientSatisfactionSurveyController::class, 'exportXlsx'])
        ->name('client-reviews.export');

    // Optional convenience route if you still want a dedicated XLSX URL
    Route::get('/client-reviews/export-xlsx', [ClientSatisfactionSurveyController::class, 'exportXlsx'])
        ->name('client-reviews.export-xlsx');

    // Review admin actions (constrain the param so 'export' can't match)
    Route::patch('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'update'])
        ->whereUlid('clientSatisfactionSurvey')
        ->name('client-reviews.update');

    Route::delete('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'destroy'])
        ->whereUlid('clientSatisfactionSurvey')
        ->name('client-reviews.destroy');

    // School management
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
    Route::patch('/schools/{school}', [SchoolController::class, 'update'])->name('schools.update');
    Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])->name('schools.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
