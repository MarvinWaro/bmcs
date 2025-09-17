<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function index(): Response
    {
        // Fetch only active (not soft-deleted) schools
        $schools = School::query()
            ->oldest('created_at')  // This orders oldest first (ascending)
            ->get(['id', 'name']);

        return Inertia::render('schools/index', [
            'schools' => $schools,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        School::create($validated);

        // Redirect back to index so the new row appears
        return redirect()->back()
            ->with('success', 'School created.');
    }

    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        $school->update($validated);

        return redirect()->route('schools.index')
            ->with('success', 'School updated.');
    }

    public function destroy(School $school)
    {
        $school->delete(); // soft delete
        return redirect()->route('schools.index')
            ->with('success', 'School deleted.');
    }
}
