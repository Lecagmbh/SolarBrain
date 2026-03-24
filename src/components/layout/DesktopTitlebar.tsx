/**
 * DesktopTitlebar — Custom titlebar for Electron desktop app.
 * 38px fixed bar with drag region, logo, page title, connection indicator.
 * Only renders when running inside Electron (window.baunityDesktop).
 */

import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/netzanmeldungen": "Sales Pipeline",
  "/archiv": "Archiv",
  "/anlagen-wizard": "Neuer Lead",
  "/dokumente": "Dokumente",
  "/finanzen": "Finanzen",
  "/rechnungen": "Rechnungen",
  "/emails": "Kommunikation",
  "/email-inbox": "Email-Postfach",
  "/netzbetreiber": "Netzbetreiber",
  "/benutzer": "Benutzerverwaltung",
  "/analytics": "Analytics",
  "/produkte-db": "Produkte-Datenbank",
  "/settings/company": "Einstellungen",
  "/settings/me": "Mein Profil",
  "/import": "Import Center",
  "/projekte": "Projekte",
  "/intelligence": "Intelligence",
  "/control-center": "Control Center",
  "/hv-center": "HV Center",
  "/calendar": "Kalender",
  "/aufgaben": "Aufgaben",
  "/accounting": "Finanzen",
  "/whatsapp": "WhatsApp",
  "/nb-wissen": "NB Wissen",
  "/agent-center": "Agent Center",
  "/rag-admin": "RAG Admin",
  "/brain-admin": "Brain Admin",
};

interface DesktopTitlebarProps {
  isConnected: boolean;
}

export default function DesktopTitlebar({ isConnected }: DesktopTitlebarProps) {
  const location = useLocation();

  // Seitentitel aus Route ableiten
  const pageTitle =
    ROUTE_TITLES[location.pathname] ||
    ROUTE_TITLES[
      Object.keys(ROUTE_TITLES).find((key) =>
        location.pathname.startsWith(key)
      ) || ""
    ] ||
    "Baunity Portal";

  return (
    <>
      <style>{`
        .desktop-titlebar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 38px;
          z-index: 9999;
          display: flex;
          align-items: center;
          padding: 0 16px;
          background: #0a0e1a;
          border-bottom: 1px solid rgba(56, 189, 248, 0.08);
          -webkit-app-region: drag;
          user-select: none;
        }
        .desktop-titlebar__logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: linear-gradient(135deg, #22d3ee, #0ea5e9);
          font-weight: 800;
          font-size: 12px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.25);
        }
        .desktop-titlebar__title {
          margin-left: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #8892B0;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .desktop-titlebar__spacer {
          flex: 1;
        }
        .desktop-titlebar__status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 140px;
          -webkit-app-region: no-drag;
        }
        .desktop-titlebar__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background 0.3s, box-shadow 0.3s;
        }
        .desktop-titlebar__dot--connected {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
        }
        .desktop-titlebar__dot--disconnected {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
        }
        .desktop-titlebar__status-text {
          font-size: 11px;
          color: #475569;
        }
        .desktop-titlebar__version {
          font-size: 10px;
          color: #334155;
          margin-right: 8px;
        }
      `}</style>
      <div className="desktop-titlebar">
        <div className="desktop-titlebar__logo">GN</div>
        <div className="desktop-titlebar__title">{pageTitle}</div>
        <div className="desktop-titlebar__spacer" />
        <span className="desktop-titlebar__version">
          v{window.baunityDesktop?.version}
        </span>
        <div className="desktop-titlebar__status">
          <div
            className={`desktop-titlebar__dot ${
              isConnected
                ? "desktop-titlebar__dot--connected"
                : "desktop-titlebar__dot--disconnected"
            }`}
          />
          <span className="desktop-titlebar__status-text">
            {isConnected ? "Verbunden" : "Offline"}
          </span>
        </div>
      </div>
    </>
  );
}
