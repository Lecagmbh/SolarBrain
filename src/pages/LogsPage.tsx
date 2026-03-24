import { useEffect, useMemo, useState } from "react";
import { apiGet, apiDelete } from "../modules/api/client";
import { useAuth } from "./AuthContext";

type LogEntry = {
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
};

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  info: { label: "Info", color: "#38bdf8", bg: "rgba(56,189,248,0.15)", icon: "ℹ️" },
  success: { label: "Erfolg", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: "✅" },
  warning: { label: "Warnung", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "⚠️" },
  error: { label: "Fehler", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: "❌" },
  debug: { label: "Debug", color: "#EAD068", bg: "rgba(139,92,246,0.15)", icon: "🔧" },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  auth: { label: "Authentifizierung", icon: "🔐" },
  api: { label: "API", icon: "🔗" },
  email: { label: "E-Mail", icon: "📧" },
  document: { label: "Dokumente", icon: "📄" },
  system: { label: "System", icon: "⚙️" },
  rule: { label: "Regeln", icon: "⚡" },
  user: { label: "Benutzer", icon: "👤" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function LogsPage() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const q = encodeURIComponent(query.trim());
      const lvl = encodeURIComponent(levelFilter);
      const cat = encodeURIComponent(categoryFilter);

      const res: any = await apiGet(`/logs?limit=800&level=${lvl}&category=${cat}&q=${q}`);
      setLogs((res?.data || []) as LogEntry[]);
    } catch (e) {
      console.error(e);
      setLogs([]);
      alert("Logs konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => loadLogs(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, query, levelFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: logs.length,
    errors: logs.filter(l => l.level === "error").length,
    warnings: logs.filter(l => l.level === "warning").length,
    today: logs.filter(l => formatDate(l.timestamp) === formatDate(new Date().toISOString())).length,
  }), [logs]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(log => {
        const d = formatDate(log.timestamp);
        if (!groups[d]) groups[d] = [];
        groups[d].push(log);
      });
    return groups;
  }, [logs]);

  async function clearLogs() {
    if (role !== "admin") return;
    if (!confirm("Logs wirklich leeren?")) return;
    try {
      await apiDelete("/logs/clear");
      await loadLogs();
    } catch (e) {
      console.error(e);
      alert("Logs konnten nicht geleert werden.");
    }
  }

  const todayKey = formatDate(new Date().toISOString());

  return (
    <div className="admin-page" style={{ paddingTop: 12 }}>
      {/* HERO HEADER (ENDLVL) */}
      <div style={{
        padding: "18px 18px 16px",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: "rgba(56,189,248,0.16)",
                border: "1px solid rgba(56,189,248,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18
              }}>📋</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: "-0.02em" }}>System-Logs</div>
                <div style={{ fontSize: 13, opacity: 0.88, marginTop: 3 }}>
                  Endlvl Logs: serverseitige Filter + Auto-Refresh + Admin Clear.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <div style={kpiPill}><div style={kpiLabel}>Einträge</div><div style={kpiValue}>{loading ? "…" : stats.total}</div></div>
              <div style={kpiPill}><div style={kpiLabel}>Fehler</div><div style={{ ...kpiValue, color: stats.errors ? "#ef4444" : "#e5e7eb" }}>{loading ? "…" : stats.errors}</div></div>
              <div style={kpiPill}><div style={kpiLabel}>Warnungen</div><div style={{ ...kpiValue, color: stats.warnings ? "#f59e0b" : "#e5e7eb" }}>{loading ? "…" : stats.warnings}</div></div>
              <div style={kpiPill}><div style={kpiLabel}>Heute</div><div style={kpiValue}>{loading ? "…" : stats.today}</div></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: autoRefresh ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.03)",
                color: autoRefresh ? "#22c55e" : "#94a3b8",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: autoRefresh ? "#22c55e" : "#64748b" }} />
              Live
            </button>

            <button className="btn-primary" onClick={() => loadLogs()} style={{ padding: "10px 16px", borderRadius: 14, minWidth: 160 }}>
              🔄 Aktualisieren
            </button>

            {role === "admin" && (
              <button className="btn-ghost" onClick={() => clearLogs()} style={{ padding: "10px 16px", borderRadius: 14, color: "#ef4444" }}>
                🧹 Leeren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="dash-card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Logs durchsuchen…" style={inputStyle} />

        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={selectStyle}>
          <option value="all">Alle Level</option>
          {Object.entries(LEVEL_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="all">Alle Kategorien</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
          {logs.length} Einträge
        </div>
      </div>

      {/* LIST */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>Lade…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📋</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Keine Logs gefunden</div>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, dayLogs]) => (
            <div key={date}>
              <div style={{
                padding: "10px 20px",
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                position: "sticky",
                top: 0,
                zIndex: 10
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                  {date === todayKey ? "Heute" : date}
                </span>
                <span style={{ fontSize: 11, opacity: 0.55, marginLeft: 8 }}>({dayLogs.length} Einträge)</span>
              </div>

              {dayLogs.map(log => {
                const lvl = LEVEL_CONFIG[log.level];
                const cat = CATEGORY_CONFIG[log.category];
                const isOpen = selectedLog?.id === log.id;

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(isOpen ? null : log)}
                    style={{
                      padding: "12px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: isOpen ? "rgba(56,189,248,0.05)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 80, fontSize: 12, fontFamily: "monospace", opacity: 0.6, flexShrink: 0, paddingTop: 2 }}>
                        {formatTime(log.timestamp)}
                      </div>

                      <div style={{
                        padding: "3px 8px",
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 800,
                        background: lvl.bg,
                        color: lvl.color,
                        flexShrink: 0,
                        minWidth: 70,
                        textAlign: "center",
                      }}>
                        {lvl.icon} {lvl.label}
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.75, width: 140, flexShrink: 0 }}>
                        {cat.icon} {cat.label}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>{log.action}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{log.message}</div>

                        {(log.userName || log.installationId || log.ip) && (
                          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {log.userName && <span>👤 {log.userName}</span>}
                            {log.installationId && <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{log.installationId}</span>}
                            {log.ip && <span style={{ fontFamily: "monospace" }}>IP: {log.ip}</span>}
                          </div>
                        )}

                        {isOpen && log.details && (
                          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ fontSize: 10, opacity: 0.55, textTransform: "uppercase", marginBottom: 6 }}>Details</div>
                            <pre style={{ margin: 0, fontSize: 11, fontFamily: "monospace", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: 260,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(2,6,23,0.9)",
  color: "#e5e7eb",
  padding: "10px 12px",
  fontSize: 13,
};

const selectStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(2,6,23,0.9)",
  color: "#e5e7eb",
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const kpiPill: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 120,
};

const kpiLabel: React.CSSProperties = {
  fontSize: 10,
  opacity: 0.7,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const kpiValue: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 850,
  marginTop: 2,
};
