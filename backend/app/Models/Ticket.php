<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_code',
        'access_code',
        'patient_id',
        'clinic_id',
        'doctor_id',
        'room_id',
        'created_by_admin_id',
        'status',
        'service_note',
        'cancel_reason',
        'canceled_by',
        'called_at',
        'finished_at',
        'canceled_at',
    ];

    protected $casts = [
        'called_at' => 'datetime',
        'finished_at' => 'datetime',
        'canceled_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    public function ticketStatusHistories()
    {
        return $this->hasMany(TicketStatusHistory::class);
    }

    public function ticketCalls()
    {
        return $this->hasMany(TicketCall::class);
    }
}
