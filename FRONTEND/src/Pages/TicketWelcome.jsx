import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const PATIENT_NOTIFICATION_KEY = "patientNotificationEnabled";

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
      gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + offset + 0.14);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + offset);
      oscillator.stop(audioContext.currentTime + offset + 0.16);
    });
  } catch {
    // Visual notification still works if browser blocks sound.
  }
}

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

export default function TicketWelcome() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const ticket = state?.ticket || null;
  const patientName = ticket?.name || state?.patientName || "-";
  const patientCode = ticket?.code || state?.patientCode || "";
  const accessCode = ticket?.accessCode || state?.accessCode || "";
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(() => {
    try {
      return localStorage.getItem(PATIENT_NOTIFICATION_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleEnableNotification = () => {
    playNotificationPreview();
    setIsNotificationEnabled(true);
    try {
      localStorage.setItem(PATIENT_NOTIFICATION_KEY, "true");
    } catch {
      // Continue even if storage is unavailable.
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card relative">
        <div className="mb-5 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <div className="form-panel mx-auto max-w-3xl items-center text-center">
          <div className="rounded-3xl border border-[#23803B]/20 bg-white/55 px-8 py-8 text-center">
            <p className="app-title text-xl lg:text-3xl">
              SELAMAT DATANG
            </p>
            <p className="mt-5 text-lg font-black uppercase text-[#23803B] lg:text-2xl">
              {patientName}
            </p>
            <p className="mt-3 rounded-full bg-white px-5 py-2 text-sm font-black uppercase text-black">
              {patientCode || "Kode tiket belum tersedia"}
            </p>
            {accessCode && (
              <p className="mt-2 text-[10px] font-black uppercase text-black/55">
                Kode akses: {accessCode}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleEnableNotification}
            className={`app-button mx-auto mt-8 ${isNotificationEnabled ? "" : "app-button-muted"}`}
          >
            {isNotificationEnabled ? "NOTIFIKASI AKTIF" : "AKTIFKAN NOTIFIKASI"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/informasi-tiket", {
                state: { patientName, patientCode, accessCode, ticket, notificationEnabled: isNotificationEnabled },
              })
            }
            disabled={!patientCode || !isNotificationEnabled}
            className="app-button mt-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            LIHAT INFORMASI TIKET
          </button>
          {!isNotificationEnabled && (
            <p className="mt-3 text-center text-[10px] font-black uppercase text-[#B00000]">
              Aktifkan notifikasi dulu agar panggilan tiket terdengar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

