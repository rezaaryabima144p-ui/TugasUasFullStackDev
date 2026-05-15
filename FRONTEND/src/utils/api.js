import { findTicket, getAllTickets, saveTicket, updateTicketStatus } from "./ticketStorage";
import { getTicketNote, saveTicketNote } from "./ticketNotes";
import { generateTicketAccessCode, getTicketAccessCode, isMatchingTicketAccess, saveTicketAccessCode } from "./ticketAccessCodes";
import { getTicketNotificationSignal } from "./ticketNotifications";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export const TICKET_TIMEOUT_MINUTES = 30;
export const PRESENTATION_TIME_KEY = "presentationTimeOverride";

const LOCAL_CLINICS = [
  { id: 1, name: "Poli Umum", openTime: "08:00", closeTime: "12:00", status: "ACTIVE" },
  { id: 2, name: "Poli Gigi", openTime: "09:00", closeTime: "12:00", status: "ACTIVE" },
  { id: 3, name: "Poli Lansia", openTime: "09:00", closeTime: "12:00", status: "ACTIVE" },
  { id: 4, name: "Poli Balita", openTime: "08:30", closeTime: "11:30", status: "ACTIVE" },
];

const LOCAL_DOCTORS = [
  { id: 1, clinic_id: 1, name: "dr. Siti Aminah", specialization: "Dokter Umum", status: "ACTIVE" },
  { id: 2, clinic_id: 1, name: "dr. Ahmad Fauzi", specialization: "Dokter Umum", status: "ACTIVE" },
  { id: 3, clinic_id: 2, name: "drg. Andi Pratama", specialization: "Dokter Gigi", status: "ACTIVE" },
  { id: 4, clinic_id: 2, name: "drg. Putri Lestari", specialization: "Dokter Gigi", status: "ACTIVE" },
  { id: 5, clinic_id: 3, name: "dr. Rina Melati", specialization: "Dokter Lansia", status: "ACTIVE" },
  { id: 6, clinic_id: 3, name: "dr. Hendra Wijaya", specialization: "Dokter Lansia", status: "ACTIVE" },
  { id: 7, clinic_id: 4, name: "dr. Budi Santoso", specialization: "Dokter Balita", status: "ACTIVE" },
  { id: 8, clinic_id: 4, name: "dr. Maya Kartika", specialization: "Dokter Balita", status: "ACTIVE" },
];

const LOCAL_ROOMS = [
  { id: 1, clinic_id: 1, name: "Ruang Pemeriksaan Umum 1", status: "ACTIVE" },
  { id: 2, clinic_id: 1, name: "Ruang Pemeriksaan Umum 2", status: "ACTIVE" },
  { id: 3, clinic_id: 2, name: "Ruang Perawatan Gigi 1", status: "ACTIVE" },
  { id: 4, clinic_id: 2, name: "Ruang Perawatan Gigi 2", status: "ACTIVE" },
  { id: 5, clinic_id: 3, name: "Ruang Pemeriksaan Lansia 1", status: "ACTIVE" },
  { id: 6, clinic_id: 3, name: "Ruang Pemeriksaan Lansia 2", status: "ACTIVE" },
  { id: 7, clinic_id: 4, name: "Ruang Pemeriksaan Balita 1", status: "ACTIVE" },
  { id: 8, clinic_id: 4, name: "Ruang Pemeriksaan Balita 2", status: "ACTIVE" },
];

export const FALLBACK_CLINICS = LOCAL_CLINICS;
export const FALLBACK_DOCTORS = LOCAL_DOCTORS;
export const FALLBACK_ROOMS = LOCAL_ROOMS;

function hasName(items) {
  return items.some((item) => String(item.name || "").trim());
}

function hasUsableOptions(items) {
  return items.some((item) => String(item.id || "").trim() && String(item.name || "").trim());
}

function getFallbackClinicHours(clinic) {
  const clinicName = String(clinic?.name || "").toUpperCase();
  const clinicId = String(clinic?.id || "");

  if (clinicId === "2" || clinicName.includes("GIGI")) return { openTime: "09:00", closeTime: "12:00" };
  if (clinicId === "3" || clinicName.includes("LANSIA")) return { openTime: "09:00", closeTime: "12:00" };
  if (clinicId === "4" || clinicName.includes("BALITA") || clinicName.includes("ANAK")) {
    return { openTime: "08:30", closeTime: "11:30" };
  }

  return { openTime: "08:00", closeTime: "12:00" };
}

function addMinutes(dateValue, minutes) {
  const date = new Date(dateValue || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function normalizeClinic(clinic) {
  const namedClinic = {
    ...clinic,
    id: clinic.id || clinic.clinic_id || clinic.poli_id || clinic.id_poli,
    name: clinic.name || clinic.clinic_name || clinic.poli_name || clinic.nama_poli || clinic.jenis_poli || clinic.nama || "",
  };
  const fallbackHours = getFallbackClinicHours(namedClinic);

  return {
    ...namedClinic,
    openTime: clinic.openTime || clinic.open_time || clinic.jam_buka || fallbackHours.openTime,
    closeTime: clinic.closeTime || clinic.close_time || clinic.jam_tutup || fallbackHours.closeTime,
  };
}

function normalizeDoctor(doctor) {
  return {
    ...doctor,
    id: doctor.id || doctor.doctor_id || doctor.dokter_id,
    clinic_id: doctor.clinic_id || doctor.clinicId || doctor.clinic?.id || doctor.poli_id || doctor.id_poli,
    name: doctor.name || doctor.doctor_name || doctor.nama_dokter || doctor.full_name || doctor.nama || "",
  };
}

function normalizeRoom(room) {
  return {
    ...room,
    id: room.id || room.room_id || room.ruangan_id,
    clinic_id: room.clinic_id || room.clinicId || room.clinic?.id || room.poli_id || room.id_poli,
    name: room.name || room.room_name || room.nama_ruangan || room.kode_ruangan || room.nama || "",
  };
}

function endpoint(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function extractCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extractTicket(data) {
  return data?.ticket || data;
}

function normalizeApiStatus(status) {
  const normalizedStatus = String(status || "MENUNGGU").trim().toUpperCase();

  if (normalizedStatus === "MENUNGGU") return "MENUNGGU";
  if (normalizedStatus === "DIPANGGIL") return "DIPANGGIL";
  if (normalizedStatus === "SELESAI") return "SELESAI";
  if (normalizedStatus === "DIBATALKAN") return "DIBATALKAN";
  if (normalizedStatus === "TIMEOUT") return "TIMEOUT";

  if (normalizedStatus === "MENUNGGU") return "MENUNGGU";
  return normalizedStatus;
}

function toBackendStatus(status) {
  const normalizedStatus = normalizeApiStatus(status);

  if (normalizedStatus === "MENUNGGU") return "menunggu";
  if (normalizedStatus === "DIPANGGIL") return "dipanggil";
  if (normalizedStatus === "SELESAI") return "selesai";
  if (normalizedStatus === "DIBATALKAN" || normalizedStatus === "TIMEOUT") return "dibatalkan";

  return String(status || "").trim().toLowerCase();
}

export function getClinicHoursLabel(clinic) {
  const fallbackHours = getFallbackClinicHours(clinic);
  const openTime = clinic?.openTime || clinic?.open_time || clinic?.jam_buka || fallbackHours.openTime;
  const closeTime = clinic?.closeTime || clinic?.close_time || clinic?.jam_tutup || fallbackHours.closeTime;
  return `${openTime} - ${closeTime}`;
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function getPresentationTimeOverride() {
  try {
    return localStorage.getItem(PRESENTATION_TIME_KEY) || "";
  } catch {
    return "";
  }
}

export function setPresentationTimeOverride(value) {
  try {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      localStorage.removeItem(PRESENTATION_TIME_KEY);
    } else {
      localStorage.setItem(PRESENTATION_TIME_KEY, normalizedValue);
    }
  } catch {
    // Keep normal clock behavior if storage is unavailable.
  }
}

export function getClinicOpenStatus(clinic, date = new Date()) {
  const fallbackHours = getFallbackClinicHours(clinic);
  const openTime = clinic?.openTime || clinic?.open_time || clinic?.jam_buka || fallbackHours.openTime;
  const closeTime = clinic?.closeTime || clinic?.close_time || clinic?.jam_tutup || fallbackHours.closeTime;
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const presentationTime = getPresentationTimeOverride();
  const presentationMinutes = timeToMinutes(presentationTime);

  if (openMinutes === null || closeMinutes === null) {
    return {
      isOpen: true,
      openTime,
      closeTime,
      message: "Jam aktif poli belum lengkap.",
    };
  }

  const nowMinutes = presentationMinutes ?? (date.getHours() * 60 + date.getMinutes());
  const isOpen = openMinutes <= closeMinutes
    ? nowMinutes >= openMinutes && nowMinutes <= closeMinutes
    : nowMinutes >= openMinutes || nowMinutes <= closeMinutes;

  return {
    isOpen,
    openTime,
    closeTime,
    message: isOpen
      ? `Poli aktif sampai ${closeTime}.`
      : `Poli tutup. Jam aktif ${openTime} - ${closeTime}.`,
  };
}

export function getTicketExpiresAt(ticket) {
  const calledAt = ticket?.calledAt || ticket?.called_at;
  if (!calledAt) return "";
  return ticket?.timeout_at || ticket?.expires_at || addMinutes(calledAt, TICKET_TIMEOUT_MINUTES);
}

export function getTicketRemainingMs(ticket) {
  const expiresAt = getTicketExpiresAt(ticket);
  if (!expiresAt) return null;
  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTime)) return null;
  return Math.max(0, expiresTime - Date.now());
}

export function getTicketStatus(ticket) {
  const status = normalizeApiStatus(ticket?.status || "MENUNGGU");
  const remainingMs = getTicketRemainingMs(ticket);
  if (status === "DIPANGGIL" && remainingMs !== null && remainingMs <= 0) return "TIMEOUT";
  return status;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  let response;
  try {
    response = await fetch(endpoint(path), {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || "Request ke server gagal. Coba cek backend dan database.";
    throw new Error(message);
  }

  return data;
}

export function normalizeTicket(ticket) {
  if (!ticket) return null;
  const createdAt = ticket.created_at || ticket.createdAt || new Date().toISOString();
  const calledAt = ticket.called_at || ticket.calledAt || "";
  const expiresAt = ticket.timeout_at || ticket.expires_at || (calledAt ? addMinutes(calledAt, TICKET_TIMEOUT_MINUTES) : "");

  const normalizedTicket = {
    id: ticket.id,
    code: ticket.ticket_code || ticket.code || "",
    name: ticket.patient?.name || ticket.name || "",
    phone: ticket.patient?.phone || ticket.patient_phone || ticket.phone || "",
    status: getTicketStatus({ status: normalizeApiStatus(ticket.status), createdAt, calledAt, expiresAt }),
    clinicId: ticket.clinic_id || ticket.clinicId || ticket.clinic?.id || "",
    clinicType: ticket.clinic?.name || ticket.clinicType || "-",
    doctorId: ticket.doctor_id || ticket.doctorId || ticket.doctor?.id || "",
    doctorName: ticket.doctor?.name || ticket.doctorName || "-",
    roomId: ticket.room_id || ticket.roomId || ticket.room?.id || "",
    roomName: ticket.room?.name || ticket.roomName || "-",
    createdByAdminId: ticket.created_by_admin_id || ticket.createdByAdminId || ticket.admin?.id || "",
    createdAt,
    calledAt,
    expiresAt,
    updatedAt: ticket.updated_at || ticket.updatedAt,
  };

  return {
    ...normalizedTicket,
    note: getTicketNote(normalizedTicket) || ticket.note || ticket.status_note || ticket.service_note || ticket.cancel_reason || "",
    accessCode: getTicketAccessCode(normalizedTicket) || ticket.accessCode || ticket.access_code || "",
    notificationSignal: getTicketNotificationSignal(normalizedTicket) || ticket.notificationSignal || "",
  };
}

export function getTicketPrefixForClinic(clinic) {
  const clinicName = String(clinic?.name || clinic?.clinicType || "").toUpperCase();

  if (clinicName.includes("GIGI")) return "G";
  if (clinicName.includes("BALITA")) return "B";
  if (clinicName.includes("ANAK")) return "A";
  if (clinicName.includes("LANSIA")) return "L";
  if (clinicName.includes("UMUM")) return "U";

  return clinicName.replace(/[^A-Z]/g, "").slice(0, 1) || "P";
}

export function getNextTicketCodeFromTickets(tickets, clinic = null) {
  const prefix = getTicketPrefixForClinic(clinic);
  const clinicId = clinic?.id || clinic?.clinicId || "";
  const scopedTickets = clinicId
    ? tickets.filter((ticket) => String(ticket.clinicId) === String(clinicId))
    : tickets;

  if (!scopedTickets.length) return `${prefix}-001`;

  const maxNumber = scopedTickets.reduce((max, ticket) => {
    const numeric = parseInt(String(ticket.code).replace(/\D/g, ""), 10);
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);

  const usedCodes = new Set(tickets.map((ticket) => String(ticket.code).toUpperCase()));
  let nextNumber = maxNumber + 1;
  let nextCode = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

  while (usedCodes.has(nextCode.toUpperCase())) {
    nextNumber += 1;
    nextCode = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  return nextCode;
}

export async function loginAdmin({ adminId, password }) {
  const data = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      admin_code: adminId,
      password,
    }),
  });

  return data.admin;
}

export async function getTickets() {
  try {
    const data = await request("/api/tickets");
    const apiTickets = extractCollection(data).map(normalizeTicket);
    const localTickets = getAllTickets().map(normalizeTicket);
    const ticketMap = new Map();

    [...localTickets, ...apiTickets].forEach((ticket) => {
      const key = `code:${String(ticket.code || ticket.id).toUpperCase()}`;
      ticketMap.set(key, ticket);
    });

    return Array.from(ticketMap.values());
  } catch {
    return getAllTickets().map(normalizeTicket);
  }
}

export async function createTicket({ patientName, phone, ticketCode, clinicId, doctorId, roomId, adminId }) {
  const createdAt = new Date().toISOString();

  try {
    const data = await request("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        patient_name: patientName,
        patient_phone: phone,
        phone,
        clinic_id: clinicId,
        doctor_id: doctorId,
        room_id: roomId,
        created_by_admin_id: adminId,
        created_by_admin_code: adminId,
      }),
    });

    const normalizedTicket = normalizeTicket(extractTicket(data));
    saveTicketAccessCode(normalizedTicket, normalizedTicket.accessCode);
    saveTicket(normalizedTicket);
    return normalizedTicket;
  } catch {
    const accessCode = generateTicketAccessCode();
    const clinic = LOCAL_CLINICS.find((item) => String(item.id) === String(clinicId));
    const doctor = LOCAL_DOCTORS.find((item) => String(item.id) === String(doctorId));
    const room = LOCAL_ROOMS.find((item) => String(item.id) === String(roomId));
    const tickets = getAllTickets().map(normalizeTicket);
    const code = ticketCode || getNextTicketCodeFromTickets(tickets, clinic);

    return saveTicket({
      id: `${Date.now()}`,
      code,
      accessCode,
      name: patientName,
      phone: phone || "",
      status: "MENUNGGU",
      clinicId,
      clinicType: clinic?.name || "-",
      doctorId,
      doctorName: doctor?.name || "-",
      roomId,
      roomName: room?.name || "-",
      createdByAdminId: adminId,
      createdAt,
      updatedAt: createdAt,
    });
  }
}

export async function updateTicketStatusById(id, status, note = "") {
  try {
    const data = await request(`/api/tickets/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status: toBackendStatus(status),
        note,
      }),
    });

    const normalizedTicket = normalizeTicket(extractTicket(data));
    saveTicketNote(normalizedTicket, note);
    return normalizeTicket({ ...normalizedTicket, note });
  } catch {
    const ticket = getAllTickets().find((item) => String(item.id) === String(id));
    if (!ticket) throw new Error("Tiket tidak ditemukan di penyimpanan lokal.");
    const updatedTicket = updateTicketStatus(ticket.code, status, note);
    saveTicketNote(updatedTicket, note);
    return normalizeTicket({ ...updatedTicket, note });
  }
}

async function findTicketByAccessCode(patientName, accessCode) {
  const normalizedAccessCode = String(accessCode || "").trim().toUpperCase();
  if (!normalizedAccessCode) return null;

  const localTicket = getAllTickets()
    .map(normalizeTicket)
    .find((ticket) => isMatchingTicketAccess(ticket, normalizedAccessCode));

  if (localTicket) {
    if (localTicket.name.trim().toUpperCase() !== patientName.trim().toUpperCase()) {
      throw new Error("Nama pasien tidak sesuai dengan kode akses.");
    }
    return localTicket;
  }

  try {
    const data = await request("/api/tickets");
    const apiTickets = extractCollection(data).map(normalizeTicket);
    const apiTicket = apiTickets.find((ticket) => isMatchingTicketAccess(ticket, normalizedAccessCode));

    if (!apiTicket) return null;
    if (apiTicket.name.trim().toUpperCase() !== patientName.trim().toUpperCase()) {
      throw new Error("Nama pasien tidak sesuai dengan kode akses.");
    }
    return apiTicket;
  } catch {
    return null;
  }
}

export async function checkPatientTicket({ patientName, ticketCode }) {
  const accessTicket = await findTicketByAccessCode(patientName, ticketCode);
  if (accessTicket) return accessTicket;

  try {
    const data = await request("/api/patient/check-ticket", {
      method: "POST",
      body: JSON.stringify({
        patient_name: patientName,
        access_code: ticketCode,
        ticket_code: ticketCode,
      }),
    });

    return normalizeTicket(extractTicket(data));
  } catch {
    const ticket = normalizeTicket(findTicket(ticketCode));
    if (!ticket) throw new Error("Tiket tidak ditemukan.");
    if (ticket.name.trim().toUpperCase() !== patientName.trim().toUpperCase()) {
      throw new Error("Nama pasien tidak sesuai dengan kode tiket.");
    }
    return ticket;
  }
}

export async function getClinics() {
  try {
    const data = await request("/api/clinics");
    const clinics = Array.isArray(data) ? data.map(normalizeClinic) : [];
    return clinics.length && hasName(clinics) && hasUsableOptions(clinics) ? clinics : LOCAL_CLINICS;
  } catch {
    return LOCAL_CLINICS;
  }
}

export async function getDoctors() {
  try {
    const data = await request("/api/doctors");
    const doctors = Array.isArray(data) ? data.map(normalizeDoctor) : [];
    return doctors.length && hasName(doctors) && hasUsableOptions(doctors) ? doctors : LOCAL_DOCTORS;
  } catch {
    return LOCAL_DOCTORS;
  }
}

export async function getRooms() {
  try {
    const data = await request("/api/rooms");
    const rooms = Array.isArray(data) ? data.map(normalizeRoom) : [];
    return rooms.length && hasName(rooms) && hasUsableOptions(rooms) ? rooms : LOCAL_ROOMS;
  } catch {
    return LOCAL_ROOMS;
  }
}
