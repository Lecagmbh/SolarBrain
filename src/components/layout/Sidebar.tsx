import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { useWhiteLabel } from "../../contexts/WhiteLabelContext";
import "./sidebar.css";

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM GRIDNETZ LOGO COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function BaunityLogo({ size = 40 }: { size?: number; animated?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-baunity.png`}
      alt="Baunity"
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(212,168,67,0.3))',
        objectFit: 'contain',
      }}
    />
  );
}

function WhiteLabelLogo({ size = 40 }: { primaryColor?: string; accentColor?: string; size?: number }) {
  return <BaunityLogo size={size} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

const Icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  wallet: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  userCog: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>,
  key: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
  archive: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/></svg>,
  database: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  bot: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M9 13v2M15 13v2"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevronLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  wizard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  // NEU: Admin Center Icon (Shield)
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  // NEU: Intelligence Icon (Brain)
  brain: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  // NEU: Sparkle Icon (Claude AI)
  sparkle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/></svg>,
  // NEU: Control Center Icon (Command)
  controlCenter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7z"/><path d="M14 7h3v3h-3z"/><path d="M7 14h3v3H7z"/><path d="M14 14h3v3h-3z"/><circle cx="12" cy="12" r="1"/></svg>,
  // NEU: Ops Center Icon (Activity/Pulse)
  activity: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  // NEU: Provisionsmodul Icons
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  coins: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
  userCheck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  // NEU: Alert Center Icon (Bell)
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  // NEU: Kalender Icon
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  // NEU: WhatsApp Icon
  whatsapp: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>,
  // NEU: Buchhaltung Icon (Book)
  accounting: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h4"/></svg>,
  // NEU: EVU Learning Icon (GraduationCap)
  graduationCap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>,
  // NEU: NB-Wissen Icon (BookOpen)
  bookOpen: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  // NEU: MaStR Icon (Landmark/Government Building)
  landmark: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/><line x1="2" y1="18" x2="22" y2="18"/></svg>,
  // NEU: Workflow Icon (ClipboardCheck)
  clipboardCheck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>,
  // NEU: Aufgaben Icon (ListChecks)
  listChecks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  link2: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  inbox: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  target: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & NAVIGATION CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

type UserRole = "ADMIN" | "MANAGER" | "MITARBEITER" | "HANDELSVERTRETER" | "KUNDE" | "SUBUNTERNEHMER" | "DEMO" | "PARTNER" | "HV_LEITER" | "HV_TEAMLEITER" | "HV_LEADER";

// Display-Labels für HV-Rollen
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MITARBEITER: "Mitarbeiter",
  MANAGER: "Manager",
  HV_LEITER: "Vice President",
  HV_TEAMLEITER: "Director",
  HV_LEADER: "Leader",
  HANDELSVERTRETER: "Member",
  KUNDE: "Kunde",
  PARTNER: "Partner",
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: UserRole[]; // Wenn leer = alle Rollen
  isNew?: boolean; // Zeigt animierten "NEU" Badge
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

// Factro Center: nur für Admin + NIVOMA (kundeId 24)
const FACTRO_ALLOWED_KUNDE_IDS = [24];

// Navigation mit Rollen-Einschränkungen
const getNavConfig = (role: UserRole, hasWhitelabel: boolean, kundeId?: number, userPerms?: Record<string, unknown>): NavSection[] => {
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isMitarbeiter = role === "MITARBEITER";
  const isStaff = isAdmin || isManager || isMitarbeiter;
  const isKunde = role === "KUNDE";
  const isSub = role === "SUBUNTERNEHMER";
  const canAccessFactro = isAdmin || (isKunde && kundeId != null && FACTRO_ALLOWED_KUNDE_IDS.includes(kundeId));
  const canAccessCrm = isStaff || userPerms?.crmAccess === true;

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN: Minimale, aufgeräumte Navigation - Control Center hat alles!
  // ═══════════════════════════════════════════════════════════════════════════
  if (isAdmin) {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Sales Pipeline", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.zap, path: "/leaderboard" },
          { id: "finanzen", label: "Finanzen", icon: Icons.accounting, path: "/finanzen" },
          { id: "kunden", label: "Team & Benutzer", icon: Icons.users, path: "/kunden" },
          { id: "handelsvertreter", label: "HV-Verwaltung", icon: Icons.userCheck, path: "/admin/handelsvertreter" },
          { id: "provisionen", label: "Provisionen", icon: Icons.coins, path: "/admin/provisionen" },
          { id: "events", label: "Events & News", icon: Icons.calendar, path: "/admin/events" },
          ...(isDesktop ? [{ id: "offline", label: "Offline-Akten", icon: Icons.briefcase, path: "/offline" }] : []),
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGER: Sieht seine Teams, Finanzen, Provisionen
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "MANAGER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Sales Pipeline", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "finanzen", label: "Finanzen", icon: Icons.accounting, path: "/finanzen" },
          { id: "kunden", label: "Team & Benutzer", icon: Icons.users, path: "/kunden" },
          { id: "handelsvertreter", label: "HV-Verwaltung", icon: Icons.userCheck, path: "/admin/handelsvertreter" },
          { id: "provisionen", label: "Provisionen", icon: Icons.coins, path: "/admin/provisionen" },
        ]
      },
      {
        title: "Verwaltung",
        items: [
          { id: "wizard", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MITARBEITER: Alle Leads, KEINE Finanzen/Provisionen
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMitarbeiter) {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "netzanmeldungen", label: "Sales Pipeline", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.zap, path: "/leaderboard" },
          { id: "kommunikation", label: "Nachrichten", icon: Icons.mail, path: "/emails" },
          { id: "dokumente", label: "Dokumente", icon: Icons.file, path: "/dokumente" },
        ]
      },
      {
        title: "Verwaltung",
        items: [
          { id: "wizard", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          { id: "benutzer", label: "Team & Benutzer", icon: Icons.userCog, path: "/benutzer" },
          ...(isDesktop ? [{ id: "offline", label: "Offline-Akten", icon: Icons.briefcase, path: "/offline" }] : []),
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KUNDE: Zugriff auf eigene Anlagen und Dokumente
  // ═══════════════════════════════════════════════════════════════════════════
  if (isKunde) {
    const kundeItems: NavSection[] = [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Sales Pipeline", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.zap, path: "/leaderboard" },
          { id: "dokumente", label: "Dokumente", icon: Icons.file, path: "/dokumente" },
          { id: "finanzen", label: "Rechnungen", icon: Icons.wallet, path: "/rechnungen" },
        ]
      },
      {
        title: "Verwaltung",
        items: [
          { id: "wizard", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          ...(hasWhitelabel ? [{ id: "benutzer", label: "Benutzer", icon: Icons.userCog, path: "/benutzer" }] : []),
        ].filter(Boolean) as NavItem[]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
    return kundeItems.filter(section => section.items.length > 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HV_LEITER (Vice President): Alle eigenen Teams + Leads
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "HV_LEITER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/hv-center" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Alle Leads", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "lead-new", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.target, path: "/leaderboard" },
        ]
      },
      {
        title: "Team",
        items: [
          { id: "hv-team", label: "Meine Teams", icon: Icons.users, path: "/hv-center?tab=team" },
          { id: "hv-provisionen", label: "Provisionen", icon: Icons.coins, path: "/hv-center?tab=provisionen" },
        ]
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HV_TEAMLEITER (Director): Nur eigene Teams + Leads
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "HV_TEAMLEITER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/hv-center" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Team-Leads", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "lead-new", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.target, path: "/leaderboard" },
        ]
      },
      {
        title: "Team",
        items: [
          { id: "hv-team", label: "Mein Team", icon: Icons.users, path: "/hv-center?tab=team" },
          { id: "hv-provisionen", label: "Provisionen", icon: Icons.coins, path: "/hv-center?tab=provisionen" },
        ]
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HV_LEADER (Leader): Eigenes Team + Leads
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "HV_LEADER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/hv-center" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Team-Leads", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "lead-new", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.target, path: "/leaderboard" },
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "hv-provisionen", label: "Meine Provisionen", icon: Icons.coins, path: "/hv-center?tab=provisionen" },
        ]
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDELSVERTRETER (Member): Nur eigene Leads + Profil
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "HANDELSVERTRETER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/hv-center" },
          { id: "map", label: "Karte", icon: Icons.home, path: "/map" },
          { id: "projekte", label: "Meine Leads", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "lead-new", label: "Neuer Lead", icon: Icons.wizard, path: "/wizard" },
          { id: "leaderboard", label: "Leaderboard", icon: Icons.target, path: "/leaderboard" },
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "hv-provisionen", label: "Meine Provisionen", icon: Icons.coins, path: "/hv-center?tab=provisionen" },
        ]
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTNER: Partner Center + Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "PARTNER") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "netzanmeldungen", label: "Sales Pipeline", icon: Icons.zap, path: "/netzanmeldungen" },
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMO: Wie Kunde, aber ohne Wizard
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === "DEMO") {
    return [
      {
        items: [
          { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
          { id: "netzanmeldungen", label: "Meine Leads", icon: Icons.zap, path: "/netzanmeldungen" },
          { id: "dokumente", label: "Dokumente", icon: Icons.file, path: "/dokumente" },
        ]
      },
      {
        title: "Konto",
        items: [
          { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
        ]
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBUNTERNEHMER: Nur zugewiesene Anlagen + WhatsApp
  // ═══════════════════════════════════════════════════════════════════════════
  return [
    {
      items: [
        { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/dashboard" },
        { id: "netzanmeldungen", label: "Meine Leads", icon: Icons.zap, path: "/netzanmeldungen" },
        { id: "dokumente", label: "Dokumente", icon: Icons.file, path: "/dokumente" },
        { id: "whatsapp", label: "WhatsApp", icon: Icons.whatsapp, path: "/whatsapp", isNew: true },
      ]
    },
    {
      title: "Konto",
      items: [
        { id: "profil", label: "Mein Profil", icon: Icons.user, path: "/settings/me" },
      ]
    }
  ];
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onOpenCommand?: () => void;
  onOpenAI?: () => void;
  badges?: Record<string, number>;
  aiCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  onOpenCommand,
  onOpenAI,
  badges = {},
  aiCount = 0,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { brandName, logoUrl, primaryColor, accentColor, isWhiteLabel } = useWhiteLabel();

  // Rolle ermitteln
  const role = ((user as any)?.role || "KUNDE").toUpperCase() as UserRole;
  
  // Whitelabel prüfen - entweder aus Context oder aus User
  const hasWhitelabel = isWhiteLabel || Boolean((user as any)?.whiteLabelConfig?.enabled);

  // Navigation basierend auf Rolle
  const kundeId = (user as any)?.kundeId as number | undefined;
  const userPerms = (user as any)?.permissions as Record<string, unknown> | undefined;
  const navConfig = getNavConfig(role, hasWhitelabel, kundeId, userPerms);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = isWhiteLabel ? brandName : "Baunity";
  const fullCompanyName = isWhiteLabel ? brandName : "";

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} />
          ) : isWhiteLabel ? (
            <WhiteLabelLogo primaryColor={primaryColor} accentColor={accentColor} size={40} />
          ) : (
            <BaunityLogo size={40} animated={true} />
          )}
        </div>
        {!collapsed && (
          <div className="logo-text-wrap">
            <span className="logo-text">{displayName}</span>
            <span className="logo-subtext">{fullCompanyName}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <button className="sidebar-search" onClick={onOpenCommand}>
        <span className="search-icon">{Icons.search}</span>
        {!collapsed && (
          <>
            <span className="search-text">Suche...</span>
            <kbd className="search-kbd">⌘K</kbd>
          </>
        )}
      </button>

      {/* Nav - Rollenbasiert */}
      <nav className="sidebar-nav">
        {navConfig.map((section, idx) => (
          <div key={idx} className="nav-section">
            {section.title && !collapsed && (
              <div className="nav-section-title">{section.title}</div>
            )}
            {section.items.map(item => {
              const badge = badges[item.id];
              const isActive = location.pathname === item.path ||
                              location.pathname.startsWith(item.path + "/");

              // External links (e.g. /wizard → static HTML page)
              if (item.path === "/wizard") {
                return (
                  <a key={item.id} href="/wizard"
                    className="nav-item" title={collapsed ? item.label : undefined}>
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </a>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`nav-item ${isActive ? "nav-item--active" : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => onMobileClose?.()}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {item.isNew && !collapsed && (
                    <span className="nav-new-badge">NEU</span>
                  )}
                  {item.isNew && collapsed && (
                    <span className="nav-new-dot" />
                  )}
                  {badge && badge > 0 && (
                    <span className="nav-badge">{badge > 99 ? "99+" : badge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>


      {/* User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div 
            className="user-avatar" 
            style={isWhiteLabel ? { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` } : undefined}
          >
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{(user as any)?.name || user?.email || "User"}</span>
              <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 500 }}>{ROLE_LABELS[role] || role}</span>
            </div>
          )}
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Abmelden">
          {Icons.logout}
        </button>
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? Icons.chevronRight : Icons.chevronLeft}
      </button>
    </aside>
  );
}
