<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    /**
     * Show active schools (not soft-deleted).
     */
    public function index(Request $request): Response
    {
        // Optional: simple search by name (?search=foo)
        $search = $request->get('search');

        $schools = School::query()
            ->when($search, fn ($q) =>
                $q->where('name', 'like', '%' . trim($search) . '%')
            )
            ->orderBy('name') // alphabetic listing is usually nicer
            ->get(['id', 'name']);

        return Inertia::render('schools/index', [
            'schools' => $schools,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Create a school.
     */
    public function store(Request $request)
    {
        $validated = $request->validate(
            [
                'name' => [
                    'required',
                    'string',
                    'min:3',
                    'max:255',
                    // Unique among non-deleted rows
                    Rule::unique('schools', 'name')->whereNull('deleted_at'),
                ],
            ],
            [
                'name.required' => 'School name is required.',
                'name.min'      => 'School name must be at least :min characters.',
                'name.max'      => 'School name may not be greater than :max characters.',
                'name.unique'   => 'That school already exists.',
            ]
        );

        $validated['name'] = trim($validated['name']);

        School::create($validated);

        return redirect()
            ->back()
            ->with('success', 'School created.');
    }

    /**
     * Update a school.
     */
    public function update(Request $request, School $school)
    {
        $validated = $request->validate(
            [
                'name' => [
                    'required',
                    'string',
                    'min:3',
                    'max:255',
                    // Ignore current row; still enforce uniqueness among non-deleted rows
                    Rule::unique('schools', 'name')
                        ->ignore($school->id)
                        ->whereNull('deleted_at'),
                ],
            ],
            [
                'name.required' => 'School name is required.',
                'name.min'      => 'School name must be at least :min characters.',
                'name.max'      => 'School name may not be greater than :max characters.',
                'name.unique'   => 'That school already exists.',
            ]
        );

        $validated['name'] = trim($validated['name']);

        $school->update($validated);

        return redirect()
            ->route('schools.index')
            ->with('success', 'School updated.');
    }

    /**
     * Soft delete a school.
     * FK on surveys is nullOnDelete(), so this won’t break existing survey rows.
     */
    public function destroy(School $school)
    {
        $school->delete();

        return redirect()
            ->route('schools.index')
            ->with('success', 'School deleted.');
    }
}
