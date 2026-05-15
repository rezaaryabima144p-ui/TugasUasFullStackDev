import { useEffect, useMemo, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import AdminAccount from "./Pages/AdminAccount";
import AdminBeranda from "./Pages/AdminBeranda";
import AdminConnectTicket from "./Pages/AdminConnectTicket";
import AdminInputTicket from "./Pages/AdminInputTicket";
import AdminLogin from "./Pages/AdminLogin";
import AdminForgotPassword from "./Pages/AdminForgotPassword";
import AdminSuccess from "./Pages/AdminSuccess";
import AdminTicketCreated from "./Pages/AdminTicketCreated";
import TicketInput from "./Pages/TicketInput";
import TicketWelcome from "./Pages/TicketWelcome";
import TicketInfo from "./Pages/TicketInfo";
import { isAdminLoggedIn } from "./utils/adminSession";

function ProtectedAdminRoute({ children }) {
  return isAdminLoggedIn() ? children : <Navigate to="/admin" replace />;
}

function AnimatedPage({ children, variant = "soft" }) {
  return (
    <div className={`route-transition route-${variant}`}>
      {children}
    </div>
  );
}

function PageLoadingOverlay({ label }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-card">
        <div className="page-loader-logo">
          <div className="page-loader-plus-vertical" />
          <div className="page-loader-plus-horizontal" />
        </div>
        <p className="page-loader-title">PUSKESMAS SEKEMALA</p>
        <p className="page-loader-label">{label}</p>
        <div className="page-loader-bar">
          <span />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const shouldTriggerLoader = location.pathname === "/admin-beranda";
  const [isLoaderVisible, setIsLoaderVisible] = useState(shouldTriggerLoader);

  const loadingLabel = useMemo(() => {
    if (location.pathname.includes("admin-beranda")) return "Membuka dashboard admin";
    return "";
  }, [location.pathname]);

  useEffect(() => {
    if (!shouldTriggerLoader) {
      const hideTimeoutId = window.setTimeout(() => setIsLoaderVisible(false), 0);
      return () => window.clearTimeout(hideTimeoutId);
    }

    const showTimeoutId = window.setTimeout(() => setIsLoaderVisible(true), 0);
    const hideTimeoutId = window.setTimeout(() => setIsLoaderVisible(false), 720);

    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [shouldTriggerLoader, location.pathname]);

  return (
    <>
      {isLoaderVisible && shouldTriggerLoader && (
        <PageLoadingOverlay key={`loader-${location.pathname}`} label={loadingLabel} />
      )}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage variant="home"><Home /></AnimatedPage>} />
        <Route path="/admin" element={<AnimatedPage variant="soft"><AdminLogin /></AnimatedPage>} />
        <Route path="/admin-sign-up" element={<Navigate to="/admin" replace />} />
        <Route path="/admin-forgot-password" element={<AnimatedPage variant="lift"><AdminForgotPassword /></AnimatedPage>} />
        <Route path="/admin-success" element={<AnimatedPage variant="pop"><ProtectedAdminRoute><AdminSuccess /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/admin-account" element={<AnimatedPage variant="slide-left"><ProtectedAdminRoute><AdminAccount /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/admin-beranda" element={<AnimatedPage variant="dashboard"><ProtectedAdminRoute><AdminBeranda /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/admin-connect-ticket" element={<AnimatedPage variant="slide-right"><ProtectedAdminRoute><AdminConnectTicket /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/admin-input-tiket" element={<AnimatedPage variant="lift"><ProtectedAdminRoute><AdminInputTicket /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/admin-ticket-created" element={<AnimatedPage variant="pop"><ProtectedAdminRoute><AdminTicketCreated /></ProtectedAdminRoute></AnimatedPage>} />
        <Route path="/input-tiket" element={<AnimatedPage variant="slide-right"><TicketInput /></AnimatedPage>} />
        <Route path="/tiket-welcome" element={<AnimatedPage variant="pop"><TicketWelcome /></AnimatedPage>} />
        <Route path="/informasi-tiket" element={<AnimatedPage variant="slide-left"><TicketInfo /></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
