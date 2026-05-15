import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticateAdmin } from "../utils/adminAccounts";
import { saveAdminSession } from "../utils/adminSession";
import { loginAdmin } from "../utils/api";

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

export default function AdminLogin() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event) => {
    event?.preventDefault();

    if (!adminId.trim() || !password.trim()) {
      setError("Nomor pegawai dan password wajib diisi dulu.");
      return;
    }

    try {
      setIsLoading(true);
      try {
        const admin = await loginAdmin({
          adminId: adminId.trim(),
          password,
        });

        saveAdminSession({
          id: admin.id,
          adminName: admin.name,
          adminId: admin.admin_code,
          email: admin.email,
          phone: admin.phone,
          role: admin.role || "Administrator",
          source: "backend",
        });
        setError("");
        navigate("/admin-success");
        return;
      } catch {
        const localAuth = authenticateAdmin({
          adminId: adminId.trim(),
          password,
        });

        if (!localAuth.ok) throw new Error("Invalid admin login");

        saveAdminSession({
          id: localAuth.account.id || localAuth.account.adminId,
          adminName: localAuth.account.adminName,
          adminId: localAuth.account.adminId,
          email: localAuth.account.email,
          phone: localAuth.account.phone,
          role: localAuth.account.role || "Administrator",
          source: "local",
        });
        setError("");
        navigate("/admin-success");
      }
    } catch {
      setError("Nomor pegawai atau password belum cocok. Coba ADM001 / admin123.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card relative">
        <div className="mb-5 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <form className="form-panel mx-auto max-w-4xl" onSubmit={handleLogin}>
          <div className="text-center">
            <p className="mx-auto mb-4 w-fit rounded-full border border-[#23803B]/25 bg-white/45 px-4 py-2 text-[10px] font-black uppercase text-[#23803B]">
              Area Admin
            </p>
            <h1 className="app-title text-2xl md:text-4xl">
              Login Admin
            </h1>
            <p className="mt-3 text-sm font-bold text-black/65">
              Kelola tiket, panggilan, dan status antrian pasien.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label">
                NOMOR PEGAWAI
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
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="app-input text-center"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-center text-[11px] font-black text-[#B00000]">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-center px-1 text-[11px] font-black">
            <button
              type="button"
              onClick={() => navigate("/admin-forgot-password")}
              className="text-link"
            >
              Lupa Password / Calon Admin?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="app-button app-button-muted mx-auto mt-8 hover:bg-[#63FF45] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "MEMPROSES..." : "MASUK"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-link mx-auto mt-5"
          >
            KEMBALI KE HOME
          </button>
        </form>
      </div>
    </div>
  );
}


