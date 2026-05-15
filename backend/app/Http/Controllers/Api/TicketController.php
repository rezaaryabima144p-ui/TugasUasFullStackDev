<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\Room;
use App\Models\Ticket;
use App\Models\TicketCall;
use App\Models\TicketStatusHistory;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    private const FRONTEND_STATUSES = [
        'MENUNGGU' => 'menunggu',
        'DIPANGGIL' => 'dipanggil',
        'SELESAI' => 'selesai',
        'DIBATALKAN' => 'dibatalkan',
        'TIMEOUT' => 'dibatalkan',
    ];

    public function index(Request $request)
    {
        $query = Ticket::with(['patient', 'clinic', 'doctor', 'room', 'ticketCalls'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('clinic_id')) {
            $query->where('clinic_id', $request->input('clinic_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $this->normalizeStatus($request->input('status')));
        }

        if ($request->boolean('paginated')) {
            return response()->json($query->paginate(20));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'nullable|string|max:30',
            'phone' => 'nullable|string|max:30',
            'clinic_id' => 'required|exists:clinics,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'room_id' => 'nullable|exists:rooms,id',
            'created_by_admin_id' => 'nullable',
            'created_by_admin_code' => 'nullable|string',
        ]);

        $patientPhone = $validated['patient_phone'] ?? $validated['phone'] ?? null;

        $patientPhone = $patientPhone ?: 'NO-PHONE-'.Str::uuid();
        $admin = $this->resolveAdmin(
            $validated['created_by_admin_id'] ?? null,
            $validated['created_by_admin_code'] ?? null,
        );

        if (! $admin) {
            return response()->json(['message' => 'Admin pembuat tiket tidak ditemukan. Silakan login ulang.'], 422);
        }

        $clinic = Clinic::findOrFail($validated['clinic_id']);

        if (! empty($validated['doctor_id'])) {
            $doctor = Doctor::findOrFail($validated['doctor_id']);
            if ($doctor->clinic_id !== $clinic->id) {
                return response()->json(['message' => 'Selected doctor does not belong to the chosen clinic.'], 422);
            }
        }

        if (! empty($validated['room_id'])) {
            $room = Room::findOrFail($validated['room_id']);
            if ($room->clinic_id !== $clinic->id) {
                return response()->json(['message' => 'Selected room does not belong to the chosen clinic.'], 422);
            }
        }

        $patient = Patient::updateOrCreate([
            'phone' => $patientPhone,
        ], [
            'name' => $validated['patient_name'],
        ]);

        $prefix = strtoupper($clinic->code_prefix ?: substr($clinic->name, 0, 1));
        $lastIndex = Ticket::where('clinic_id', $clinic->id)
            ->where('ticket_code', 'like', "$prefix-%")
            ->get()
            ->map(function (Ticket $ticket) {
                return intval(Str::after($ticket->ticket_code, '-'));
            })
            ->max();

        $ticketCode = sprintf('%s-%03d', $prefix, ($lastIndex ?: 0) + 1);

        $accessCode = $this->generateAccessCode();

        $ticket = DB::transaction(function () use ($validated, $patient, $ticketCode, $accessCode, $admin) {
            return Ticket::create([
                'ticket_code' => $ticketCode,
                'access_code' => $accessCode,
                'patient_id' => $patient->id,
                'clinic_id' => $validated['clinic_id'],
                'doctor_id' => $validated['doctor_id'] ?? null,
                'room_id' => $validated['room_id'] ?? null,
                'created_by_admin_id' => $admin->id,
                'status' => 'menunggu',
            ]);
        });

        return response()->json(['ticket' => $ticket->load(['patient', 'clinic', 'doctor', 'room'])], 201);
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        if ($request->filled('status')) {
            $request->merge(['status' => $this->normalizeStatus($request->input('status'))]);
        }

        $validated = $request->validate([
            'status' => 'required|in:menunggu,dipanggil,selesai,dibatalkan',
            'admin_id' => 'nullable|exists:admins,id',
            'note' => 'nullable|string',
            'cancel_reason' => 'nullable|string',
            'canceled_by' => 'nullable|in:ADMIN,PASIEN',
        ]);

        $previousStatus = $ticket->status;
        $ticket->status = $validated['status'];
        $note = $validated['note'] ?? $validated['cancel_reason'] ?? null;

        if ($validated['status'] === 'dipanggil') {
            $ticket->called_at = $ticket->called_at ?: now();
        }

        if ($validated['status'] === 'selesai') {
            $ticket->finished_at = $ticket->finished_at ?: now();
        }

        if ($validated['status'] === 'dibatalkan') {
            $ticket->canceled_at = $ticket->canceled_at ?: now();
            $ticket->cancel_reason = $note ?? $ticket->cancel_reason;
            $ticket->canceled_by = $validated['canceled_by'] ?? 'ADMIN';
        }

        if ($note !== null) {
            $ticket->service_note = $note;
        }

        $ticket->save();

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'admin_id' => $validated['admin_id'] ?? $ticket->created_by_admin_id,
            'previous_status' => $previousStatus,
            'new_status' => $validated['status'],
            'note' => $note,
        ]);

        return response()->json(['ticket' => $ticket->load(['patient', 'clinic', 'doctor', 'room'])]);
    }

    public function updateServiceNote(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'service_note' => 'required|string',
        ]);

        $ticket->service_note = $validated['service_note'];
        $ticket->save();

        return response()->json($ticket->load(['patient', 'clinic', 'doctor', 'room']));
    }

    public function notify(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'admin_id' => 'required|exists:admins,id',
        ]);

        $previousStatus = $ticket->status;
        $ticket->status = 'dipanggil';
        $ticket->called_at = now();
        $ticket->save();

        TicketCall::create([
            'ticket_id' => $ticket->id,
            'admin_id' => $validated['admin_id'],
            'called_at' => now(),
            'status' => 'active',
        ]);

        if ($previousStatus !== 'dipanggil') {
            TicketStatusHistory::create([
                'ticket_id' => $ticket->id,
                'admin_id' => $validated['admin_id'],
                'previous_status' => $previousStatus,
                'new_status' => 'dipanggil',
                'note' => 'Admin memanggil ulang tiket',
            ]);
        }

        return response()->json($ticket->load(['patient', 'clinic', 'doctor', 'room', 'ticketCalls']));
    }

    private function generateAccessCode(): string
    {
        $tries = 0;

        do {
            $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $exists = Ticket::where('access_code', $code)->exists();
            $tries++;
        } while ($exists && $tries < 20);

        return $code;
    }

    private function normalizeStatus(string $status): string
    {
        $status = trim($status);

        return self::FRONTEND_STATUSES[strtoupper($status)] ?? strtolower($status);
    }

    private function resolveAdmin(mixed $adminId, ?string $adminCode): ?Admin
    {
        if ($adminId && is_numeric($adminId)) {
            return Admin::find($adminId);
        }

        $adminCode = trim($adminCode ?: (string) $adminId);

        if ($adminCode === '') {
            return null;
        }

        return Admin::where('admin_code', $adminCode)->first();
    }
}
