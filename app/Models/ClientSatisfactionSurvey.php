<?php
// app/Models/ClientSatisfactionSurvey.php

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
        'transaction_type',
        'satisfaction_rating',
        'reason',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    // Scope for filtering by satisfaction rating
    public function scopeBySatisfactionRating($query, $rating)
    {
        return $query->where('satisfaction_rating', $rating);
    }

    // Scope for filtering by transaction type
    public function scopeByTransactionType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    // Scope for filtering by school/HEI
    public function scopeBySchool($query, $school)
    {
        return $query->where('school_hei', $school);
    }

    // Scope for filtering by date range
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Accessor for formatted transaction date
    public function getFormattedTransactionDateAttribute()
    {
        return $this->transaction_date->format('F d, Y');
    }

    // Get satisfaction rating with emoji
    public function getSatisfactionRatingWithEmojiAttribute()
    {
        return match($this->satisfaction_rating) {
            'satisfied' => '😊 Satisfied',
            'neutral' => '😐 Neutral',
            'dissatisfied' => '😞 Dissatisfied',
            default => $this->satisfaction_rating,
        };
    }
}
