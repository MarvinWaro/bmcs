<?php

namespace App\Http\Controllers;

use App\Models\ClientSatisfactionSurvey;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientSatisfactionSurveyController extends Controller
{
    /**
     * Display a listing of client satisfaction surveys for admin review
     */
    public function index(): Response
    {
        $surveys = ClientSatisfactionSurvey::orderBy('created_at', 'desc')->get();

        // Transform the data to match the frontend expectations
        $reviews = $surveys->map(function ($survey) {
            return [
                'id' => $survey->id,
                'clientName' => $survey->client_name,
                'email' => $survey->email,
                'rating' => $this->mapSatisfactionToStars($survey->satisfaction_rating),
                'comment' => $survey->reason,
                'date' => $survey->transaction_date->format('Y-m-d'),
                'status' => $survey->status ?? 'submitted',
                'loanType' => $survey->full_transaction_type, // Use the accessor for full display
                'schoolHei' => $survey->full_school_name, // Use the new accessor for full school display
                'satisfactionRating' => $survey->satisfaction_rating,
                'transactionType' => $survey->transaction_type,
                'otherTransactionSpecify' => $survey->other_transaction_specify,
                'otherSchoolSpecify' => $survey->other_school_specify, // Add this new field
                'submittedAt' => $survey->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return Inertia::render('reviews/index', [
            'reviews' => $reviews
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date|before_or_equal:today',
            'client_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'school_hei' => ['required', 'string', Rule::in(array_merge(
                School::pluck('id')->toArray(),
                ['other']
            ))],
            'other_school_specify' => [
                'nullable',
                'string',
                'max:255',
                // Required only if school_hei is 'other'
                Rule::requiredIf($request->school_hei === 'other')
            ],
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment',
                'payment',
                'transcript',
                'certification',
                'scholarship',
                'consultation',
                'other'
            ])],
            'other_transaction_specify' => [
                'nullable',
                'string',
                'max:255',
                // Required only if transaction_type is 'other'
                Rule::requiredIf($request->transaction_type === 'other')
            ],
            'satisfaction_rating' => ['required', 'string', Rule::in([
                'dissatisfied',
                'neutral',
                'satisfied'
            ])],
            'reason' => 'required|string|min:10|max:2000',
        ], [
            'transaction_date.required' => 'The transaction date is required.',
            'transaction_date.date' => 'Please enter a valid date.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
            'client_name.required' => 'Your name is required.',
            'client_name.max' => 'Your name cannot exceed 255 characters.',
            'email.required' => 'Your email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Your email address cannot exceed 255 characters.',
            'school_hei.required' => 'School/HEI is required.',
            'school_hei.in' => 'Please select a valid school or "Other".',
            'other_school_specify.required' => 'Please specify your school/institution when selecting "Other".',
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
        ]);

        try {
            // Handle school_hei value - convert school ID to school name for storage
            if ($validated['school_hei'] !== 'other') {
                $school = School::find($validated['school_hei']);
                if ($school) {
                    $validated['school_hei'] = $school->name;
                }
                // Clear other_school_specify if not using "other"
                $validated['other_school_specify'] = null;
            }

            // Create the survey response with default status
            $validated['status'] = 'submitted';

            // If transaction_type is not 'other', clear the other_transaction_specify field
            if ($validated['transaction_type'] !== 'other') {
                $validated['other_transaction_specify'] = null;
            }

            ClientSatisfactionSurvey::create($validated);

            return redirect()->back()->with('success', 'Thank you for your feedback! Your response has been recorded.');

        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error saving client satisfaction survey: ' . $e->getMessage(), [
                'data' => $validated,
                'exception' => $e
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
            'status' => 'required|string|in:submitted,reviewed,resolved',
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
        return match($satisfaction) {
            'dissatisfied' => 2,
            'neutral' => 3,
            'satisfied' => 5,
            default => 3,
        };
    }

    /**
     * Format transaction type for display
     */
    private function formatTransactionType(string $type): string
    {
        return match($type) {
            'enrollment' => 'Enrollment',
            'payment' => 'Payment',
            'transcript' => 'Transcript Request',
            'certification' => 'Certification',
            'scholarship' => 'Scholarship Application',
            'consultation' => 'Consultation',
            'other' => 'Other',
            default => ucfirst($type),
        };
    }

    /**
     * Get validation rules for the form
     */
    public static function getValidationRules(): array
    {
        return [
            'transaction_date' => 'required|date|before_or_equal:today',
            'client_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'school_hei' => ['required', 'string', Rule::in(array_merge(
                School::pluck('id')->toArray(),
                ['other']
            ))],
            'other_school_specify' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(request('school_hei') === 'other')
            ],
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment',
                'payment',
                'transcript',
                'certification',
                'scholarship',
                'consultation',
                'other'
            ])],
            'other_transaction_specify' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(request('transaction_type') === 'other')
            ],
            'satisfaction_rating' => ['required', 'string', Rule::in([
                'dissatisfied',
                'neutral',
                'satisfied'
            ])],
            'reason' => 'required|string|min:10|max:2000',
        ];
    }

    /**
     * Get validation messages
     */
    public static function getValidationMessages(): array
    {
        return [
            'transaction_date.required' => 'The transaction date is required.',
            'transaction_date.date' => 'Please enter a valid date.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
            'client_name.required' => 'Your name is required.',
            'client_name.max' => 'Your name cannot exceed 255 characters.',
            'email.required' => 'Your email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Your email address cannot exceed 255 characters.',
            'school_hei.required' => 'School/HEI is required.',
            'school_hei.in' => 'Please select a valid school or "Other".',
            'other_school_specify.required' => 'Please specify your school/institution when selecting "Other".',
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
