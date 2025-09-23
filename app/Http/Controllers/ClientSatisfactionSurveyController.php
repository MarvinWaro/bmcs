<?php

namespace App\Http\Controllers;

use App\Models\ClientSatisfactionSurvey;
use App\Models\School;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

// PhpSpreadsheet
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Csv;

class ClientSatisfactionSurveyController extends Controller
{
    /**
     * Display a listing of client satisfaction surveys for admin review
     */
    public function index(Request $request): Response
    {
        // Build the query with filters
        $query = ClientSatisfactionSurvey::query();

        // Apply filters based on request parameters
        if ($request->filled('satisfaction_rating') && $request->satisfaction_rating !== 'all') {
            $query->bySatisfactionRating($request->satisfaction_rating);
        }

        if ($request->filled('school_hei') && $request->school_hei !== 'all') {
            $query->bySchool($request->school_hei);
        }

        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $query->byTransactionType($request->transaction_type);
        }

        // Date range filtering - use app timezone for consistency
        if ($request->filled('date_range') && $request->date_range !== 'all') {
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
                    $startOfWeek = Carbon::now($appTimezone)->startOfWeek()->format('Y-m-d');
                    $endOfWeek   = Carbon::now($appTimezone)->endOfWeek()->format('Y-m-d');
                    $query->where(function ($q) use ($startOfWeek, $endOfWeek) {
                        $q->whereBetween('transaction_date', [$startOfWeek, $endOfWeek])
                            ->orWhereBetween('created_at', [$startOfWeek, $endOfWeek]);
                    });
                    break;
                case 'this_month':
                    $month = Carbon::now($appTimezone)->month;
                    $year  = Carbon::now($appTimezone)->year;
                    $query->where(function ($q) use ($month, $year) {
                        $q->where(function ($subQ) use ($month, $year) {
                            $subQ->whereMonth('transaction_date', $month)
                                ->whereYear('transaction_date', $year);
                        })->orWhere(function ($subQ) use ($month, $year) {
                            $subQ->whereMonth('created_at', $month)
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
                    $thirtyDaysAgo = Carbon::now($appTimezone)->subDays(30)->format('Y-m-d');
                    $query->where(function ($q) use ($thirtyDaysAgo) {
                        $q->where('transaction_date', '>=', $thirtyDaysAgo)
                            ->orWhere('created_at', '>=', $thirtyDaysAgo);
                    });
                    break;
            }
        }

        // Custom date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->byClientName($searchTerm)
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhere('reason', 'like', "%{$searchTerm}%")
                    ->orWhere('school_hei', 'like', "%{$searchTerm}%")
                    ->orWhere('other_school_specify', 'like', "%{$searchTerm}%");
            });
        }

        // Get per_page from request or default to 10
        $perPage = $request->get('per_page', 10);
        $validPerPageValues = [5, 10, 15, 20, 25, 50];
        if (!in_array($perPage, $validPerPageValues)) {
            $perPage = 10;
        }

        // Add pagination to the query
        $surveys = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString(); // preserve query parameters

        // Transform the data - ensure dates are displayed correctly
        $reviews = $surveys->getCollection()->map(function ($survey) {
            return [
                'id'                      => $survey->id,
                'clientName'              => $survey->full_name,
                'firstName'               => $survey->first_name,
                'middleName'              => $survey->middle_name,
                'lastName'                => $survey->last_name,
                'displayName'             => $survey->display_name,
                'formalName'              => $survey->formal_name,
                'email'                   => $survey->email,
                'rating'                  => $this->mapSatisfactionToStars($survey->satisfaction_rating),
                'comment'                 => $survey->reason,
                'date'                    => $survey->transaction_date->format('Y-m-d'),
                'status'                  => $survey->status ?? 'submitted',
                'loanType'                => $survey->full_transaction_type,
                'schoolHei'               => $survey->full_school_name,
                'satisfactionRating'      => $survey->satisfaction_rating,
                'transactionType'         => $survey->transaction_type,
                'otherTransactionSpecify' => $survey->other_transaction_specify,
                'otherSchoolSpecify'      => $survey->other_school_specify,
                'submittedAt'             => $survey->created_at->setTimezone(config('app.timezone'))->format('Y-m-d H:i:s'),
                'adminNotes'              => $survey->admin_notes,
            ];
        });

        // Update the collection with transformed data
        $surveys->setCollection($reviews);

        // Get statistics (for all surveys, not just paginated)
        $allSurveys = ClientSatisfactionSurvey::all();

        // Get filtered count for stats (without pagination)
        $filteredQuery = ClientSatisfactionSurvey::query();

        // Apply the same filters to get accurate filtered stats (with 'all' checks)
        if ($request->filled('satisfaction_rating') && $request->satisfaction_rating !== 'all') {
            $filteredQuery->bySatisfactionRating($request->satisfaction_rating);
        }
        if ($request->filled('school_hei') && $request->school_hei !== 'all') {
            $filteredQuery->bySchool($request->school_hei);
        }
        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $filteredQuery->byTransactionType($request->transaction_type);
        }
        if ($request->filled('date_range') && $request->date_range !== 'all') {
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
                    $startOfWeek = Carbon::now($appTimezone)->startOfWeek()->format('Y-m-d');
                    $endOfWeek   = Carbon::now($appTimezone)->endOfWeek()->format('Y-m-d');
                    $filteredQuery->where(function ($q) use ($startOfWeek, $endOfWeek) {
                        $q->whereBetween('transaction_date', [$startOfWeek, $endOfWeek])
                            ->orWhereBetween('created_at', [$startOfWeek, $endOfWeek]);
                    });
                    break;
                case 'this_month':
                    $month = Carbon::now($appTimezone)->month;
                    $year  = Carbon::now($appTimezone)->year;
                    $filteredQuery->where(function ($q) use ($month, $year) {
                        $q->where(function ($subQ) use ($month, $year) {
                            $subQ->whereMonth('transaction_date', $month)
                                ->whereYear('transaction_date', $year);
                        })->orWhere(function ($subQ) use ($month, $year) {
                            $subQ->whereMonth('created_at', $month)
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
                    $thirtyDaysAgo = Carbon::now($appTimezone)->subDays(30)->format('Y-m-d');
                    $filteredQuery->where(function ($q) use ($thirtyDaysAgo) {
                        $q->where('transaction_date', '>=', $thirtyDaysAgo)
                            ->orWhere('created_at', '>=', $thirtyDaysAgo);
                    });
                    break;
            }
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $filteredQuery->byDateRange($request->start_date, $request->end_date);
        }
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $filteredQuery->where(function ($q) use ($searchTerm) {
                $q->byClientName($searchTerm)
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhere('reason', 'like', "%{$searchTerm}%")
                    ->orWhere('school_hei', 'like', "%{$searchTerm}%")
                    ->orWhere('other_school_specify', 'like', "%{$searchTerm}%");
            });
        }

        $filteredSurveys = $filteredQuery->get();

        $stats = [
            'total'                 => $allSurveys->count(),
            'satisfied'             => $allSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'dissatisfied'          => $allSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            'filtered_total'        => $filteredSurveys->count(),
            'filtered_satisfied'    => $filteredSurveys->where('satisfaction_rating', 'satisfied')->count(),
            'filtered_dissatisfied' => $filteredSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            'today'                 => $allSurveys->filter(function ($survey) {
                return $survey->created_at->setTimezone(config('app.timezone'))->isToday();
            })->count(),
            'this_month'            => $allSurveys->filter(function ($survey) {
                return $survey->created_at->setTimezone(config('app.timezone'))->isCurrentMonth();
            })->count(),
        ];

        // Get schools for filter dropdown
        $schools = School::orderBy('name')->get(['id', 'name']);

        // Get unique transaction types from surveys
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
            'reviews'          => $surveys, // contains pagination meta data
            'schools'          => $schools,
            'transactionTypes' => $transactionTypes,
            'stats'            => $stats,
            'filters'          => [
                'satisfaction_rating' => $request->satisfaction_rating,
                'school_hei'          => $request->school_hei,
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
        $validated = $request->validate([
            'transaction_date' => 'required|date|before_or_equal:today',
            'first_name'       => 'required|string|max:255',
            'middle_name'      => 'nullable|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'required|email|max:255',
            'school_hei'       => ['required', 'string', Rule::in(array_merge(
                School::pluck('id')->toArray(),
                ['other']
            ))],
            'other_school_specify' => [
                'nullable', 'string', 'max:255',
                Rule::requiredIf($request->school_hei === 'other'),
            ],
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment', 'payment', 'transcript', 'certification',
                'scholarship', 'consultation', 'other',
            ])],
            'other_transaction_specify' => [
                'nullable', 'string', 'max:255',
                Rule::requiredIf($request->transaction_type === 'other'),
            ],
            'satisfaction_rating' => ['required', 'string', Rule::in(['dissatisfied', 'satisfied'])],
            'reason'              => 'required|string|min:10|max:2000',
        ], [
            'transaction_date.required'    => 'The transaction date is required.',
            'transaction_date.date'        => 'Please enter a valid date.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
            'first_name.required'          => 'Your first name is required.',
            'first_name.max'               => 'Your first name cannot exceed 255 characters.',
            'middle_name.max'              => 'Your middle name cannot exceed 255 characters.',
            'last_name.required'           => 'Your last name is required.',
            'last_name.max'                => 'Your last name cannot exceed 255 characters.',
            'email.required'               => 'Your email address is required.',
            'email.email'                  => 'Please enter a valid email address.',
            'email.max'                    => 'Your email address cannot exceed 255 characters.',
            'school_hei.required'          => 'School/HEI is required.',
            'school_hei.in'                => 'Please select a valid school or "Other".',
            'other_school_specify.required'=> 'Please specify your school/institution when selecting "Other".',
            'other_school_specify.max'     => 'School specification cannot exceed 255 characters.',
            'transaction_type.required'    => 'Please select a transaction type.',
            'transaction_type.in'          => 'Please select a valid transaction type.',
            'other_transaction_specify.required' => 'Please specify the type of transaction when selecting "Other".',
            'other_transaction_specify.max'=> 'Transaction specification cannot exceed 255 characters.',
            'satisfaction_rating.required' => 'Please select your satisfaction rating.',
            'satisfaction_rating.in'       => 'Please select a valid satisfaction rating.',
            'reason.required'              => 'Please provide your feedback.',
            'reason.min'                   => 'Your feedback must be at least 10 characters long.',
            'reason.max'                   => 'Your feedback cannot exceed 2000 characters.',
        ]);

        try {
            // Normalize date
            if (!empty($validated['transaction_date'])) {
                $date = Carbon::createFromFormat('Y-m-d', $validated['transaction_date'], config('app.timezone'));
                $validated['transaction_date'] = $date->format('Y-m-d');
            }

            // Convert school ID to name (unless "other")
            if ($validated['school_hei'] !== 'other') {
                $school = School::find($validated['school_hei']);
                if ($school) {
                    $validated['school_hei'] = $school->name;
                }
                $validated['other_school_specify'] = null;
            }

            // Default status
            $validated['status'] = 'submitted';

            if ($validated['transaction_type'] !== 'other') {
                $validated['other_transaction_specify'] = null;
            }

            ClientSatisfactionSurvey::create($validated);

            return redirect()->back()->with('success', 'Thank you for your feedback! Your response has been recorded.');
        } catch (\Exception $e) {
            \Log::error('Error saving client satisfaction survey: ' . $e->getMessage(), [
                'data' => $validated,
                'exception' => $e,
            ]);

            return redirect()->back()
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
            'status'      => 'required|string|in:submitted,reviewed,resolved',
            'admin_notes' => 'nullable|string|max:1000',
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
            'satisfied'    => 5,
            default        => 3,
        };
    }

    /**
     * Export filtered client reviews as XLSX or CSV
     */
    public function exportXlsx(Request $request)
    {
        // Check if CSV format is requested
        $format = $request->get('format', 'xlsx');

        // Build filtered data (no pagination)
        $query = ClientSatisfactionSurvey::query();
        $this->applyFilters($query, $request);
        $rows = $query->orderBy('created_at', 'desc')->get();

        // Debug: Log the count of rows
        \Log::info('Export: Found ' . $rows->count() . ' rows to export');

        $tz = config('app.timezone');

        if ($format === 'csv') {
            // CSV Export
            $filename = 'client-reviews-' . now()->timezone($tz)->format('Ymd-His') . '.csv';

            return response()->streamDownload(function () use ($rows) {
                $output = fopen('php://output', 'w');

                // Headers
                fputcsv($output, [
                    'DATE',
                    'FIRST NAME',
                    'MIDDLE NAME',
                    'LAST NAME',
                    'EMAIL',
                    'SCHOOL / HEI\'S',
                    'TYPE OF TRANSACTION',
                    'SATISFACTION RATING',
                    'REASON/COMMENTS'
                ]);

                // Data rows
                foreach ($rows as $survey) {
                    fputcsv($output, [
                        $survey->transaction_date ? $survey->transaction_date->format('n/j/Y') : '',
                        $survey->first_name ?? '',
                        $survey->middle_name ?? '',
                        $survey->last_name ?? '',
                        $survey->email ?? '',
                        $survey->full_school_name,
                        $survey->full_transaction_type,
                        ucfirst($survey->satisfaction_rating ?? ''),
                        $survey->reason ?? ''
                    ]);
                }

                fclose($output);
            }, $filename, [
                'Content-Type' => 'text/csv',
            ]);
        }

        // XLSX Export
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Client Reviews');

        // Merge header cells
        $sheet->mergeCells('B2:B3');
        $sheet->mergeCells('C2:F2');
        $sheet->mergeCells('G2:G3');
        $sheet->mergeCells('H2:H3');
        $sheet->mergeCells('I2:I3');
        $sheet->mergeCells('J2:J3');

        // Top headers
        $sheet->setCellValue('B2', 'DATE');
        $sheet->setCellValue('C2', 'CLIENT INFO');
        $sheet->setCellValue('G2', "SCHOOL / HEI'S");
        $sheet->setCellValue('H2', 'TYPE OF TRANSACTION');
        $sheet->setCellValue('I2', 'SATISFACTION RATING');
        $sheet->setCellValue('J2', 'REASON/COMMENTS');

        // Sub headers (row 3)
        $sheet->setCellValue('C3', 'FIRST NAME');
        $sheet->setCellValue('D3', 'MIDDLE NAME');
        $sheet->setCellValue('E3', 'LAST NAME');
        $sheet->setCellValue('F3', 'EMAIL');

        // Styling for headers
        $headerFill = [
            'fillType'   => Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'F3F4F6'],
        ];
        $thinBorder = [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color'       => ['rgb' => 'D1D5DB'],
            ],
        ];

        // Style headers
        $sheet->getStyle('B2:J2')->applyFromArray([
            'font'      => ['bold' => true],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill'    => $headerFill,
            'borders' => $thinBorder,
        ]);

        $sheet->getStyle('B3:J3')->applyFromArray([
            'font'      => ['bold' => true],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill'    => $headerFill,
            'borders' => $thinBorder,
        ]);

        // Row heights
        $sheet->getRowDimension(2)->setRowHeight(24);
        $sheet->getRowDimension(3)->setRowHeight(22);

        // Column widths
        $sheet->getColumnDimension('B')->setWidth(14); // DATE
        $sheet->getColumnDimension('C')->setWidth(18); // FIRST
        $sheet->getColumnDimension('D')->setWidth(18); // MIDDLE
        $sheet->getColumnDimension('E')->setWidth(18); // LAST
        $sheet->getColumnDimension('F')->setWidth(30); // EMAIL
        $sheet->getColumnDimension('G')->setWidth(36); // SCHOOL
        $sheet->getColumnDimension('H')->setWidth(24); // TYPE
        $sheet->getColumnDimension('I')->setWidth(20); // SATISFACTION
        $sheet->getColumnDimension('J')->setWidth(60); // COMMENTS

        // Freeze panes below the header group
        $sheet->freezePane('B4');

        // Write data starting row 4
        $rowIdx = 4;
        foreach ($rows as $survey) {
            // Format date - transaction_date is already a Carbon instance due to model casting
            $date = $survey->transaction_date ? $survey->transaction_date->format('n/j/Y') : '';

            $first         = $survey->first_name ?? '';
            $middle        = $survey->middle_name ?? '';
            $last          = $survey->last_name ?? '';
            $email         = $survey->email ?? '';
            $schoolName    = $survey->full_school_name;
            $typeReadable  = $survey->full_transaction_type;
            $satisfaction  = ucfirst($survey->satisfaction_rating ?? '');
            $comment       = $survey->reason ?? '';

            // Set cell values
            $sheet->setCellValue("B{$rowIdx}", $date);
            $sheet->setCellValue("C{$rowIdx}", $first);
            $sheet->setCellValue("D{$rowIdx}", $middle);
            $sheet->setCellValue("E{$rowIdx}", $last);
            $sheet->setCellValue("F{$rowIdx}", $email);
            $sheet->setCellValue("G{$rowIdx}", $schoolName);
            $sheet->setCellValue("H{$rowIdx}", $typeReadable);
            $sheet->setCellValue("I{$rowIdx}", $satisfaction);
            $sheet->setCellValue("J{$rowIdx}", $comment);

            // Make email a hyperlink if present
            if (!empty($email)) {
                $sheet->getCell("F{$rowIdx}")
                    ->getHyperlink()
                    ->setUrl("mailto:{$email}");
                $sheet->getStyle("F{$rowIdx}")->getFont()->getColor()->setARGB('0563C1');
                $sheet->getStyle("F{$rowIdx}")->getFont()->setUnderline(true);
            }

            // Wrap comment text
            $sheet->getStyle("J{$rowIdx}")->getAlignment()->setWrapText(true);

            // Row borders
            $sheet->getStyle("B{$rowIdx}:J{$rowIdx}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_HAIR,
                        'color'       => ['rgb' => 'E5E7EB'],
                    ],
                ],
            ]);

            $rowIdx++;
        }

        // Outer border for the whole header block
        $sheet->getStyle("B2:J3")->applyFromArray([
            'borders' => [
                'outline' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['rgb' => '9CA3AF'],
                ],
            ],
        ]);

        // Stream to browser
        $filename = 'client-reviews-' . now()->timezone($tz)->format('Ymd-His') . '.xlsx';
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Apply filters to a query builder (for export) - WITH 'all' value checks
     */
    private function applyFilters(Builder $query, Request $request): void
    {
        // Only apply filter if value is not 'all'
        if ($request->filled('satisfaction_rating') && $request->satisfaction_rating !== 'all') {
            $query->bySatisfactionRating($request->satisfaction_rating);
        }

        if ($request->filled('school_hei') && $request->school_hei !== 'all') {
            $query->bySchool($request->school_hei);
        }

        if ($request->filled('transaction_type') && $request->transaction_type !== 'all') {
            $query->byTransactionType($request->transaction_type);
        }

        if ($request->filled('date_range') && $request->date_range !== 'all') {
            $tz = config('app.timezone');
            switch ($request->date_range) {
                case 'today':
                    $today = Carbon::now($tz)->toDateString();
                    $query->where(function ($q) use ($today) {
                        $q->whereDate('transaction_date', $today)->orWhereDate('created_at', $today);
                    });
                    break;
                case 'this_week':
                    $start = Carbon::now($tz)->startOfWeek()->toDateString();
                    $end   = Carbon::now($tz)->endOfWeek()->toDateString();
                    $query->where(function ($q) use ($start, $end) {
                        $q->whereBetween('transaction_date', [$start, $end])->orWhereBetween('created_at', [$start, $end]);
                    });
                    break;
                case 'this_month':
                    $month = Carbon::now($tz)->month;
                    $year  = Carbon::now($tz)->year;
                    $query->where(function ($q) use ($month, $year) {
                        $q->whereMonth('transaction_date', $month)->whereYear('transaction_date', $year)
                          ->orWhere(function ($sub) use ($month, $year) {
                              $sub->whereMonth('created_at', $month)->whereYear('created_at', $year);
                          });
                    });
                    break;
                case 'this_year':
                    $year = Carbon::now($tz)->year;
                    $query->where(function ($q) use ($year) {
                        $q->whereYear('transaction_date', $year)->orWhereYear('created_at', $year);
                    });
                    break;
                case 'last_30_days':
                    $since = Carbon::now($tz)->subDays(30)->toDateString();
                    $query->where(function ($q) use ($since) {
                        $q->where('transaction_date', '>=', $since)->orWhere('created_at', '>=', $since);
                    });
                    break;
            }
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->byClientName($term)
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('reason', 'like', "%{$term}%")
                    ->orWhere('school_hei', 'like', "%{$term}%")
                    ->orWhere('other_school_specify', 'like', "%{$term}%");
            });
        }
    }

    /**
     * Validation rules/messages helpers
     */
    public static function getValidationRules(): array
    {
        return [
            'transaction_date' => 'required|date|before_or_equal:today',
            'first_name'       => 'required|string|max:255',
            'middle_name'      => 'nullable|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'required|email|max:255',
            'school_hei'       => ['required', 'string', Rule::in(array_merge(
                School::pluck('id')->toArray(),
                ['other']
            ))],
            'other_school_specify' => [
                'nullable', 'string', 'max:255',
                Rule::requiredIf(request('school_hei') === 'other'),
            ],
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment', 'payment', 'transcript', 'certification',
                'scholarship', 'consultation', 'other',
            ])],
            'other_transaction_specify' => [
                'nullable', 'string', 'max:255',
                Rule::requiredIf(request('transaction_type') === 'other'),
            ],
            'satisfaction_rating' => ['required', 'string', Rule::in(['dissatisfied', 'satisfied'])],
            'reason'              => 'required|string|min:10|max:2000',
        ];
    }

    public static function getValidationMessages(): array
    {
        return [
            'transaction_date.required' => 'The transaction date is required.',
            'transaction_date.date'     => 'Please enter a valid date.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
            'first_name.required'       => 'Your first name is required.',
            'first_name.max'            => 'Your first name cannot exceed 255 characters.',
            'middle_name.max'           => 'Your middle name cannot exceed 255 characters.',
            'last_name.required'        => 'Your last name is required.',
            'last_name.max'             => 'Your last name cannot exceed 255 characters.',
            'email.required'            => 'Your email address is required.',
            'email.email'               => 'Please enter a valid email address.',
            'email.max'                 => 'Your email address cannot exceed 255 characters.',
            'school_hei.required'       => 'School/HEI is required.',
            'school_hei.in'             => 'Please select a valid school or "Other".',
            'other_school_specify.required' => 'Please specify your school/institution when selecting "Other".',
            'other_school_specify.max'  => 'School specification cannot exceed 255 characters.',
            'transaction_type.required' => 'Please select a transaction type.',
            'transaction_type.in'       => 'Please select a valid transaction type.',
            'other_transaction_specify.required' => 'Please specify the type of transaction when selecting "Other".',
            'other_transaction_specify.max' => 'Transaction specification cannot exceed 255 characters.',
            'satisfaction_rating.required' => 'Please select your satisfaction rating.',
            'satisfaction_rating.in'    => 'Please select a valid satisfaction rating.',
            'reason.required'           => 'Please provide your feedback.',
            'reason.min'                => 'Your feedback must be at least 10 characters long.',
            'reason.max'                => 'Your feedback cannot exceed 2000 characters.',
        ];
    }
}
