import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { TICKET_TIMEOUT_MINUTES, getClinicHoursLabel, getClinicOpenStatus, getClinics, getNextTicketCodeFromTickets, getPresentationTimeOverride, getTicketPrefixForClinic, getTicketRemainingMs, getTickets, setPresentationTimeOverride, updateTicketStatusById } from "../utils/api";
import { clearAdminSession } from "../utils/adminSession";
import { sendTicketNotificationSignal } from "../utils/ticketNotifications";

const DEFAULT_CLINICS = [
  { id: 1, name: "Poli Umum", openTime: "08:00", closeTime: "12:00" },
  { id: 2, name: "Poli Gigi", openTime: "09:00", closeTime: "12:00" },
  { id: 3, name: "Poli Lansia", openTime: "09:00", closeTime: "12:00" },
  { id: 4, name: "Poli Balita", openTime: "08:30", closeTime: "11:30" },
];

const STATUS_NOTE_OPTIONS = [
  "",
  "Pasien diminta menuju ruangan",
  "Pasien belum hadir",
  "Data pasien perlu dicek ulang",
  "Tiket dibatalkan atas permintaan pasien",
  "Silakan hubungi admin loket",
];

function HealthLogo() {
  return (
    <div className="flex flex-col items-start">
      <div className="relative h-[clamp(24px,8vw,34px)] w-[clamp(24px,8vw,34px)] rounded-sm bg-[#2E9D45]">
        <div className="absolute left-1/2 top-1/2 h-[68%] w-[22%] -translate-x-1/2 -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-[22%] w-[68%] -translate-x-1/2 -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-[42%] w-[14%] -translate-x-1/2 -translate-y-1/2 bg-[#E53535]" />
        <div className="absolute left-1/2 top-1/2 h-[14%] w-[42%] -translate-x-1/2 -translate-y-1/2 bg-[#E53535]" />
      </div>
      <p className="mt-0.5 text-[clamp(5px,1.8vw,7px)] font-black leading-tight text-[#2E7D32]">
        PUSKESMAS<br />SEKEMALA
      </p>
    </div>
  );
}

function clinicButtonLabel(name) {
  return String(name || "POLI").replace(/^Poli\s+/i, "POLI ").toUpperCase();
}

function formatRemaining(ms) {
  if (ms === null) return "BELUM DIPANGGIL";
  if (ms <= 0) return "HABIS";
  const totalMinutes = Math.ceil(ms / 60000);
  return `${totalMinutes} MENIT`;
}

function formatTicketTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatTicketTimeoutLabel(ticket) {
  if (ticket.status === "DIPANGGIL" && ticket.expiresAt) {
    return `Respon sampai ${formatTicketTime(ticket.expiresAt)}`;
  }

  if (ticket.status === "TIMEOUT") return "Batas respon habis";
  if (ticket.status === "MENUNGGU") return "Timeout mulai saat dipanggil";
  return `Status ${ticket.status}`;
}

function getStatusColorClass(status) {
  if (status === "DIPANGGIL") return "bg-[#25B9FF]";
  if (status === "DIBATALKAN") return "bg-[#FF2F1F]";
  if (status === "SELESAI") return "bg-[#63FF45]";
  if (status === "TIMEOUT") return "bg-[#FF8A1F]";
  return "bg-[#FFDA1F]";
}

function QueueCard({ title, number }) {
  return (
    <div className="flex h-[clamp(108px,15vw,150px)] flex-col items-center justify-center rounded-[clamp(18px,4vw,28px)] border border-black bg-[#D9D9D9] px-3 py-3 shadow-[0_3px_0_rgba(0,0,0,0.35)]">
      <p className="max-w-[88%] text-center text-[clamp(8px,1.7vw,11px)] font-black leading-tight text-black">
        {title}
      </p>
      {number && (
        <p className="mt-2 whitespace-nowrap text-center text-[clamp(28px,4.8vw,44px)] font-black leading-none tracking-wide text-black">
          {number}
        </p>
      )}
    </div>
  );
}

function TicketDisplayCard({ ticket, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-[132px] rounded-2xl border px-4 py-4 text-left shadow-[0_3px_0_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 ${
        isSelected
          ? "border-[#23803B] bg-[#DFF9DE] ring-2 ring-[#23803B]/35"
          : "border-black bg-[#E9E9E9]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[clamp(15px,2.5vw,22px)] font-black uppercase text-[#23803B]">
          {ticket.name || "Nama Pasien"}
        </p>
        <p className={`rounded-full border border-black px-3 py-1 text-[clamp(8px,1.6vw,10px)] font-black uppercase text-black ${getStatusColorClass(ticket.status)}`}>
          {ticket.status}
        </p>
      </div>
      <p className="mt-2 text-[clamp(24px,3vw,34px)] font-black uppercase leading-none text-black">
        {ticket.code}
      </p>
      <p className="mt-2 truncate text-[clamp(10px,1.8vw,13px)] font-black uppercase text-black">
        {ticket.clinicType}
      </p>
      <p className="truncate text-[clamp(9px,1.8vw,12px)] font-bold uppercase text-black/70">
        {ticket.roomName}
      </p>
      <p className="mt-2 text-[clamp(8px,1.6vw,10px)] font-black uppercase text-black/65">
        {formatTicketTimeoutLabel(ticket)}
      </p>
      {ticket.note && (
        <p className="mt-1 truncate text-[clamp(8px,1.6vw,10px)] font-black uppercase text-[#23803B]">
          Catatan: {ticket.note}
        </p>
      )}
    </button>
  );
}

function PillButton({ children, color = "bg-[#6BFF4B]", onClick, className = "", disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${color} ${className} flex min-h-[34px] items-center justify-center rounded-full border border-black px-4 py-1.5 text-[clamp(8px,2vw,11px)] font-black leading-tight text-black shadow-[0_2px_0_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 md:min-h-[42px] md:px-5 md:text-[12px]`}
    >
      {children}
    </button>
  );
}

function getClinicTicketSummary(tickets, clinic) {
  const clinicTickets = tickets.filter((ticket) => String(ticket.clinicId) === String(clinic.id));

  return clinicTickets.reduce(
    (summary, ticket) => {
      if (ticket.status === "MENUNGGU") summary.waiting += 1;
      if (ticket.status === "DIPANGGIL") summary.called += 1;
      if (ticket.status === "TIMEOUT") summary.timeout += 1;
      if (["MENUNGGU", "DIPANGGIL", "TIMEOUT"].includes(ticket.status)) {
        summary.needsAction += 1;
      }
      return summary;
    },
    { waiting: 0, called: 0, timeout: 0, needsAction: 0 }
  );
}

function ClinicFilterButton({ clinic, isSelected, summary, onClick }) {
  const hasAttention = summary.needsAction > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[74px] rounded-xl border px-3 py-2 text-left shadow-[0_2px_0_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 ${
        isSelected
          ? "border-[#155B28] bg-[#63FF45] ring-2 ring-[#155B28]/35"
          : hasAttention
            ? "border-black bg-[#FFDA1F]"
            : "border-black bg-[#D9D9D9]"
      }`}
    >
      {hasAttention && (
        <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border border-black bg-[#FF3D2E] px-1 text-[10px] font-black text-white">
          {summary.needsAction}
        </span>
      )}
      <p className="truncate text-[clamp(9px,2.3vw,12px)] font-black uppercase text-black">
        {clinicButtonLabel(clinic.name)}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        <div className="rounded-md bg-white/75 px-1 py-1">
          <p className="text-[7px] font-black uppercase text-black/60">Tunggu</p>
          <p className="text-sm font-black leading-none text-black">{summary.waiting}</p>
        </div>
        <div className="rounded-md bg-white/75 px-1 py-1">
          <p className="text-[7px] font-black uppercase text-black/60">Panggil</p>
          <p className="text-sm font-black leading-none text-black">{summary.called}</p>
        </div>
        <div className="rounded-md bg-white/75 px-1 py-1">
          <p className="text-[7px] font-black uppercase text-black/60">Timeout</p>
          <p className="text-sm font-black leading-none text-black">{summary.timeout}</p>
        </div>
      </div>
    </button>
  );
}

function LogoutConfirmModal({ onCancel, onConfirm }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto bg-black/45 px-5 py-8">
      <div className="w-full max-w-md rounded-2xl border border-black bg-[#D9E5D9] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <p className="text-lg font-black uppercase text-black">
          Logout Admin?
        </p>
        <p className="mt-2 text-xs font-bold text-black/70">
          Sesi admin akan ditutup dan kembali ke beranda.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="app-button app-button-muted min-w-0 w-full text-[10px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="app-button app-button-danger min-w-0 w-full text-[10px]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminBeranda() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [presentationTime, setPresentationTime] = useState(() => getPresentationTimeOverride());
  const [isPresentationTimeEnabled, setIsPresentationTimeEnabled] = useState(() => Boolean(getPresentationTimeOverride()));

  const refreshTicketData = useCallback(async (desiredCode) => {
    try {
      const [apiTickets, clinicData] = await Promise.all([
        getTickets(),
        getClinics(),
      ]);

      setTickets(apiTickets);
      setClinics(clinicData);
      setSelectedClinicId((currentClinicId) => currentClinicId || String(clinicData[0]?.id || ""));

      const normalizedDesired = desiredCode?.trim().toUpperCase();
      const exactMatch = normalizedDesired
        ? apiTickets.find((ticket) => ticket.code.toUpperCase() === normalizedDesired)
        : null;

      setSelectedCode((currentCode) => {
        if (exactMatch) return exactMatch.code;

        const currentSelected = apiTickets.find(
          (ticket) => ticket.code.toUpperCase() === currentCode.trim().toUpperCase()
        );
        return currentSelected?.code || "";
      });
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => refreshTicketData(), 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshTicketData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => refreshTicketData(), 3000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshTicketData]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshTicketData();
    };

    window.addEventListener("focus", refreshTicketData);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshTicketData);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshTicketData]);

  const visibleClinics = clinics.length ? clinics : DEFAULT_CLINICS;

  const selectedClinic = useMemo(
    () => visibleClinics.find((clinic) => String(clinic.id) === String(selectedClinicId)) || visibleClinics[0] || null,
    [selectedClinicId, visibleClinics]
  );

  const selectedClinicTickets = useMemo(
    () => tickets.filter((ticket) => String(ticket.clinicId) === String(selectedClinic?.id)),
    [selectedClinic, tickets]
  );

  const normalizeInputCode = (value) => {
    const rawValue = String(value || "").trim().toUpperCase();
    if (!rawValue) return "";
    if (rawValue.includes("-")) return rawValue;

    const prefix = getTicketPrefixForClinic(selectedClinic);
    const number = rawValue.replace(/\D/g, "");
    return number ? `${prefix}-${number.padStart(3, "0")}` : rawValue;
  };

  const selectedTicket = selectedClinicTickets.find(
    (ticket) => ticket.code.toUpperCase() === normalizeInputCode(selectedCode)
  ) || null;
  const selectedQueueCode = normalizeInputCode(selectedCode);

  const nextWaitingTicket = useMemo(() => {
    return selectedClinicTickets
      .filter((ticket) => ticket.status === "MENUNGGU")
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())[0] || null;
  }, [selectedClinicTickets]);

  const ticketDisplays = useMemo(() => {
    return [...selectedClinicTickets]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8);
  }, [selectedClinicTickets]);

  const getCurrentCallForClinic = (clinic) => {
    const clinicTickets = tickets.filter((ticket) => String(ticket.clinicId) === String(clinic.id));
    const calledTicket = clinicTickets.find((ticket) => ticket.status === "DIPANGGIL");

    return calledTicket?.code || "";
  };

  const handleCreateTicketForClinic = (clinic) => {
    const openStatus = getClinicOpenStatus(clinic);

    if (!openStatus.isOpen) {
      setSelectedClinicId(String(clinic.id));
      setStatusMessage(`${clinic.name} tutup. Tiket baru hanya bisa dibuat pada ${openStatus.openTime} - ${openStatus.closeTime}.`);
      return;
    }

    navigate("/admin-input-tiket", {
      state: {
        clinicId: clinic.id,
        clinicName: clinic.name,
        ticketCode: getNextTicketCodeFromTickets(tickets, clinic),
      },
    });
  };

  const handleChooseClinic = (clinicId) => {
    setSelectedClinicId(clinicId);
    setSelectedCode("");
    setSelectedNote("");
  };

  const handleSelectTicket = (ticket) => {
    setSelectedClinicId(String(ticket.clinicId));
    setSelectedCode(ticket.code);
    setSelectedNote(ticket.note || "");
    setStatusMessage("");
  };

  const isActiveStatus = (status) => selectedTicket?.status === status;

  const getStatusColor = (status) => {
    if (status === "MENUNGGU") return isActiveStatus(status) ? "bg-[#D8B71E]" : getStatusColorClass(status);
    if (status === "DIPANGGIL") return isActiveStatus(status) ? "bg-[#139AD8]" : getStatusColorClass(status);
    if (status === "TIMEOUT") return isActiveStatus(status) ? "bg-[#D56B12]" : getStatusColorClass(status);
    if (status === "DIBATALKAN") return isActiveStatus(status) ? "bg-[#C92620]" : getStatusColorClass(status);
    if (status === "SELESAI") return isActiveStatus(status) ? "bg-[#49D83A]" : getStatusColorClass(status);
    return "bg-[#9F9F9F]";
  };

  const ubahStatus = async (status) => {
    if (!selectedTicket) {
      setStatusMessage("Pilih poli, lalu input nomor tiket yang sesuai.");
      return;
    }

    try {
      const note = selectedNote.trim() || (status === "DIBATALKAN" ? "Tiket dibatalkan oleh admin" : "");
      const updated = await updateTicketStatusById(selectedTicket.id, status, note);
      setSelectedNote(note);
      setStatusMessage("");
      await refreshTicketData(updated.code);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const simpanCatatan = async () => {
    if (!selectedTicket) {
      setStatusMessage("Pilih tiket dulu sebelum menyimpan catatan.");
      return;
    }

    try {
      const note = selectedNote.trim();
      const updated = await updateTicketStatusById(selectedTicket.id, selectedTicket.status, note);
      setSelectedNote(note);
      setStatusMessage(note ? "Catatan berhasil dikirim ke informasi tiket pasien." : "Catatan berhasil dikosongkan.");
      await refreshTicketData(updated.code);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const panggilBerikutnya = async () => {
    if (!selectedClinic) {
      setStatusMessage("Pilih poli dulu untuk memanggil antrian berikutnya.");
      return;
    }

    if (!nextWaitingTicket) {
      setStatusMessage(`Tidak ada tiket menunggu di ${selectedClinic.name}.`);
      return;
    }

    try {
      const updated = await updateTicketStatusById(nextWaitingTicket.id, "DIPANGGIL", "Pasien diminta menuju ruangan");
      setSelectedCode(updated.code);
      setSelectedNote(updated.note || "Pasien diminta menuju ruangan");
      setStatusMessage("");
      await refreshTicketData(updated.code);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const kirimUlangNotifikasi = async () => {
    if (!selectedTicket) {
      setStatusMessage("Pilih tiket yang sedang dipanggil dulu.");
      return;
    }

    if (selectedTicket.status !== "DIPANGGIL") {
      setStatusMessage("Notifikasi panggilan hanya bisa dikirim untuk tiket berstatus DIPANGGIL.");
      return;
    }

    sendTicketNotificationSignal(selectedTicket);
    setStatusMessage(`Notifikasi panggilan ${selectedTicket.code} dikirim ulang.`);
    await refreshTicketData(selectedTicket.code);
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/");
  };

  const handlePresentationTimeChange = (value) => {
    setPresentationTime(value);
    setPresentationTimeOverride(value);
    setIsPresentationTimeEnabled(Boolean(value));
  };

  const togglePresentationTime = () => {
    if (isPresentationTimeEnabled) {
      setIsPresentationTimeEnabled(false);
      setPresentationTime("");
      setPresentationTimeOverride("");
      return;
    }

    const nextTime = presentationTime || "08:00";
    setIsPresentationTimeEnabled(true);
    setPresentationTime(nextTime);
    setPresentationTimeOverride(nextTime);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[#28392B] px-3 py-3 sm:py-5 lg:px-8">
      <div className="relative mx-auto min-h-[calc(100vh-24px)] w-full max-w-[1560px] overflow-hidden rounded-3xl bg-[#B8C8B9] text-black shadow-[0_24px_70px_rgba(0,0,0,0.28)] max-sm:rounded-none">
        <div className="h-[clamp(28px,8vw,42px)] bg-[#E8E8E8] px-2 pt-1 md:h-16 md:px-5 md:pt-3">
          <div className="flex items-start justify-between gap-3">
            <HealthLogo />
            <div className="flex gap-2 pt-1 md:pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin-account")}
                className="rounded-full border border-black bg-white px-3 py-1 text-[clamp(7px,1.8vw,9px)] font-black uppercase text-black shadow-[0_2px_0_rgba(0,0,0,0.2)]"
              >
                Akun
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-full border border-black bg-[#FF3D2E] px-3 py-1 text-[clamp(7px,1.8vw,9px)] font-black uppercase text-black shadow-[0_2px_0_rgba(0,0,0,0.2)]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="px-[clamp(10px,3vw,28px)] pb-8 pt-3 md:px-10 md:pb-12 md:pt-8 lg:px-16">
          <h1 className="mx-auto w-[72%] text-center text-[clamp(12px,3.6vw,17px)] font-black leading-tight text-[#23803B] md:w-full md:text-3xl">
            WAITING APP PUSKESMAS SEKEMALA
          </h1>

          <div className="mx-auto mt-6 grid max-w-[1240px] gap-5 md:mt-8 md:grid-cols-2 md:gap-6 xl:gap-7">
            {visibleClinics.map((clinic) => {
              const openStatus = getClinicOpenStatus(clinic);

              return (
                <div key={clinic.id} className="rounded-2xl bg-[#AFC1B0] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] md:p-5">
                  <h2 className="mb-1 text-center text-[clamp(12px,2.3vw,18px)] font-black uppercase leading-tight text-[#155B28]">
                    {clinicButtonLabel(clinic.name)}
                  </h2>
                  <p className="mb-1 text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-black md:text-[10px]">
                    JAM AKTIF {getClinicHoursLabel(clinic)}
                  </p>
                  <p className={`mb-2 text-center text-[clamp(7px,2vw,9px)] font-black uppercase md:mb-3 md:text-[10px] ${openStatus.isOpen ? "text-[#23803B]" : "text-[#B00000]"}`}>
                    {openStatus.isOpen ? "Sedang Aktif" : "Sedang Tutup"}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <QueueCard
                      title="NOMOR ANTRIAN REAL TIME"
                      number={getCurrentCallForClinic(clinic)}
                    />
                    <QueueCard
                      title="NOMOR ANTRIAN YANG TERSEDIA"
                      number={getNextTicketCodeFromTickets(tickets, clinic)}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <PillButton className="md:min-h-9 md:text-[10px]" onClick={() => refreshTicketData()}>
                      REFRESH
                    </PillButton>
                    <PillButton
                      className="md:min-h-9 md:text-[10px]"
                      onClick={() => handleCreateTicketForClinic(clinic)}
                      disabled={!openStatus.isOpen}
                      color={openStatus.isOpen ? "bg-[#6BFF4B]" : "bg-[#B9B9B9]"}
                    >
                      {openStatus.isOpen ? `ISI TIKET ${clinicButtonLabel(clinic.name)}` : "POLI TUTUP"}
                    </PillButton>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-[clamp(16px,5vw,24px)] max-w-6xl md:mt-10">
            <p className="mb-3 text-center text-[clamp(8px,2.2vw,10px)] font-black uppercase text-black/70 md:text-xs">
              Pilih poli untuk melihat dan memanggil antrian
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {visibleClinics.map((clinic) => (
                <ClinicFilterButton
                  key={clinic.id}
                  clinic={clinic}
                  isSelected={String(selectedClinic?.id) === String(clinic.id)}
                  summary={getClinicTicketSummary(tickets, clinic)}
                  onClick={() => handleChooseClinic(String(clinic.id))}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-black/70 md:text-xs">
            Timeout {TICKET_TIMEOUT_MINUTES} menit dimulai saat tiket dipanggil
          </p>
          {selectedClinic && (
            <p className="mt-1 text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-[#23803B] md:text-xs">
              Pilih poli, lalu panggil otomatis tiket menunggu berikutnya
            </p>
          )}

          <div className="mt-4 md:mt-7">
            <p className="text-center text-[clamp(8px,2.3vw,11px)] font-black uppercase text-black md:text-sm">
              8 Tampilan Tiket {selectedClinic?.name || "Terbaru"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                ticketDisplays[index] ? (
                  <TicketDisplayCard
                    key={ticketDisplays[index].id || ticketDisplays[index].code}
                    ticket={ticketDisplays[index]}
                    isSelected={selectedTicket?.code === ticketDisplays[index].code}
                    onSelect={() => handleSelectTicket(ticketDisplays[index])}
                  />
                ) : (
                  <div key={`empty-ticket-${index}`} className="flex min-h-[132px] items-center justify-center rounded-2xl border border-dashed border-black/35 bg-white/30 px-3 py-2 text-center text-[clamp(9px,1.8vw,12px)] font-black uppercase text-black/40">
                    Belum Ada Tiket
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="mx-auto mt-4 md:mt-7 md:grid md:max-w-5xl md:grid-cols-[220px_1fr] md:items-center md:gap-10">
            <div>
              <p className="mb-2 text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-black/70 md:text-xs">
                Tiket Dipilih
              </p>
              <div className="mx-auto flex aspect-square w-[clamp(64px,20vw,92px)] items-center justify-center rounded-[clamp(20px,6vw,28px)] border border-black bg-[#D9D9D9] shadow-[0_2px_0_rgba(0,0,0,0.24)] md:w-32">
                <input
                  value={selectedCode ? selectedQueueCode : ""}
                  onChange={(event) => setSelectedCode(event.target.value)}
                  placeholder="G-001"
                  className="h-full w-full bg-transparent text-center text-[clamp(17px,5vw,26px)] font-black uppercase text-black outline-none placeholder:text-black/35 md:text-4xl"
                  aria-label="Input nomor tiket"
                />
              </div>

              {(selectedCode || selectedTicket) && (
                <div className="mx-auto mt-3 max-w-[220px] rounded-xl border border-black/25 bg-white/45 px-3 py-3 text-center shadow-[0_1px_0_rgba(0,0,0,0.12)]">
                  <p className="text-[clamp(7px,2vw,9px)] font-black uppercase text-black/55 md:text-[10px]">
                    Nama Pasien
                  </p>
                  <p className="mt-0.5 break-words text-[clamp(16px,4vw,22px)] font-black uppercase leading-tight text-[#23803B]">
                    {selectedTicket?.name || "Belum ditemukan"}
                  </p>
                  {selectedTicket?.accessCode && (
                    <>
                      <p className="mt-2 text-[clamp(7px,2vw,9px)] font-black uppercase text-black/55 md:text-[10px]">
                        Kode Akses
                      </p>
                      <p className="mt-0.5 text-[clamp(16px,4vw,22px)] font-black uppercase leading-none text-[#23803B]">
                        {selectedTicket.accessCode}
                      </p>
                    </>
                  )}
                  <p className={`${selectedTicket?.accessCode ? "mt-2" : ""} text-[clamp(7px,2vw,9px)] font-black uppercase text-black/55 md:text-[10px]`}>
                    Kode Tiket
                  </p>
                  <p className="mt-0.5 text-[clamp(10px,2.8vw,14px)] font-black uppercase leading-none text-black/70">
                    {selectedQueueCode || "-"}
                  </p>
                  {selectedTicket?.roomName && (
                    <>
                      <p className="mt-2 text-[clamp(7px,2vw,9px)] font-black uppercase text-black/55 md:text-[10px]">
                        Ruangan
                      </p>
                      <p className="mt-0.5 break-words text-[clamp(10px,3vw,13px)] font-black uppercase leading-tight text-black">
                        {selectedTicket.roomName}
                      </p>
                    </>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/70 px-2 py-1">
                      <p className="text-[7px] font-black uppercase text-black/55">Poli</p>
                      <p className="truncate text-[9px] font-black uppercase text-black">
                        {selectedTicket?.clinicType || selectedClinic?.name || "-"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 px-2 py-1">
                      <p className="text-[7px] font-black uppercase text-black/55">Status</p>
                      <p className="truncate text-[9px] font-black uppercase text-black">
                        {selectedTicket?.status || "-"}
                      </p>
                    </div>
                  </div>
                  {selectedTicket?.note && (
                    <p className="mt-2 rounded-lg bg-[#DFF9DE] px-2 py-1 text-[8px] font-black uppercase text-[#23803B]">
                      Catatan: {selectedTicket.note}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="md:rounded-2xl md:bg-[#AFC1B0] md:p-5">
              <p className="mt-3 text-center text-[clamp(7px,2vw,9px)] font-black uppercase md:mt-0 md:text-xs">
                Kontrol Antrian
              </p>
              <div className="mx-auto mt-3 max-w-sm">
                <PillButton
                  color="bg-[#25B9FF]"
                  className="min-h-9 w-full text-[10px]"
                  onClick={panggilBerikutnya}
                  disabled={!nextWaitingTicket}
                >
                  PANGGIL BERIKUTNYA {nextWaitingTicket ? `(${nextWaitingTicket.code})` : ""}
                </PillButton>
              </div>
              <div className="mx-auto mt-2 max-w-sm">
                <PillButton
                  color="bg-[#25B9FF]"
                  className="min-h-9 w-full text-[10px]"
                  onClick={kirimUlangNotifikasi}
                  disabled={!selectedTicket || selectedTicket.status !== "DIPANGGIL"}
                >
                  KIRIM ULANG NOTIFIKASI
                </PillButton>
              </div>
              {statusMessage && (
                <p className="mx-auto mt-1 max-w-[88%] text-center text-[clamp(7px,2vw,9px)] font-black text-[#B00000] md:text-xs">
                  {statusMessage}
                </p>
              )}
              {selectedTicket && (
                <p className="mx-auto mt-1 max-w-[88%] text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-black/70 md:text-xs">
                  {selectedTicket.name || "Nama Pasien"} | Status: {selectedTicket.status} | Sisa: {formatRemaining(getTicketRemainingMs(selectedTicket))}
                </p>
              )}
              {selectedTicket && (
                <div className="mx-auto mt-3 max-w-sm">
                  <p className="mb-1 text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-black/70 md:text-xs">
                    Catatan Singkat
                  </p>
                  <select
                    value={selectedNote}
                    onChange={(event) => setSelectedNote(event.target.value)}
                    className="h-9 w-full rounded-xl border border-black bg-white px-3 text-[10px] font-black uppercase text-black outline-none"
                  >
                    {STATUS_NOTE_OPTIONS.map((note) => (
                      <option key={note || "empty-note"} value={note}>
                        {note || "Tanpa catatan"}
                      </option>
                    ))}
                  </select>
                  <PillButton
                    color="bg-[#63FF45]"
                    className="mt-2 min-h-8 w-full text-[10px]"
                    onClick={simpanCatatan}
                  >
                    SIMPAN CATATAN
                  </PillButton>
                </div>
              )}
              {selectedCode && !selectedTicket && (
                <p className="mx-auto mt-1 max-w-[88%] text-center text-[clamp(7px,2vw,9px)] font-black uppercase text-[#B00000] md:text-xs">
                  Tiket {selectedQueueCode} belum ada di {selectedClinic?.name || "poli ini"}
                </p>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 px-2 md:gap-4 md:px-0">
                <PillButton color={getStatusColor("MENUNGGU")} disabled={!selectedTicket} className="min-h-[16px] py-0 text-[clamp(6px,1.8vw,8px)] md:min-h-8 md:text-[10px]" onClick={() => ubahStatus("MENUNGGU")}>
                  MENUNGGU
                </PillButton>
                <PillButton color={getStatusColor("DIPANGGIL")} disabled={!selectedTicket} className="min-h-[16px] py-0 text-[clamp(6px,1.8vw,8px)] md:min-h-8 md:text-[10px]" onClick={() => ubahStatus("DIPANGGIL")}>
                  DIPANGGIL
                </PillButton>
                <PillButton color={getStatusColor("DIBATALKAN")} disabled={!selectedTicket} className="min-h-[16px] py-0 text-[clamp(6px,1.8vw,8px)] md:min-h-8 md:text-[10px]" onClick={() => ubahStatus("DIBATALKAN")}>
                  DIBATALKAN
                </PillButton>
              </div>

              <div className="mt-3 flex justify-center">
                <PillButton color={getStatusColor("SELESAI")} disabled={!selectedTicket} className="min-h-[16px] min-w-[58px] py-0 text-[clamp(6px,1.8vw,8px)] md:min-h-8 md:min-w-32 md:text-[10px]" onClick={() => ubahStatus("SELESAI")}>
                  SELESAI
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
      <div className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/40 bg-[#E8E8E8] px-3 py-2 text-[10px] font-black uppercase text-black shadow-[0_4px_12px_rgba(0,0,0,0.24)]">
        <span className="hidden sm:inline">Jam Test</span>
        <button
          type="button"
          onClick={togglePresentationTime}
          className={`h-7 rounded-full border border-black px-3 text-[10px] font-black uppercase shadow-[0_1px_0_rgba(0,0,0,0.25)] ${
            isPresentationTimeEnabled ? "bg-[#63FF45] text-black" : "bg-white text-black/65"
          }`}
        >
          {isPresentationTimeEnabled ? "ON" : "OFF"}
        </button>
        <select
          value={isPresentationTimeEnabled ? presentationTime : ""}
          onChange={(event) => handlePresentationTimeChange(event.target.value)}
          disabled={!isPresentationTimeEnabled}
          className="h-7 rounded-full border border-black bg-white px-2 text-[10px] font-black outline-none disabled:cursor-not-allowed disabled:bg-[#CFCFCF] disabled:text-black/45"
          aria-label="Pilih jam test presentasi"
        >
          <option value="">Sekarang</option>
          <option value="08:00">08:00</option>
          <option value="08:30">08:30</option>
          <option value="09:30">09:30</option>
          <option value="10:30">10:30</option>
          <option value="11:30">11:30</option>
          <option value="12:30">12:30</option>
        </select>
      </div>
    </div>
  );
}
