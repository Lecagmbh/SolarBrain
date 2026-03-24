/**
 * Operations Center – NB Reminder Management, Data Quality, Audit Trail
 * Dark theme, Kanban board layout with 4 tabs
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiPatch } from "../modules/api/client";
import { ToastProvider } from "../modules/ui/toast/ToastContext";
import { ToastContainer } from "../modules/ui/toast/ToastContainer";
import { useToast } from "../modules/ui/toast/useToast";
import {
  Activity, AlertTriangle, Bell, BellOff, CheckCircle2, ChevronRight, Clock,
  Database, ExternalLink, Filter, Mail, MessageSquare, Phone, Play, RefreshCw,
  Search, Send, Settings2, Shield, Terminal, TrendingUp, User, Zap,
} from "lucide-react";
import "./ops-center.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OpsCase {
  id: number;
  publicId: string;
  customerName: string;
  address: string;
  nbCaseNumber: string | null;
  nbName: string;
  nbEmail: string | null;
  nbId: number | null;
  daysSinceSubmission: number;
  daysSinceActivity: number;
  urgency: "critical" | "overdue" | "due" | "ok";
  reminderActive: boolean;
  reminderIntervalDays: number;
  reminderCount: number;
  lastReminderAt: string | null;
  escalationFlag: boolean;
  completeness: number;
  missingFields: string[];
  commentCount: number;
  documentCount: number;
  nbEingereichtAm: string | null;
  contactEmail: string | null;
}

interface OpsStats {
  totalCases: number;
  critical: number;
  overdue: number;
  escalated: number;
  avgDays: number;
  remindersSentToday: number;
  avgCompleteness: number;
}

interface NbEntry {
  id: number;
  name: string;
  kurzname: string | null;
  email: string | null;
  einreichEmail: string | null;
  telefon: string | null;
  portalUrl: string | null;
  reminderDays: number;
  activeCases: number;
  hasEmail: boolean;
  kontakte: any;
  notizen: string | null;
}

interface QualityEntry {
  id: number;
  publicId: string;
  customerName: string;
  nbName: string;
  completeness: number;
  totalFields: number;
  filledCount: number;
  missingFields: string[];
  filledFields: string[];
}

interface LogEntry {
  id: number;
  installationId: number | null;
  action?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  userName?: string;
  reminderNumber?: number;
  emailSentTo?: string;
  status?: string;
  nbName?: string;
  createdAt: string;
  installation?: { publicId: string; customerName: string };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OpsCenterPage() {
  return (
    <ToastProvider>
      <OpsCenterInner />
      <ToastContainer />
    </ToastProvider>
  );
}

function OpsCenterInner() {
  const [activeTab, setActiveTab] = useState<"board" | "nb" | "quality" | "log">("board");
  const [cases, setCases] = useState<OpsCase[]>([]);
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        apiGet("/ops/cases"),
        apiGet("/ops/stats"),
      ]);
      setCases((casesRes as any).data || []);
      setStats((statsRes as any).data || null);
    } catch {
      push("Fehler beim Laden der Ops-Daten", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { id: "board" as const, label: "Board", icon: <Zap size={16} /> },
    { id: "nb" as const, label: "NB-Verzeichnis", icon: <Database size={16} /> },
    { id: "quality" as const, label: "Datenqualität", icon: <Shield size={16} /> },
    { id: "log" as const, label: "Log", icon: <Terminal size={16} /> },
  ];

  return (
    <div className="ops-page">
      {/* Header */}
      <div className="ops-header">
        <div className="ops-header-left">
          <div className="ops-header-icon"><Activity size={22} /></div>
          <div>
            <h1 className="ops-title">Operations Center</h1>
            <p className="ops-subtitle">NB-Erinnerungen · Datenqualität · Audit-Trail</p>
          </div>
        </div>
        <div className="ops-header-right">
          <button className="ops-btn ops-btn-ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="ops-stats-bar">
          <StatChip label="Fälle beim NB" value={stats.totalCases} icon={<Clock size={14} />} />
          <StatChip label="Kritisch" value={stats.critical} icon={<AlertTriangle size={14} />} variant="danger" />
          <StatChip label="Überfällig" value={stats.overdue} icon={<TrendingUp size={14} />} variant="warning" />
          <StatChip label="Eskaliert" value={stats.escalated} icon={<Shield size={14} />} variant="purple" />
          <StatChip label="Ø Tage" value={stats.avgDays} icon={<Clock size={14} />} />
          <StatChip label="Heute gesendet" value={stats.remindersSentToday} icon={<Send size={14} />} variant="success" />
          <StatChip label="Ø Vollständigkeit" value={`${stats.avgCompleteness}%`} icon={<CheckCircle2 size={14} />} />
        </div>
      )}

      {/* Tabs */}
      <div className="ops-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ops-tab ${activeTab === tab.id ? "ops-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="ops-content">
        {activeTab === "board" && <KanbanBoard cases={cases} onRefresh={fetchData} />}
        {activeTab === "nb" && <NbDirectory />}
        {activeTab === "quality" && <DataQualityView />}
        {activeTab === "log" && <EngineLog />}
      </div>
    </div>
  );
}

// ─── Stat Chip ──────────────────────────────────────────────────────────────

function StatChip({ label, value, icon, variant }: {
  label: string; value: string | number; icon: React.ReactNode; variant?: string;
}) {
  return (
    <div className={`ops-stat-chip ${variant ? `ops-stat-${variant}` : ""}`}>
      <span className="ops-stat-icon">{icon}</span>
      <span className="ops-stat-value">{value}</span>
      <span className="ops-stat-label">{label}</span>
    </div>
  );
}

// ─── Kanban Board ───────────────────────────────────────────────────────────

function KanbanBoard({ cases, onRefresh }: { cases: OpsCase[]; onRefresh: () => void }) {
  const [selectedCase, setSelectedCase] = useState<OpsCase | null>(null);
  const { push } = useToast();

  const columns = useMemo(() => ({
    critical: cases.filter((c) => c.urgency === "critical"),
    overdue: cases.filter((c) => c.urgency === "overdue"),
    due: cases.filter((c) => c.urgency === "due"),
    ok: cases.filter((c) => c.urgency === "ok"),
  }), [cases]);

  const columnMeta = [
    { key: "critical" as const, label: "Kritisch", sublabel: "≥ 21 Tage", color: "#ef4444", count: columns.critical.length },
    { key: "overdue" as const, label: "Überfällig", sublabel: "≥ 14 Tage", color: "#f59e0b", count: columns.overdue.length },
    { key: "due" as const, label: "Fällig", sublabel: "≥ 7 Tage", color: "#3b82f6", count: columns.due.length },
    { key: "ok" as const, label: "OK", sublabel: "< 7 Tage", color: "#22c55e", count: columns.ok.length },
  ];

  return (
    <div className="ops-board-wrapper">
      <div className="ops-board">
        {columnMeta.map((col) => (
          <div key={col.key} className="ops-column">
            <div className="ops-column-header">
              <div className="ops-column-dot" style={{ background: col.color }} />
              <span className="ops-column-title">{col.label}</span>
              <span className="ops-column-count">{col.count}</span>
              <span className="ops-column-sub">{col.sublabel}</span>
            </div>
            <div className="ops-column-cards">
              {columns[col.key].map((c) => (
                <CaseCard key={c.id} data={c} onClick={() => setSelectedCase(c)} />
              ))}
              {columns[col.key].length === 0 && (
                <div className="ops-column-empty">Keine Fälle</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedCase && (
        <DetailPanel
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRefresh={() => { onRefresh(); setSelectedCase(null); }}
        />
      )}
    </div>
  );
}

// ─── NB Color Helper ────────────────────────────────────────────────────────

const NB_COLOR_PALETTE = [
  "#D4A843", "#EAD068", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#2563eb", "#7c3aed", "#c026d3",
];

function getNbColor(nbName: string): string {
  let hash = 0;
  for (let i = 0; i < nbName.length; i++) {
    hash = ((hash << 5) - hash + nbName.charCodeAt(i)) | 0;
  }
  return NB_COLOR_PALETTE[Math.abs(hash) % NB_COLOR_PALETTE.length];
}

// ─── Case Card ──────────────────────────────────────────────────────────────

function CaseCard({ data, onClick }: { data: OpsCase; onClick: () => void }) {
  const urgencyColors: Record<string, string> = {
    critical: "#ef4444", overdue: "#f59e0b", due: "#3b82f6", ok: "#22c55e",
  };
  const ringColor = urgencyColors[data.urgency] || "#666";
  const nbColor = getNbColor(data.nbName);

  return (
    <div className="ops-card" onClick={onClick} style={{ position: "relative" }}>
      <div
        className="ops-card-nb-stripe"
        style={{ background: nbColor }}
        title={data.nbName}
      />
      <div className="ops-card-top">
        <div className="ops-card-ring" style={{ borderColor: ringColor }}>
          <span className="ops-card-days">{data.daysSinceActivity}</span>
        </div>
        <div className="ops-card-info">
          <div className="ops-card-nb" title={data.nbName}>
            <span className="ops-card-nb-dot" style={{ background: nbColor }} />
            {data.nbName}
          </div>
          <div className="ops-card-id">{data.nbCaseNumber || data.publicId}</div>
        </div>
        {data.escalationFlag && (
          <div className="ops-card-escalated" title="Eskaliert">
            <AlertTriangle size={14} />
          </div>
        )}
      </div>

      <div className="ops-card-customer">{data.customerName || "Unbekannt"}</div>
      <div className="ops-card-address">{data.address || "–"}</div>

      <div className="ops-card-bottom">
        <div className="ops-card-completeness">
          <div className="ops-card-completeness-bar">
            <div
              className="ops-card-completeness-fill"
              style={{
                width: `${data.completeness}%`,
                background: data.completeness >= 80 ? "#22c55e" : data.completeness >= 50 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className="ops-card-completeness-text">{data.completeness}%</span>
        </div>
        <div className="ops-card-badges">
          {data.reminderCount > 0 && (
            <span className="ops-card-badge" title={`${data.reminderCount} Erinnerungen`}>
              <Mail size={11} /> {data.reminderCount}
            </span>
          )}
          {data.commentCount > 0 && (
            <span className="ops-card-badge" title={`${data.commentCount} Kommentare`}>
              <MessageSquare size={11} /> {data.commentCount}
            </span>
          )}
          {!data.reminderActive && (
            <span className="ops-card-badge ops-card-badge-muted" title="Erinnerungen deaktiviert">
              <BellOff size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────────────────────────────

function DetailPanel({ caseData, onClose, onRefresh }: {
  caseData: OpsCase; onClose: () => void; onRefresh: () => void;
}) {
  const [subTab, setSubTab] = useState<"overview" | "data" | "history" | "comments">("overview");
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [auditLog, setAuditLog] = useState<LogEntry[]>([]);
  const { push } = useToast();

  useEffect(() => {
    apiGet(`/ops/log?type=audit&limit=20`).then((res: any) => {
      const items = (res.data?.items || []).filter(
        (l: LogEntry) => l.installationId === caseData.id
      );
      setAuditLog(items);
    }).catch(() => {});
  }, [caseData.id]);

  const handleSendReminder = async () => {
    if (!caseData.nbEmail) {
      push("Keine NB-E-Mail vorhanden", "error");
      return;
    }
    setSending(true);
    try {
      await apiPost(`/ops/cases/${caseData.id}/remind`, {});
      push("Erinnerung gesendet", "success");
      onRefresh();
    } catch {
      push("Fehler beim Senden", "error");
    } finally {
      setSending(false);
    }
  };

  const handleToggleAutomation = async () => {
    try {
      await apiPatch(`/ops/cases/${caseData.id}/automation`, {
        active: !caseData.reminderActive,
      });
      push(caseData.reminderActive ? "Erinnerungen deaktiviert" : "Erinnerungen aktiviert", "success");
      onRefresh();
    } catch {
      push("Fehler beim Ändern", "error");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await apiPost(`/ops/cases/${caseData.id}/comments`, { message: commentText });
      push("Kommentar hinzugefügt", "success");
      setCommentText("");
      onRefresh();
    } catch {
      push("Fehler beim Kommentieren", "error");
    }
  };

  const urgencyLabels: Record<string, string> = {
    critical: "Kritisch", overdue: "Überfällig", due: "Fällig", ok: "OK",
  };

  const subTabs = [
    { id: "overview" as const, label: "Übersicht" },
    { id: "data" as const, label: "Daten" },
    { id: "history" as const, label: "Verlauf" },
    { id: "comments" as const, label: "Kommentare" },
  ];

  return (
    <div className="ops-detail-overlay" onClick={onClose}>
      <div className="ops-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ops-detail-header">
          <div>
            <h2 className="ops-detail-title">{caseData.nbCaseNumber || caseData.publicId}</h2>
            <p className="ops-detail-subtitle">{caseData.customerName} · {caseData.nbName}</p>
          </div>
          <button className="ops-btn ops-btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="ops-detail-tabs">
          {subTabs.map((t) => (
            <button
              key={t.id}
              className={`ops-detail-tab ${subTab === t.id ? "ops-detail-tab-active" : ""}`}
              onClick={() => setSubTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ops-detail-body">
          {subTab === "overview" && (
            <div className="ops-detail-overview">
              <div className="ops-detail-row">
                <span className="ops-detail-label">Status</span>
                <span className={`ops-urgency-badge ops-urgency-${caseData.urgency}`}>
                  {urgencyLabels[caseData.urgency]}
                </span>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">Tage seit Einreichung</span>
                <span className="ops-detail-value">{caseData.daysSinceSubmission}</span>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">Tage seit letzter Aktivität</span>
                <span className="ops-detail-value">{caseData.daysSinceActivity}</span>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">Erinnerungen gesendet</span>
                <span className="ops-detail-value">{caseData.reminderCount}</span>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">Intervall</span>
                <span className="ops-detail-value">{caseData.reminderIntervalDays} Tage</span>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">Vollständigkeit</span>
                <div className="ops-detail-completeness">
                  <div className="ops-card-completeness-bar" style={{ width: 120 }}>
                    <div
                      className="ops-card-completeness-fill"
                      style={{
                        width: `${caseData.completeness}%`,
                        background: caseData.completeness >= 80 ? "#22c55e" : caseData.completeness >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span>{caseData.completeness}%</span>
                </div>
              </div>
              <div className="ops-detail-row">
                <span className="ops-detail-label">NB E-Mail</span>
                <span className="ops-detail-value">{caseData.nbEmail || <span style={{ color: "#ef4444" }}>Fehlt!</span>}</span>
              </div>

              {caseData.escalationFlag && (
                <div className="ops-detail-escalation">
                  <AlertTriangle size={16} /> Eskaliert – 4+ Erinnerungen ohne Rückmeldung
                </div>
              )}

              <div className="ops-detail-actions">
                <button
                  className="ops-btn ops-btn-primary"
                  onClick={handleSendReminder}
                  disabled={sending || !caseData.nbEmail}
                >
                  {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Erinnerung senden
                </button>
                <button
                  className={`ops-btn ${caseData.reminderActive ? "ops-btn-warning" : "ops-btn-success"}`}
                  onClick={handleToggleAutomation}
                >
                  {caseData.reminderActive ? <BellOff size={14} /> : <Bell size={14} />}
                  {caseData.reminderActive ? "Auto deaktivieren" : "Auto aktivieren"}
                </button>
              </div>

              {caseData.missingFields.length > 0 && (
                <div className="ops-detail-missing">
                  <h4>Fehlende Felder ({caseData.missingFields.length})</h4>
                  <div className="ops-detail-missing-list">
                    {caseData.missingFields.map((f) => (
                      <span key={f} className="ops-missing-tag">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === "data" && (
            <div className="ops-detail-data">
              <DataRow label="Kundenname" value={caseData.customerName} />
              <DataRow label="Adresse" value={caseData.address} />
              <DataRow label="E-Mail" value={caseData.contactEmail} />
              <DataRow label="Vorgangsnummer" value={caseData.nbCaseNumber} />
              <DataRow label="Netzbetreiber" value={caseData.nbName} />
              <DataRow label="NB E-Mail" value={caseData.nbEmail} missing={!caseData.nbEmail} />
              <DataRow label="Eingereicht am" value={caseData.nbEingereichtAm ? new Date(caseData.nbEingereichtAm).toLocaleDateString("de-DE") : null} />
              <DataRow label="Letzte Erinnerung" value={caseData.lastReminderAt ? new Date(caseData.lastReminderAt).toLocaleDateString("de-DE") : "Noch keine"} />
            </div>
          )}

          {subTab === "history" && (
            <div className="ops-detail-history">
              {auditLog.length === 0 && (
                <div className="ops-empty-state">Noch keine Einträge</div>
              )}
              {auditLog.map((entry) => (
                <div key={entry.id} className="ops-log-entry">
                  <div className="ops-log-time">
                    {new Date(entry.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="ops-log-content">
                    <span className={`ops-log-action ops-log-${entry.action}`}>{entry.action}</span>
                    <span className="ops-log-desc">{entry.description}</span>
                  </div>
                  <div className="ops-log-user">{entry.userName}</div>
                </div>
              ))}
            </div>
          )}

          {subTab === "comments" && (
            <div className="ops-detail-comments">
              <div className="ops-comment-input">
                <textarea
                  className="ops-textarea"
                  placeholder="Interner Kommentar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <button
                  className="ops-btn ops-btn-primary"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send size={14} /> Kommentar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value, missing }: { label: string; value: string | null | undefined; missing?: boolean }) {
  return (
    <div className="ops-data-row">
      <span className="ops-data-label">{label}</span>
      <span className={`ops-data-value ${missing ? "ops-data-missing" : ""}`}>
        {value || (missing ? "Fehlt" : "–")}
      </span>
    </div>
  );
}

// ─── NB Directory ───────────────────────────────────────────────────────────

function NbDirectory() {
  const [nbs, setNbs] = useState<NbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { push } = useToast();

  useEffect(() => {
    setLoading(true);
    apiGet("/ops/nb-directory")
      .then((res: any) => setNbs(res.data || []))
      .catch(() => push("Fehler beim Laden der NB-Daten", "error"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = useMemo(() =>
    nbs.filter((nb) =>
      nb.name.toLowerCase().includes(search.toLowerCase()) ||
      (nb.kurzname && nb.kurzname.toLowerCase().includes(search.toLowerCase()))
    ), [nbs, search]);

  return (
    <div className="ops-nb-section">
      <div className="ops-nb-toolbar">
        <div className="ops-search-box">
          <Search size={16} />
          <input
            className="ops-search-input"
            placeholder="Netzbetreiber suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="ops-nb-count">{filtered.length} Netzbetreiber</span>
      </div>

      {loading ? (
        <div className="ops-loading">Lade NB-Verzeichnis...</div>
      ) : (
        <div className="ops-nb-grid">
          {filtered.map((nb) => (
            <NbCard key={nb.id} nb={nb} />
          ))}
        </div>
      )}
    </div>
  );
}

function NbCard({ nb }: { nb: NbEntry }) {
  return (
    <div className={`ops-nb-card ${!nb.hasEmail ? "ops-nb-card-warn" : ""}`}>
      <div className="ops-nb-card-header">
        <h3 className="ops-nb-name">{nb.name}</h3>
        {nb.activeCases > 0 && (
          <span className="ops-nb-cases">{nb.activeCases} aktiv</span>
        )}
      </div>

      <div className="ops-nb-details">
        <div className="ops-nb-detail">
          <Mail size={13} />
          <span className={!nb.hasEmail ? "ops-text-danger" : ""}>
            {nb.einreichEmail || nb.email || "Keine E-Mail!"}
          </span>
        </div>
        {nb.telefon && (
          <div className="ops-nb-detail">
            <Phone size={13} />
            <span>{nb.telefon}</span>
          </div>
        )}
        {nb.portalUrl && (
          <div className="ops-nb-detail">
            <ExternalLink size={13} />
            <a href={nb.portalUrl} target="_blank" rel="noopener noreferrer" className="ops-link">Portal</a>
          </div>
        )}
        <div className="ops-nb-detail">
          <Clock size={13} />
          <span>Intervall: {nb.reminderDays} Tage</span>
        </div>
      </div>

      {nb.notizen && (
        <div className="ops-nb-notes">{nb.notizen}</div>
      )}
    </div>
  );
}

// ─── Data Quality View ──────────────────────────────────────────────────────

function DataQualityView() {
  const [entries, setEntries] = useState<QualityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    setLoading(true);
    apiGet("/ops/data-quality")
      .then((res: any) => setEntries(res.data || []))
      .catch(() => push("Fehler beim Laden der Datenqualität", "error"))
      .finally(() => setLoading(false));
  }, [push]);

  return (
    <div className="ops-quality-section">
      {loading ? (
        <div className="ops-loading">Lade Datenqualität...</div>
      ) : entries.length === 0 ? (
        <div className="ops-empty-state">Keine Fälle beim NB</div>
      ) : (
        <div className="ops-quality-list">
          {entries.map((entry) => (
            <div key={entry.id} className="ops-quality-row">
              <div className="ops-quality-info">
                <span className="ops-quality-id">{entry.publicId}</span>
                <span className="ops-quality-customer">{entry.customerName || "Unbekannt"}</span>
                <span className="ops-quality-nb">{entry.nbName}</span>
              </div>
              <div className="ops-quality-bar-wrap">
                <div className="ops-quality-bar">
                  <div
                    className="ops-quality-bar-fill"
                    style={{
                      width: `${entry.completeness}%`,
                      background: entry.completeness >= 80 ? "#22c55e" : entry.completeness >= 50 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="ops-quality-percent">{entry.completeness}%</span>
                <span className="ops-quality-ratio">{entry.filledCount}/{entry.totalFields}</span>
              </div>
              {entry.missingFields.length > 0 && (
                <div className="ops-quality-missing">
                  {entry.missingFields.map((f) => (
                    <span key={f} className="ops-missing-tag">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Engine Log ─────────────────────────────────────────────────────────────

function EngineLog() {
  const [logType, setLogType] = useState<"audit" | "reminder">("reminder");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { push } = useToast();

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiGet(`/ops/log?type=${logType}&page=${page}&limit=50`);
      setEntries(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      push("Fehler beim Laden des Logs", "error");
    } finally {
      setLoading(false);
    }
  }, [logType, page, push]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  return (
    <div className="ops-log-section">
      <div className="ops-log-toolbar">
        <div className="ops-log-type-switch">
          <button
            className={`ops-log-type-btn ${logType === "reminder" ? "active" : ""}`}
            onClick={() => { setLogType("reminder"); setPage(1); }}
          >
            <Mail size={14} /> Erinnerungen
          </button>
          <button
            className={`ops-log-type-btn ${logType === "audit" ? "active" : ""}`}
            onClick={() => { setLogType("audit"); setPage(1); }}
          >
            <Activity size={14} /> Audit Trail
          </button>
        </div>
        <span className="ops-log-total">{total} Einträge</span>
      </div>

      {loading ? (
        <div className="ops-loading">Lade Log...</div>
      ) : (
        <div className="ops-log-terminal">
          {entries.length === 0 && (
            <div className="ops-terminal-empty">Noch keine Log-Einträge</div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="ops-terminal-line">
              <span className="ops-terminal-time">
                {new Date(entry.createdAt).toLocaleString("de-DE", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
              {logType === "reminder" ? (
                <>
                  <span className={`ops-terminal-status ops-terminal-${entry.status}`}>
                    {entry.status}
                  </span>
                  <span className="ops-terminal-text">
                    #{entry.reminderNumber} → {entry.emailSentTo}
                    {entry.nbName && <span className="ops-terminal-nb"> ({entry.nbName})</span>}
                  </span>
                  {entry.installation && (
                    <span className="ops-terminal-ref">{entry.installation.publicId}</span>
                  )}
                </>
              ) : (
                <>
                  <span className={`ops-terminal-action ops-terminal-${entry.action}`}>
                    {entry.action}
                  </span>
                  <span className="ops-terminal-text">{entry.description}</span>
                  <span className="ops-terminal-user">{entry.userName}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {total > 50 && (
        <div className="ops-log-pagination">
          <button
            className="ops-btn ops-btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Zurück
          </button>
          <span className="ops-log-page">Seite {page} / {Math.ceil(total / 50)}</span>
          <button
            className="ops-btn ops-btn-ghost"
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage((p) => p + 1)}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
