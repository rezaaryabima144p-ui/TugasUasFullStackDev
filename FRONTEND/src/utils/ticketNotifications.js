const TICKET_NOTIFICATIONS_KEY = "ticketNotificationSignals";

function parseStoredSignals() {
  try {
    const stored = localStorage.getItem(TICKET_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredSignals(signals) {
  try {
    localStorage.setItem(TICKET_NOTIFICATIONS_KEY, JSON.stringify(signals));
  } catch {
    // Keep ticket flow usable if browser storage is unavailable.
  }
}

export function getTicketNotificationSignal(ticket) {
  const signals = parseStoredSignals();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";
  return signals[idKey] || signals[codeKey] || "";
}

export function sendTicketNotificationSignal(ticket) {
  const signal = new Date().toISOString();
  const signals = parseStoredSignals();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";

  if (idKey) signals[idKey] = signal;
  if (codeKey) signals[codeKey] = signal;

  saveStoredSignals(signals);
  return signal;
}
