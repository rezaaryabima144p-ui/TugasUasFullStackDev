<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'name',
        'specialization',
        'status',
    ];

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
