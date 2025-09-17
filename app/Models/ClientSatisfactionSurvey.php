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
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'school_hei',
        'other_school_specify',
        'transaction_type',
        'other_transaction_specify',
        'satisfaction_rating',
        'reason',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    // Accessor for full client name
    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);

        return implode(' ', $parts);
    }

    // Accessor for display name (Last, First Middle format)
    public function getDisplayNameAttribute()
    {
        $firstName = $this->first_name;
        $middleName = $this->middle_name ? ' ' . $this->middle_name : '';
        $lastName = $this->last_name;

        if ($firstName && $lastName) {
            return $lastName . ', ' . $firstName . $middleName;
        }

        return $this->getFullNameAttribute();
    }

    // Accessor for formal name (First Middle Last format)
    public function getFormalNameAttribute()
    {
        return $this->getFullNameAttribute();
    }

    // Add accessor for full school display name
    public function getFullSchoolNameAttribute()
    {
        if ($this->school_hei === 'other' && $this->other_school_specify) {
            return 'Other: ' . $this->other_school_specify;
        }

        return $this->school_hei;
    }

    // Scopes
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

    public function scopeByClientName($query, $searchTerm)
    {
        return $query->where(function($q) use ($searchTerm) {
            $q->where('first_name', 'like', "%{$searchTerm}%")
              ->orWhere('middle_name', 'like', "%{$searchTerm}%")
              ->orWhere('last_name', 'like', "%{$searchTerm}%");
        });
    }

    // Accessors for display
    public function getFormattedTransactionDateAttribute()
    {
        return $this->transaction_date->format('F d, Y');
    }

    public function getSatisfactionRatingWithEmojiAttribute()
    {
        return match($this->satisfaction_rating) {
            'satisfied' => '😊 Satisfied',
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
