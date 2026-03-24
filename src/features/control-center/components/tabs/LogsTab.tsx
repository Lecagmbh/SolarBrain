/**
 * LOGS TAB
 * Activity and error log viewer with filtering and export
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Bug,
  Filter,
  User,
  Clock,
  Server,
  Mail,
  Shield,
  FileCode,
  Activity,
} from "lucide-react";
import { api } from "../../../../modules/api/client";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warning" | "error" | "success" | "debug";
  category: "auth" | "api" | "email" | "document" | "system" | "rule" | "user";
  action: string;
  message: string;
  details?: Record<string, any>;
  userId?: number;
  userName?: string;
  ip?: string;
  installationId?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const LEVEL_CONFIG = {
  info: { icon: Info, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", label: "Info" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", label: "Warnung" },
  error: { icon: XCircle, color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", label: "Fehler" },
  success: { icon: CheckCircle, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Erfolg" },
  debug: { icon: Bug, color: "#EAD068", bg: "rgba(139, 92, 246, 0.15)", label: "Debug" },
};

const CATEGORY_CONFIG = {
  auth: { icon: Shield, label: "Auth" },
  api: { icon: Server, label: "API" },
  email: { icon: Mail, label: "Email" },
  document: { icon: FileCode, label: "Dokument" },
  system: { icon: Activity, label: "System" },
  rule: { icon: FileText, label: "Regel" },
  user: { icon: User, label: "User" },
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
  btnSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnDangerOutline: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "0.625rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  levelSummary: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  levelCard: (isActive: boolean, borderColor?: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: isActive ? "rgba(255,255,255,0.05)" : "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: isActive
      ? `2px solid ${borderColor || "rgba(255,255,255,0.08)"}`
      : "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "8px",
    padding: "0.625rem 1rem",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  levelCount: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#e2e8f0",
  },
  levelLabel: {
    fontSize: "0.8rem",
    color: "#71717a",
  },
  filtersBar: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "0 0.75rem",
    flex: 1,
    minWidth: "250px",
  } as React.CSSProperties,
  searchInput: {
    background: "transparent",
    border: "none",
    color: "#e2e8f0",
    padding: "0.625rem 0",
    flex: 1,
    fontSize: "0.875rem",
    outline: "none",
  } as React.CSSProperties,
  searchIcon: {
    color: "#71717a",
  },
  selectStyle: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#a1a1aa",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    minWidth: "160px",
  },
  btnClearFilters: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "transparent",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#f59e0b",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    color: "#fca5a5",
  },
  logsContainer: {
    background: "var(--dash-card-bg, rgba(255,255,255,0.03))",
    border: "1px solid var(--dash-border, rgba(255,255,255,0.08))",
    borderRadius: "var(--dash-radius, 16px)",
    minHeight: "400px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
    color: "#71717a",
    gap: "1rem",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid rgba(212, 168, 67, 0.3)",
    borderTopColor: "#D4A843",
    borderRadius: "50%",
    animation: "logs-spin 1s linear infinite",
  } as React.CSSProperties,
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
    color: "#71717a",
    gap: "1rem",
  },
  logsList: {
    display: "flex",
    flexDirection: "column" as const,
  },
  logEntry: (isExpanded: boolean): React.CSSProperties => ({
    padding: "0.875rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    cursor: "pointer",
    transition: "background 0.2s",
    background: isExpanded ? "rgba(212, 168, 67, 0.05)" : "transparent",
  }),
  logHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.35rem",
  },
  logLevel: (bg: string): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: bg,
    flexShrink: 0,
  }),
  logCategory: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.7rem",
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  logAction: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#D4A843",
  },
  logTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    marginLeft: "auto",
    fontSize: "0.75rem",
    color: "#71717a",
  },
  logMessage: {
    fontSize: "0.875rem",
    color: "#a1a1aa",
    paddingLeft: "2.5rem",
  },
  logDetails: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    marginLeft: "2.5rem",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  detailRow: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.8rem",
    marginBottom: "0.35rem",
  },
  detailRowFull: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    fontSize: "0.8rem",
    marginBottom: "0.35rem",
  },
  detailLabel: {
    color: "#71717a",
    minWidth: "60px",
  },
  detailValue: {
    color: "#a1a1aa",
  },
  detailPre: {
    margin: "0.5rem 0 0 0",
    padding: "0.5rem",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "4px",
    fontSize: "0.75rem",
    color: "#a1a1aa",
    overflowX: "auto" as const,
    fontFamily: "monospace",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    color: "#71717a",
    fontSize: "0.875rem",
  },
  paginationBtn: (disabled: boolean): React.CSSProperties => ({
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: disabled ? "#71717a" : "#a1a1aa",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  }),
};

/* ── keyframes injected once via a tiny <style> that only holds animations ── */
const animationStyle = `
@keyframes logs-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
      };
      if (search) params.q = search;
      if (levelFilter !== "all") params.level = levelFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const response = await api.get("/logs", { params });
      setLogs(response.data.data || []);
      setPagination(response.data.pagination || pagination);
    } catch (err: any) {
      console.error("[LogsTab] Fetch error:", err);
      setError(err.response?.data?.error || "Fehler beim Laden der Logs");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, levelFilter, categoryFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchLogs();
  };

  const handleClearLogs = async () => {
    if (!confirm("Alle Logs wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    try {
      await api.delete("/logs/clear");
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.error || "Fehler beim Löschen");
    }
  };

  const handleExport = async () => {
    const csv = [
      ["ID", "Zeitstempel", "Level", "Kategorie", "Aktion", "Nachricht", "User", "IP"].join(","),
      ...logs.map(log => [
        log.id,
        log.timestamp,
        log.level,
        log.category,
        `"${log.action}"`,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userName || "-",
        log.ip || "-"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const { downloadFile } = await import("@/utils/desktopDownload");
    await downloadFile({ filename: `logs_${new Date().toISOString().split("T")[0]}.csv`, blob, fileType: 'csv' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={styles.container}>
      {/* Keyframe animations only */}
      <style>{animationStyle}</style>

      {/* Header */}
      <div style={styles.tabHeader}>
        <div style={styles.tabTitle}>
          <FileText size={24} />
          <div>
            <h2 style={styles.tabTitleH2}>System Logs</h2>
            <p style={styles.tabTitleP}>{pagination.total} Einträge</p>
          </div>
        </div>
        <div style={styles.tabActions}>
          <button
            style={{ ...styles.btnSecondary, opacity: logs.length === 0 ? 0.5 : 1, cursor: logs.length === 0 ? "not-allowed" : "pointer" }}
            onClick={handleExport}
            disabled={logs.length === 0}
          >
            <Download size={16} />
            Export
          </button>
          <button style={styles.btnDangerOutline} onClick={handleClearLogs}>
            <Trash2 size={16} />
            Leeren
          </button>
          <button
            style={styles.btnRefresh}
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              style={loading ? { animation: "logs-spin 1s linear infinite" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* Level Summary */}
      <div style={styles.levelSummary}>
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          const count = levelCounts[level] || 0;
          const Icon = config.icon;
          return (
            <button
              key={level}
              style={styles.levelCard(levelFilter === level, levelFilter === level ? config.color : undefined)}
              onClick={() => {
                setLevelFilter(levelFilter === level ? "all" : level);
                setPagination(p => ({ ...p, page: 1 }));
              }}
            >
              <Icon size={16} style={{ color: config.color }} />
              <span style={styles.levelCount}>{count}</span>
              <span style={styles.levelLabel}>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Logs durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </form>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          style={styles.selectStyle}
        >
          <option value="all">Alle Kategorien</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        {(levelFilter !== "all" || categoryFilter !== "all" || search) && (
          <button
            style={styles.btnClearFilters}
            onClick={() => {
              setLevelFilter("all");
              setCategoryFilter("all");
              setSearch("");
              setPagination(p => ({ ...p, page: 1 }));
            }}
          >
            <Filter size={14} />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          {safeString(error)}
        </div>
      )}

      {/* Logs List */}
      <div style={styles.logsContainer}>
        {loading && logs.length === 0 ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            Lade Logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} />
            <span>Keine Logs gefunden</span>
          </div>
        ) : (
          <div style={styles.logsList}>
            {logs.map((log) => {
              const levelConfig = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
              const categoryConfig = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.system;
              const LevelIcon = levelConfig.icon;
              const CategoryIcon = categoryConfig.icon;
              const isExpanded = expandedLog === log.id;

              return (
                <div
                  key={log.id}
                  style={styles.logEntry(isExpanded)}
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div style={styles.logHeader}>
                    <div style={styles.logLevel(levelConfig.bg)}>
                      <LevelIcon size={14} style={{ color: levelConfig.color }} />
                    </div>
                    <div style={styles.logCategory}>
                      <CategoryIcon size={12} />
                      {categoryConfig.label}
                    </div>
                    <div style={styles.logAction}>{log.action}</div>
                    <div style={styles.logTime}>
                      <Clock size={12} />
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                  <div style={styles.logMessage}>{log.message}</div>
                  {isExpanded && (
                    <div style={styles.logDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>ID:</span>
                        <span style={styles.detailValue}>{log.id}</span>
                      </div>
                      {log.userName && (
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>User:</span>
                          <span style={styles.detailValue}>{log.userName}</span>
                        </div>
                      )}
                      {log.ip && (
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>IP:</span>
                          <span style={styles.detailValue}>{log.ip}</span>
                        </div>
                      )}
                      {log.installationId && (
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Anlage:</span>
                          <span style={styles.detailValue}>{log.installationId}</span>
                        </div>
                      )}
                      {log.details && (
                        <div style={styles.detailRowFull}>
                          <span style={styles.detailLabel}>Details:</span>
                          <pre style={styles.detailPre}>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.paginationBtn(pagination.page <= 1)}
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            Zurück
          </button>
          <span>
            Seite {pagination.page} von {pagination.totalPages}
          </span>
          <button
            style={styles.paginationBtn(pagination.page >= pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

export default LogsTab;
