/**
 * RAG Admin Dashboard - Enterprise RAG System Management
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ragApi } from "../api/rag.api";
import type { RagStatus, HealthCheck } from "../types/rag.types";
import { DashboardTab } from "./tabs/DashboardTab";
import { QueriesTab } from "./tabs/QueriesTab";
import { IndexingTab } from "./tabs/IndexingTab";
import { SearchTestTab } from "./tabs/SearchTestTab";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { ABTestsTab } from "./tabs/ABTestsTab";
import { BackupsTab } from "./tabs/BackupsTab";
import "../styles/rag-admin.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 3v18h18M19 9l-5 5-4-4-3 3" },
  { id: "queries", label: "Query Logs", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
  { id: "indexing", label: "Indexierung", icon: "M21 12a9 9 0 11-6.219-8.56 M21 3v5h-5" },
  { id: "search", label: "Test-Suche", icon: "M11 11a7 7 0 100-14 7 7 0 000 14z M21 21l-4.35-4.35" },
  { id: "feedback", label: "Feedback", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { id: "abtests", label: "A/B Tests", icon: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" },
  { id: "backups", label: "Backups", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function RagAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "dashboard",
  );
  const [status, setStatus] = useState<RagStatus | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, healthRes] = await Promise.all([
        ragApi.getStatus(),
        ragApi.getHealth(),
      ]);
      setStatus(statusRes);
      setHealth(healthRes);
    } catch (err) {
      console.error("RAG Status laden fehlgeschlagen:", err);
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
      <div className="rag-admin-loading">
        <div className="rag-spinner" />
        <span>RAG System laden...</span>
      </div>
    );
  }

  return (
    <div className="rag-admin-page">
      {/* Header */}
      <div className="rag-admin-header">
        <div className="rag-admin-header-content">
          <div className="rag-admin-title-row">
            <div className="rag-admin-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
              </svg>
            </div>
            <div>
              <h1>RAG Admin</h1>
              <p className="rag-admin-subtitle">Enterprise Retrieval-Augmented Generation</p>
            </div>
          </div>
          <div className="rag-admin-status-badges">
            <span className={`rag-badge ${health?.healthy ? "rag-badge-green" : "rag-badge-red"}`}>
              {health?.healthy ? "Healthy" : "Degraded"}
            </span>
            <span className="rag-badge rag-badge-blue">
              {status?.totalEmbeddings?.toLocaleString("de-DE") || "0"} Embeddings
            </span>
            {health?.alerts && health.alerts.length > 0 && (
              <span className="rag-badge rag-badge-yellow">
                {health.alerts.length} Alert{health.alerts.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rag-admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`rag-admin-tab ${activeTab === tab.id ? "active" : ""}`}
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
      <div className="rag-admin-content">
        {activeTab === "dashboard" && <DashboardTab status={status} health={health} onRefresh={loadData} />}
        {activeTab === "queries" && <QueriesTab />}
        {activeTab === "indexing" && <IndexingTab status={status} onRefresh={loadData} />}
        {activeTab === "search" && <SearchTestTab />}
        {activeTab === "feedback" && <FeedbackTab />}
        {activeTab === "abtests" && <ABTestsTab />}
        {activeTab === "backups" && <BackupsTab />}
      </div>
    </div>
  );
}
