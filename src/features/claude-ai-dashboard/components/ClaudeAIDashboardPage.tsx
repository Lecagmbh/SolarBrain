/**
 * AI Dashboard - Intelligente Automatisierung fuer Baunity (OpenAI GPT-4o)
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { claudeApi } from "../api/claude.api";
import type { ClaudeAIStatus, ClaudeAIDashboard } from "../types/claude.types";
import { DashboardTab } from "./tabs/DashboardTab";
import { EmailAnalysisTab } from "./tabs/EmailAnalysisTab";
// Deaktiviert – Alert-System wird überarbeitet
// import { AlertsTab } from "./tabs/AlertsTab";
import { AssistantTab } from "./tabs/AssistantTab";
import "../styles/claude-dashboard.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 3v18h18M19 9l-5 5-4-4-3 3" },
  { id: "email-analyse", label: "Email-Analyse", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
  { id: "assistent", label: "Assistent", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ClaudeAIDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "dashboard",
  );
  const [status, setStatus] = useState<ClaudeAIStatus | null>(null);
  const [dashboard, setDashboard] = useState<ClaudeAIDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, dashboardRes] = await Promise.all([
        claudeApi.getStatus(),
        claudeApi.getDashboard(),
      ]);
      setStatus(statusRes);
      setDashboard(dashboardRes);
    } catch (err) {
      console.error("AI Dashboard laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="claude-loading">
        <div className="claude-spinner" />
        <span>AI Dashboard laden...</span>
      </div>
    );
  }

  return (
    <div className="claude-dashboard-page">
      {/* Header */}
      <div className="claude-dashboard-header">
        <div className="claude-header-content">
          <div className="claude-title-row">
            <div className="claude-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 3l1.5 3.2 3.5.5-2.5 2.4.6 3.5L12 11l-3.1 1.6.6-3.5-2.5-2.4 3.5-.5z" />
                <path d="M5 16l1 2.1 2.3.3-1.7 1.6.4 2.3L5 21l-2 1.3.4-2.3-1.7-1.6 2.3-.3z" />
                <path d="M19 16l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.3-2 1.3.4-2.3-1.7-1.6 2.3-.3z" />
              </svg>
            </div>
            <div>
              <h1>AI Dashboard</h1>
              <p className="claude-header-subtitle">Intelligente Automatisierung (OpenAI)</p>
            </div>
          </div>
          <div className="claude-status-badges">
            <span className={`claude-badge ${status?.configured ? "claude-badge-green" : "claude-badge-red"}`}>
              {status?.configured ? "Konfiguriert" : "Nicht konfiguriert"}
            </span>
            <span className="claude-badge claude-badge-violet">
              {status?.model || "Kein Modell"}
            </span>
            <span className="claude-badge claude-badge-blue">
              {status?.stats?.totalAnalyses?.toLocaleString("de-DE") || "0"} Analysen
            </span>
            <span className="claude-badge claude-badge-amber">
              Heute: {status?.stats?.todayAnalyses || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="claude-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`claude-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="claude-content">
        {activeTab === "dashboard" && (
          <DashboardTab status={status} dashboard={dashboard} onRefresh={loadData} />
        )}
        {activeTab === "email-analyse" && (
          <EmailAnalysisTab dashboard={dashboard} />
        )}
        {activeTab === "assistent" && <AssistantTab />}
      </div>
    </div>
  );
}
