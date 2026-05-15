import { useNavigate } from "react-router-dom";

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

export default function AdminForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="app-card relative">
        <div className="mb-5 lg:absolute lg:left-12 lg:top-12">
          <HealthLogo />
        </div>

        <form className="form-panel mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mx-auto mb-4 w-fit rounded-full border border-[#23803B]/25 bg-white/45 px-4 py-2 text-[10px] font-black uppercase text-[#23803B]">
              Bantuan Admin
            </p>
            <h1 className="app-title text-2xl md:text-4xl">
              Hubungi Super Admin
            </h1>
            <p className="mt-3 text-sm font-bold leading-relaxed text-black/65">
              Akun admin baru dan reset password hanya dapat diproses oleh super admin.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[#23803B]/25 bg-white/55 px-6 py-5 text-center">
              <p className="text-xs font-black uppercase text-[#23803B]">
                Untuk Calon Admin
              </p>
              <p className="mt-2 text-[11px] font-bold leading-relaxed text-black/70">
                Minta super admin membuat akun dengan menyertakan nomor pegawai,
                nama lengkap, unit/poli, dan nomor WhatsApp aktif.
              </p>
            </div>

            <div className="rounded-3xl border border-[#23803B]/25 bg-white/55 px-6 py-5 text-center">
              <p className="text-xs font-black uppercase text-[#23803B]">
                Untuk Lupa Password
              </p>
              <p className="mt-2 text-[11px] font-bold leading-relaxed text-black/70">
                Kirim nomor pegawai dan nama lengkap ke super admin agar
                password dapat diverifikasi dan diatur ulang.
              </p>
            </div>

            <div className="rounded-3xl bg-[#23803B] px-6 py-5 text-center text-white">
              <p className="text-[10px] font-black uppercase text-white/80">
                Kontak Super Admin
              </p>
              <p className="mt-2 text-lg font-black">
                SUPER ADMIN PUSKESMAS
              </p>
              <p className="mt-1 text-sm font-bold">
                Hubungi petugas pengelola sistem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="app-button app-button-muted mx-auto mt-8 hover:bg-[#63FF45]"
          >
            KEMBALI KE LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
