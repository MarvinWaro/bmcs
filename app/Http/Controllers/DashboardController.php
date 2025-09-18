<?php

namespace App\Http\Controllers;

use App\Models\ClientSatisfactionSurvey;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // Get filter parameters
        $dateRange = $request->get('date_range', 'last_30_days');
        $schoolFilter = $request->get('school');
        $transactionTypeFilter = $request->get('transaction_type');

        // Calculate date range
        $endDate = Carbon::now();
        $startDate = match($dateRange) {
            'today' => Carbon::today(),
            'this_week' => Carbon::now()->startOfWeek(),
            'this_month' => Carbon::now()->startOfMonth(),
            'last_30_days' => Carbon::now()->subDays(30),
            'last_60_days' => Carbon::now()->subDays(60),
            'last_90_days' => Carbon::now()->subDays(90),
            'this_year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->subDays(30),
        };

        // Base query with filters
        $baseQuery = ClientSatisfactionSurvey::whereBetween('transaction_date', [$startDate, $endDate]);

        if ($schoolFilter && $schoolFilter !== 'all') {
            $baseQuery->where('school_hei', $schoolFilter);
        }

        if ($transactionTypeFilter && $transactionTypeFilter !== 'all') {
            $baseQuery->where('transaction_type', $transactionTypeFilter);
        }

        // Get all surveys for the period
        $surveys = $baseQuery->get();

        // Calculate key metrics
        $totalSurveys = $surveys->count();
        $satisfiedCount = $surveys->where('satisfaction_rating', 'satisfied')->count();
        $dissatisfiedCount = $surveys->where('satisfaction_rating', 'dissatisfied')->count();
        $satisfactionRate = $totalSurveys > 0 ? round(($satisfiedCount / $totalSurveys) * 100, 1) : 0;

        // Previous period comparison
        $previousStartDate = match($dateRange) {
            'today' => Carbon::yesterday(),
            'this_week' => Carbon::now()->subWeek()->startOfWeek(),
            'this_month' => Carbon::now()->subMonth()->startOfMonth(),
            'last_30_days' => Carbon::now()->subDays(60)->addDay(),
            'last_60_days' => Carbon::now()->subDays(120)->addDay(),
            'last_90_days' => Carbon::now()->subDays(180)->addDay(),
            'this_year' => Carbon::now()->subYear()->startOfYear(),
            default => Carbon::now()->subDays(60)->addDay(),
        };

        $previousEndDate = match($dateRange) {
            'today' => Carbon::yesterday()->endOfDay(),
            'this_week' => Carbon::now()->subWeek()->endOfWeek(),
            'this_month' => Carbon::now()->subMonth()->endOfMonth(),
            'last_30_days' => Carbon::now()->subDays(30)->subDay(),
            'last_60_days' => Carbon::now()->subDays(60)->subDay(),
            'last_90_days' => Carbon::now()->subDays(90)->subDay(),
            'this_year' => Carbon::now()->subYear()->endOfYear(),
            default => Carbon::now()->subDays(30)->subDay(),
        };

        $previousPeriodQuery = ClientSatisfactionSurvey::whereBetween('transaction_date', [$previousStartDate, $previousEndDate]);
        if ($schoolFilter && $schoolFilter !== 'all') {
            $previousPeriodQuery->where('school_hei', $schoolFilter);
        }
        if ($transactionTypeFilter && $transactionTypeFilter !== 'all') {
            $previousPeriodQuery->where('transaction_type', $transactionTypeFilter);
        }

        $previousSurveys = $previousPeriodQuery->get();
        $previousTotal = $previousSurveys->count();
        $previousSatisfied = $previousSurveys->where('satisfaction_rating', 'satisfied')->count();
        $previousSatisfactionRate = $previousTotal > 0 ? round(($previousSatisfied / $previousTotal) * 100, 1) : 0;

        // Calculate percentage changes
        $totalChange = $previousTotal > 0 ? round((($totalSurveys - $previousTotal) / $previousTotal) * 100, 1) : 0;
        $satisfactionChange = $previousSatisfactionRate > 0 ? round($satisfactionRate - $previousSatisfactionRate, 1) : 0;

        // Daily satisfaction trend (last 30 days for line chart)
        $dailyTrendData = [];
        $trendStartDate = Carbon::now()->subDays(29);
        for ($i = 0; $i < 30; $i++) {
            $date = $trendStartDate->copy()->addDays($i);
            $dayQuery = ClientSatisfactionSurvey::whereDate('transaction_date', $date);

            if ($schoolFilter && $schoolFilter !== 'all') {
                $dayQuery->where('school_hei', $schoolFilter);
            }
            if ($transactionTypeFilter && $transactionTypeFilter !== 'all') {
                $dayQuery->where('transaction_type', $transactionTypeFilter);
            }

            $daySurveys = $dayQuery->get();
            $dayTotal = $daySurveys->count();
            $daySatisfied = $daySurveys->where('satisfaction_rating', 'satisfied')->count();
            $dayDissatisfied = $daySurveys->where('satisfaction_rating', 'dissatisfied')->count();

            $dailyTrendData[] = [
                'date' => $date->format('Y-m-d'),
                'satisfied' => $daySatisfied,
                'dissatisfied' => $dayDissatisfied,
                'total' => $dayTotal,
            ];
        }

        // School distribution (donut chart)
        $schoolDistribution = $surveys->groupBy('school_hei')->map(function ($schoolSurveys, $school) {
            return [
                'name' => $school,
                'value' => $schoolSurveys->count(),
                'satisfied' => $schoolSurveys->where('satisfaction_rating', 'satisfied')->count(),
                'dissatisfied' => $schoolSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            ];
        })->values()->toArray();

        // Transaction type distribution
        $transactionDistribution = $surveys->groupBy('transaction_type')->map(function ($typeSurveys, $type) {
            $typeLabel = match($type) {
                'enrollment' => 'Enrollment',
                'payment' => 'Payment',
                'transcript' => 'Transcript',
                'certification' => 'Certification',
                'scholarship' => 'Scholarship',
                'consultation' => 'Consultation',
                'other' => 'Other',
                default => ucfirst($type),
            };

            return [
                'name' => $typeLabel,
                'value' => $typeSurveys->count(),
                'satisfied' => $typeSurveys->where('satisfaction_rating', 'satisfied')->count(),
                'dissatisfied' => $typeSurveys->where('satisfaction_rating', 'dissatisfied')->count(),
            ];
        })->values()->toArray();

        // Recent surveys
        $recentSurveys = $baseQuery->latest('created_at')
            ->take(5)
            ->get()
            ->map(function ($survey) {
                return [
                    'id' => $survey->id,
                    'client_name' => $survey->full_name,
                    'satisfaction_rating' => $survey->satisfaction_rating,
                    'school' => $survey->full_school_name,
                    'transaction_type' => $survey->full_transaction_type,
                    'date' => $survey->transaction_date->setTimezone(config('app.timezone'))->format('M j, Y'),
                    'submitted_at' => $survey->created_at->setTimezone(config('app.timezone'))->diffForHumans(),
                ];
            });

        // Monthly satisfaction trend (last 6 months)
        $monthlyTrendData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();

            $monthQuery = ClientSatisfactionSurvey::whereBetween('transaction_date', [$monthStart, $monthEnd]);
            if ($schoolFilter && $schoolFilter !== 'all') {
                $monthQuery->where('school_hei', $schoolFilter);
            }
            if ($transactionTypeFilter && $transactionTypeFilter !== 'all') {
                $monthQuery->where('transaction_type', $transactionTypeFilter);
            }

            $monthSurveys = $monthQuery->get();
            $monthTotal = $monthSurveys->count();
            $monthSatisfied = $monthSurveys->where('satisfaction_rating', 'satisfied')->count();
            $monthDissatisfied = $monthSurveys->where('satisfaction_rating', 'dissatisfied')->count();

            $monthlyTrendData[] = [
                'month' => $monthStart->format('M Y'),
                'satisfied' => $monthSatisfied,
                'dissatisfied' => $monthDissatisfied,
                'total' => $monthTotal,
                'satisfaction_rate' => $monthTotal > 0 ? round(($monthSatisfied / $monthTotal) * 100, 1) : 0,
            ];
        }

        // Get filter options
        $schools = School::orderBy('name')->get(['id', 'name']);
        $transactionTypes = [
            ['value' => 'enrollment', 'label' => 'Enrollment'],
            ['value' => 'payment', 'label' => 'Payment'],
            ['value' => 'transcript', 'label' => 'Transcript'],
            ['value' => 'certification', 'label' => 'Certification'],
            ['value' => 'scholarship', 'label' => 'Scholarship'],
            ['value' => 'consultation', 'label' => 'Consultation'],
            ['value' => 'other', 'label' => 'Other'],
        ];

        return Inertia::render('dashboard', [
            'analytics' => [
                'metrics' => [
                    'total_surveys' => $totalSurveys,
                    'satisfied_count' => $satisfiedCount,
                    'dissatisfied_count' => $dissatisfiedCount,
                    'satisfaction_rate' => $satisfactionRate,
                    'total_change' => $totalChange,
                    'satisfaction_change' => $satisfactionChange,
                ],
                'daily_trend' => $dailyTrendData,
                'monthly_trend' => $monthlyTrendData,
                'school_distribution' => $schoolDistribution,
                'transaction_distribution' => $transactionDistribution,
                'recent_surveys' => $recentSurveys,
            ],
            'filter_options' => [
                'schools' => $schools,
                'transaction_types' => $transactionTypes,
                'date_ranges' => [
                    ['value' => 'today', 'label' => 'Today'],
                    ['value' => 'this_week', 'label' => 'This Week'],
                    ['value' => 'this_month', 'label' => 'This Month'],
                    ['value' => 'last_30_days', 'label' => 'Last 30 Days'],
                    ['value' => 'last_60_days', 'label' => 'Last 60 Days'],
                    ['value' => 'last_90_days', 'label' => 'Last 90 Days'],
                    ['value' => 'this_year', 'label' => 'This Year'],
                    ['value' => 'submitted_today', 'label' => 'Submitted Today'],
                    ['value' => 'transaction_today', 'label' => 'Transaction Today'],
                ],
            ],
            'current_filters' => [
                'date_range' => $dateRange,
                'school' => $schoolFilter,
                'transaction_type' => $transactionTypeFilter,
            ],
        ]);
    }
}
