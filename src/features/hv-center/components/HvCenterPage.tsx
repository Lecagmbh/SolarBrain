/**
 * HV CENTER PAGE
 * Main container with tab navigation for Handelsvertreter (HV) provisioning module
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Coins,
  Banknote,
  UserPlus,
  UserCircle,
  FileText,
  Target,
  BookOpen,
  AlertTriangle,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../../pages/AuthContext";
import { useHvContract } from "../hooks/useHvContract";
import { hvCenterApi } from "../api/hv-center.api";
import { HvDashboardTab } from "./tabs/HvDashboardTab";
import { HvKundenTab } from "./tabs/HvKundenTab";
import { HvProvisionenTab } from "./tabs/HvProvisionenTab";
import { HvAuszahlungenTab } from "./tabs/HvAuszahlungenTab";
import { HvBenutzerTab } from "./tabs/HvBenutzerTab";
import { HvProfilTab } from "./tabs/HvProfilTab";
import { HvVertragTab } from "./tabs/HvVertragTab";
import { HvLeadsTab } from "./tabs/HvLeadsTab";
import { HvProgrammTab } from "./tabs/HvProgrammTab";
import { HvTeamTab } from "./tabs/HvTeamTab";

type TabId = "dashboard" | "leads" | "kunden" | "provisionen" | "auszahlungen" | "benutzer" | "profil" | "vertrag" | "programm" | "team";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  component: React.ComponentType;
  oberHvOnly?: boolean;
}

const ALL_TABS: Tab[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: HvDashboardTab },
  { id: "team", label: "Mein Team", icon: UsersRound, component: HvTeamTab, oberHvOnly: true },
  { id: "provisionen", label: "Provisionen", icon: Coins, component: HvProvisionenTab },
  { id: "auszahlungen", label: "Auszahlungen", icon: Banknote, component: HvAuszahlungenTab },
  { id: "vertrag", label: "Vertrag", icon: FileText, component: HvVertragTab },
];

const ALLOWED_ROLES = ["ADMIN", "MITARBEITER", "HANDELSVERTRETER", "HV_LEITER", "HV_TEAMLEITER", "HV_LEADER"];

export function HvCenterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOberHv, setIsOberHv] = useState(false);

  // HV-Leitungsrollen sehen Team-Tab immer
  const isHvLeader = ["HV_LEITER", "HV_TEAMLEITER", "HV_LEADER"].includes(user?.role || "");

  // Ober-HV Status laden (für HANDELSVERTRETER die Unter-HVs haben)
  useEffect(() => {
    if (user?.role === "HANDELSVERTRETER" || user?.role === "ADMIN" || user?.role === "MITARBEITER") {
      hvCenterApi.getProfil()
        .then((profil: any) => setIsOberHv(profil?.isOberHv === true))
        .catch(() => {});
    }
  }, [user]);

  // Tabs filtern: team-Tab für Leitungsrollen, Ober-HVs oder Staff
  const isStaff = user?.role === "ADMIN" || user?.role === "MITARBEITER";
  const TABS = ALL_TABS.filter((t) => !t.oberHvOnly || isHvLeader || isOberHv || isStaff);

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.find((t) => t.id === tabParam) ? tabParam : "dashboard"
  );

  useEffect(() => {
    if (tabParam && TABS.find((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, TABS]);

  // Contract check for HV users
  const { needsAcceptance, loading: contractLoading } = useHvContract();

  const showContractBanner = !contractLoading && needsAcceptance && user?.role === "HANDELSVERTRETER";

  // Redirect non-HV users (Admin/Mitarbeiter haben eigenes Dashboard)
  useEffect(() => {
    if (!user) return;
    if (!ALLOWED_ROLES.includes(user.role)) {
      navigate("/dashboard", { replace: true });
    }
    // Admin/Mitarbeiter → eigenes Dashboard (HV-Center ist nur für HV-Rollen)
    if (user.role === "ADMIN" || user.role === "MITARBEITER") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || HvDashboardTab;

  // Don't render if user isn't authorized
  if (user && !ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--dash-bg, #060b18)" }}>
      {/* Tab Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10, 10, 15, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          padding: "0 2.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.125rem",
            maxWidth: "1600px",
            margin: "0 auto",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.125rem",
                  background: isActive ? "rgba(212, 168, 67, 0.08)" : "transparent",
                  border: "none",
                  color: isActive
                    ? "var(--dash-primary, #D4A843)"
                    : "var(--dash-text-subtle, #71717a)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  position: "relative",
                  letterSpacing: "0.01em",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderBottom: isActive
                    ? "2px solid var(--dash-primary, #D4A843)"
                    : "2px solid transparent",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contract Banner */}
      {showContractBanner && (
        <div
          style={{
            margin: "1rem 2.5rem 0",
            maxWidth: "1600px",
            padding: "0.875rem 1.25rem",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#f59e0b",
            fontSize: "0.85rem",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            Ihr Handelsvertretervertrag wurde noch nicht unterschrieben.
          </span>
          <button
            onClick={() => navigate("/hv-center/vertrag")}
            style={{
              padding: "0.5rem 1rem",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: "8px",
              color: "#f59e0b",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Jetzt unterschreiben
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div style={{ minHeight: "calc(100vh - 52px)" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}

export default HvCenterPage;
