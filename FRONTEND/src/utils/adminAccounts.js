const ADMIN_ACCOUNTS_KEY = "adminAccounts";
const ADMIN_OTP_KEY = "pendingAdminOtp";
const MANUAL_ADMIN_ACCOUNTS = [
  {
    adminName: "ADMIN SEKEMALA",
    adminId: "ADM001",
    email: "admin@puskesmassekemala.test",
    phone: "081234567890",
    password: "admin123",
    role: "Administrator",
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "manual",
  },
  {
    adminName: "YUDHA",
    adminId: "YUDHA",
    email: "andhiyudhapermana@gmail.com",
    phone: "083148509826",
    password: "123",
    role: "Administrator",
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "manual",
  }
];

function parseStoredAccounts() {
  try {
    const stored = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts) {
  try {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Keep the UI usable if browser storage is unavailable.
  }
}

function normalizeAdminId(adminId) {
  return String(adminId || "").trim().toUpperCase();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+()\-\s]{8,20}$/.test(phone);
}

export function getAdminAccounts() {
  return [...MANUAL_ADMIN_ACCOUNTS, ...parseStoredAccounts()];
}

export function findAdminById(adminId) {
  const normalizedId = normalizeAdminId(adminId);
  if (!normalizedId) return null;
  return getAdminAccounts().find(
    (account) => normalizeAdminId(account.adminId) === normalizedId
  ) || null;
}

export function createAdminOtp({ adminId, email }) {
  const normalizedId = normalizeAdminId(adminId);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedId || !normalizedEmail) {
    return { ok: false, message: "ID admin dan email wajib diisi sebelum meminta OTP." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, message: "Format email admin belum valid." };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpData = {
    adminId: normalizedId,
    email: normalizedEmail,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    localStorage.setItem(ADMIN_OTP_KEY, JSON.stringify(otpData));
  } catch {
    return { ok: false, message: "OTP gagal disimpan. Coba aktifkan browser storage." };
  }

  return { ok: true, otp };
}

function verifyAdminOtp({ adminId, email, otp }) {
  try {
    const stored = localStorage.getItem(ADMIN_OTP_KEY);
    const otpData = stored ? JSON.parse(stored) : null;
    const normalizedId = normalizeAdminId(adminId);
    const normalizedEmail = normalizeEmail(email);

    if (!otpData) {
      return { ok: false, message: "OTP belum dikirim. Klik kirim OTP dulu." };
    }

    if (Date.now() > otpData.expiresAt) {
      localStorage.removeItem(ADMIN_OTP_KEY);
      return { ok: false, message: "OTP sudah kedaluwarsa. Kirim OTP ulang." };
    }

    if (otpData.adminId !== normalizedId || otpData.email !== normalizedEmail) {
      return { ok: false, message: "OTP tidak cocok dengan ID admin atau email." };
    }

    if (otpData.otp !== String(otp || "").trim()) {
      return { ok: false, message: "Kode OTP tidak sesuai." };
    }

    localStorage.removeItem(ADMIN_OTP_KEY);
    return { ok: true };
  } catch {
    return { ok: false, message: "OTP tidak bisa diverifikasi. Kirim OTP ulang." };
  }
}

export function registerAdmin({ adminName, adminId, email, phone, password, otp }) {
  const normalizedId = normalizeAdminId(adminId);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!adminName?.trim() || !normalizedId || !normalizedEmail || !normalizedPhone || !password?.trim()) {
    return { ok: false, message: "Semua data admin wajib diisi." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, message: "Format email admin belum valid." };
  }

  if (!isValidPhone(normalizedPhone)) {
    return { ok: false, message: "Nomor telepon admin belum valid." };
  }

  const accounts = parseStoredAccounts();
  const exists = getAdminAccounts().some((account) => normalizeAdminId(account.adminId) === normalizedId);
  if (exists) {
    return { ok: false, message: "ID admin sudah terdaftar." };
  }

  const emailExists = getAdminAccounts().some((account) => normalizeEmail(account.email) === normalizedEmail);
  if (emailExists) {
    return { ok: false, message: "Email admin sudah terdaftar." };
  }

  const otpResult = verifyAdminOtp({
    adminId: normalizedId,
    email: normalizedEmail,
    otp,
  });

  if (!otpResult.ok) {
    return otpResult;
  }

  const account = {
    adminName: adminName.trim(),
    adminId: normalizedId,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: "Administrator",
    createdAt: new Date().toISOString(),
  };

  saveStoredAccounts([...accounts, account]);
  return { ok: true, account };
}

export function authenticateAdmin({ adminName = "", adminId, password }) {
  const account = findAdminById(adminId);
  if (!account) {
    return { ok: false, message: "Nomor pegawai belum terdaftar. Silakan hubungi administrator." };
  }

  if (account.password !== password) {
    return { ok: false, message: "Password admin tidak sesuai." };
  }

  if (adminName.trim() && account.adminName.trim().toUpperCase() !== adminName.trim().toUpperCase()) {
    return { ok: false, message: "Nama admin tidak sesuai dengan ID admin." };
  }

  return { ok: true, account };
}

export function requestAdminPasswordReset({ adminId, email }) {
  const normalizedId = normalizeAdminId(adminId);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedId || !normalizedEmail) {
    return { ok: false, message: "ID admin dan email wajib diisi." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, message: "Format email admin belum valid." };
  }

  return {
    ok: true,
    message: "Jika data cocok, instruksi reset password akan dikirim ke email admin atau diproses oleh pengelola sistem.",
  };
}
