import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkPatientTicket, getClinicHoursLabel, getTicketRemainingMs, getTicketStatus, updateTicketStatusById } from "../utils/api";

const CANCEL_REASONS = [
  "Tidak jadi datang",
  "Salah pilih poli",
  "Sudah terlalu lama menunggu",
  "Kondisi membaik",
  "Lainnya",
];
const PATIENT_NOTIFICATION_KEY = "patientNotificationEnabled";

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

function TicketDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-[#23803B]/15 bg-white/55 px-2 py-1.5 text-left shadow-[0_2px_0_rgba(0,0,0,0.08)] md:rounded-2xl md:px-4 md:py-3">
      <p className="text-[7px] font-black uppercase tracking-wide text-black/55 md:text-[9px]">{label}</p>
      <div className="mt-0.5 flex min-h-6 items-center md:mt-1 md:min-h-8">
        <p className="break-words text-[10px] font-black uppercase leading-tight text-black sm:text-xs md:text-base">{value}</p>
      </div>
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "DIPANGGIL") return "bg-[#25B9FF]";
  if (status === "TIMEOUT") return "bg-[#FF8A1F]";
  if (status === "DIBATALKAN") return "bg-[#FF2F1F]";
  if (status === "SELESAI") return "bg-[#63FF45]";
  return "bg-[#FFDA1F]";
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatRemaining(ms) {
  if (ms === null) return "Belum dipanggil";
  if (ms <= 0) return "Habis";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getTimeoutEndLabel(ticket, expiresAt) {
  if (ticket?.status === "DIPANGGIL" && expiresAt) return formatTime(expiresAt);
  if (ticket?.status === "TIMEOUT") return "Habis";
  return "Mulai saat dipanggil";
}

function playCalledNotification() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const patternOffsets = [0, 0.18, 0.36, 0.68, 0.86, 1.04];
    const repeatCount = 3;

    Array.from({ length: repeatCount }).forEach((_, repeatIndex) => {
      const repeatOffset = repeatIndex * 1.55;
      patternOffsets.forEach((patternOffset, index) => {
        const offset = repeatOffset + patternOffset;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, audioContext.currentTime + offset);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + offset + 0.14);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime + offset);
        oscillator.stop(audioContext.currentTime + offset + 0.16);
      });
    });
  } catch {
    // Browsers can block audio without user interaction; visual alert still works.
  }
}

function playNotificationPreview() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    [0, 0.18, 0.36].forEach((offset, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, audioContext.currentTime + offset);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + offset + 0.14);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + offset);
      oscillator.stop(audioContext.currentTime + offset + 0.16);
    });
  } catch {
    // Browser can block sound; visual state still updates.
  }
}

export default function TicketInfo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const patientCode = state?.patientCode || "";
  const [ticket, setTicket] = useState(() => state?.ticket || null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (state?.notificationEnabled) return true;
    try {
      return localStorage.getItem(PATIENT_NOTIFICATION_KEY) === "true";
    } catch {
      return false;
    }
  });
  const previousStatusRef = useRef(ticket ? getTicketStatus(ticket) : "");
  const previousNotificationSignalRef = useRef(ticket?.notificationSignal || "");

  useEffect(() => {
    if (!patientCode) return undefined;

    const refreshTicket = async () => {
      try {
        const updatedTicket = await checkPatientTicket({
          patientName: state?.patientName || ticket?.name || "",
          ticketCode: patientCode,
        });
        setTicket(updatedTicket);
        setError("");
      } catch (error) {
        setError(error.message);
      }
    };

    refreshTicket();
    const intervalId = window.setInterval(refreshTicket, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [patientCode, state?.patientName, ticket?.name]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNow(Date.now()), 0);
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!ticket) return;

    const currentStatus = getTicketStatus(ticket);
    const previousStatus = previousStatusRef.current;
    const currentNotificationSignal = ticket.notificationSignal || "";
    const previousNotificationSignal = previousNotificationSignalRef.current;

    if (currentStatus === "DIPANGGIL" && previousStatus !== "DIPANGGIL" && isSoundEnabled) {
      playCalledNotification();
    }

    if (
      currentStatus === "DIPANGGIL"
      && currentNotificationSignal
      && currentNotificationSignal !== previousNotificationSignal
      && isSoundEnabled
    ) {
      playCalledNotification();
    }

    previousStatusRef.current = currentStatus;
    previousNotificationSignalRef.current = currentNotificationSignal;
  }, [isSoundEnabled, ticket]);

  const patientName = ticket?.name || state?.patientName || "-";
  const ticketStatus = ticket ? getTicketStatus(ticket) : "MENUNGGU";
  const ticketNumber = ticket?.code || patientCode || "-";
  const clinicType = ticket?.clinicType || "Poli Gigi";
  const doctorName = ticket?.doctorName || "drg. Andi Pratama, Sp.KG";
  const roomName = ticket?.roomName || "Ruangan 4";
  const ticketNote = ticket?.note || "";
  const expiresAt = ticket?.expiresAt || "";
  const remainingMs = ticket ? getTicketRemainingMs(ticket) : 0;
  const remainingLabel = now ? formatRemaining(remainingMs) : "-";
  const statusColor = getStatusStyle(ticketStatus);
  const canCancelTicket = Boolean(ticket?.id) && ["MENUNGGU", "DIPANGGIL"].includes(ticketStatus);
  const finalCancelReason = cancelReason === "Lainnya" ? customCancelReason.trim() : cancelReason;
  const isCalled = ticketStatus === "DIPANGGIL";

  const handleCancelTicket = async () => {
    if (!ticket?.id) {
      setError("Tiket belum bisa dibatalkan. Silakan cek ulang kode tiket.");
      return;
    }

    if (!finalCancelReason) {
      setError("Alasan pembatalan wajib diisi.");
      return;
    }

    try {
      setIsCanceling(true);
      const note = `Dibatalkan pasien: ${finalCancelReason}`;
      const updatedTicket = await updateTicketStatusById(ticket.id, "DIBATALKAN", note);
      setTicket(updatedTicket);
      setShowCancelForm(false);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card app-card-green ticket-info-card">
        <div className="flex items-start gap-3 border-b border-[#23803B]/15 pb-3 md:gap-5 md:pb-5">
          <HealthLogo />
          <h1 className="app-title mt-2 text-left text-lg sm:text-2xl lg:text-4xl">
            INFORMASI TIKET
          </h1>
        </div>

        {isCalled && (
          <div className="patient-call-banner mx-auto mt-3 w-full max-w-6xl rounded-2xl border border-black bg-[#25B9FF] px-4 py-4 text-center shadow-[0_4px_0_rgba(0,0,0,0.25)] md:mt-5">
            <p className="text-xl font-black uppercase text-black md:text-3xl">
              Tiket Anda Dipanggil
            </p>
            <p className="mt-1 text-xs font-black uppercase text-black/75 md:text-sm">
              Silakan menuju {roomName}
            </p>
          </div>
        )}

        <div className="mx-auto mt-4 grid w-full max-w-6xl gap-3 md:mt-8 md:gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
          <div className="patient-ticket-main rounded-2xl border border-black/20 bg-[#AFC1B0] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] md:rounded-3xl md:p-5">
            <div className="text-center">
              <div>
                <p className="text-[9px] font-black uppercase text-black/65 md:text-[11px]">Nomor Tiket</p>
                <div className="info-card mx-auto mt-2 flex min-h-20 w-full max-w-[230px] items-center justify-center bg-white/90 px-4 py-3 md:mt-4 md:min-h-36 md:max-w-[280px] md:px-5 md:py-6">
                  <p className="whitespace-nowrap text-[clamp(32px,10.5vw,44px)] font-black leading-none tracking-wide text-black md:text-[clamp(42px,7vw,66px)]">
                    {ticketNumber}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-center md:mt-5">
                <p className="text-[8px] font-black uppercase text-black/65 md:text-[11px]">Status</p>
                <div className={`mx-auto mt-1.5 flex h-9 w-full max-w-[170px] items-center justify-center rounded-xl border border-black px-3 ${statusColor} shadow-[0_3px_0_rgba(0,0,0,0.25)] md:mt-2 md:h-16 md:max-w-44 md:rounded-2xl`}>
                  <p className="text-[12px] font-black uppercase text-black md:text-2xl">{ticketStatus}</p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs font-black uppercase text-[#23803B] md:mt-4 md:text-sm">
              {patientName}
            </p>
            <p className="mt-0.5 text-[10px] font-black uppercase text-black/65 md:mt-1 md:text-xs">
              {clinicType}
            </p>
          </div>

          <div className="patient-ticket-details rounded-2xl border border-[#23803B]/15 bg-[#BFD0C0] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] md:rounded-3xl md:p-5">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <TicketDetail label="Nama Pasien" value={patientName} />
              <TicketDetail label="Kode Tiket" value={patientCode || ticketNumber} />
              <TicketDetail label="Jenis Poli" value={clinicType} />
              <TicketDetail label="Nama Dokter" value={doctorName} />
              <TicketDetail label="Ruangan" value={roomName} />
              <TicketDetail label="Jam Aktif Poli" value={getClinicHoursLabel({ name: clinicType })} />
              <TicketDetail label="Batas Respon" value={getTimeoutEndLabel(ticket, expiresAt)} />
              <TicketDetail label="Sisa Waktu" value={remainingLabel} />
              <div className="md:col-span-2">
                <TicketDetail label="Informasi Layanan" value={ticketNote || "Belum ada informasi tambahan"} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-6xl text-center md:mt-8">
          <button
            type="button"
            onClick={() => {
              setIsSoundEnabled(true);
              try {
              localStorage.setItem(PATIENT_NOTIFICATION_KEY, "true");
              } catch {
                // Continue if storage is blocked.
              }
              playNotificationPreview();
            }}
            className={`app-button mx-auto mt-2 text-[10px] ${isSoundEnabled ? "" : "app-button-muted"}`}
          >
            {isSoundEnabled ? "NOTIFIKASI AKTIF" : "AKTIFKAN NOTIFIKASI"}
          </button>
          {(error || !ticket) && (
            <p className="mx-auto mt-4 max-w-sm text-[11px] font-black text-[#B00000]">
              {error || "Tiket tidak ditemukan. Silakan login ulang memakai kode tiket dari admin."}
            </p>
          )}
          {canCancelTicket && !showCancelForm && (
            <button
              type="button"
              onClick={() => setShowCancelForm(true)}
              className="app-button app-button-danger mx-auto mt-4 text-[10px]"
            >
              BATALKAN TIKET
            </button>
          )}
          {canCancelTicket && showCancelForm && (
            <div className="patient-cancel-panel mx-auto mt-4 max-w-xl rounded-2xl border border-[#B00000]/30 bg-[#FFE5E5] p-4 text-left">
              <p className="text-center text-[10px] font-black uppercase text-[#B00000]">
                Alasan Pembatalan
              </p>
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="mt-3 h-10 w-full rounded-xl border border-black bg-white px-3 text-[10px] font-black uppercase text-black outline-none"
              >
                {CANCEL_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {cancelReason === "Lainnya" && (
                <input
                  value={customCancelReason}
                  onChange={(event) => setCustomCancelReason(event.target.value)}
                  placeholder="Tulis alasan pembatalan"
                  className="mt-3 h-10 w-full rounded-xl border border-black bg-white px-3 text-[10px] font-black uppercase text-black outline-none placeholder:text-black/40"
                />
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelForm(false)}
                  className="app-button app-button-muted min-w-0 w-full text-[10px]"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleCancelTicket}
                  disabled={isCanceling || !finalCancelReason}
                  className="app-button app-button-danger min-w-0 w-full text-[10px] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCanceling ? "MEMBATALKAN..." : "KONFIRMASI"}
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/input-tiket")}
            className="app-button app-button-muted mx-auto mt-3 text-[10px] md:mt-6"
          >
            KEMBALI
          </button>
        </div>
      </div>
    </div>
  );
}

