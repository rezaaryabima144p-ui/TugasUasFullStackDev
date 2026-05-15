const TICKET_NOTES_KEY = "ticketStatusNotes";

function parseStoredNotes() {
  try {
    const stored = localStorage.getItem(TICKET_NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredNotes(notes) {
  try {
    localStorage.setItem(TICKET_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Keep ticket flow usable if browser storage is unavailable.
  }
}

export function getTicketNote(ticket) {
  const notes = parseStoredNotes();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";
  return notes[idKey] || notes[codeKey] || ticket?.note || ticket?.status_note || "";
}

export function saveTicketNote(ticket, note) {
  const normalizedNote = String(note || "").trim();
  const notes = parseStoredNotes();
  const idKey = ticket?.id ? `id:${ticket.id}` : "";
  const codeKey = ticket?.code ? `code:${String(ticket.code).toUpperCase()}` : "";

  if (idKey) notes[idKey] = normalizedNote;
  if (codeKey) notes[codeKey] = normalizedNote;

  saveStoredNotes(notes);
}
