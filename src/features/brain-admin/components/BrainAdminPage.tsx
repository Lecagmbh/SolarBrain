/**
 * Brain Admin Dashboard - Self-Learning Intelligence System
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { brainApi } from "../api/brain.api";
import type { BrainStats } from "../types/brain.types";
import { DashboardTab } from "./tabs/DashboardTab";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { PatternsRulesTab } from "./tabs/PatternsRulesTab";
import { EventsTab } from "./tabs/EventsTab";
import "../styles/brain-admin.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
  { id: "knowledge", label: "Wissen", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "patterns", label: "Patterns & Regeln", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "events", label: "Events", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BrainAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "dashboard",
  );
  const [stats, setStats] = useState<BrainStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await brainApi.getStats();
      setStats(statsRes);
    } catch (err) {
      console.error("Brain Stats laden fehlgeschlagen:", err);
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
      <div className="brain-admin-loading">
        <div className="brain-spinner" />
        <span>Brain System laden...</span>
      </div>
    );
  }

  return (
    <div className="brain-admin-page">
      {/* Header */}
      <div className="brain-admin-header">
        <div className="brain-admin-header-content">
          <div className="brain-admin-title-row">
            <div className="brain-admin-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1>Brain Admin</h1>
              <p className="brain-admin-subtitle">Self-Learning Intelligence System</p>
            </div>
          </div>
          <div className="brain-admin-status-badges">
            <span className="brain-badge brain-badge-emerald">
              {stats?.knowledge?.total?.toLocaleString("de-DE") || "0"} Wissen
            </span>
            <span className="brain-badge brain-badge-teal">
              {stats?.patterns?.active || 0} Patterns
            </span>
            <span className="brain-badge brain-badge-blue">
              {stats?.events?.last24h || 0} Events (24h)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="brain-admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`brain-admin-tab ${activeTab === tab.id ? "active" : ""}`}
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
      <div className="brain-admin-content">
        {activeTab === "dashboard" && <DashboardTab stats={stats} onRefresh={loadData} />}
        {activeTab === "knowledge" && <KnowledgeTab />}
        {activeTab === "patterns" && <PatternsRulesTab />}
        {activeTab === "events" && <EventsTab />}
      </div>
    </div>
  );
}
