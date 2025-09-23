<?php

namespace App\Exports;

use App\Models\ClientSatisfactionSurvey;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ClientReviewsExport implements FromCollection, WithHeadings, WithColumnFormatting
{
    public function __construct(private Request $request) {}

    public function collection(): Collection
    {
        $query = ClientSatisfactionSurvey::query();

        // Apply the same filters as the index method
        if ($this->request->filled('satisfaction_rating') && $this->request->satisfaction_rating !== 'all') {
            $query->bySatisfactionRating($this->request->satisfaction_rating);
        }

        if ($this->request->filled('school_hei') && $this->request->school_hei !== 'all') {
            $query->bySchool($this->request->school_hei);
        }

        if ($this->request->filled('transaction_type') && $this->request->transaction_type !== 'all') {
            $query->byTransactionType($this->request->transaction_type);
        }

        // Date range filtering
        if ($this->request->filled('date_range') && $this->request->date_range !== 'all') {
            $appTimezone = config('app.timezone');

            switch ($this->request->date_range) {
                case 'today':
                    $today = Carbon::now($appTimezone)->format('Y-m-d');
                    $query->where(function($q) use ($today) {
                        $q->whereDate('transaction_date', $today)
                          ->orWhereDate('created_at', $today);
                    });
                    break;
                case 'this_week':
                    $startOfWeek = Carbon::now($appTimezone)->startOfWeek()->format('Y-m-d');
                    $endOfWeek = Carbon::now($appTimezone)->endOfWeek()->format('Y-m-d');
                    $query->where(function($q) use ($startOfWeek, $endOfWeek) {
                        $q->whereBetween('transaction_date', [$startOfWeek, $endOfWeek])
                          ->orWhereBetween('created_at', [$startOfWeek, $endOfWeek]);
                    });
                    break;
                case 'this_month':
                    $month = Carbon::now($appTimezone)->month;
                    $year = Carbon::now($appTimezone)->year;
                    $query->where(function($q) use ($month, $year) {
                        $q->where(function($subQ) use ($month, $year) {
                            $subQ->whereMonth('transaction_date', $month)
                                 ->whereYear('transaction_date', $year);
                        })->orWhere(function($subQ) use ($month, $year) {
                            $subQ->whereMonth('created_at', $month)
                                 ->whereYear('created_at', $year);
                        });
                    });
                    break;
                case 'this_year':
                    $year = Carbon::now($appTimezone)->year;
                    $query->where(function($q) use ($year) {
                        $q->whereYear('transaction_date', $year)
                          ->orWhereYear('created_at', $year);
                    });
                    break;
                case 'last_30_days':
                    $thirtyDaysAgo = Carbon::now($appTimezone)->subDays(30)->format('Y-m-d');
                    $query->where(function($q) use ($thirtyDaysAgo) {
                        $q->where('transaction_date', '>=', $thirtyDaysAgo)
                          ->orWhere('created_at', '>=', $thirtyDaysAgo);
                    });
                    break;
            }
        }

        // Custom date range
        if ($this->request->filled('start_date') && $this->request->filled('end_date')) {
            $query->byDateRange($this->request->start_date, $this->request->end_date);
        }

        // Search functionality
        if ($this->request->filled('search')) {
            $searchTerm = $this->request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->byClientName($searchTerm)
                ->orWhere('email', 'like', "%{$searchTerm}%")
                ->orWhere('reason', 'like', "%{$searchTerm}%")
                ->orWhere('school_hei', 'like', "%{$searchTerm}%")
                ->orWhere('other_school_specify', 'like', "%{$searchTerm}%");
            });
        }

        // Get the data without pagination
        $surveys = $query->orderBy('created_at', 'desc')->get();

        // Transform the data to match your table structure
        return $surveys->map(function ($survey) {
            // Build client name - same logic as in your controller
            $clientName = trim(implode(' ', array_filter([
                $survey->first_name,
                $survey->middle_name,
                $survey->last_name
            ])));

            // Format dates consistently
            $transactionDate = $survey->transaction_date ?
                $survey->transaction_date->format('Y-m-d') : '';

            $submittedAt = $survey->created_at ?
                $survey->created_at->setTimezone(config('app.timezone'))->format('Y-m-d H:i:s') : '';

            // Get school name
            $schoolName = $survey->school_hei;
            if ($survey->school_hei === 'other' && $survey->other_school_specify) {
                $schoolName = 'Other: ' . $survey->other_school_specify;
            }

            // Get transaction type
            $transactionType = $survey->transaction_type;
            if ($survey->transaction_type === 'other' && $survey->other_transaction_specify) {
                $transactionType = 'Other: ' . $survey->other_transaction_specify;
            } else {
                // Map transaction type to display name
                $transactionType = match($survey->transaction_type) {
                    'enrollment' => 'Enrollment',
                    'payment' => 'Payment',
                    'transcript' => 'Transcript Request',
                    'certification' => 'Certification',
                    'scholarship' => 'Scholarship Application',
                    'consultation' => 'Consultation',
                    'other' => 'Other',
                    default => ucfirst($survey->transaction_type),
                };
            }

            // Return array with same order as headings
            return [
                $survey->id,
                $clientName,
                $survey->email ?? '',
                $transactionDate,
                $submittedAt,
                $schoolName,
                $transactionType,
                ucfirst($survey->satisfaction_rating),
                $survey->reason ?? '',
                $survey->status ?? 'submitted',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'ID',
            'Client Name',
            'Email',
            'Transaction Date',
            'Submitted At',
            'School/HEI',
            'Transaction Type',
            'Satisfaction',
            'Comment',
            'Status',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_DATE_YYYYMMDD, // Transaction Date
            'E' => NumberFormat::FORMAT_DATE_DATETIME, // Submitted At
        ];
    }
}
