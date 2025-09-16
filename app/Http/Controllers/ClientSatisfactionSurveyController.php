<?php
// app/Http/Controllers/ClientSatisfactionSurveyController.php

namespace App\Http\Controllers;

use App\Models\ClientSatisfactionSurvey;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class ClientSatisfactionSurveyController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date|before_or_equal:today',
            'client_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'school_hei' => 'required|string|max:255',
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment',
                'payment',
                'transcript',
                'certification',
                'scholarship',
                'consultation',
                'other'
            ])],
            'satisfaction_rating' => ['required', 'string', Rule::in([
                'dissatisfied',
                'neutral',
                'satisfied'
            ])],
            'reason' => 'required|string|min:10|max:2000',
        ]);

        try {
            // Create the survey response
            ClientSatisfactionSurvey::create($validated);

            return redirect()->back()->with('success', 'Thank you for your feedback! Your response has been recorded.');

        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Error saving client satisfaction survey: ' . $e->getMessage(), [
                'data' => $validated,
                'exception' => $e
            ]);

            return redirect()->back()
                ->withErrors(['general' => 'There was an error submitting your feedback. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Get validation rules for the form
     */
    public static function getValidationRules(): array
    {
        return [
            'transaction_date' => 'required|date|before_or_equal:today',
            'client_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'school_hei' => 'required|string|max:255',
            'transaction_type' => ['required', 'string', Rule::in([
                'enrollment',
                'payment',
                'transcript',
                'certification',
                'scholarship',
                'consultation',
                'other'
            ])],
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
            'email.email' => 'Please enter a valid email address.',
            'school_hei.required' => 'School/HEI is required.',
            'school_hei.max' => 'School/HEI name cannot exceed 255 characters.',
            'transaction_type.required' => 'Please select a transaction type.',
            'transaction_type.in' => 'Please select a valid transaction type.',
            'satisfaction_rating.required' => 'Please select your satisfaction rating.',
            'satisfaction_rating.in' => 'Please select a valid satisfaction rating.',
            'reason.required' => 'Please provide your feedback.',
            'reason.min' => 'Your feedback must be at least 10 characters long.',
            'reason.max' => 'Your feedback cannot exceed 2000 characters.',
        ];
    }
}
