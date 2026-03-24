/**
 * Claude AI Dashboard Tab - KPIs, Recent Analyses, Active Alerts
 */

import type { ClaudeAIStatus, ClaudeAIDashboard, EmailAnalysis, InstallationAlert } from "../../types/claude.types";

interface Props {
  status: ClaudeAIStatus | null;
  dashboard: ClaudeAIDashboard | null;
  onRefresh: () => void;
}

const EMAIL_TYPE_COLORS: Record<EmailAnalysis["type"], { bg: string; color: string; label: string }> = {
  GENEHMIGUNG: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", label: "Genehmigung" },
  RUECKFRAGE: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Rueckfrage" },
  ABLEHNUNG: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "Ablehnung" },
  INFO: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", label: "Info" },
  SONSTIGES: { bg: "rgba(107, 114, 128, 0.15)", color: "#6b7280", label: "Sonstiges" },
};

const SEVERITY_CONFIG: Record<InstallationAlert["severity"], { bg: string; border: string; color: string; icon: string }> = {
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.3)",
    color: "#f87171",
    icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.3)",
    color: "#fbbf24",
    icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.3)",
    color: "#60a5fa",
    icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01",
  },
};

export function DashboardTab({ status, dashboard, onRefresh }: Props) {
  const stats = status?.stats;

  return (
    <div className="claude-tab-content">
      {/* KPI Cards */}
      <div className="claude-kpi-grid">
        <KpiCard
          label="Total Analysen"
          value={stats?.totalAnalyses?.toLocaleString("de-DE") || "0"}
          icon="M3 3v18h18M19 9l-5 5-4-4-3 3"
          color="violet"
        />
        <KpiCard
          label="Heute"
          value={String(stats?.todayAnalyses || 0)}
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          color="fuchsia"
        />
        <KpiCard
          label="Avg Antwortzeit"
          value={`${stats?.avgResponseTime || 0}ms`}
          icon="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2"
          color="emerald"
        />
        <KpiCard
          label="Cache-Hit-Rate"
          value={`${stats?.cacheHitRate || 0}%`}
          icon="M13 2L3 14h9l-1 8 10-12h-9l1-8"
          color="amber"
        />
      </div>

      {/* Model Info */}
      <div className="claude-section">
        <div className="claude-section-header">
          <h3>Modell-Information</h3>
          <button className="claude-btn-ghost" onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
            </svg>
            Aktualisieren
          </button>
        </div>
        <div className="claude-info-grid">
          <InfoRow label="Modell" value={status?.model || "Nicht konfiguriert"} />
          <InfoRow label="Status" value={status?.configured ? "Online" : "Offline"} />
          <InfoRow label="Gesamtanalysen" value={stats?.totalAnalyses?.toLocaleString("de-DE") || "0"} />
          <InfoRow label="Heute" value={String(stats?.todayAnalyses || 0)} />
          <InfoRow label="Durchschn. Antwortzeit" value={`${stats?.avgResponseTime || 0}ms`} />
          <InfoRow label="Cache-Hit-Rate" value={`${stats?.cacheHitRate || 0}%`} />
        </div>
      </div>

      {/* Recent Analyses */}
      {dashboard?.recentAnalyses && dashboard.recentAnalyses.length > 0 && (
        <div className="claude-section">
          <h3>Letzte Analysen</h3>
          <div className="claude-analyses-list">
            {dashboard.recentAnalyses.map((analysis) => {
              const typeConfig = EMAIL_TYPE_COLORS[analysis.type] || EMAIL_TYPE_COLORS.SONSTIGES;
              return (
                <div key={analysis.id} className="claude-analysis-card">
                  <div className="claude-analysis-header">
                    <span
                      className="claude-type-badge"
                      style={{ background: typeConfig.bg, color: typeConfig.color, border: `1px solid ${typeConfig.color}30` }}
                    >
                      {typeConfig.label}
                    </span>
                    <span className="claude-confidence">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="claude-text-dim claude-text-xs">
                      {new Date(analysis.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="claude-analysis-summary">{analysis.summary}</div>
                  {analysis.installationId && (
                    <div className="claude-analysis-meta">
                      Installation #{analysis.installationId} | Email #{analysis.emailId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {dashboard?.alerts && dashboard.alerts.length > 0 && (
        <div className="claude-section">
          <h3>Aktive Alerts</h3>
          <div className="claude-alerts-list">
            {dashboard.alerts.map((alert, i) => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              return (
                <div
                  key={i}
                  className="claude-alert-card"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="claude-alert-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cfg.icon} />
                    </svg>
                    <span className="claude-alert-severity" style={{ color: cfg.color }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="claude-alert-type">{alert.type}</span>
                    <span className="claude-text-dim">Installation #{alert.installationId}</span>
                  </div>
                  <div className="claude-alert-message">{alert.message}</div>
                  {alert.suggestedAction && (
                    <div className="claude-alert-action">
                      <strong>Empfehlung:</strong> {alert.suggestedAction}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!dashboard?.recentAnalyses || dashboard.recentAnalyses.length === 0) &&
        (!dashboard?.alerts || dashboard.alerts.length === 0) && (
          <div className="claude-empty">
            Noch keine Analysen oder Alerts vorhanden. Starten Sie eine Email-Analyse im Tab "Email-Analyse".
          </div>
        )}
    </div>
  );
}

function KpiCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className={`claude-kpi-card claude-kpi-${color}`}>
      <div className="claude-kpi-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="claude-kpi-value">{value}</div>
      <div className="claude-kpi-label">{label}</div>
      {subtitle && <div className="claude-kpi-subtitle">{subtitle}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="claude-info-row">
      <span className="claude-info-label">{label}</span>
      <span className="claude-info-value">{value}</span>
    </div>
  );
}
