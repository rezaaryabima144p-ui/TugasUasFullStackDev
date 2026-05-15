import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminOtp, registerAdmin } from "../utils/adminAccounts";

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

export default function AdminSignUp() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOtp = () => {
    if (!adminId.trim() || !email.trim()) {
      setError("ID admin dan email wajib diisi sebelum kirim OTP.");
      setSuccessMessage("");
      return;
    }

    const result = createAdminOtp({
      adminId: adminId.trim(),
      email: email.trim(),
    });

    if (!result.ok) {
      setError(result.message);
      setSuccessMessage("");
      return;
    }

    setError("");
    setDemoOtp(result.otp);
    setSuccessMessage("OTP berhasil dibuat. Untuk demo frontend, kode OTP ditampilkan di bawah.");
  };

  const handleSignUp = () => {
    if (
      !adminName.trim() ||
      !adminId.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !otp.trim()
    ) {
      setError("Semua data sign up wajib diisi dulu.");
      setSuccessMessage("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password harus sama dengan password.");
      setSuccessMessage("");
      return;
    }

    const result = registerAdmin({
      adminName: adminName.trim(),
      adminId: adminId.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      otp: otp.trim(),
    });

    if (!result.ok) {
      setError(result.message);
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");
    navigate("/admin");
  };

  return (
    <div className="app-shell">
      <div className="app-card relative">
        <div className="mb-5 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <form className="form-panel">
          <h1 className="app-title text-lg md:text-2xl">
            Sign Up Admin
          </h1>
          <p className="mt-3 text-center text-sm font-bold leading-relaxed text-black/65">
            Daftarkan akun admin untuk mengelola waiting list Puskesmas Sekemala.
          </p>
          <p className="mt-2 text-center text-[11px] font-black leading-relaxed text-black/55">
            Mode frontend demo: OTP tampil di layar. Saat terhubung backend, OTP dikirim ke email.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">
                NAMA ADMIN
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
                className="app-input text-center uppercase"
              />
            </div>

            <div>
              <label className="field-label">
                NO ID ADMIN
              </label>
              <input
                type="text"
                value={adminId}
                onChange={(event) => setAdminId(event.target.value)}
                className="app-input text-center uppercase"
              />
            </div>

            <div>
              <label className="field-label">
                EMAIL ADMIN
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="app-input text-center"
              />
            </div>

            <div>
              <label className="field-label">
                NO TELEPON
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="app-input text-center"
              />
            </div>

            <div>
              <label className="field-label">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="app-input text-center"
              />
            </div>

            <div>
              <label className="field-label">
                KONFIRMASI PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="app-input text-center"
              />
            </div>

            <div className="md:col-span-2">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="field-label">
                    KODE OTP EMAIL
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="app-input text-center tracking-[0.35em]"
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="app-button app-button-muted w-full whitespace-nowrap text-[10px] md:w-auto"
                >
                  KIRIM OTP
                </button>
              </div>
              {demoOtp && (
                <p className="mt-3 rounded-2xl bg-white/45 px-4 py-3 text-center text-[11px] font-black text-[#23803B]">
                  OTP DEMO: {demoOtp}
                </p>
              )}
            </div>
          </div>

          {successMessage && (
            <p className="mt-4 text-center text-[11px] font-black text-[#23803B]">
              {successMessage}
            </p>
          )}

          {error && (
            <p className="mt-4 text-center text-[11px] font-black text-[#B00000]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSignUp}
            className="app-button mx-auto mt-8"
          >
            SIGN UP
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-link mx-auto mt-4"
          >
            SUDAH PUNYA AKUN? LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
