/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ADMIN LAYOUT v3.0 - FIXED NAVIGATION                                        ║
 * ║  Responsive Sidebar, Header, Mobile Support                                  ║
 * ║  - Korrigierte Pfade (/netzanmeldungen statt /archiv)                       ║
 * ║  - Kanban in Netzanmeldungen integriert                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";

// Lazy-loaded 3D Background
const DashboardBackground = lazy(() =>
  import("../../../../../components/three/DashboardBackground").then((m) => ({
    default: m.DashboardBackground,
  }))
);
import {
  Home,
  Zap,
  Mail,
  FolderOpen,
  Receipt,
  Building,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Search,
  Command,
  HelpCircle,
  Sparkles,
  FileText,
  Upload,
  Workflow,
  Database,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar, Badge } from "../ui/UIComponents";
import { CommandPalette, useCommandPalette } from "../ui/CommandPalette";
import { NotificationCenter, NotificationBell, useNotifications } from "../../features/notifications/NotificationCenter";
import { AIAssistantLocal, useAIAssistantLocal } from "../../features/ai/AIAssistantLocal";
import "./layout.css";

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useLayout must be used within LayoutProvider");
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION CONFIG - KORRIGIERT
// ═══════════════════════════════════════════════════════════════════════════════

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const getNavConfig = (userRole: string = "ADMIN", hasWhiteLabel: boolean = false): NavSection[] => {
  const isStaff = ["ADMIN", "MITARBEITER"].includes(userRole);
  const isKunde = userRole === "KUNDE";
  const isSub = userRole === "SUBUNTERNEHMER";

  const sections: NavSection[] = [
    {
      items: [
        { path: "/dashboard", label: "Dashboard", icon: <Home size={20} /> },
      ],
    },
    {
      title: "Netzanmeldungen",
      items: [
        // ✅ KORRIGIERT: /netzanmeldungen statt /archiv
        { path: "/netzanmeldungen", label: "Übersicht", icon: <Zap size={20} /> },
        // ✅ Wizard für Staff und Kunden
        ...(isStaff || isKunde ? [{ path: "/anlagen-wizard", label: "Neue Anmeldung", icon: <FileText size={20} /> }] : []),
        // ✅ Import nur für Staff und Kunden
        ...(isStaff || isKunde ? [{ path: "/import", label: "Import", icon: <Upload size={20} /> }] : []),
      ],
    },
    {
      title: "Kommunikation",
      items: [
        { path: "/emails", label: "E-Mails", icon: <Mail size={20} /> },
        { path: "/dokumente", label: "Dokumente", icon: <FolderOpen size={20} /> },
      ],
    },
  ];

  // Finanzen - nicht für Subunternehmer
  if (!isSub) {
    sections.push({
      title: "Finanzen",
      items: [
        { path: "/rechnungen", label: "Rechnungen", icon: <Receipt size={20} /> },
      ],
    });
  }

  // Staff-only sections
  if (isStaff) {
    sections.push({
      title: "Verwaltung",
      items: [
        { path: "/netzbetreiber", label: "Netzbetreiber", icon: <Building size={20} /> },
        { path: "/benutzer", label: "Benutzer", icon: <Users size={20} /> },
        { path: "/analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
        { path: "/automation", label: "Automation", icon: <Workflow size={20} /> },
      ],
    });
  } else if (isKunde && hasWhiteLabel) {
    // Kunde with WhiteLabel can see Benutzer
    sections.push({
      title: "Verwaltung",
      items: [
        { path: "/benutzer", label: "Subunternehmer", icon: <Users size={20} /> },
      ],
    });
  }

  // Settings - Admin only
  if (userRole === "ADMIN") {
    sections.push({
      title: "System",
      items: [
        { path: "/settings/company", label: "Einstellungen", icon: <Settings size={20} /> },
        { path: "/settings/database", label: "Datenbank", icon: <Database size={20} /> },
      ],
    });
  }

  return sections;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

interface SidebarProps {
  user?: { name: string; email: string; role: string };
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  hasWhiteLabel?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
  hasWhiteLabel = false,
}) => {
  const location = useLocation();
  const navConfig = getNavConfig(user?.role, hasWhiteLabel);

  // Check if a path is active (including sub-paths)
  const isActivePath = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo__icon">
            <Zap size={24} />
          </div>
          {!collapsed && <span className="sidebar-logo__text">Baunity</span>}
          
          {/* Mobile Close */}
          <button className="sidebar-mobile-close" onClick={onMobileClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navConfig.map((section, si) => (
            <div key={si} className="sidebar-section">
              {section.title && !collapsed && (
                <span className="sidebar-section__title">{section.title}</span>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    `sidebar-item ${isActivePath(item.path) ? "sidebar-item--active" : ""}`
                  }
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item__icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="sidebar-item__label">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="sidebar-item__badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="sidebar-user">
          {!collapsed && user && (
            <div className="sidebar-user__info">
              <Avatar name={user.name} size="sm" />
              <div className="sidebar-user__details">
                <span className="sidebar-user__name">{user.name}</span>
                <span className="sidebar-user__role">{user.role}</span>
              </div>
            </div>
          )}
          <NavLink to="/profil" className="sidebar-item" title="Profil">
            <span className="sidebar-item__icon"><User size={20} /></span>
            {!collapsed && <span className="sidebar-item__label">Mein Profil</span>}
          </NavLink>
        </div>

        {/* Collapse Toggle */}
        <button
          className="sidebar-collapse"
          onClick={() => onCollapse(!collapsed)}
          title={collapsed ? "Sidebar erweitern" : "Sidebar verkleinern"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface HeaderProps {
  onMobileMenuOpen: () => void;
  onCommandPaletteOpen: () => void;
  onNotificationsOpen: () => void;
  onAIOpen: () => void;
  notificationCount: number;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMobileMenuOpen,
  onCommandPaletteOpen,
  onNotificationsOpen,
  onAIOpen,
  notificationCount,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="header">
      <div className="header__left">
        {/* Mobile Menu Button */}
        <button className="header-mobile-menu" onClick={onMobileMenuOpen}>
          <Menu size={24} />
        </button>

        {/* Search */}
        <button className="header-search" onClick={onCommandPaletteOpen}>
          <Search size={18} />
          <span className="header-search__text">Suchen...</span>
          <kbd className="header-search__kbd">⌘K</kbd>
        </button>
      </div>

      <div className="header__right">
        {/* Theme Toggle */}
        <button className="header-action" onClick={onThemeToggle} title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* AI Button */}
        <button className="header-action header-action--ai" onClick={onAIOpen} title="AI Assistent">
          <Sparkles size={20} />
        </button>

        {/* Help */}
        <button className="header-action" title="Hilfe">
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <NotificationBell onClick={onNotificationsOpen} count={notificationCount} />
      </div>
    </header>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

interface AdminLayoutProps {
  user?: { name: string; email: string; role: string };
  hasWhiteLabel?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, hasWhiteLabel = false }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const commandPalette = useCommandPalette();
  const notifications = useNotifications();
  const aiAssistant = useAIAssistantLocal();

  // Close mobile menu on route change
  const location = useLocation();
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setSidebarCollapsed(saved === "true");
    
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        theme,
        setTheme,
      }}
    >
      {/* 3D Background Layer - z-index: -1, fixed position */}
      <Suspense fallback={null}>
        <DashboardBackground />
      </Suspense>

      <div className={`layout ${sidebarCollapsed ? "layout--collapsed" : ""}`} data-theme={theme}>
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          hasWhiteLabel={hasWhiteLabel}
        />

        <div className="layout-main">
          <Header
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
            onCommandPaletteOpen={commandPalette.open}
            onNotificationsOpen={notifications.open}
            onAIOpen={aiAssistant.open}
            notificationCount={notifications.unreadCount}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />

          <main className="layout-content">
            <Outlet />
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />

        {/* Notification Center */}
        <NotificationCenter isOpen={notifications.isOpen} onClose={notifications.close} />

        {/* AI Assistant */}
        <AIAssistantLocal 
          isOpen={aiAssistant.isOpen} 
          onClose={aiAssistant.close}
          user={user ? { id: 1, name: user.name, email: user.email, role: user.role as any } : { id: 0, name: "Gast", email: "", role: "KUNDE" as any }}
        />
      </div>
    </LayoutContext.Provider>
  );
};

export default AdminLayout;
