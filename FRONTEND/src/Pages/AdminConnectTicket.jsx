import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createTicket } from "../utils/api";
import { getAdminSession } from "../utils/adminSession";

function HealthLogo() {
  return (
    <div className="flex flex-col items-start">
      <div className="relative h-12 w-12 rounded-md bg-[#2E9D45]">
        <div className="absolute left-1/2 top-1/2 h-8 w-3 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-3 w-8 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 bg-[#E53535]" />
        <div className="absolute left-1/2 top-1/2 h-2 w-5 -translate-x-1/2 -translate-y-1/2 bg-[#E53535]" />
      </div>
      <p className="mt-1 text-[9px] font-black leading-tight text-[#2E7D32]">
        PUSKESMAS<br />SEKEMALA
      </p>
    </div>
  );
}

export default function AdminConnectTicket() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [patientName, setPatientName] = useState("");
  const [ticketCode] = useState(() => state?.ticketCode || "A-001");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const clinicType = state?.clinicType || "-";
  const doctorName = state?.doctorName || "-";
  const roomName = state?.roomName || "-";

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (!patientName.trim()) {
      setError("Nama pasien wajib diisi dulu.");
      return;
    }

    const adminSession = getAdminSession();
    if (!adminSession?.id) {
      setError("Session admin tidak lengkap. Silakan login ulang.");
      return;
    }

    if (!state?.clinicId || !state?.doctorId || !state?.roomId) {
      setError("Data poli, dokter, atau ruangan belum lengkap. Kembali ke input tiket dulu.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const ticket = await createTicket({
        patientName: patientName.trim(),
        ticketCode,
        clinicId: state.clinicId,
        doctorId: state.doctorId,
        roomId: state.roomId,
        adminId: adminSession.id,
      });

      navigate("/admin-ticket-created", {
        state: {
          patientName: ticket.name,
          ticketCode: ticket.code,
          accessCode: ticket.accessCode,
          clinicType: ticket.clinicType || clinicType,
          doctorName: ticket.doctorName || doctorName,
          roomName: ticket.roomName || roomName,
          createdAt: ticket.createdAt,
        },
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card app-card-green compact-card relative">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <div className="flex items-start gap-6">
            <HealthLogo />
            <div className="pt-3">
              <h1 className="app-title text-left text-xl md:text-3xl">
                HUBUNGKAN TIKET KE PASIEN
              </h1>
              <p className="mt-2 text-xs font-black uppercase text-black/60">
                Lengkapi nama pasien untuk menerbitkan tiket
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="content-panel mx-auto mt-10 w-full max-w-4xl md:mt-12"
          >
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-black/15 bg-white/60 px-4 py-4 text-center">
                <p className="text-[9px] font-black uppercase text-black/55">Kode Tiket</p>
                <p className="mt-2 text-3xl font-black uppercase text-black">{ticketCode}</p>
              </div>
              <div className="rounded-2xl border border-black/15 bg-white/45 px-4 py-4 text-center">
                <p className="text-[9px] font-black uppercase text-black/55">Poli</p>
                <p className="mt-2 truncate text-sm font-black uppercase text-[#23803B]">{clinicType}</p>
              </div>
              <div className="rounded-2xl border border-black/15 bg-white/45 px-4 py-4 text-center">
                <p className="text-[9px] font-black uppercase text-black/55">Dokter</p>
                <p className="mt-2 truncate text-sm font-black uppercase text-black">{doctorName}</p>
              </div>
              <div className="rounded-2xl border border-black/15 bg-white/45 px-4 py-4 text-center">
                <p className="text-[9px] font-black uppercase text-black/55">Ruangan</p>
                <p className="mt-2 truncate text-sm font-black uppercase text-black">{roomName}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
              <div>
                <label className="mb-3 block text-center text-sm font-black uppercase text-black">
                  NAMA PASIEN
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  className="app-input bg-[#E9E9E9] text-center uppercase"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-3 block text-center text-sm font-black uppercase text-black">
                  KODE TIKET
                </label>
                <input
                  type="text"
                  value={ticketCode}
                  readOnly
                  className="app-input bg-[#E9E9E9] text-center uppercase"
                />
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] font-bold uppercase text-black/55">
              Kode mengikuti nomor antrian tersedia dari poli yang dipilih
            </p>

            {error && (
              <p className="mt-5 text-center text-[11px] font-black text-[#B00000]">
                {error}
              </p>
            )}

            <div className="mx-auto mt-8 grid w-full max-w-xl grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => navigate("/admin-input-tiket")}
                className="app-button app-button-danger w-full text-[10px]"
              >
                BATAL
              </button>
              <button
                type="submit"
                disabled={!patientName.trim() || isLoading}
                className={`app-button app-button-muted w-full text-[10px] ${
                  !patientName.trim() || isLoading
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#63FF45]"
                }`}
              >
                {isLoading ? "MENYIMPAN..." : "LANJUT"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
