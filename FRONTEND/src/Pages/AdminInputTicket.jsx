import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FALLBACK_CLINICS, FALLBACK_DOCTORS, FALLBACK_ROOMS, TICKET_TIMEOUT_MINUTES, getClinicHoursLabel, getClinicOpenStatus, getClinics, getDoctors, getNextTicketCodeFromTickets, getRooms, getTickets } from "../utils/api";

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

function SelectField({ label, value, onChange, children }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase text-black">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="app-select text-xs uppercase"
      >
        {children}
      </select>
    </div>
  );
}

export default function AdminInputTicket() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const hasSelectedClinicFromBeranda = Boolean(state?.clinicId);
  const initialFallbackClinic = FALLBACK_CLINICS.find((clinic) => String(clinic.id) === String(state?.clinicId))
    || FALLBACK_CLINICS.find((clinic) => clinic.name?.toUpperCase() === state?.clinicName?.toUpperCase())
    || FALLBACK_CLINICS[0];
  const [tickets, setTickets] = useState([]);
  const [clinics, setClinics] = useState(FALLBACK_CLINICS);
  const [doctors, setDoctors] = useState(FALLBACK_DOCTORS);
  const [rooms, setRooms] = useState(FALLBACK_ROOMS);
  const [clinicId, setClinicId] = useState(String(initialFallbackClinic?.id || ""));
  const [doctorId, setDoctorId] = useState(String(FALLBACK_DOCTORS[0]?.id || ""));
  const [roomId, setRoomId] = useState(String(FALLBACK_ROOMS[0]?.id || ""));
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [ticketData, clinicData, doctorData, roomData] = await Promise.all([
          getTickets(),
          getClinics(),
          getDoctors(),
          getRooms(),
        ]);

        if (!isMounted) return;

        setTickets(ticketData);
        setClinics(clinicData);
        setDoctors(doctorData);
        setRooms(roomData);
        const requestedClinicId = state?.clinicId ? String(state.clinicId) : "";
        const requestedClinicName = String(state?.clinicName || "").toUpperCase();
        const matchingClinic = clinicData.find((clinic) => String(clinic.id) === requestedClinicId)
          || clinicData.find((clinic) => String(clinic.name || "").toUpperCase() === requestedClinicName)
          || clinicData[0];
        const initialClinicId = String(matchingClinic?.id || "");
        setClinicId(initialClinicId);
        setDoctorId(String(doctorData[0]?.id || ""));
        setRoomId(String(roomData[0]?.id || ""));
        setError("");
      } catch (error) {
        if (isMounted) setError(error.message);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [state?.clinicId, state?.clinicName]);

  const filteredDoctors = useMemo(() => {
    const matchingDoctors = doctors.filter((doctor) => String(doctor.clinic_id) === String(clinicId));
    return matchingDoctors.length ? matchingDoctors : doctors;
  }, [clinicId, doctors]);

  const filteredRooms = useMemo(() => {
    const matchingRooms = rooms.filter((room) => String(room.clinic_id) === String(clinicId));
    return matchingRooms.length ? matchingRooms : rooms;
  }, [clinicId, rooms]);

  useEffect(() => {
    if (!filteredDoctors.length) return;
    const stillAvailable = filteredDoctors.some((doctor) => String(doctor.id) === String(doctorId));
    if (!stillAvailable) {
      const timeoutId = window.setTimeout(() => setDoctorId(String(filteredDoctors[0].id)), 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [doctorId, filteredDoctors]);

  useEffect(() => {
    if (!filteredRooms.length) return;
    const stillAvailable = filteredRooms.some((room) => String(room.id) === String(roomId));
    if (!stillAvailable) {
      const timeoutId = window.setTimeout(() => setRoomId(String(filteredRooms[0].id)), 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [filteredRooms, roomId]);

  const selectedClinic = clinics.find((clinic) => String(clinic.id) === String(clinicId));
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === String(doctorId));
  const selectedRoom = rooms.find((room) => String(room.id) === String(roomId));
  const computedTicketCode = getNextTicketCodeFromTickets(tickets, selectedClinic);
  const nextTicketCode = state?.ticketCode || computedTicketCode;
  const selectedClinicOpenStatus = selectedClinic ? getClinicOpenStatus(selectedClinic) : null;
  const isSelectedClinicOpen = selectedClinicOpenStatus?.isOpen !== false;

  const handleAddTicket = () => {
    if (!clinicId || !doctorId || !roomId) {
      setError("Data poli, dokter, dan ruangan belum lengkap dari backend.");
      return;
    }

    if (!isSelectedClinicOpen) {
      setError(`${selectedClinic?.name || "Poli"} tutup. Tiket baru hanya bisa dibuat pada ${selectedClinicOpenStatus.openTime} - ${selectedClinicOpenStatus.closeTime}.`);
      return;
    }

    navigate("/admin-connect-ticket", {
      state: {
        ticketCode: nextTicketCode,
        clinicId,
        doctorId,
        roomId,
        clinicType: selectedClinic?.name || "-",
        doctorName: selectedDoctor?.name || "-",
        roomName: selectedRoom?.name || "-",
      },
    });
  };

  return (
    <div className="app-shell">
      <div className="app-card app-card-green">
        <div className="app-header">
          <HealthLogo />
          <button
            type="button"
            onClick={() => navigate("/admin-beranda")}
            className="app-button app-button-muted min-w-0 px-5 text-[10px]"
          >
            BERANDA
          </button>
        </div>

        <div className="content-panel mx-auto mt-6 w-full max-w-6xl">
          <div className="text-center">
            <h1 className="app-title text-xl md:text-3xl">
              INPUT JENIS TIKET
            </h1>
            <p className="mt-2 text-xs font-black uppercase text-black/60">
              Pilih poli, dokter, dan ruangan sebelum menghubungkan tiket ke pasien
            </p>
          </div>

          {error && (
            <p className="mt-4 text-center text-[11px] font-black text-[#B00000]">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-stretch">
            <div className="rounded-3xl border border-black/15 bg-[#AFC1B0] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <p className="text-[10px] font-black uppercase text-black/60">
                Nomor Antrian Tersedia
              </p>
              <div className="info-card mx-auto mt-5 flex min-h-44 w-full max-w-[260px] items-center justify-center bg-white px-5 py-6">
                <p className="whitespace-nowrap text-[clamp(42px,6vw,64px)] font-black leading-none tracking-wide text-black">
                  {nextTicketCode}
                </p>
              </div>
              <p className="mt-5 text-sm font-black uppercase text-[#23803B]">
                {selectedClinic?.name || "Pilih Poli"}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-black/60">
                {selectedDoctor?.name || "Dokter belum dipilih"}
              </p>
            </div>

            <form className="rounded-3xl border border-[#23803B]/15 bg-white/35 p-5 md:p-6">
              <div className="grid gap-5 md:grid-cols-2">
              {hasSelectedClinicFromBeranda ? (
                <div>
                  <p className="mb-2 block text-[10px] font-black uppercase text-black">
                    Jenis Poli
                  </p>
                  <div className="flex h-[54px] items-center rounded-xl border-[1.5px] border-[#111111] bg-white px-5 text-xs font-black uppercase text-black">
                    {selectedClinic?.name || state?.clinicName || "Poli"}
                  </div>
                </div>
              ) : (
                <SelectField
                  label="Jenis Poli"
                  value={clinicId}
                  onChange={(event) => setClinicId(event.target.value)}
                >
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                  ))}
                </SelectField>
              )}

              <SelectField
                label="Nama Dokter"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                {filteredDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </SelectField>

                <div className="md:col-span-2">
                  <SelectField
                    label="Ruangan"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                  >
                    {filteredRooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </SelectField>
                </div>
              </div>

              {selectedClinic && (
                <div className={`mt-5 rounded-2xl border px-4 py-4 text-[10px] font-black uppercase ${
                  isSelectedClinicOpen
                    ? "border-[#23803B]/35 bg-white/65 text-black"
                    : "border-[#B00000]/40 bg-[#FFE5E5] text-[#B00000]"
                }`}>
                  <div className="grid gap-2 md:grid-cols-3">
                    <p>Jam Aktif Poli: {getClinicHoursLabel(selectedClinic)}</p>
                    <p>Timeout Setelah Dipanggil: {TICKET_TIMEOUT_MINUTES} Menit</p>
                    <p>Status: {isSelectedClinicOpen ? "Sedang Aktif" : "Sedang Tutup"}</p>
                  </div>
                </div>
              )}

              <div className="mt-7 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin-beranda")}
                  className="app-button app-button-danger min-w-36 text-[10px]"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleAddTicket}
                  disabled={!clinicId || !doctorId || !roomId || !isSelectedClinicOpen}
                  className="app-button min-w-40 text-[10px] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSelectedClinicOpen ? "TAMBAH TIKET" : "POLI TUTUP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
