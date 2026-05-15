const TICKETS_KEY = "waitingTickets";
const CURRENT_CALL_KEY = "currentCallTicket";

function parseStoredTickets() {
  try {
    const stored = localStorage.getItem(TICKETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredTickets(tickets) {
  try {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  } catch {
    // silent fail if storage is unavailable
  }
}

export function getAllTickets() {
  return parseStoredTickets();
}

export function getNextTicketCode() {
  const tickets = parseStoredTickets();
  if (!tickets.length) return "001";

  const maxNumber = tickets.reduce((max, ticket) => {
    const numeric = parseInt(String(ticket.code).replace(/\D/g, ""), 10);
    if (Number.isNaN(numeric)) return max;
    return numeric > max ? numeric : max;
  }, 0);

  return String(maxNumber + 1).padStart(3, "0");
}

export function findTicket(code) {
  const normalizedCode = String(code).trim();
  if (!normalizedCode) return null;
  return parseStoredTickets().find(
    (ticket) => String(ticket.code).trim().toUpperCase() === normalizedCode.toUpperCase()
  );
}

export function saveTicket(ticket) {
  if (!ticket || !ticket.code) return;
  const tickets = parseStoredTickets();
  const normalizedCode = String(ticket.code).trim().toUpperCase();
  const existingIndex = tickets.findIndex(
    (item) => String(item.code).trim().toUpperCase() === normalizedCode
  );
  const updatedTicket = {
    ...tickets[existingIndex],
    ...ticket,
    code: normalizedCode,
    name: ticket.name?.trim() || tickets[existingIndex]?.name || "",
    status: ticket.status || tickets[existingIndex]?.status || "MENUNGGU",
    clinicType: ticket.clinicType || tickets[existingIndex]?.clinicType || "Poli Gigi",
    doctorName: ticket.doctorName || tickets[existingIndex]?.doctorName || "drg. Andi Pratama, Sp.KG",
    roomName: ticket.roomName || tickets[existingIndex]?.roomName || "Ruangan 4",
    accessCode: ticket.accessCode || tickets[existingIndex]?.accessCode || "",
    note: ticket.note || tickets[existingIndex]?.note || "",
    calledAt: ticket.calledAt || tickets[existingIndex]?.calledAt || "",
    expiresAt: ticket.expiresAt || tickets[existingIndex]?.expiresAt || "",
    createdBy: ticket.createdBy || tickets[existingIndex]?.createdBy || "PASIEN",
    createdAt: tickets[existingIndex]?.createdAt || ticket.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    tickets[existingIndex] = updatedTicket;
  } else {
    tickets.push(updatedTicket);
  }

  saveStoredTickets(tickets);
  return updatedTicket;
}

export function updateTicketStatus(code, status, note = "") {
  if (!code || !status) return null;
  const tickets = parseStoredTickets();
  const normalizedCode = String(code).trim().toUpperCase();
  const index = tickets.findIndex(
    (ticket) => String(ticket.code).trim().toUpperCase() === normalizedCode
  );
  if (index < 0) return null;
  const now = new Date().toISOString();
  tickets[index] = {
    ...tickets[index],
    status,
    note: String(note || "").trim(),
    calledAt: status === "DIPANGGIL" ? now : tickets[index].calledAt,
    updatedAt: now,
  };
  saveStoredTickets(tickets);
  return tickets[index];
}

export function getCurrentCallTicketCode() {
  try {
    return localStorage.getItem(CURRENT_CALL_KEY) || "";
  } catch {
    return "";
  }
}

export function setCurrentCallTicketCode(code) {
  try {
    if (!code) {
      localStorage.removeItem(CURRENT_CALL_KEY);
    } else {
      localStorage.setItem(CURRENT_CALL_KEY, String(code).trim().toUpperCase());
    }
  } catch {
    // ignore storage errors
  }
}

export function clearCurrentCallTicketCode() {
  try {
    localStorage.removeItem(CURRENT_CALL_KEY);
  } catch {
    // ignore
  }
}
