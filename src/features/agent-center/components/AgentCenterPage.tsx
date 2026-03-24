/**
 * Agent Center Dashboard - AI Agent Task Management
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { agentApi } from "../api/agent.api";
import type { AgentStats } from "../types/agent.types";
import { DashboardTab } from "./tabs/DashboardTab";
import { TasksTab } from "./tabs/TasksTab";
import { NewTaskTab } from "./tabs/NewTaskTab";
import "../styles/agent-center.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 3v18h18M19 9l-5 5-4-4-3 3" },
  { id: "tasks", label: "Tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M8 12h.01M16 12h.01" },
  { id: "new", label: "Neuer Task", icon: "M12 5v14M5 12h14" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AgentCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "dashboard",
  );
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await agentApi.getStats();
      setStats(res);
    } catch (err) {
      console.error("Agent Stats laden fehlgeschlagen:", err);
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
      <div className="agent-center-loading">
        <div className="agent-spinner" />
        <span>Agent Center laden...</span>
      </div>
    );
  }

  const successRate = stats?.successRate ?? 0;

  return (
    <div className="agent-center-page">
      {/* Header */}
      <div className="agent-center-header">
        <div className="agent-center-header-content">
          <div className="agent-center-title-row">
            <div className="agent-center-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 015.27 19H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                <circle cx="9" cy="13" r="1" />
                <circle cx="15" cy="13" r="1" />
                <path d="M9 17h6" />
              </svg>
            </div>
            <div>
              <h1>Agent Center</h1>
              <p className="agent-center-subtitle">18 Spezialisierte AI-Agenten</p>
            </div>
          </div>
          <div className="agent-center-status-badges">
            {(stats?.runningTasks ?? 0) > 0 && (
              <span className="agent-badge agent-badge-blue agent-badge-pulse">
                {stats!.runningTasks} Laufend
              </span>
            )}
            {(stats?.pendingTasks ?? 0) > 0 && (
              <span className="agent-badge agent-badge-yellow">
                {stats!.pendingTasks} Wartend
              </span>
            )}
            <span className={`agent-badge ${successRate >= 90 ? "agent-badge-green" : successRate >= 70 ? "agent-badge-yellow" : "agent-badge-red"}`}>
              {successRate.toFixed(1)}% Erfolgsrate
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="agent-center-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`agent-center-tab ${activeTab === tab.id ? "active" : ""}`}
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
      <div className="agent-center-content">
        {activeTab === "dashboard" && <DashboardTab stats={stats} onRefresh={loadStats} />}
        {activeTab === "tasks" && <TasksTab />}
        {activeTab === "new" && <NewTaskTab onCreated={loadStats} />}
      </div>
    </div>
  );
}
