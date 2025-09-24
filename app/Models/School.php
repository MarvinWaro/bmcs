<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class School extends Model
{
    use SoftDeletes;

    // Default $incrementing = true and $keyType = 'int' are fine.
    protected $fillable = ['name'];

    public function surveys()
    {
        return $this->hasMany(ClientSatisfactionSurvey::class);
    }

    // Compatibility accessor if your frontend referenced `school_name`
    public function getSchoolNameAttribute(): string
    {
        return $this->name;
    }
}
