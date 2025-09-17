<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ClientSatisfactionSurvey extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'transaction_date',
        'client_name',
        'email',
        'school_hei',
        'other_school_specify', // Add this new field
        'transaction_type',
        'other_transaction_specify',
        'satisfaction_rating',
        'reason',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    // Add accessor for full school display name
    public function getFullSchoolNameAttribute()
    {
        if ($this->school_hei === 'other' && $this->other_school_specify) {
            return 'Other: ' . $this->other_school_specify;
        }

        return $this->school_hei;
    }

    // Rest of your existing methods...
    public function scopeBySatisfactionRating($query, $rating)
    {
        return $query->where('satisfaction_rating', $rating);
    }

    public function scopeByTransactionType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeBySchool($query, $school)
    {
        return $query->where('school_hei', $school);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function getFormattedTransactionDateAttribute()
    {
        return $this->transaction_date->format('F d, Y');
    }

    public function getSatisfactionRatingWithEmojiAttribute()
    {
        return match($this->satisfaction_rating) {
            'satisfied' => '😊 Satisfied',
            'neutral' => '😐 Neutral',
            'dissatisfied' => '😞 Dissatisfied',
            default => $this->satisfaction_rating,
        };
    }

    public function getFullTransactionTypeAttribute()
    {
        if ($this->transaction_type === 'other' && $this->other_transaction_specify) {
            return 'Other: ' . $this->other_transaction_specify;
        }

        return match($this->transaction_type) {
            'enrollment' => 'Enrollment',
            'payment' => 'Payment',
            'transcript' => 'Transcript Request',
            'certification' => 'Certification',
            'scholarship' => 'Scholarship Application',
            'consultation' => 'Consultation',
            'other' => 'Other',
            default => ucfirst($this->transaction_type),
        };
    }
}
