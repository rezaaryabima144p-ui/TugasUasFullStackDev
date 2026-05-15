import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkPatientTicket } from "../utils/api";

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

export default function TicketInput() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!patientName.trim() || !accessCode.trim()) {
      setError("Nama pasien dan kode akses wajib diisi dulu.");
      return;
    }

    try {
      setIsLoading(true);
      const ticket = await checkPatientTicket({
        patientName: patientName.trim(),
        ticketCode: accessCode.trim(),
      });

      setError("");
      navigate("/tiket-welcome", {
        state: {
          patientName: ticket.name,
          patientCode: ticket.code,
          accessCode: ticket.accessCode,
          ticket,
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
      <div className="app-card relative">
        <div className="mb-6 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-panel mx-auto max-w-4xl"
        >
          <div className="text-center">
            <h1 className="app-title text-2xl md:text-4xl">
              Masuk Tiket Pasien
            </h1>
            <p className="mt-3 text-sm font-bold text-black/65">
              Gunakan nama pasien dan kode tiket yang sudah diberikan admin.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <label className="field-label">
              NAMA PASIEN
              </label>
              <input
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                className="app-input"
              />
            </div>

            <div>
              <label className="field-label">
              KODE AKSES
              </label>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                className="app-input text-center uppercase"
              />
            </div>
          </div>

          <p className="mt-6 rounded-2xl border border-[#23803B]/20 bg-white/45 px-5 py-3 text-center text-[11px] font-black leading-tight text-black/70">
            Masukkan kode akses unik dari admin. Nomor antrian tetap tampil setelah tiket ditemukan.
          </p>

          {error && (
            <p className="mt-4 text-center text-[11px] font-black text-[#B00000]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="app-button app-button-muted mx-auto mt-8 hover:bg-[#63FF45] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "MEMERIKSA..." : "LANJUT"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-link mx-auto mt-5"
          >
            KEMBALI KE HOME
          </button>
        </form>
      </div>
    </div>
  );
}

