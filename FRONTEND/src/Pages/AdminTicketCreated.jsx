import { useLocation, useNavigate } from "react-router-dom";
import { TICKET_TIMEOUT_MINUTES } from "../utils/api";

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

export default function AdminTicketCreated() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const patientName = state?.patientName || "CAHYADI";
  const ticketCode = state?.ticketCode || "-";
  const accessCode = state?.accessCode || "-";

  return (
    <div className="app-shell">
      <div className="app-card app-card-green compact-card">
        <div className="mx-auto w-full max-w-4xl">
          <HealthLogo />

          <div className="content-panel mx-auto mt-10 max-w-3xl text-center md:mt-12">
            <p className="text-[10px] font-black uppercase text-black/55">
              Tiket berhasil dibuat
            </p>
            <div className="info-card mx-auto mt-5 flex min-h-32 w-full max-w-sm items-center justify-center bg-white/90 px-6 py-6">
              <p className="whitespace-nowrap text-5xl font-black uppercase tracking-wide text-black md:text-6xl">
                {ticketCode}
              </p>
            </div>
            <h1 className="app-title mt-7 text-xl uppercase md:text-3xl">
              {patientName}
            </h1>
            <div className="mx-auto mt-5 grid max-w-xl gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[#23803B]/20 bg-white/55 px-5 py-4">
                <p className="text-[9px] font-black uppercase text-black/55">Status</p>
                <p className="mt-1 text-base font-black uppercase text-[#23803B]">Menunggu</p>
              </div>
              <div className="rounded-2xl border border-[#23803B]/20 bg-white/55 px-5 py-4">
                <p className="text-[9px] font-black uppercase text-black/55">Timeout</p>
                <p className="mt-1 text-sm font-black uppercase text-black">
                  {TICKET_TIMEOUT_MINUTES} menit setelah dipanggil
                </p>
              </div>
            </div>
            <div className="mx-auto mt-3 max-w-xl rounded-2xl border border-black bg-[#DFF9DE] px-5 py-4">
              <p className="text-[9px] font-black uppercase text-black/55">Kode Akses Pasien</p>
              <p className="mt-1 text-3xl font-black uppercase tracking-wide text-black">{accessCode}</p>
              <p className="mt-1 text-[10px] font-bold uppercase text-black/60">
                Berikan kode ini ke pasien untuk melihat informasi tiket.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin-beranda")}
            className="app-button mx-auto mt-8 flex items-center justify-center text-[10px]"
          >
            KEMBALI KE DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
