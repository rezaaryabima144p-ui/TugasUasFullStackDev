<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class PatientTicketController extends Controller
{
    public function checkTicket(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'access_code' => 'nullable|string',
            'ticket_code' => 'nullable|string',
        ]);

        $lookupCode = trim($validated['access_code'] ?? $validated['ticket_code'] ?? '');

        if ($lookupCode === '') {
            return response()->json(['message' => 'Access code or ticket code is required.'], 422);
        }

        $ticket = Ticket::with(['patient', 'clinic', 'doctor', 'room', 'ticketCalls'])
            ->where(function ($query) use ($lookupCode) {
                $query->where('access_code', $lookupCode)
                    ->orWhere('ticket_code', strtoupper($lookupCode));
            })
            ->whereHas('patient', function ($query) use ($validated) {
                $query->where('name', $validated['patient_name']);
            })
            ->latest('created_at')
            ->first();

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found or patient data mismatch.'], 404);
        }

        return response()->json($ticket);
    }

    public function cancelByPatient(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'access_code' => 'required|string|size:4',
            'cancel_reason' => 'required|string',
        ]);

        if ($ticket->access_code !== $validated['access_code'] || $ticket->patient->name !== $validated['patient_name']) {
            return response()->json(['message' => 'Invalid ticket details.'], 422);
        }

        if (in_array($ticket->status, ['selesai', 'dibatalkan'], true)) {
            return response()->json(['message' => 'Ticket cannot be canceled.'], 422);
        }

        $previousStatus = $ticket->status;
        $ticket->status = 'dibatalkan';
        $ticket->cancel_reason = $validated['cancel_reason'];
        $ticket->canceled_by = 'PASIEN';
        $ticket->canceled_at = now();
        $ticket->save();

        $ticket->ticketStatusHistories()->create([
            'admin_id' => $ticket->created_by_admin_id,
            'previous_status' => $previousStatus,
            'new_status' => 'dibatalkan',
            'note' => $validated['cancel_reason'],
        ]);

        return response()->json($ticket->load(['patient', 'clinic', 'doctor', 'room']));
    }
}
