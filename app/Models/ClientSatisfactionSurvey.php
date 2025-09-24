<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientSatisfactionSurvey extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_date',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'school_id',                 // FK now (nullable)
        'other_school_specify',
        'transaction_type',
        'other_transaction_specify',
        'satisfaction_rating',
        'reason',
        'status',
    ];

    protected $casts = [
        'transaction_date' => 'date:Y-m-d',
    ];

    /** Relationships */
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /** ----- Accessors ----- */

    // Full name: "First Middle Last"
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ]);

        return implode(' ', $parts);
    }

    // Display name: "Last, First Middle"
    public function getDisplayNameAttribute(): string
    {
        $first = $this->first_name;
        $middle = $this->middle_name ? ' ' . $this->middle_name : '';
        $last = $this->last_name;

        return ($first && $last)
            ? ($last . ', ' . $first . $middle)
            : $this->full_name;
    }

    // Alias to full name (kept for compatibility)
    public function getFormalNameAttribute(): string
    {
        return $this->full_name;
    }

    // Full school display name
    public function getFullSchoolNameAttribute(): ?string
    {
        if ($this->school) {
            return $this->school->name;
        }

        if ($this->other_school_specify) {
            return 'Other: ' . $this->other_school_specify;
        }

        return null;
    }

    public function getFormattedTransactionDateAttribute(): ?string
    {
        return $this->transaction_date?->format('F d, Y');
    }

    public function getSatisfactionRatingWithEmojiAttribute(): ?string
    {
        return match ($this->satisfaction_rating) {
            'satisfied' => '😊 Satisfied',
            'dissatisfied' => '😞 Dissatisfied',
            default => $this->satisfaction_rating,
        };
    }

    public function getFullTransactionTypeAttribute(): ?string
    {
        if ($this->transaction_type === 'other' && $this->other_transaction_specify) {
            return 'Other: ' . $this->other_transaction_specify;
        }

        return match ($this->transaction_type) {
            'enrollment'   => 'Enrollment',
            'payment'      => 'Payment',
            'transcript'   => 'Transcript Request',
            'certification'=> 'Certification',
            'scholarship'  => 'Scholarship Application',
            'consultation' => 'Consultation',
            'other'        => 'Other',
            default        => $this->transaction_type
                ? ucfirst($this->transaction_type)
                : null,
        };
    }

    /** ----- Scopes ----- */

    public function scopeBySatisfactionRating($query, string $rating)
    {
        return $query->where('satisfaction_rating', $rating);
    }

    public function scopeByTransactionType($query, string $type)
    {
        return $query->where('transaction_type', $type);
    }

    // Filter by school id (FK). If you still need by school name, see below.
    public function scopeBySchoolId($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    // Optional: filter by school name (joins schools)
    public function scopeBySchoolName($query, string $nameLike)
    {
        return $query->whereHas('school', function ($q) use ($nameLike) {
            $q->where('name', 'like', "%{$nameLike}%");
        });
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function scopeByClientName($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
              ->orWhere('middle_name', 'like', "%{$term}%")
              ->orWhere('last_name', 'like', "%{$term}%");
        });
    }
}
