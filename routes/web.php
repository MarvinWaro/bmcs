<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ClientSatisfactionSurveyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchoolController;
use App\Models\School;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    // Provide schools to the public welcome page (id + name only)
    $schools = School::orderBy('name')->get(['id', 'name']);

    return Inertia::render('welcome', [
        'schools' => $schools,
    ]);
})->name('home');

// Public: submit a client satisfaction survey
Route::post('/client-satisfaction-survey', [ClientSatisfactionSurveyController::class, 'store'])
    ->name('client-satisfaction-survey.store');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Client Reviews (list/manage)
    Route::get('/client-reviews', [ClientSatisfactionSurveyController::class, 'index'])
        ->name('client-reviews');

    // Export Client Reviews (CSV/XLSX via Laravel Excel)
    // Accepts the same optional query params as index:
    // ?satisfaction_rating=&school_id=&transaction_type=&date_range=&start_date=&end_date=&search=
    Route::get('/client-reviews/export', [ClientSatisfactionSurveyController::class, 'export'])
        ->name('client-reviews.export');

    // Update / Delete a single review
    Route::patch('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'update'])
        ->whereNumber('clientSatisfactionSurvey')
        ->name('client-reviews.update');

    Route::delete('/client-reviews/{clientSatisfactionSurvey}', [ClientSatisfactionSurveyController::class, 'destroy'])
        ->whereNumber('clientSatisfactionSurvey')
        ->name('client-reviews.destroy');

    // School management
    Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
    Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');

    Route::patch('/schools/{school}', [SchoolController::class, 'update'])
        ->whereNumber('school')
        ->name('schools.update');

    Route::delete('/schools/{school}', [SchoolController::class, 'destroy'])
        ->whereNumber('school')
        ->name('schools.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
