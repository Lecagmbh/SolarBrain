/**
 * Claude AI Alerts Tab - Installation alerts with filtering
 */

import { useState, useEffect } from "react";
import { claudeApi } from "../../api/claude.api";
import type { InstallationAlert } from "../../types/claude.types";

const DAYS_OPTIONS = [
  { value: 1, label: "1 Tag" },
  { value: 3, label: "3 Tage" },
  { value: 7, label: "7 Tage" },
  { value: 14, label: "14 Tage" },
  { value: 30, label: "30 Tage" },
];

const SEVERITY_ORDER: Record<InstallationAlert["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const SEVERITY_CONFIG: Record<InstallationAlert["severity"], { bg: string; border: string; color: string; badgeBg: string }> = {
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.3)",
    color: "#f87171",
    badgeBg: "rgba(239, 68, 68, 0.2)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.3)",
    color: "#fbbf24",
    badgeBg: "rgba(245, 158, 11, 0.2)",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.3)",
    color: "#60a5fa",
    badgeBg: "rgba(59, 130, 246, 0.2)",
  },
};

export function AlertsTab() {
  const [daysBack, setDaysBack] = useState(7);
  const [alerts, setAlerts] = useState<InstallationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [daysBack]);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await claudeApi.getAlerts(daysBack);
      const sorted = (res.alerts || []).sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      );
      setAlerts(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alerts laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.severity === "warning");
  const infoAlerts = alerts.filter((a) => a.severity === "info");

  return (
    <div className="claude-tab-content">
      {/* Filter Bar */}
      <div className="claude-section">
        <div className="claude-section-header">
          <h3>Alert-Filter</h3>
          <div className="claude-header-actions">
            <select
              className="claude-select"
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value, 10))}
            >
              {DAYS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Letzte {opt.label}
                </option>
              ))}
            </select>
            <button className="claude-btn-ghost" onClick={loadAlerts}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
              </svg>
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="claude-alert-summary">
          <span className="claude-badge claude-badge-red">
            {criticalAlerts.length} Kritisch
          </span>
          <span className="claude-badge claude-badge-yellow">
            {warningAlerts.length} Warnung
          </span>
          <span className="claude-badge claude-badge-blue">
            {infoAlerts.length} Info
          </span>
          <span className="claude-badge claude-badge-dim">
            {alerts.length} Gesamt
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="claude-tab-loading">
          <div className="claude-spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="claude-message claude-message-error">
          {error}
          <button className="claude-message-close" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* Critical Alerts */}
      {!loading && criticalAlerts.length > 0 && (
        <AlertGroup title="Kritische Alerts" alerts={criticalAlerts} severity="critical" />
      )}

      {/* Warning Alerts */}
      {!loading && warningAlerts.length > 0 && (
        <AlertGroup title="Warnungen" alerts={warningAlerts} severity="warning" />
      )}

      {/* Info Alerts */}
      {!loading && infoAlerts.length > 0 && (
        <AlertGroup title="Informationen" alerts={infoAlerts} severity="info" />
      )}

      {/* Empty State */}
      {!loading && !error && alerts.length === 0 && (
        <div className="claude-empty">
          Keine Alerts in den letzten {daysBack} Tagen gefunden.
        </div>
      )}
    </div>
  );
}

function AlertGroup({ title, alerts, severity }: {
  title: string;
  alerts: InstallationAlert[];
  severity: InstallationAlert["severity"];
}) {
  const cfg = SEVERITY_CONFIG[severity];

  return (
    <div className="claude-section">
      <h3 style={{ color: cfg.color }}>{title} ({alerts.length})</h3>
      <div className="claude-alerts-list">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className="claude-alert-card"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <div className="claude-alert-header">
              <span
                className="claude-alert-severity-badge"
                style={{ background: cfg.badgeBg, color: cfg.color }}
              >
                {alert.severity.toUpperCase()}
              </span>
              <span className="claude-alert-type">{alert.type}</span>
              <span className="claude-alert-installation">
                Installation #{alert.installationId}
              </span>
              {alert.dueDate && (
                <span className="claude-text-dim claude-text-xs" style={{ marginLeft: "auto" }}>
                  Frist: {new Date(alert.dueDate).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
            <div className="claude-alert-message">{alert.message}</div>
            {alert.suggestedAction && (
              <div className="claude-alert-action">
                <strong>Empfehlung:</strong> {alert.suggestedAction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
