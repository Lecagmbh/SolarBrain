import { useAnnouncementPopup } from "../admin-center/components/AnnouncementPopup/AnnouncementPopup";
import "../styles/sidebar-item.css";
import "../styles/admin-modern.css";

import {
  LayoutDashboard,
  FileText,
  Mail,
  Inbox,
  FileSpreadsheet,
  Settings,
  UserCircle,
  LogOut,
  KeyRound,
  Archive,
  Upload,
  Lock,
  Building2,
  Zap,
  BarChart3,
  Database,
} from "lucide-react";

import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../pages/AuthContext";

/* 🔥 startet Upload-Queue automatisch */
import { useUploadQueueRunner } from "../modules/uploadQueue/useUploadQueueRunner";
import { clearAccessToken } from "../modules/auth/tokenStorage";

export default function AdminLayout() {
  const { user } = useAuth();
  const role = (user?.role || "").toUpperCase();
  
  // Whitelabel Check
  const whiteLabelConfig = (user as any)?.whiteLabelConfig || (user as any)?.kunde?.whiteLabelConfig;
  const hasWhitelabel = Boolean(whiteLabelConfig?.enabled);

  useUploadQueueRunner();
  const { AnnouncementPopup } = useAnnouncementPopup();

  useEffect(() => {
    const flag = localStorage.getItem("wizard_submit_success");
    if (!flag) return;
    localStorage.removeItem("wizard_submit_success");

    const el = document.createElement("div");
    el.textContent =
      "✅ Netzanmeldung erstellt – Dokumente werden im Hintergrund hochgeladen.";
    el.style.position = "fixed";
    el.style.right = "16px";
    el.style.bottom = "16px";
    el.style.padding = "12px 14px";
    el.style.borderRadius = "14px";
    el.style.background = "rgba(0,0,0,0.9)";
    el.style.color = "white";
    el.style.fontSize = "13px";
    el.style.fontWeight = "600";
    el.style.zIndex = "99999";
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3500);
  }, []);

  /* =====================
     NAVIGATION - Rollenbasiert
  ===================== */

  // SUBUNTERNEHMER - Minimal (nur eigene Daten sehen)
  const NAV_SUBUNTERNEHMER = [
    {
      group: "Hauptnavigation",
      items: [
        { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Netzanmeldungen", to: "/admin/archiv", icon: Archive },
        { label: "Dokumente", to: "/admin/dokumente", icon: FileText },
        { label: "Kommunikation", to: "/admin/emails", icon: Mail },
        { label: "Finanzen", to: "/admin/rechnungen", icon: FileSpreadsheet },
      ],
    },
    {
      group: "Konto",
      items: [
        { label: "Mein Profil", to: "/admin/settings/me", icon: KeyRound },
      ],
    },
  ];

  // KUNDE - Eigene Daten + evtl. Whitelabel
  const NAV_KUNDE = [
    {
      group: "Hauptnavigation",
      items: [
        { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Netzanmeldungen", to: "/admin/archiv", icon: Archive },
        { label: "Dokumente", to: "/admin/dokumente", icon: FileText },
        { label: "Kommunikation", to: "/admin/emails", icon: Mail },
        { label: "Finanzen", to: "/admin/rechnungen", icon: FileSpreadsheet },
      ],
    },
    {
      group: "Verwaltung",
      items: [
        { label: "Neuer Lead", to: "/wizard", icon: Zap, external: true },
        { label: "Import Center", to: "/admin/import", icon: Upload },
        // Benutzerverwaltung nur bei Whitelabel
        ...(hasWhitelabel ? [{ label: "Benutzerverwaltung", to: "/admin/benutzer", icon: UserCircle }] : []),
      ],
    },
    {
      group: "Konto",
      items: [
        { label: "Mein Profil", to: "/admin/settings/me", icon: KeyRound },
      ],
    },
  ];

  // MITARBEITER - Wie Admin, aber ohne Company Settings
  const NAV_MITARBEITER = [
    {
      group: "Hauptnavigation",
      items: [
        { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Netzanmeldungen", to: "/admin/archiv", icon: Archive },
        { label: "Dokumente", to: "/admin/dokumente", icon: FileText },
        { label: "Kommunikation", to: "/admin/emails", icon: Mail },
        { label: "Email-Postfach", to: "/admin/email-inbox", icon: Inbox },
        { label: "Finanzen", to: "/admin/rechnungen", icon: FileSpreadsheet },
      ],
    },
    {
      group: "Verwaltung",
      items: [
        { label: "Neuer Lead", to: "/wizard", icon: Zap, external: true },
        { label: "Import Center", to: "/admin/import", icon: Upload },
        { label: "Netzbetreiber", to: "/admin/netzbetreiber", icon: Building2 },
        { label: "Benutzerverwaltung", to: "/admin/benutzer", icon: UserCircle },
        { label: "Passwort-Center", to: "/admin/passwoerter", icon: Lock },
        { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
        { label: "Produkte DB", to: "/admin/produkte-db", icon: Database },
      ],
    },
    {
      group: "Konto",
      items: [
        { label: "Mein Profil", to: "/admin/settings/me", icon: KeyRound },
      ],
    },
  ];

  // ADMIN - Vollzugriff
  const NAV_ADMIN = [
    {
      group: "Hauptnavigation",
      items: [
        { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Netzanmeldungen", to: "/admin/archiv", icon: Archive },
        { label: "Dokumente", to: "/admin/dokumente", icon: FileText },
        { label: "Kommunikation", to: "/admin/emails", icon: Mail },
        { label: "Email-Postfach", to: "/admin/email-inbox", icon: Inbox },
        { label: "Finanzen", to: "/admin/rechnungen", icon: FileSpreadsheet },
      ],
    },
    {
      group: "Verwaltung",
      items: [
        { label: "Neuer Lead", to: "/wizard", icon: Zap, external: true },
        { label: "Import Center", to: "/admin/import", icon: Upload },
        { label: "Netzbetreiber", to: "/admin/netzbetreiber", icon: Building2 },
        { label: "Benutzerverwaltung", to: "/admin/benutzer", icon: UserCircle },
        { label: "Passwort-Center", to: "/admin/passwoerter", icon: Lock },
        { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
        { label: "Produkte DB", to: "/admin/produkte-db", icon: Database },
        { label: "Company Settings", to: "/admin/settings/company", icon: Settings },
      ],
    },
  ];

  // Navigation basierend auf Rolle wählen
  function getNavigation() {
    switch (role) {
      case "ADMIN":
        return NAV_ADMIN;
      case "MITARBEITER":
        return NAV_MITARBEITER;
      case "SUBUNTERNEHMER":
        return NAV_SUBUNTERNEHMER;
      case "KUNDE":
      default:
        return NAV_KUNDE;
    }
  }

  const NAV = getNavigation();

  function logout() {
    clearAccessToken();
    window.location.href = "https://baunity.de";
  }

  return (
    <div className="admin-shell-modern" data-role={role.toLowerCase()}>
      <aside className="admin-sidebar-modern">
        <nav className="admin-nav-modern">
          {NAV.map((section, i) => (
            <div key={i}>
              <div className="admin-nav-group-title">{section.group}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      "admin-nav-item-modern" +
                      (isActive ? " admin-nav-item-modern--active" : "")
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <button className="admin-user-modern" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="admin-main-modern">
        <Outlet />
      </main>
      {AnnouncementPopup}
    </div>
  );
}
