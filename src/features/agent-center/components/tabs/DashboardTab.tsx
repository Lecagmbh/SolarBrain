/**
 * Agent Dashboard Tab - KPIs, Charts, Recent Tasks
 */

import { useState, useEffect, useCallback } from "react";
import type { AgentStats } from "../../types/agent.types";

interface Props {
  stats: AgentStats | null;
  onRefresh: () => void;
}

export function DashboardTab({ stats, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(onRefresh, 10000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh();
    // Visual feedback for manual refresh
    setTimeout(() => setRefreshing(false), 600);
  }, [onRefresh]);

  if (!stats) {
    return (
      <div className="agent-tab-loading">
        <div className="agent-spinner" />
      </div>
    );
  }

  const avgDurationSec = stats.avgDurationMs ? (stats.avgDurationMs / 1000).toFixed(1) : "0";

  // Prepare bar chart data for tasks by type
  const typeEntries = Object.entries(stats.tasksByType || {}).sort(([, a], [, b]) => b - a);
  const maxTypeCount = typeEntries.length > 0 ? Math.max(...typeEntries.map(([, v]) => v)) : 1;

  return (
    <div className="agent-tab-content">
      {/* KPI Cards */}
      <div className="agent-kpi-grid">
        <KpiCard
          label="Gesamt Tasks"
          value={stats.totalTasks.toLocaleString("de-DE")}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          color="amber"
        />
        <KpiCard
          label="Laufend"
          value={String(stats.runningTasks)}
          icon="M13 2L3 14h9l-1 8 10-12h-9l1-8"
          color="blue"
          subtitle={stats.runningTasks > 0 ? "Aktiv" : undefined}
        />
        <KpiCard
          label="Wartend"
          value={String(stats.pendingTasks)}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="orange"
        />
        <KpiCard
          label="Abgeschlossen"
          value={stats.completedTasks.toLocaleString("de-DE")}
          icon="M22 11.08V12a10 10 0 11-5.93-9.14M9 11l3 3L22 4"
          color="emerald"
        />
        <KpiCard
          label="Fehlgeschlagen"
          value={String(stats.failedTasks)}
          icon="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
          color="red"
        />
        <KpiCard
          label="Erfolgsrate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
          color="cyan"
          subtitle={`Avg. Dauer: ${avgDurationSec}s`}
        />
      </div>

      {/* Tasks by Type - Bar Chart */}
      {typeEntries.length > 0 && (
        <div className="agent-section">
          <div className="agent-section-header">
            <h3>Tasks nach Typ</h3>
            <button
              className="agent-btn-ghost"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={refreshing ? { animation: "agent-spin 0.6s linear" } : undefined}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
              </svg>
              Aktualisieren
            </button>
          </div>
          <div className="agent-bar-chart">
            {typeEntries.map(([type, count]) => {
              const pct = (count / maxTypeCount) * 100;
              return (
                <div key={type} className="agent-bar-row">
                  <span className="agent-bar-label" title={type}>{type}</span>
                  <div className="agent-bar-track">
                    <div
                      className="agent-bar-fill"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="agent-bar-value">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks by Status */}
      {stats.tasksByStatus && Object.keys(stats.tasksByStatus).length > 0 && (
        <div className="agent-section">
          <h3>Verteilung nach Status</h3>
          <div className="agent-status-grid">
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <div key={status} className="agent-status-card">
                <div className="agent-status-card-label">{formatStatusLabel(status)}</div>
                <div className="agent-status-card-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {stats.recentTasks && stats.recentTasks.length > 0 && (
        <div className="agent-section">
          <h3>Letzte Tasks (10)</h3>
          <div className="agent-recent-list">
            {stats.recentTasks.slice(0, 10).map((task) => (
              <div key={task.id} className="agent-recent-item">
                <span className="agent-recent-id">#{task.id}</span>
                <span className="agent-recent-type">{task.type}</span>
                <span className={`agent-task-status-badge agent-task-status-${task.status}`}>
                  {task.status}
                </span>
                <span className="agent-recent-time">
                  {new Date(task.createdAt).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avg Duration Info */}
      <div className="agent-section">
        <h3>Performance</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <InfoRow label="Durchschnittliche Dauer" value={`${avgDurationSec}s`} />
          <InfoRow label="Gesamt Tasks" value={stats.totalTasks.toLocaleString("de-DE")} />
          <InfoRow label="Abgebrochen" value={String(stats.cancelledTasks)} />
          <InfoRow label="Erfolgsrate" value={`${stats.successRate.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Wartend",
    RUNNING: "Laufend",
    COMPLETED: "Abgeschlossen",
    FAILED: "Fehlgeschlagen",
    CANCELLED: "Abgebrochen",
    WAITING_CONFIRMATION: "Warte auf Bestätigung",
    WAITING_INPUT: "Warte auf Eingabe",
  };
  return labels[status] || status;
}

function KpiCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className={`agent-kpi-card agent-kpi-${color}`}>
      <div className="agent-kpi-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="agent-kpi-value">{value}</div>
      <div className="agent-kpi-label">{label}</div>
      {subtitle && <div className="agent-kpi-subtitle">{subtitle}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "0.5rem 0",
      borderBottom: "1px solid rgba(51, 65, 85, 0.2)",
    }}>
      <span style={{ color: "#71717a", fontSize: "0.8rem" }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
