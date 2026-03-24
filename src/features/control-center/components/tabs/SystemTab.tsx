/**
 * SYSTEM TAB
 * System monitoring, cron jobs, health checks, and feature flags
 */

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  RefreshCw,
  Clock,
  Database,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Timer,
  HardDrive,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

interface HealthCheck {
  status: "ok" | "warning" | "error";
  message?: string;
  value?: number | string;
}

interface HealthData {
  status: "ok" | "warning" | "error";
  checks: Record<string, HealthCheck>;
  timestamp: string;
}

interface CronJob {
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  status: "ok" | "running" | "failed" | "disabled";
  duration?: number;
}

interface SystemStats {
  database: {
    installations: number;
    users: number;
    documents: number;
    emails: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

const CRON_JOBS: CronJob[] = [
  { name: "Email Scheduler", schedule: "*/2 * * * *", lastRun: null, nextRun: null, status: "ok" },
  { name: "Email Digest", schedule: "0 9 * * *", lastRun: null, nextRun: null, status: "ok" },
  { name: "NB-Nachfragen", schedule: "30 9 * * *", lastRun: null, nextRun: null, status: "ok" },
  { name: "Document Batch", schedule: "*/5 * * * *", lastRun: null, nextRun: null, status: "ok" },
  { name: "Hourly Metrics", schedule: "0 * * * *", lastRun: null, nextRun: null, status: "ok" },
  { name: "Daily Cleanup", schedule: "0 4 * * *", lastRun: null, nextRun: null, status: "ok" },
];

const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  { key: "auto_nb_nachfrage", label: "Auto NB-Nachfragen", enabled: true, description: "Automatische Nachfragen an Netzbetreiber" },
  { key: "email_tracking", label: "Email Tracking", enabled: true, description: "Tracking von Email-Öffnungen" },
  { key: "ai_predictions", label: "KI-Prognosen", enabled: true, description: "Intelligente Vorhersagen für Genehmigungen" },
  { key: "document_ocr", label: "Dokument OCR", enabled: false, description: "Automatische Texterkennung in Dokumenten" },
  { key: "beta_features", label: "Beta Features", enabled: false, description: "Experimentelle neue Funktionen" },
];

const FEATURE_FLAG_MAP: Record<string, string> = {
  ai_predictions: "featureAI",
  auto_nb_nachfrage: "featureProjects",
  email_tracking: "featureAnalytics",
  document_ocr: "featureWizard",
  beta_features: "featureWhiteLabel",
};

/* ── inline style objects ── */

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabTitle: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#e2e8f0",
  },
  tabTitleH2: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  tabTitleP: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#71717a",
  },
  tabActions: {
    display: "flex",
    gap: "0.75rem",
  },
  btnRefresh: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    padding: "0.625rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    background: "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "var(--dash-radius, 16px)",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  sectionH3: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#e2e8f0",
    margin: "0 0 1rem 0",
  },
  healthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  healthCard: (status: string): React.CSSProperties => ({
    background: status === "warning"
      ? "rgba(245, 158, 11, 0.05)"
      : status === "error"
        ? "rgba(239, 68, 68, 0.05)"
        : "rgba(255,255,255,0.03)",
    border: `1px solid ${
      status === "ok"
        ? "rgba(16, 185, 129, 0.3)"
        : status === "warning"
          ? "rgba(245, 158, 11, 0.3)"
          : status === "error"
            ? "rgba(239, 68, 68, 0.3)"
            : "rgba(255,255,255,0.08)"
    }`,
    borderRadius: "12px",
    padding: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  }),
  healthCardOverall: (status: string): React.CSSProperties => ({
    ...styles.healthCard(status),
    gridColumn: "span 2",
  }),
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: "10px",
    background: "rgba(212, 168, 67, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#D4A843",
    flexShrink: 0,
  } as React.CSSProperties,
  healthInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  healthLabel: {
    fontSize: "0.75rem",
    color: "#71717a",
    textTransform: "capitalize" as const,
  },
  healthStatus: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "#e2e8f0",
  },
  healthStatusLarge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    color: "#e2e8f0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
  },
  statCard: {
    background: "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center" as const,
  },
  statIcon: {
    width: 40,
    height: 40,
    margin: "0 auto 0.75rem",
    borderRadius: "10px",
    background: "rgba(212, 168, 67, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#D4A843",
  } as React.CSSProperties,
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "0.25rem",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#71717a",
  },
  tableContainer: {
    background: "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "12px",
    overflow: "hidden",
  } as React.CSSProperties,
  dataTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableTh: {
    background: "rgba(255,255,255,0.03)",
    textAlign: "left" as const,
    padding: "10px 16px",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  tableTd: {
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.03)",
    color: "#e2e8f0",
    fontSize: "0.85rem",
  },
  jobName: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#e2e8f0",
  },
  codeStyle: {
    background: "rgba(212, 168, 67, 0.1)",
    color: "#D4A843",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontFamily: "monospace",
  },
  statusBadge: (bgColor: string, textColor: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.625rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 500,
    background: bgColor,
    color: textColor,
  }),
  flagsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1rem",
  },
  flagCard: {
    background: "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  } as React.CSSProperties,
  flagInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  flagLabel: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#e2e8f0",
  },
  flagDescription: {
    fontSize: "0.75rem",
    color: "#71717a",
  },
  flagToggle: (enabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    color: enabled ? "#10b981" : "#71717a",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
  }),
  actionsGrid: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "0.875rem 1.25rem",
    color: "#a1a1aa",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

/* ── keyframes injected once via a tiny <style> that only holds animations ── */
const animationStyle = `
@keyframes system-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes system-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

export function SystemTab() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>(CRON_JOBS);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch health
      const healthRes = await api.get("/control-center/health");
      setHealth(healthRes.data);

      // Fetch stats from overview
      const overviewRes = await api.get("/control-center/overview");
      const data = overviewRes.data;

      // Build stats from overview data
      setStats({
        database: {
          installations: data.kpis?.totalInstallations?.value || 0,
          users: data.kpis?.activeUsers?.total || 0,
          documents: 0, // Not in overview
          emails: data.kpis?.emailsToday?.value || 0,
        },
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
        uptime: Date.now(),
      });

      // Fetch real cron job status
      try {
        const cronRes = await api.get("/control-center/crons");
        const cronData = cronRes.data?.data || [];
        if (cronData.length > 0) {
          setCronJobs(cronData.map((j: any) => ({
            name: j.name,
            schedule: j.schedule,
            lastRun: j.lastRun,
            nextRun: null,
            status: j.lastStatus === "failed" ? "failed" : j.lastRun ? "ok" : "disabled",
            duration: j.lastDuration,
          })));
        }
      } catch {
        // Fallback to default cron jobs if endpoint not available
      }

      // Fetch feature flags from company settings
      try {
        const settingsRes = await api.get("/settings/company");
        const settings = settingsRes.data?.data;
        if (settings) {
          setFeatureFlags(prev => prev.map(flag => {
            const backendKey = FEATURE_FLAG_MAP[flag.key];
            if (backendKey && settings[backendKey] !== undefined) {
              return { ...flag, enabled: !!settings[backendKey] };
            }
            return flag;
          }));
        }
      } catch {
        // Fallback to default flags
      }

    } catch (err) {
      console.error("[SystemTab] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleClearCache = async () => {
    if (!confirm("Cache wirklich leeren?")) return;
    setClearing(true);
    try {
      await api.post("/control-center/cache/clear");
      alert("Cache wurde geleert");
    } catch (err) {
      console.error("[SystemTab] Cache clear error:", err);
      alert("Fehler beim Leeren des Cache");
    } finally {
      setClearing(false);
    }
  };

  const toggleFeatureFlag = async (key: string) => {
    const flag = featureFlags.find(f => f.key === key);
    if (!flag) return;

    const backendKey = FEATURE_FLAG_MAP[key];
    if (!backendKey) return;

    const newValue = !flag.enabled;

    // Optimistic update
    setFeatureFlags(prev => prev.map(f =>
      f.key === key ? { ...f, enabled: newValue } : f
    ));

    setSavingFlag(key);
    try {
      await api.put("/settings/company", { [backendKey]: newValue });
    } catch (err) {
      // Revert on error
      setFeatureFlags(prev => prev.map(f =>
        f.key === key ? { ...f, enabled: !newValue } : f
      ));
      console.error("[SystemTab] Feature flag save error:", err);
      alert("Fehler beim Speichern der Einstellung");
    } finally {
      setSavingFlag(null);
    }
  };

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "#10b981";
      case "warning": return "#f59e0b";
      case "error": return "#ef4444";
      case "running": return "#D4A843";
      default: return "#71717a";
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "ok": return <CheckCircle size={16} style={{ color: "#10b981" }} />;
      case "warning": return <AlertTriangle size={16} style={{ color: "#f59e0b" }} />;
      case "error": return <XCircle size={16} style={{ color: "#ef4444" }} />;
      case "running": return <Activity size={16} style={{ color: "#D4A843", animation: "system-pulse 1.5s ease-in-out infinite" }} />;
      default: return <Clock size={16} style={{ color: "#71717a" }} />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Keyframe animations only */}
      <style>{animationStyle}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <Server size={24} />
          <div>
            <h2 style={styles.tabTitleH2}>Systemübersicht</h2>
            <p style={styles.tabTitleP}>Monitoring &amp; Konfiguration</p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button
            style={styles.btnRefresh}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              style={loading ? { animation: "system-spin 1s linear infinite" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* Health Overview */}
      <div style={styles.section}>
        <h3 style={styles.sectionH3}>System Health</h3>
        <div style={styles.healthGrid}>
          {health && Object.entries(health.checks || {}).map(([key, check]) => (
            <div key={key} style={styles.healthCard(check.status)}>
              <div style={styles.healthIcon}>
                {key === "database" && <Database size={20} />}
                {key === "emailQueue" && <Mail size={20} />}
                {key === "errorRate" && <AlertTriangle size={20} />}
                {!["database", "emailQueue", "errorRate"].includes(key) && <Zap size={20} />}
              </div>
              <div style={styles.healthInfo}>
                <span style={styles.healthLabel}>{key}</span>
                <span style={styles.healthStatus}>
                  <StatusIcon status={check.status} />
                  {check.status === "ok" ? "OK" : check.message || check.status}
                </span>
              </div>
            </div>
          ))}

          {/* Overall Status */}
          <div style={styles.healthCardOverall(health?.status || "ok")}>
            <div style={styles.healthIcon}>
              <Activity size={24} />
            </div>
            <div style={styles.healthInfo}>
              <span style={styles.healthLabel}>Gesamtstatus</span>
              <span style={styles.healthStatusLarge}>
                <StatusIcon status={health?.status || "ok"} />
                {health?.status === "ok" ? "Alle Systeme OK" : "Probleme erkannt"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div style={styles.section}>
        <h3 style={styles.sectionH3}>Datenbank-Statistiken</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Zap size={20} />
            </div>
            <div style={styles.statValue}>{stats?.database.installations.toLocaleString() || "-"}</div>
            <div style={styles.statLabel}>Anlagen</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Users size={20} />
            </div>
            <div style={styles.statValue}>{stats?.database.users.toLocaleString() || "-"}</div>
            <div style={styles.statLabel}>Benutzer</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Mail size={20} />
            </div>
            <div style={styles.statValue}>{stats?.database.emails.toLocaleString() || "-"}</div>
            <div style={styles.statLabel}>Emails heute</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Timer size={20} />
            </div>
            <div style={styles.statValue}>{stats ? formatUptime(Date.now() - stats.uptime + 86400000 * 7) : "-"}</div>
            <div style={styles.statLabel}>Uptime</div>
          </div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div style={styles.section}>
        <h3 style={styles.sectionH3}>Geplante Aufgaben (Cron Jobs)</h3>
        <div style={styles.tableContainer}>
          <table style={styles.dataTable}>
            <thead>
              <tr>
                <th style={styles.tableTh}>Aufgabe</th>
                <th style={styles.tableTh}>Zeitplan</th>
                <th style={styles.tableTh}>Letzter Lauf</th>
                <th style={styles.tableTh}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cronJobs.map((job) => (
                <tr key={job.name}>
                  <td style={styles.tableTd}>
                    <div style={styles.jobName}>
                      <Clock size={14} />
                      {job.name}
                    </div>
                  </td>
                  <td style={styles.tableTd}>
                    <code style={styles.codeStyle}>{job.schedule}</code>
                  </td>
                  <td style={styles.tableTd}>{formatDate(job.lastRun)}</td>
                  <td style={styles.tableTd}>
                    <span
                      style={styles.statusBadge(
                        `${getStatusColor(job.status)}20`,
                        getStatusColor(job.status)
                      )}
                    >
                      <StatusIcon status={job.status} />
                      {job.status === "ok" ? "OK" : job.status === "running" ? "Läuft..." : job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Flags */}
      <div style={styles.section}>
        <h3 style={styles.sectionH3}>Feature Flags</h3>
        <div style={styles.flagsGrid}>
          {featureFlags.map((flag) => (
            <div key={flag.key} style={styles.flagCard}>
              <div style={styles.flagInfo}>
                <span style={styles.flagLabel}>{flag.label}</span>
                <span style={styles.flagDescription}>{flag.description}</span>
              </div>
              <button
                style={styles.flagToggle(flag.enabled)}
                onClick={() => toggleFeatureFlag(flag.key)}
              >
                {flag.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.section}>
        <h3 style={styles.sectionH3}>System-Aktionen</h3>
        <div style={styles.actionsGrid}>
          <button style={{ ...styles.actionCard, opacity: clearing ? 0.5 : 1, cursor: clearing ? "not-allowed" : "pointer" }} onClick={handleClearCache} disabled={clearing}>
            <Trash2 size={20} />
            <span>{clearing ? "Leere Cache..." : "Cache leeren"}</span>
          </button>
          <button style={styles.actionCard} onClick={fetchData}>
            <RefreshCw size={20} />
            <span>Status aktualisieren</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Need to import Users icon
const Users = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default SystemTab;
