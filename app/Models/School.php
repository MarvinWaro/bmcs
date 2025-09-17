<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasUlids, SoftDeletes;

    public $incrementing = false;   // string PK
    protected $keyType = 'string';

    protected $fillable = [
        'name',
    ];

    // You can add relationships here as needed
    // For example, if you have students or other entities related to schools:
    /*
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
    */

    // Add accessor to get name (for compatibility with frontend)
    public function getSchoolNameAttribute()
    {
        return $this->name;
    }
}
