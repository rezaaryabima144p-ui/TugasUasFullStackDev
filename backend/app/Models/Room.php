<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'clinic_id',
        'name',
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
