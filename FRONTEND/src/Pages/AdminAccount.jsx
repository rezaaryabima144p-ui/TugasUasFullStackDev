import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminSession } from "../utils/adminSession";

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

function AccountField({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#23803B]/15 bg-white/45 px-4 py-3 shadow-[0_2px_0_rgba(0,0,0,0.08)]">
      <p className="text-[10px] font-black uppercase tracking-wide text-black/55">{label}</p>
      <div className="mt-2 flex min-h-9 items-center">
        <p className="break-words text-sm font-black uppercase leading-tight text-black">{value}</p>
      </div>
    </div>
  );
}

export default function AdminAccount() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const adminSession = useMemo(() => getAdminSession(), []);
  const adminName = adminSession?.adminName || "ADMIN";
  const adminId = adminSession?.adminId || "-";
  const email = adminSession?.email || "-";
  const phone = adminSession?.phone || "-";
  const role = adminSession?.role || "Administrator";

  const handleLogout = () => {
    clearAdminSession();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <div className="app-card app-card-green compact-card relative">
        <div className={`mx-auto w-full max-w-5xl ${showLogoutConfirm ? "blur-[2px]" : ""}`}>
          <div className="flex items-start gap-6">
            <HealthLogo />
            <div className="pt-3">
              <h1 className="app-title text-left text-xl md:text-3xl">
                INFORMASI AKUN
              </h1>
              <p className="mt-2 text-xs font-black uppercase text-black/60">
                Detail akun admin yang sedang aktif
              </p>
            </div>
          </div>

          <div className="content-panel mx-auto mt-10 w-full md:mt-12">
            <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-stretch">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-black/15 bg-[#AFC1B0] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-black bg-[#D9D9D9] shadow-[0_4px_0_rgba(0,0,0,0.22)]">
                  <p className="text-4xl font-black uppercase text-[#23803B]">
                    {adminName.trim().slice(0, 1) || "A"}
                  </p>
                </div>
                <p className="mt-5 text-lg font-black uppercase text-[#23803B]">
                  {adminName}
                </p>
                <p className="mt-1 rounded-full border border-black/20 bg-white/60 px-4 py-1 text-[10px] font-black uppercase text-black">
                  {role}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <AccountField label="Username" value={adminName} />
                <AccountField label="Akses Pengguna" value={role} />
                <AccountField label="No Admin" value={adminId} />
                <AccountField label="Email" value={email} />
                <AccountField label="No Telepon" value={phone} />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-xl grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="app-button app-button-danger w-full"
            >
              LOGOUT
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin-beranda")}
              className="app-button w-full"
            >
              KEMBALI
            </button>
          </div>
        </div>

        {showLogoutConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-8">
            <div className="w-full max-w-md rounded-2xl border border-black bg-[#D9E5D9] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <h2 className="text-xl font-black uppercase text-black">
                Logout Admin?
              </h2>
              <p className="mt-2 text-xs font-bold text-black/70">
                Sesi admin akan ditutup dan kembali ke beranda.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="app-button app-button-muted min-w-0 w-full text-[10px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="app-button app-button-danger min-w-0 w-full text-[10px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
