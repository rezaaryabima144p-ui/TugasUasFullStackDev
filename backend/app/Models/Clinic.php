<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code_prefix',
        'open_time',
        'close_time',
        'status',
    ];

    protected $casts = [
        'open_time' => 'datetime:H:i',
        'close_time' => 'datetime:H:i',
    ];

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
