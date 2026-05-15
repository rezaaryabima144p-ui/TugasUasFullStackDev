import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSession } from "../utils/adminSession";

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

export default function AdminSuccess() {
  const navigate = useNavigate();
  const adminSession = useMemo(() => getAdminSession(), []);
  const adminName = adminSession?.adminName || "ADMIN";

  return (
    <div className="app-shell">
      <div className="app-card relative">
        <div className="mb-5 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <div className="form-panel mx-auto max-w-3xl items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-black bg-[#63FF45] shadow-[0_5px_0_rgba(0,0,0,0.24)]">
            <p className="text-5xl font-black text-black">✓</p>
          </div>
          <h1 className="app-title mt-8 text-2xl sm:text-3xl lg:text-4xl">
            LOGIN BERHASIL
          </h1>
          <div className="mt-5 rounded-2xl border border-[#23803B]/20 bg-white/55 px-8 py-4">
            <p className="text-[10px] font-black uppercase text-black/55">
              Selamat datang
            </p>
            <p className="mt-1 text-lg font-black uppercase text-[#23803B]">
              {adminName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin-beranda")}
            className="app-button mt-10"
          >
            MASUK DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
