import { useAnnouncementPopup } from "../../admin-center/components/AnnouncementPopup/AnnouncementPopup";
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import Sidebar from "./Sidebar";
import CommandPalette from "../features/CommandPalette";
// FlyingAI entfernt (nicht verwendet)
import { useAutoLogout, SessionWarningModal } from "../../hooks/useAutoLogout";
import EmailVerificationBanner from "../EmailVerificationBanner";
import { apiGet } from "../../services/apiClient";
import DesktopTitlebar from "./DesktopTitlebar";
import { useDesktopIntegration, setTrayBadge } from "../../hooks/useDesktopIntegration";
import "./admin-layout.css";

// Lazy-loaded 3D Background
const DashboardBackground = lazy(() =>
  import("../three/DashboardBackground").then((m) => ({
    default: m.DashboardBackground,
  }))
);

function useImpersonation() {
  const [info, setInfo] = useState<{ adminName: string; targetUser: string } | null>(null);

  useEffect(() => {
    try {
      // Lese aus localStorage (nicht sessionStorage – muss Tab-übergreifend funktionieren)
      const raw = localStorage.getItem("baunity_impersonation");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.active) setInfo(parsed);
      }
    } catch {}
  }, []);

  const endSession = async () => {
    // Admin-Token wiederherstellen
    const adminToken = localStorage.getItem("baunity_admin_token_backup");
    const adminRefresh = localStorage.getItem("baunity_admin_refresh_backup");

    // Impersonation-Daten aufräumen
    localStorage.removeItem("baunity_impersonation");
    localStorage.removeItem("baunity_impersonate_user");

    if (adminToken) {
      // Admin-Token zurücksetzen
      localStorage.setItem("baunity_token", adminToken);
      localStorage.setItem("accessToken", adminToken);
      localStorage.removeItem("baunity_admin_token_backup");
      if (adminRefresh) {
        localStorage.setItem("baunity_refresh_token", adminRefresh);
        localStorage.removeItem("baunity_admin_refresh_backup");
      }

      // Zurück zum Admin-Dashboard
      window.location.replace(window.location.origin + "/kunden");
    } else {
      // Kein Admin-Token Backup → Tab schließen
      localStorage.removeItem("baunity_token");
      localStorage.removeItem("accessToken");
      window.close();

      // Fallback
      setTimeout(() => {
        document.title = "Session beendet";
        document.body.innerHTML = `
          <div style="min-height:100vh;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif">
            <div style="text-align:center;max-width:360px">
              <div style="width:56px;height:56px;border-radius:50%;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style="color:white;font-size:20px;font-weight:700;margin:0 0 8px">Session beendet</h2>
              <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:0 0 24px">Die Impersonation wurde beendet.</p>
              <a href="/kunden" style="padding:10px 24px;background:rgba(212,168,67,0.15);border:1px solid rgba(212,168,67,0.3);border-radius:10px;color:#EAD068;font-size:14px;font-weight:600;text-decoration:none">Zurück zum Admin</a>
            </div>
          </div>`;
      }, 200);
    }
  };

  return { info, endSession };
}

export default function AdminLayout() {
  const { user, preferences } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { AnnouncementPopup } = useAnnouncementPopup();
  const impersonation = useImpersonation();
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // KUNDE / DEMO / SUBUNTERNEHMER → Onboarding wenn noch nicht abgeschlossen
  // Bei Impersonation: Onboarding überspringen (Admin simuliert den User)
  const isImpersonating = !!localStorage.getItem("baunity_impersonate_user");
  if (!isImpersonating && (user?.role === 'KUNDE' || user?.role === 'DEMO' || user?.role === 'SUBUNTERNEHMER') && preferences?.onboarding?.completed !== true) {
    return <Navigate to="/onboarding" replace />;
  }

  // Auto-Logout nach 30 Min Inaktivität
  const { showWarning, secondsRemaining, extendSession, logoutNow } = useAutoLogout();

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live Inbox-Counts für Sidebar-Badges
  const [inboxTotal, setInboxTotal] = useState(0);
  useEffect(() => {
    let active = true;
    const fetchCounts = () => {
      apiGet<{ total: number; critical: number; high: number }>("/v2/inbox/counts")
        .then((data) => { if (active) setInboxTotal(data.total); })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const badges = useMemo(() => ({ aufgaben: inboxTotal }), [inboxTotal]);

  // Desktop integration: CSS variables, tray navigation, power resume, keyboard shortcuts
  useDesktopIntegration({
    openCommandPalette: () => setCommandOpen(true),
  });

  // Online-Status für Titlebar-Dot
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Desktop: Tray-Badge mit Inbox-Count synchronisieren
  useEffect(() => {
    setTrayBadge(inboxTotal);
  }, [inboxTotal]);

  const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

  return (
    <>
      {/* Desktop Titlebar (Electron only) */}
      {isDesktop && <DesktopTitlebar isConnected={isOnline} />}

      {/* 3D Background Layer */}
      <Suspense fallback={null}>
        <DashboardBackground />
      </Suspense>

      <div className={`admin-layout ${sidebarCollapsed ? "admin-layout--collapsed" : ""}`}>
        <SessionWarningModal
        show={showWarning}
        secondsRemaining={secondsRemaining}
        onExtend={extendSession}
        onLogout={logoutNow}
      />

      {/* Mobile Hamburger Button */}
      <button
        className="mobile-hamburger"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Menü öffnen"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCommand={() => setCommandOpen(true)}
        badges={badges}
        aiCount={3}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <EmailVerificationBanner />
      {impersonation.info && (
        <>
          <style>{`
            .admin-impersonation-banner { display: flex; align-items: center; gap: 12px; padding: 10px 32px; margin-left: var(--sidebar-width); background: linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06)); border-bottom: 1px solid rgba(245,158,11,0.25); color: #fbbf24; font-size: 13px; transition: margin-left var(--duration-normal) var(--ease-out); }
            .admin-layout--collapsed .admin-impersonation-banner { margin-left: var(--sidebar-collapsed); }
            .admin-impersonation-banner svg { flex-shrink: 0; color: #f59e0b; }
            .admin-impersonation-text { flex: 1; color: rgba(251,191,36,0.85); }
            .admin-impersonation-text strong { color: #fbbf24; }
            .admin-impersonation-btn { padding: 6px 16px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.35); border-radius: 8px; color: #fbbf24; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
            .admin-impersonation-btn:hover { background: rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.5); }
          `}</style>
          <div className="admin-impersonation-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="admin-impersonation-text">
              Admin-Ansicht: Eingeloggt als <strong>{impersonation.info.targetUser}</strong>
            </span>
            <button className="admin-impersonation-btn" onClick={impersonation.endSession}>
              Session beenden & zurück
            </button>
          </div>
        </>
      )}
      <main className="admin-main">
        <Outlet />
      </main>
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        recentItems={[]}
      />
      {AnnouncementPopup}
    </div>
    </>
  );
}
