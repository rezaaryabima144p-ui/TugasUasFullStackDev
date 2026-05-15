export function getAdminSession() {
  try {
    const savedSession = localStorage.getItem("adminSession");
    return savedSession ? JSON.parse(savedSession) : null;
  } catch {
    try {
      localStorage.removeItem("adminSession");
    } catch {
      // Keep the app visible even if browser storage is blocked.
    }
    return null;
  }
}

export function isAdminLoggedIn() {
  const session = getAdminSession();
  return Boolean(session?.adminId);
}

export function saveAdminSession(adminSession) {
  try {
    localStorage.setItem("adminSession", JSON.stringify(adminSession));
  } catch {
    // Login should still continue even when storage cannot be written.
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem("adminSession");
  } catch {
    // Nothing else to do if storage is blocked.
  }
}
