/**
 * Portal Layout
 * =============
 * Layout für das Endkunden-Portal - gleicher Stil wie Admin-Dashboard.
 */

import { Outlet, NavLink, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import { usePortal } from "./PortalContext";
import "./portal-layout.css";
import { useState, useEffect, lazy, Suspense } from "react";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  LogOut,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
  Menu,
  Bell,
} from "lucide-react";
import { NotificationBell } from "./components/NotificationBell";

// Lazy-loaded 3D Background - gleich wie Admin
const DashboardBackground = lazy(() =>
  import("../components/three/DashboardBackground").then((m) => ({
    default: m.DashboardBackground,
  }))
);

// Logo Component
function PortalLogo({ size = 40 }: { size?: number }) {
  const uniqueId = `portal-logo-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(212, 168, 67, 0.4))' }}
    >
      <defs>
        <linearGradient id={`${uniqueId}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A843">
            <animate attributeName="stop-color" values="#D4A843;#EAD068;#D4A843" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#EAD068">
            <animate attributeName="stop-color" values="#EAD068;#f0d878;#EAD068" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#06b6d4">
            <animate attributeName="stop-color" values="#06b6d4;#22d3ee;#06b6d4" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${uniqueId}-main)`}>
        <animate attributeName="rx" values="12;14;12" dur="4s" repeatCount="indefinite" />
      </rect>
      <path d="M14 12 L14 28 L14 36 L26 36" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter={`url(#${uniqueId}-glow)`}>
        <animate attributeName="stroke-width" values="4.5;5;4.5" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M30 14 L26 24 L32 24 L28 36" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95">
        <animate attributeName="opacity" values="0.95;1;0.95" dur="1.5s" repeatCount="indefinite" />
      </path>
      <circle cx="38" cy="12" r="3" fill="white" opacity="0.8">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function useImpersonation() {
  const [info, setInfo] = useState<{ adminName: string; targetUser: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("baunity_impersonation");
      if (raw) setInfo(JSON.parse(raw));
    } catch {}
  }, []);

  const endSession = async () => {
    // Session serverseitig beenden (httpOnly Cookie kann nur der Server löschen)
    try {
      await fetch("/api/auth/v2/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    // Client-seitige Daten aufräumen
    localStorage.removeItem("baunity_token");
    sessionStorage.removeItem("baunity_csrf");
    sessionStorage.removeItem("baunity_impersonation");

    // Tab schließen (funktioniert wenn via window.open geöffnet)
    window.close();

    // Fallback: Falls Tab nicht geschlossen werden konnte, "Fertig"-Seite zeigen
    setTimeout(() => {
      document.title = "Session beendet";
      document.body.innerHTML = `
        <div style="min-height:100vh;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif">
          <div style="text-align:center;max-width:360px">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style="color:white;font-size:20px;font-weight:700;margin:0 0 8px">Session beendet</h2>
            <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:0 0 24px">Die Impersonation wurde beendet. Du kannst diesen Tab schließen.</p>
            <button onclick="window.close()" style="padding:10px 24px;background:rgba(212,168,67,0.15);border:1px solid rgba(212,168,67,0.3);border-radius:10px;color:#EAD068;font-size:14px;font-weight:600;cursor:pointer">Tab schließen</button>
          </div>
        </div>`;
    }, 200);
  };

  return { info, endSession };
}

export function PortalLayout() {
  const { user, logout } = useAuth();
  const { hasRueckfrage, needsOnboarding, loading, onboardingStatus, unreadNotificationCount } = usePortal();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const impersonation = useImpersonation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/portal/login");
  };

  // Warte bis Daten geladen sind
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Loader2 size={32} style={{ color: '#D4A843', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Portal wird geladen...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Redirect zum Onboarding wenn noch nicht abgeschlossen
  // (auch wenn onboardingStatus null ist - Onboarding prüft selbst nochmal)
  if (needsOnboarding) {
    return <Navigate to="/portal/onboarding" replace />;
  }

  const navItems = [
    { path: "/portal", label: "Dashboard", icon: LayoutDashboard, end: true },
    { path: "/portal/documents", label: "Dokumente", icon: FileText },
    { path: "/portal/messages", label: "Nachrichten", icon: MessageSquare, badge: hasRueckfrage },
    // Rechnungen-Nav ENTFERNT: Endkunden dürfen keine Rechnungen sehen
    { path: "/portal/settings", label: "Einstellungen", icon: Settings },
  ];

  return (
    <>
      {/* 3D Background */}
      <Suspense fallback={null}>
        <DashboardBackground />
      </Suspense>

      <div className="portal-layout" data-collapsed={collapsed} data-mobile-open={mobileMenuOpen}>
        {/* Mobile Hamburger Button */}
        <button
          className="portal-mobile-hamburger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Menü öffnen"
        >
          <Menu size={24} />
        </button>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="portal-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className="portal-sidebar">
          {/* Logo */}
          <div className="portal-sidebar-header">
            <div className="portal-logo-wrap">
              <PortalLogo size={collapsed ? 32 : 40} />
              {!collapsed && (
                <div className="portal-logo-text">
                  <span className="portal-logo-title">Baunity</span>
                  <span className="portal-logo-subtitle">Kundenportal</span>
                </div>
              )}
            </div>
            <button
              className="portal-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="portal-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `portal-nav-item ${isActive ? "portal-nav-item--active" : ""}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {item.badge && (
                  <span className="portal-nav-badge">!</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="portal-sidebar-footer">
            {!collapsed && (
              <div className="portal-user-info">
                <div className="portal-user-avatar">
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </div>
                <div className="portal-user-details">
                  <span className="portal-user-name">{user?.name || "Benutzer"}</span>
                  <span className="portal-user-email">{user?.email}</span>
                </div>
              </div>
            )}
            <button className="portal-logout-btn" onClick={handleLogout} title="Abmelden">
              <LogOut size={18} />
              {!collapsed && <span>Abmelden</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="portal-main">
          {/* Notification Bell - oben rechts */}
          <div style={{ position: "absolute", top: 16, right: 20, zIndex: 100 }}>
            <NotificationBell />
          </div>

          {/* Impersonation Banner */}
          {impersonation.info && (
            <div className="portal-impersonation-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="portal-impersonation-text">
                Admin-Ansicht: Eingeloggt als <strong>{impersonation.info.targetUser}</strong>
              </span>
              <button className="portal-impersonation-btn" onClick={impersonation.endSession}>
                Session beenden & zurück
              </button>
            </div>
          )}

          {/* Alert Banner */}
          {hasRueckfrage && (
            <div className="portal-alert-banner">
              <AlertCircle size={20} />
              <div className="portal-alert-content">
                <strong>Rückfrage vom Netzbetreiber</strong>
                <span>Es liegt eine offene Rückfrage zu Ihrer Anlage vor.</span>
              </div>
              <NavLink to="/portal/messages" className="portal-alert-action">
                Jetzt antworten
              </NavLink>
            </div>
          )}

          {/* Page Content */}
          <div className="portal-content">
            <Outlet />
          </div>
        </main>
        {/* Mobile Bottom Navigation */}
        <nav className="portal-bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={`bottom-${item.path}`}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `portal-bottom-nav-item ${isActive ? "portal-bottom-nav-item--active" : ""}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="portal-bottom-nav-badge" />}
            </NavLink>
          ))}
        </nav>
      </div>

    </>
  );
}
