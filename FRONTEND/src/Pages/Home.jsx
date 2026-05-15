import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="home-card grid md:grid-cols-[1.15fr_0.85fr]">
        <div className="home-visual">
          <p className="mb-4 rounded-full border border-[#23803B]/25 bg-white/35 px-4 py-2 text-[10px] font-black uppercase text-[#23803B]">
            Puskesmas Sekemala
          </p>
          <h1 className="app-title max-w-2xl text-3xl md:text-5xl">
            Waiting List Puskesmas Sekemala
          </h1>
          <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-black/70 md:text-base">
            Pantau nomor antrian, status tiket, dan panggilan pasien dalam satu tampilan yang sederhana.
          </p>

          <img
            src="/icon_karakter.png"
            className="animate-float-soft mt-10 w-[240px] drop-shadow-sm md:w-[420px]"
            alt="Karakter puskesmas"
          />
        </div>

        <div className="home-actions">
          <h2 className="app-title mb-3 text-2xl md:text-4xl">
            LOGIN SEKARANG
          </h2>
          <p className="mb-10 max-w-sm text-sm font-bold leading-relaxed text-black/60 md:text-base">
            Pilih akses sesuai kebutuhanmu.
          </p>

          <Link
            to="/input-tiket"
            className="app-button mb-5 flex w-52 items-center justify-center"
          >
            INPUT TIKET
          </Link>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="app-button app-button-muted w-52"
          >
            LOGIN ADMIN
          </button>
        </div>
      </div>
    </div>
  );
}
