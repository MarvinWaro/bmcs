<?php

namespace App\Http\Controllers;

use App\Models\ClientSatisfactionSurvey;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ClientSatisfactionSurveyController extends Controller
{
    /**
     * Display a listing of client satisfaction surveys for admin review
     */
    public function index(Request $request): Response
    {
        $query = ClientSatisfactionSurvey::query()->with('school');

        // Filters
        if ($request->filled('satisfaction_rating')) {
            $query->bySatisfactionRating($request->satisfaction_rating);
        }

        if ($request->filled('school_id') && $request->school_id !== 'all') {
            $query->bySchoolId($request->school_id);
        }

        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $query->byTransactionType($request->transaction_type);
        }

        // Date range filtering - use app timezone for consistency
        if ($request->filled('date_range')) {
            $appTimezone = config('app.timezone');

            switch ($request->date_range) {
                case 'today':
                    $today = Carbon::now($appTimezone)->format('Y-m-d');
                    $query->where(function ($q) use ($today) {
                        $q->whereDate('transaction_date', $today)
                          ->orWhereDate('created_at', $today);
                    });
                    break;

                case 'this_week':
                    $start = Carbon::now($appTimezone)->startOfWeek()->format('Y-m-d');
                    $end   = Carbon::now($appTimezone)->endOfWeek()->format('Y-m-d');
                    $query->where(function ($q) use ($start, $end) {
                        $q->whereBetween('transaction_date', [$start, $end])
                          ->orWhereBetween('created_at', [$start, $end]);
                    });
                    break;

                case 'this_month':
                    $month = Carbon::now($appTimezone)->month;
                    $year  = Carbon::now($appTimezone)->year;
                    $query->where(function ($q) use ($month, $year) {
                        $q->where(function ($sub) use ($month, $year) {
                            $sub->whereMonth('transaction_date', $month)
                                ->whereYear('transaction_date', $year);
                        })->orWhere(function ($sub) use ($month, $year) {
                            $sub->whereMonth('created_at', $month)
                                ->whereYear('created_at', $year);
                        });
                    });
                    break;

                case 'this_year':
                    $year = Carbon::now($appTimezone)->year;
                    $query->where(function ($q) use ($year) {
                        $q->whereYear('transaction_date', $year)
                          ->orWhereYear('created_at', $year);
                    });
                    break;

                case 'last_30_days':
                    $from = Carbon::now($appTimezone)->subDays(30)->format('Y-m-d');
                    $query->where(function ($q) use ($from) {
                        $q->where('transaction_date', '>=', $from)
                          ->orWhere('created_at', '>=', $from);
                    });
                    break;
            }
        }

        // Custom date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        // Search: name/email/reason/other_school_specify + school name
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->byClientName($term)
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('reason', 'like', "%{$term}%")
                  ->orWhere('other_school_specify', 'like', "%{$term}%")
                  ->orWhereHas('school', function ($sq) use ($term) {
                      $sq->where('name', 'like', "%{$term}%");
                  });
            });
        }

        // Pagination page size
        $perPage = (int) $request->get('per_page', 10);
        $validPerPage = [5, 10, 15, 20, 25, 50];
        if (!in_array($perPage, $validPerPage)) {
            $perPage = 10;
        }

        // Fetch + transform
        $surveys = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $reviews = $surveys->getCollection()->map(function (ClientSatisfactionSurvey $survey) {
            return [
                'id' => $survey->id,
                'clientName' => $survey->full_name,
                'firstName' => $survey->first_name,
                'middleName' => $survey->middle_name,
                'lastName' => $survey->last_name,
                'displayName' => $survey->display_name,
                'formalName' => $survey->formal_name,
                'email' => $survey->email,
                'rating' => $this->mapSatisfactionToStars($survey->satisfaction_rating),
                'comment' => $survey->reason,
                'date' => $survey->transaction_date?->format('Y-m-d'),
                'status' => $survey->status ?? 'submitted',
                'loanType' => $survey->full_transaction_type,
                'schoolHei' => $survey->full_school_name,   // kept key for UI compatibility
                'satisfactionRating' => $survey->satisfaction_rating,
                'transactionType' => $survey->transaction_type,
                'otherTransactionSpecify' => $survey->other_transaction_specify,
                'otherSchoolSpecify' => $survey->other_school_specify,
                'submittedAt' => $survey->created_at?->setTimezone(config('app.timezone'))?->format('Y-m-d H:i:s'),
                // 'adminNotes' removed (no column)
            ];
        });

        $surveys->setCollection($reviews);

        // Stats
        $allSurveys = ClientSatisfactionSurvey::query()->get();
        $filteredQuery = ClientSatisfactionSurvey::query();

        if ($request->filled('satisfaction_rating')) {
            $filteredQuery->bySatisfactionRating($request->satisfaction_rating);
        }
        if ($request->filled('school_id') && $request->school_id !== 'all') {
            $filteredQuery->bySchoolId($request->school_id);
        }
        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $filteredQuery->byTransactionType($request->transaction_type);
        }
        if ($request->filled('date_range')) {
            $appTimezone = config('app.timezone');
            switch ($request->date_range) {
                case 'today':
                    $today = Carbon::now($appTimezone)->format('Y-m-d');
                    $filteredQuery->where(function ($q) use ($today) {
                        $q->whereDate('transaction_date', $today)
                          ->orWhereDate('created_at', $today);
                    });
                    break;
                case 'this_week':
                    $start = Carbon::now($appTimezone)->startOfWeek()->format('Y-m-d');
                    $end   = Carbon::now($appTimezone)->endOfWeek()->format('Y-m-d');
                    $filteredQuery->where(function ($q) use ($start, $end) {
                        $q->whereBetween('transaction_date', [$start, $end])
                          ->orWhereBetween('created_at', [$start, $end]);
                    });
                    break;
                case 'this_month':
                    $month = Carbon::now($appTimezone)->month;
                    $year  = Carbon::now($appTimezone)->year;
                    $filteredQuery->where(function ($q) use ($month, $year) {
                        $q->where(function ($sub) use ($month, $year) {
                            $sub->whereMonth('transaction_date', $month)
                                ->whereYear('transaction_date', $year);
                        })->orWhere(function ($sub) use ($month, $year) {
                            $sub->whereMonth('created_at', $month)
                                ->whereYear('created_at', $year);
                        });
                    });
                    break;
                case 'this_year':
                    $year = Carbon::now($appTimezone)->year;
                    $filteredQuery->where(function ($q) use ($year) {
                        $q->whereYear('transaction_date', $year)
                          ->orWhereYear('created_at', $year);
                    });
                    break;
                case 'last_30_days':
                    $from = Carbon::now($appTimezone)->subDays(30)->format('Y-m-d');
                    $filteredQuery->where(function ($q) use ($from) {
                        $q->where('transaction_date', '>=', $from)
                          ->orWhere('created_at', '>=', $from);
                    });
                    break;
            }
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $filteredQuery->byDateRange($request->start_date, $request->end_date);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $filteredQuery->where(function ($q) use ($term) {
                $q->byClientName($term)
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('reason', 'like', "%{$term}%")
                  ->orWhere('other_school_specify', 'like', "%{$term}%")
                  ->orWhereHas('school', function ($sq) use ($term) {
                      $sq->where('name', 'like', "%{$term}%");
                  });
            });
        }

        $filteredSurveys = $filteredQuery->get();

        $stats = [
            'total' => $allSurveys->count(),
            'satisfied' => $allSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'dissatisfied' => $allSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            'filtered_total' => $filteredSurveys->count(),
            'filtered_satisfied' => $filteredSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'filtered_dissatisfied' => $filteredSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            'today' => $allSurveys->filter(fn ($s) => $s->created_at?->setTimezone(config('app.timezone'))?->isToday())->count(),
            'this_month' => $allSurveys->filter(fn ($s) => $s->created_at?->setTimezone(config('app.timezone'))?->isCurrentMonth())->count(),
        ];

        // Filters data for UI
        $schools = School::orderBy('name')->get(['id', 'name']);
        $transactionTypes = [
            ['value' => 'enrollment', 'label' => 'Enrollment'],
            ['value' => 'payment', 'label' => 'Payment'],
            ['value' => 'transcript', 'label' => 'Transcript Request'],
            ['value' => 'certification', 'label' => 'Certification'],
            ['value' => 'scholarship', 'label' => 'Scholarship Application'],
            ['value' => 'consultation', 'label' => 'Consultation'],
            ['value' => 'other', 'label' => 'Other'],
        ];

        return Inertia::render('reviews/index', [
            'reviews' => $surveys,
            'schools' => $schools,
            'transactionTypes' => $transactionTypes,
            'stats' => $stats,
            'filters' => [
                'satisfaction_rating' => $request->satisfaction_rating,
                'school_id' => $request->school_id,
                'transaction_type' => $request->transaction_type,
                'date_range' => $request->date_range,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'search' => $request->search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(
            [
                'transaction_date' => 'required|date|before_or_equal:today',
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255',

                // Either school_id (FK) OR other_school_specify must be present
                'school_id' => [
                    'nullable',
                    'integer',
                    Rule::exists('schools', 'id'),
                    'required_without:other_school_specify',
                ],
                'other_school_specify' => [
                    'nullable',
                    'string',
                    'max:255',
                    'required_without:school_id',
                ],

                'transaction_type' => ['required', 'string', Rule::in([
                    'enrollment', 'payment', 'transcript', 'certification', 'scholarship', 'consultation', 'other',
                ])],
                'other_transaction_specify' => [
                    'nullable', 'string', 'max:255',
                    Rule::requiredIf($request->transaction_type === 'other'),
                ],
                'satisfaction_rating' => ['required', 'string', Rule::in(['dissatisfied', 'satisfied'])],
                'reason' => 'required|string|min:10|max:2000',
            ],
            [
                'transaction_date.required' => 'The transaction date is required.',
                'transaction_date.date' => 'Please enter a valid date.',
                'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',

                'first_name.required' => 'Your first name is required.',
                'first_name.max' => 'Your first name cannot exceed 255 characters.',
                'middle_name.max' => 'Your middle name cannot exceed 255 characters.',
                'last_name.required' => 'Your last name is required.',
                'last_name.max' => 'Your last name cannot exceed 255 characters.',
                'email.required' => 'Your email address is required.',
                'email.email' => 'Please enter a valid email address.',
                'email.max' => 'Your email address cannot exceed 255 characters.',

                'school_id.required_without' => 'Please select a school or specify "Other".',
                'school_id.exists' => 'Please select a valid school.',
                'other_school_specify.required_without' => 'Please specify your school/institution when not selecting a listed school.',
                'other_school_specify.max' => 'School specification cannot exceed 255 characters.',

                'transaction_type.required' => 'Please select a transaction type.',
                'transaction_type.in' => 'Please select a valid transaction type.',
                'other_transaction_specify.required' => 'Please specify the type of transaction when selecting "Other".',
                'other_transaction_specify.max' => 'Transaction specification cannot exceed 255 characters.',

                'satisfaction_rating.required' => 'Please select your satisfaction rating.',
                'satisfaction_rating.in' => 'Please select a valid satisfaction rating.',
                'reason.required' => 'Please provide your feedback.',
                'reason.min' => 'Your feedback must be at least 10 characters long.',
                'reason.max' => 'Your feedback cannot exceed 2000 characters.',
            ]
        );

        try {
            // Normalize date to Y-m-d without timezone shift
            if (!empty($validated['transaction_date'])) {
                $date = Carbon::createFromFormat('Y-m-d', $validated['transaction_date'], config('app.timezone'));
                $validated['transaction_date'] = $date->format('Y-m-d');
            }

            // If using a listed school, clear "other"
            if (!empty($validated['school_id'])) {
                $validated['other_school_specify'] = null;
            }

            // If transaction_type not 'other', clear the extra field
            if (($validated['transaction_type'] ?? null) !== 'other') {
                $validated['other_transaction_specify'] = null;
            }

            // Default status
            $validated['status'] = 'submitted';

            ClientSatisfactionSurvey::create($validated);

            return redirect()->back()->with('success', 'Thank you for your feedback! Your response has been recorded.');
        } catch (\Exception $e) {
            \Log::error('Error saving client satisfaction survey: ' . $e->getMessage(), [
                'data' => $validated,
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->withErrors(['general' => 'There was an error processing your submission. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Update a survey status (for admin actions)
     */
    public function update(Request $request, ClientSatisfactionSurvey $clientSatisfactionSurvey): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:submitted,reviewed,resolved',
            // 'admin_notes' removed (no column)
        ]);

        try {
            $clientSatisfactionSurvey->update($validated);
            return redirect()->back()->with('success', 'Survey updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Error updating survey: ' . $e->getMessage());
            return redirect()->back()->withErrors(['general' => 'Failed to update survey.']);
        }
    }

    /**
     * Delete a survey (admin only)
     */
    public function destroy(ClientSatisfactionSurvey $clientSatisfactionSurvey): RedirectResponse
    {
        try {
            $clientSatisfactionSurvey->delete();
            return redirect()->back()->with('success', 'Survey deleted successfully.');
        } catch (\Exception $e) {
            \Log::error('Error deleting survey: ' . $e->getMessage());
            return redirect()->back()->withErrors(['general' => 'Failed to delete survey.']);
        }
    }

    /**
     * Map satisfaction rating to star rating (1-5)
     */
    private function mapSatisfactionToStars(string $satisfaction): int
    {
        return match ($satisfaction) {
            'dissatisfied' => 2,
            'satisfied' => 5,
            default => 3,
        };
    }

    /**
     * If you still need these for external use
     */
    public static function getValidationRules(): array
    {
        return [
            'transaction_date' => 'required|date|before_or_equal:today',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'school_id' => ['nullable', 'integer', Rule::exists('schools', 'id'), 'required_without:other_school_specify'],
            'other_school_specify' => ['nullable', 'string', 'max:255', 'required_without:school_id'],
            'transaction_type' => ['required', 'string', Rule::in(['enrollment','payment','transcript','certification','scholarship','consultation','other'])],
            'other_transaction_specify' => ['nullable','string','max:255', Rule::requiredIf(request('transaction_type') === 'other')],
            'satisfaction_rating' => ['required','string', Rule::in(['dissatisfied','satisfied'])],
            'reason' => 'required|string|min:10|max:2000',
        ];
    }

    public static function getValidationMessages(): array
    {
        return [
            'transaction_date.required' => 'The transaction date is required.',
            'transaction_date.date' => 'Please enter a valid date.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
            'first_name.required' => 'Your first name is required.',
            'first_name.max' => 'Your first name cannot exceed 255 characters.',
            'middle_name.max' => 'Your middle name cannot exceed 255 characters.',
            'last_name.required' => 'Your last name is required.',
            'last_name.max' => 'Your last name cannot exceed 255 characters.',
            'email.required' => 'Your email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Your email address cannot exceed 255 characters.',
            'school_id.required_without' => 'Please select a school or specify "Other".',
            'school_id.exists' => 'Please select a valid school.',
            'other_school_specify.required_without' => 'Please specify your school/institution when not selecting a listed school.',
            'other_school_specify.max' => 'School specification cannot exceed 255 characters.',
            'transaction_type.required' => 'Please select a transaction type.',
            'transaction_type.in' => 'Please select a valid transaction type.',
            'other_transaction_specify.required' => 'Please specify the type of transaction when selecting "Other".',
            'other_transaction_specify.max' => 'Transaction specification cannot exceed 255 characters.',
            'satisfaction_rating.required' => 'Please select your satisfaction rating.',
            'satisfaction_rating.in' => 'Please select a valid satisfaction rating.',
            'reason.required' => 'Please provide your feedback.',
            'reason.min' => 'Your feedback must be at least 10 characters long.',
            'reason.max' => 'Your feedback cannot exceed 2000 characters.',
        ];
    }
}
