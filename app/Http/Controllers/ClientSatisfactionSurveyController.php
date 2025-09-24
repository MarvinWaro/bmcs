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

use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ClientSatisfactionSurveysExport;


class ClientSatisfactionSurveyController extends Controller
{
    /**
     * Display a listing of client satisfaction surveys for admin review
     */
    public function index(Request $request): Response
    {
        // Base query + eager load
        $query = ClientSatisfactionSurvey::query()->with('school');

        /**
         * -------- Filters (MAIN LIST) ----------
         */

        // Satisfaction
        if ($request->filled('satisfaction_rating') && $request->satisfaction_rating !== 'all') {
            $query->where('satisfaction_rating', $request->satisfaction_rating);
        }

        // School: accepts numeric id OR "other" OR "all"
        if ($request->filled('school_id') && $request->school_id !== 'all') {
            if ($request->school_id === 'other') {
                $query->whereNull('school_id')->whereNotNull('other_school_specify');
            } else {
                $query->where('school_id', $request->school_id);
            }
        }

        // Transaction type
        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $query->where('transaction_type', $request->transaction_type);
        }

        // Date range (match Dashboard: **transaction_date only**)
        if ($request->filled('date_range') && $request->date_range !== 'all') {
            $tz = config('app.timezone');

            switch ($request->date_range) {
                case 'today': {
                    $today = Carbon::now($tz)->toDateString();
                    $query->whereDate('transaction_date', $today);
                    break;
                }

                case 'this_week': {
                    $start = Carbon::now($tz)->startOfWeek()->toDateString();
                    $end   = Carbon::now($tz)->endOfWeek()->toDateString();
                    $query->whereBetween('transaction_date', [$start, $end]);
                    break;
                }

                case 'this_month': {
                    $month = Carbon::now($tz)->month;
                    $year  = Carbon::now($tz)->year;
                    $query->whereMonth('transaction_date', $month)
                        ->whereYear('transaction_date', $year);
                    break;
                }

                case 'this_year': {
                    $year = Carbon::now($tz)->year;
                    $query->whereYear('transaction_date', $year);
                    break;
                }

                case 'last_30_days': {
                    $from = Carbon::now($tz)->subDays(30)->toDateString();
                    $query->where('transaction_date', '>=', $from);
                    break;
                }
            }
        }

        // Custom date range (match Dashboard: **transaction_date only**)
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        // Search
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where(function ($nq) use ($term) {
                    $nq->where('first_name',  'like', "%{$term}%")
                    ->orWhere('middle_name','like', "%{$term}%")
                    ->orWhere('last_name',  'like', "%{$term}%");
                })
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('reason','like', "%{$term}%")
                ->orWhere('other_school_specify', 'like', "%{$term}%")
                ->orWhereHas('school', function ($sq) use ($term) {
                    $sq->where('name', 'like', "%{$term}%");
                });
            });
        }

        /**
         * -------- Pagination ----------
         */
        $perPage = (int) $request->get('per_page', 10);
        $allowed = [5, 10, 15, 20, 25, 50];
        if (!in_array($perPage, $allowed, true)) $perPage = 10;

        // (You can switch to orderBy('transaction_date','desc') if you prefer)
        $surveys = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Transform rows for the table UI
        $reviews = $surveys->getCollection()->map(function (ClientSatisfactionSurvey $survey) {
            return [
                'id'                     => $survey->id,
                'clientName'             => $survey->full_name,
                'firstName'              => $survey->first_name,
                'middleName'             => $survey->middle_name,
                'lastName'               => $survey->last_name,
                'displayName'            => $survey->display_name,
                'formalName'             => $survey->formal_name,
                'email'                  => $survey->email,
                'rating'                 => $this->mapSatisfactionToStars($survey->satisfaction_rating),
                'comment'                => $survey->reason,
                'date'                   => optional($survey->transaction_date)->format('Y-m-d'),
                'status'                 => $survey->status ?? 'submitted',
                'loanType'               => $survey->full_transaction_type,
                'schoolHei'              => $survey->full_school_name,
                'satisfactionRating'     => $survey->satisfaction_rating,
                'transactionType'        => $survey->transaction_type,
                'otherTransactionSpecify'=> $survey->other_transaction_specify,
                'otherSchoolSpecify'     => $survey->other_school_specify,
                'submittedAt'            => optional($survey->created_at)->setTimezone(config('app.timezone'))?->format('Y-m-d H:i:s'),
            ];
        });
        $surveys->setCollection($reviews);

        /**
         * -------- Stats (MIRROR SAME FILTERS) ----------
         */
        $allSurveys = ClientSatisfactionSurvey::query()->get();
        $filtered = ClientSatisfactionSurvey::query();

        if ($request->filled('satisfaction_rating') && $request->satisfaction_rating !== 'all') {
            $filtered->where('satisfaction_rating', $request->satisfaction_rating);
        }
        if ($request->filled('school_id') && $request->school_id !== 'all') {
            if ($request->school_id === 'other') {
                $filtered->whereNull('school_id')->whereNotNull('other_school_specify');
            } else {
                $filtered->where('school_id', $request->school_id);
            }
        }
        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $filtered->where('transaction_type', $request->transaction_type);
        }

        // Date range for stats (transaction_date only)
        if ($request->filled('date_range') && $request->date_range !== 'all') {
            $tz = config('app.timezone');
            switch ($request->date_range) {
                case 'today': {
                    $today = Carbon::now($tz)->toDateString();
                    $filtered->whereDate('transaction_date', $today);
                    break;
                }
                case 'this_week': {
                    $start = Carbon::now($tz)->startOfWeek()->toDateString();
                    $end   = Carbon::now($tz)->endOfWeek()->toDateString();
                    $filtered->whereBetween('transaction_date', [$start, $end]);
                    break;
                }
                case 'this_month': {
                    $month = Carbon::now($tz)->month;
                    $year  = Carbon::now($tz)->year;
                    $filtered->whereMonth('transaction_date', $month)
                            ->whereYear('transaction_date', $year);
                    break;
                }
                case 'this_year': {
                    $year = Carbon::now($tz)->year;
                    $filtered->whereYear('transaction_date', $year);
                    break;
                }
                case 'last_30_days': {
                    $from = Carbon::now($tz)->subDays(30)->toDateString();
                    $filtered->where('transaction_date', '>=', $from);
                    break;
                }
            }
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $filtered->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $filtered->where(function ($q) use ($term) {
                $q->where(function ($nq) use ($term) {
                    $nq->where('first_name',  'like', "%{$term}%")
                    ->orWhere('middle_name','like', "%{$term}%")
                    ->orWhere('last_name',  'like', "%{$term}%");
                })
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('reason','like', "%{$term}%")
                ->orWhere('other_school_specify', 'like', "%{$term}%")
                ->orWhereHas('school', function ($sq) use ($term) {
                    $sq->where('name', 'like', "%{$term}%");
                });
            });
        }

        $filteredSurveys = $filtered->get();

        $stats = [
            'total'                  => $allSurveys->count(),
            'satisfied'              => $allSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'dissatisfied'           => $allSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            'filtered_total'         => $filteredSurveys->count(),
            'filtered_satisfied'     => $filteredSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'filtered_dissatisfied'  => $filteredSurveys->where('satisfaction_rating', 'dissatisfied')->count(),

            // Use transaction_date for these so they align with the page filters.
            // If you prefer "submitted" counts, switch transaction_date -> created_at here only.
            'today'                  => $allSurveys->filter(fn ($s) =>
                optional($s->transaction_date)?->isToday()
            )->count(),
            'this_month'             => $allSurveys->filter(fn ($s) =>
                optional($s->transaction_date)?->isCurrentMonth()
            )->count(),
        ];

        /**
         * -------- Reference data ----------
         */
        $schools = School::orderBy('name')->get(['id', 'name']);
        $transactionTypes = [
            ['value' => 'enrollment',   'label' => 'Enrollment'],
            ['value' => 'payment',      'label' => 'Payment'],
            ['value' => 'transcript',   'label' => 'Transcript Request'],
            ['value' => 'certification','label' => 'Certification'],
            ['value' => 'scholarship',  'label' => 'Scholarship Application'],
            ['value' => 'consultation', 'label' => 'Consultation'],
            ['value' => 'other',        'label' => 'Other'],
        ];

        return Inertia::render('reviews/index', [
            'reviews'          => $surveys,
            'schools'          => $schools,
            'transactionTypes' => $transactionTypes,
            'stats'            => $stats,
            'filters'          => [
                'satisfaction_rating' => $request->satisfaction_rating,
                'school_id'           => $request->school_id,
                'transaction_type'    => $request->transaction_type,
                'date_range'          => $request->date_range,
                'start_date'          => $request->start_date,
                'end_date'            => $request->end_date,
                'search'              => $request->search,
                'per_page'            => $perPage,
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

    public function export(Request $request)
    {
        // Pass all current filters so the export matches what the admin is seeing
        $filters = $request->only([
            'satisfaction_rating',
            'school_id',           // numeric id or "other" or "all"
            'transaction_type',
            'date_range',
            'start_date',
            'end_date',
            'search',
        ]);

        $stamp = now()->format('Ymd_His');
        $filename = "client_surveys_{$stamp}.xlsx";

        return Excel::download(new ClientSatisfactionSurveysExport($filters), $filename);
    }

}
