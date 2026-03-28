/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACCOUNTING PAGE
 * Hauptseite für Buchhaltung mit Tab-Navigation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Building2,
  BookOpen,
  FileText,
  CreditCard,
  Sparkles,
  Bot,
} from "lucide-react";
import { AccountingDashboard } from "./components/AccountingDashboard";
import { ExpensesTab } from "./components/tabs/ExpensesTab";
import { VendorsTab } from "./components/tabs/VendorsTab";
import { JournalTab } from "./components/tabs/JournalTab";
import { ReportsTab } from "./components/tabs/ReportsTab";
import { WiseTab } from "./components/tabs/WiseTab";
import { AIInsightsTab } from "./components/tabs/AIInsightsTab";
import { AIChatWidget } from "../../components/accounting/AIChatWidget";
import "../../modules/dashboard/dashboard.css";

type TabId = "dashboard" | "expenses" | "vendors" | "journal" | "reports" | "wise" | "ai";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  component: React.ComponentType;
}

const TABS: Tab[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: AccountingDashboard },
  { id: "wise", label: "Wise Bank", icon: CreditCard, component: WiseTab },
  { id: "expenses", label: "Ausgaben", icon: Receipt, component: ExpensesTab },
  { id: "vendors", label: "Lieferanten", icon: Building2, component: VendorsTab },
  { id: "journal", label: "Journal", icon: BookOpen, component: JournalTab },
  { id: "reports", label: "Berichte", icon: FileText, component: ReportsTab },
  { id: "ai", label: "KI Insights", icon: Sparkles, component: AIInsightsTab },
];

export function AccountingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.find((t) => t.id === tabParam) ? tabParam : "dashboard"
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

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || AccountingDashboard;

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
              <BookOpen size={20} color="white" />
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
                Buchhaltung
              </h1>
              <p
                style={{
                  color: "var(--dash-text-subtle, #71717a)",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
              >
                Baunity - Buchhaltung
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
        <ActiveComponent />
      </div>

      {/* KI-Assistent Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

export default AccountingPage;
