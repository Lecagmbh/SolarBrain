/**
 * FINANZEN PAGE
 * Konsolidierte Finanzseite: Rechnungen, OP, Abrechnung, Wise, Journal, Berichte, KI
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ClipboardList,
  CreditCard,
  Receipt,
  BookOpen,
  FileBarChart,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AIChatWidget } from "../../components/accounting/AIChatWidget";
import "../../modules/dashboard/dashboard.css";

// Lazy-load tab components
const UebersichtTab = lazy(() => import("./tabs/UebersichtTab"));
const RechnungenContent = lazy(() =>
  import("../../pages/RechnungenPage").then((m) => ({ default: m.RechnungenContent }))
);
const OPCenterContent = lazy(() =>
  import("../../pages/OPCenterPage").then((m) => ({ default: m.OPCenterContent }))
);
const AbrechnungOverview = lazy(() => import("../../components/billing/AbrechnungOverview"));
const PreiseKundenTab = lazy(() => import("./tabs/PreiseKundenTab"));
const WiseTab = lazy(() =>
  import("../accounting/components/tabs/WiseTab").then((m) => ({ default: m.WiseTab }))
);
const AusgabenTab = lazy(() => import("./tabs/AusgabenTab"));
const JournalTab = lazy(() =>
  import("../accounting/components/tabs/JournalTab").then((m) => ({ default: m.JournalTab }))
);
const ReportsTab = lazy(() =>
  import("../accounting/components/tabs/ReportsTab").then((m) => ({ default: m.ReportsTab }))
);
const AIInsightsTab = lazy(() =>
  import("../accounting/components/tabs/AIInsightsTab").then((m) => ({ default: m.AIInsightsTab }))
);

type TabId =
  | "uebersicht"
  | "rechnungen"
  | "offene-posten"
  | "abrechnung"
  | "preise"
  | "wise"
  | "ausgaben"
  | "journal"
  | "berichte"
  | "ki";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TABS: Tab[] = [
  { id: "uebersicht", label: "Übersicht", icon: LayoutDashboard },
  { id: "rechnungen", label: "Rechnungen", icon: FileText },
  { id: "offene-posten", label: "Offene Posten", icon: AlertTriangle },
  { id: "abrechnung", label: "Abrechnung", icon: ClipboardList },
  { id: "preise", label: "Preise & Kunden", icon: CreditCard },
  { id: "wise", label: "Wise Bank", icon: CreditCard },
  { id: "ausgaben", label: "Ausgaben", icon: Receipt },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "berichte", label: "Berichte", icon: FileBarChart },
  { id: "ki", label: "KI Insights", icon: Sparkles },
];

const TabLoader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      color: "var(--dash-text-subtle, #71717a)",
    }}
  >
    <Loader2 size={28} className="animate-spin" />
  </div>
);

function TabContent({ tabId }: { tabId: TabId }) {
  switch (tabId) {
    case "uebersicht":
      return <UebersichtTab />;
    case "rechnungen":
      return <RechnungenContent />;
    case "offene-posten":
      return <OPCenterContent />;
    case "abrechnung":
      return <AbrechnungOverview />;
    case "preise":
      return <PreiseKundenTab />;
    case "wise":
      return <WiseTab />;
    case "ausgaben":
      return <AusgabenTab />;
    case "journal":
      return <JournalTab />;
    case "berichte":
      return <ReportsTab />;
    case "ki":
      return <AIInsightsTab />;
    default:
      return <UebersichtTab />;
  }
}

export function FinanzenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.find((t) => t.id === tabParam) ? tabParam : "uebersicht"
  );

  useEffect(() => {
    if (tabParam && TABS.find((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--dash-bg, #060b18)" }}>
      {/* Header */}
      <header
        style={{
          background: "rgba(10, 10, 15, 0.95)",
          borderBottom: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
          padding: "1rem 2.5rem",
        }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutDashboard size={20} color="white" />
            </div>
            <div>
              <h1
                style={{
                  color: "var(--dash-text, #fafafa)",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Finanzen
              </h1>
              <p
                style={{
                  color: "var(--dash-text-subtle, #71717a)",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
              >
                Rechnungen · Offene Posten · Buchhaltung · Berichte
              </p>
            </div>
          </div>
        </div>
      </header>

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
                  background: isActive ? "rgba(16, 185, 129, 0.08)" : "transparent",
                  border: "none",
                  color: isActive ? "#10b981" : "var(--dash-text-subtle, #71717a)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  position: "relative",
                  letterSpacing: "0.01em",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderBottom: isActive ? "2px solid #10b981" : "2px solid transparent",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div style={{ minHeight: "calc(100vh - 120px)" }}>
        <Suspense fallback={<TabLoader />}>
          <TabContent tabId={activeTab} />
        </Suspense>
      </div>

      {/* KI-Assistent Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

export default FinanzenPage;
