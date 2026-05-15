const TICKET_ACCESS_CODES_KEY = "ticketAccessCodes";

function parseStoredAccessCodes() {
  try {
    const stored = localStorage.getItem(TICKET_ACCESS_CODES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredAccessCodes(accessCodes) {
  try {
    localStorage.setItem(TICKET_ACCESS_CODES_KEY, JSON.stringify(accessCodes));
  } catch {
    // Keep ticket flow usable if browser storage is unavailable.
  }
}

export function generateTicketAccessCode() {
  const existingCodes = new Set(Object.values(parseStoredAccessCodes()).map((code) => String(code).toUpperCase()));
  let code;

  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existingCodes.has(code));

  return code;
}

export function getTicketAccessCode(ticket) {
  const accessCodes = parseStoredAccessCodes();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";
  return ticket?.accessCode || ticket?.access_code || accessCodes[idKey] || accessCodes[codeKey] || "";
}

export function saveTicketAccessCode(ticket, accessCode) {
  const normalizedAccessCode = String(accessCode || "").trim().toUpperCase();
  if (!normalizedAccessCode) return "";

  const accessCodes = parseStoredAccessCodes();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";

  if (idKey) accessCodes[idKey] = normalizedAccessCode;
  if (codeKey) accessCodes[codeKey] = normalizedAccessCode;

  saveStoredAccessCodes(accessCodes);
  return normalizedAccessCode;
}

export function isMatchingTicketAccess(ticket, value) {
  const normalizedValue = String(value || "").trim().toUpperCase();
  if (!normalizedValue) return false;

  return getTicketAccessCode(ticket).toUpperCase() === normalizedValue
    || String(ticket?.code || "").trim().toUpperCase() === normalizedValue;
}
