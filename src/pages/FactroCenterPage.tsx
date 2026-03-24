/**
 * Factro Center – Pipeline-Board für Factro-Projekte
 * Kanban-Board mit Status-Spalten, Detail-Panel, Config-Verwaltung
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../modules/api/client";
import { useAuth } from "../modules/auth/AuthContext";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Database,
  ExternalLink, Loader2, Play, RefreshCw, Search,
  Settings2, Trash2, Zap, TestTube, X,
  Link2, FileText, ArrowRight, MapPin, Sun,
  Phone, Mail, Building2, Edit3, Save, ChevronDown,
  Plus, Download, File, Image, MessageSquare,
  ChevronRight, Calendar, User2, Landmark, Package,
  Hash, Send, Eye, Check, Briefcase,
} from "lucide-react";
import BatchNetzanfrageModal from "../components/factro/BatchNetzanfrageModal";
import "./factro-center.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FactroProjectItem {
  id: number;
  configId: number;
  factroTaskId: string;
  factroPackageId: string | null;
  title: string;
  customerName: string | null;
  customerType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  strasse: string | null;
  hausNr: string | null;
  plz: string | null;
  ort: string | null;
  totalKwp: number | null;
  nbName: string | null;
  gemarkung: string | null;
  flur: string | null;
  flurstueck: string | null;
  datenraumLink: string | null;
  googleMapsLink: string | null;
  rawDescription: string | null;
  // Erweiterte geparste Felder
  firmenname: string | null;
  bundesland: string | null;
  vorgangsnummer: string | null;
  modulAnzahl: number | null;
  eingangDatum: string | null;
  additionalData: Record<string, string> | null;
  // Factro API Metadata
  factroTaskState: string | null;
  factroNumber: number | null;
  factroCreatorId: string | null;
  factroExecutorId: string | null;
  factroCreatedAt: string | null;
  factroChangedAt: string | null;
  // Netzanfrage-Tracking
  dedicatedEmail: string | null;
  netzanfrageGestelltAm: string | null;
  netzanfrageVnbEmail: string | null;
  // Status-Tracking
  status: string;
  isSold: boolean;
  soldAt: string | null;
  installationId: number | null;
  installation: { id: number; publicId: string; status: string; technicalData?: any; netzbetreiber?: { id: number; name: string } | null } | null;
  importedAt: string;
  lastSyncAt: string | null;
  createdAt: string;
  config?: { id: number; name: string };
  syncLogs?: SyncLog[];
  // Email-Count (enriched)
  _count?: { emailLogs: number };
}

interface FactroConfig {
  id: number;
  name: string;
  apiKey: string;
  projectId: string;
  sourcePackageId: string;
  soldPackageId: string;
  isActive: boolean;
  lastPollAt: string | null;
  kundeId: number | null;
  kunde: { id: number; name: string } | null;
  createdAt: string;
  _count?: { syncLogs: number; factroProjects: number };
}

interface SyncLog {
  id: number;
  action: string;
  factroTaskId: string | null;
  factroProjectId: number | null;
  installationId: number | null;
  success: boolean;
  errorMessage: string | null;
  details: any;
  createdAt: string;
  config?: { name: string };
}

interface FactroCommentItem {
  id: number;
  factroCommentId: string;
  parentCommentId: string | null;
  creatorId: string | null;
  creatorName: string | null;
  text: string;
  textPlain: string | null;
  factroCreatedAt: string;
  factroChangedAt: string | null;
}

interface FactroDocumentItem {
  id: number;
  dateiname: string;
  originalName: string;
  dateityp: string | null;
  dateigroesse: number | null;
  speicherpfad: string;
  kategorie: string;
  factroDocumentId: string | null;
  createdAt: string;
}

interface ProjectStats {
  totalProjects: number;
  statusCounts: Record<string, number>;
  soldProjects: number;
  withInstallation: number;
  overdueCount: number;
  withNetzanfrage: number;
  configs: { id: number; name: string; isActive: boolean; lastPollAt: string | null }[];
}

interface FactroCommentActionItem {
  id: number;
  factroCommentId: number;
  factroProjectId: number;
  actionType: string;
  title: string;
  description: string | null;
  extractedData: Record<string, any> | null;
  status: string;
  priority: string;
  assignedToId: number | null;
  executedAt: string | null;
  executedBy: number | null;
  executionResult: Record<string, any> | null;
  createdAt: string;
  factroComment?: {
    id: number;
    textPlain: string | null;
    creatorName: string | null;
    factroCreatedAt: string;
  };
  factroProject?: {
    id: number;
    title: string;
    customerName: string | null;
    factroNumber: number | null;
    installationId: number | null;
  };
  assignedTo?: { id: number; name: string | null; email: string } | null;
}

interface CommentActionStats {
  pending: number;
  executed: number;
  dismissed: number;
  failed: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  NETZANMELDUNG_NEEDED: { label: "Netzanmeldung", color: "#f59e0b", bg: "rgba(245,158,11,.12)", icon: "⚡" },
  NB_KONTAKTIEREN: { label: "NB kontaktieren", color: "#ef4444", bg: "rgba(239,68,68,.12)", icon: "📧" },
  VORGANGSNUMMER_EXTRACTED: { label: "Vorgangsnr.", color: "#22c55e", bg: "rgba(34,197,94,.12)", icon: "🔢" },
  NETZANFRAGE_STELLEN: { label: "Netzanfrage", color: "#3b82f6", bg: "rgba(59,130,246,.12)", icon: "📤" },
  REVIEW_NEEDED: { label: "Prüfung", color: "#EAD068", bg: "rgba(139,92,246,.12)", icon: "🔍" },
  GENERAL_ACTION: { label: "Dringend", color: "#ef4444", bg: "rgba(239,68,68,.12)", icon: "🚨" },
};

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,.15)" },
  HIGH: { color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  NORMAL: { color: "#60a5fa", bg: "rgba(96,165,250,.12)" },
  LOW: { color: "#6b7280", bg: "rgba(107,114,128,.12)" },
};

// ─── Kategorie-Mapping (Config-Name → Kurzname + Farbe) ─────────────────────

const KATEGORIE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "Dachflächen":           { label: "Dachflächen",    color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  "Schwarmspeicher":       { label: "Schwarm",        color: "#EAD068", bg: "rgba(139,92,246,.12)" },
  "Recycling":             { label: "Recycling",      color: "#22c55e", bg: "rgba(34,197,94,.12)" },
  "Großbatteriespeicher":  { label: "Großspeicher",   color: "#3b82f6", bg: "rgba(59,130,246,.12)" },
};

function getKategorie(configName?: string): { label: string; color: string; bg: string } | null {
  if (!configName) return null;
  for (const [key, val] of Object.entries(KATEGORIE_MAP)) {
    if (configName.includes(key)) return val;
  }
  return null;
}

// ─── Pipeline Status Columns ────────────────────────────────────────────────

const PIPELINE_COLUMNS = [
  { key: "NEU", label: "Neu", color: "#3b82f6", dot: "#60a5fa" },
  { key: "GEPRÜFT", label: "Geprüft", color: "#06b6d4", dot: "#22d3ee" },
  { key: "NETZANFRAGE", label: "Netzanfrage", color: "#f59e0b", dot: "#fbbf24" },
  { key: "BEIM_NB", label: "Beim NB", color: "#eab308", dot: "#facc15" },
  { key: "KORREKTUR", label: "Korrektur", color: "#ef4444", dot: "#f87171" },
  { key: "GENEHMIGT", label: "Genehmigt", color: "#22c55e", dot: "#4ade80" },
  { key: "ABGELEHNT", label: "Abgelehnt", color: "#dc2626", dot: "#ef4444" },
  { key: "BAUANTRAG", label: "Bauantrag", color: "#EAD068", dot: "#f0d878" },
  { key: "BAUGENEHMIGT", label: "Baugenehmigt", color: "#10b981", dot: "#34d399" },
  { key: "BAUBEGINN", label: "Baubeginn", color: "#0ea5e9", dot: "#38bdf8" },
  { key: "VERKAUFT", label: "Verkauft", color: "#d97706", dot: "#f59e0b",
    extraStatuses: ["NETZANMELDUNG_ERSTELLT"],
  },
];

// ─── Tabs ───────────────────────────────────────────────────────────────────

type Tab = "pipeline" | "actions" | "configs" | "logs" | "poll";

const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: "pipeline", label: "Pipeline", icon: <Activity size={16} /> },
  { id: "actions", label: "Aktionen", icon: <Zap size={16} /> },
  { id: "configs", label: "Konfigurationen", icon: <Settings2 size={16} />, adminOnly: true },
  { id: "logs", label: "Sync-Logs", icon: <FileText size={16} /> },
  { id: "poll", label: "Polling", icon: <Play size={16} /> },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nie";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function compactAddress(p: FactroProjectItem): string {
  const parts: string[] = [];
  if (p.plz || p.ort) parts.push([p.plz, p.ort].filter(Boolean).join(" "));
  return parts.join(", ") || "";
}

const OVERDUE_THRESHOLD_DAYS = 28;

function isProjectOverdue(p: FactroProjectItem): boolean {
  if (!p.netzanfrageGestelltAm) return false;
  const days = Math.floor((Date.now() - Date.parse(p.netzanfrageGestelltAm)) / (24 * 60 * 60 * 1000));
  return days > OVERDUE_THRESHOLD_DAYS;
}

function getOverdueDays(p: FactroProjectItem): number {
  if (!p.netzanfrageGestelltAm) return 0;
  return Math.floor((Date.now() - Date.parse(p.netzanfrageGestelltAm)) / (24 * 60 * 60 * 1000));
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FactroCenterPage() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role?.toUpperCase() === "ADMIN";
  const isStaffUser = ["ADMIN", "MITARBEITER"].includes((user as any)?.role?.toUpperCase() || "");

  const [tab, setTab] = useState<Tab>("pipeline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [projects, setProjects] = useState<FactroProjectItem[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [configs, setConfigs] = useState<FactroConfig[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logFilter, setLogFilter] = useState("");
  const [polling, setPolling] = useState(false);
  const [batchNetzanfrageOpen, setBatchNetzanfrageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [configFilter, setConfigFilter] = useState<number | null>(null);
  const [nbFilter, setNbFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "nb" | "kwp" | "ort">("date");

  // Detail Panel
  const [selectedProject, setSelectedProject] = useState<FactroProjectItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Comment Actions (Haupt-Tab)
  const [actionStats, setActionStats] = useState<CommentActionStats | null>(null);
  const [actions, setActions] = useState<FactroCommentActionItem[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsFilter, setActionsFilter] = useState<{ status: string; actionType: string }>({ status: "PENDING", actionType: "" });
  const [actionsPage, setActionsPage] = useState(1);
  const [actionsTotal, setActionsTotal] = useState(0);

  // ─── Data Loading ───────────────────────────────────────────────────────

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiGet("/factro/projects");
      setProjects(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("Kein Zugriff auf Factro-Integration");
      }
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGet("/factro/projects/stats");
      setStats(data);
    } catch {
      // ignore
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      const data = await apiGet("/factro/configs");
      setConfigs(data);
    } catch {
      // ignore
    }
  }, []);

  const loadLogs = useCallback(async (page = 1, action = "") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (action) params.set("action", action);
      const data = await apiGet(`/factro/sync-logs?${params}`);
      setLogs(data.logs);
      setLogsTotal(data.total);
      setLogsPage(page);
    } catch {
      // ignore
    }
  }, []);

  const loadActionStats = useCallback(async () => {
    try {
      const data = await apiGet("/factro/comment-actions/stats");
      setActionStats(data);
    } catch {
      // ignore
    }
  }, []);

  const loadActions = useCallback(async (page = 1, filters?: { status?: string; actionType?: string }) => {
    setActionsLoading(true);
    try {
      const f = filters ?? actionsFilter;
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (f.status) params.set("status", f.status);
      if (f.actionType) params.set("actionType", f.actionType);
      const data = await apiGet(`/factro/comment-actions?${params}`);
      setActions(data.actions);
      setActionsTotal(data.total);
      setActionsPage(page);
    } catch {
      setActions([]);
    } finally {
      setActionsLoading(false);
    }
  }, [actionsFilter]);

  const handleActionExecute = useCallback(async (actionId: number) => {
    if (!confirm("Aktion als ausgeführt markieren?")) return;
    try {
      await apiPost(`/factro/comment-actions/${actionId}/execute`, {});
      loadActions(actionsPage);
      loadActionStats();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Fehler beim Ausführen");
    }
  }, [loadActions, actionsPage, loadActionStats]);

  const handleActionDismiss = useCallback(async (actionId: number) => {
    if (!confirm("Aktion verwerfen?")) return;
    try {
      await apiPost(`/factro/comment-actions/${actionId}/dismiss`, {});
      loadActions(actionsPage);
      loadActionStats();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Fehler beim Verwerfen");
    }
  }, [loadActions, actionsPage, loadActionStats]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProjects(), loadStats(), loadConfigs(), loadActionStats()])
      .finally(() => setLoading(false));
  }, [loadProjects, loadStats, loadConfigs, loadActionStats]);

  // ─── Auto-Polling (30s) ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects();
      loadStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadProjects, loadStats]);

  // Load actions when tab becomes active
  useEffect(() => {
    if (tab === "actions") loadActions(1);
  }, [tab, loadActions]);

  // ─── Detail Panel ─────────────────────────────────────────────────────

  const openDetail = async (projectId: number) => {
    setDetailLoading(true);
    try {
      const data = await apiGet(`/factro/projects/${projectId}`);
      setSelectedProject(data);
    } catch {
      setSelectedProject(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedProject(null);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handlePoll = async () => {
    setPolling(true);
    try {
      await apiPost("/factro/poll", {});
      await Promise.all([loadProjects(), loadStats()]);
    } catch {
      // ignore
    } finally {
      setPolling(false);
    }
  };

  const handleCreateInstallation = async (projectId: number, templatePayload?: { templateTyp: string; anzahlSpeicher?: number; anzahlWr?: number }) => {
    try {
      const result = await apiPost(`/factro/projects/${projectId}/create-installation`, templatePayload || {});
      if (result.success) {
        await Promise.all([loadProjects(), loadStats()]);
        if (selectedProject?.id === projectId) {
          openDetail(projectId);
        }
      }
      return result;
    } catch (err: any) {
      alert(err?.response?.data?.message || "Fehler beim Erstellen der Netzanmeldung");
      return null;
    }
  };

  const handleSaveProject = async (projectId: number, data: Record<string, any>) => {
    try {
      const updated = await apiPatch(`/factro/projects/${projectId}`, data);
      setSelectedProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...updated } : p)));
    } catch {
      alert("Speichern fehlgeschlagen");
    }
  };

  // ─── Filtered Projects ────────────────────────────────────────────────

  // Unique NB names for filter dropdown
  const getNbName = (p: FactroProjectItem) => p.nbName || p.installation?.netzbetreiber?.name || null;

  const uniqueNbNames = useMemo(() => {
    const names = new Set<string>();
    projects.forEach(p => { const nb = getNbName(p); if (nb) names.add(nb); });
    return Array.from(names).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (configFilter) {
      result = result.filter((p) => p.configId === configFilter);
    }
    if (nbFilter) {
      result = result.filter((p) => getNbName(p) === nbFilter);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.customerName?.toLowerCase().includes(s) ||
          p.ort?.toLowerCase().includes(s) ||
          p.plz?.includes(s) ||
          getNbName(p)?.toLowerCase().includes(s) ||
          p.dedicatedEmail?.toLowerCase().includes(s)
      );
    }
    // Sortierung
    if (sortBy === "nb") {
      result = [...result].sort((a, b) => (getNbName(a) || "zzz").localeCompare(getNbName(b) || "zzz"));
    } else if (sortBy === "kwp") {
      result = [...result].sort((a, b) => (b.totalKwp || 0) - (a.totalKwp || 0));
    } else if (sortBy === "ort") {
      result = [...result].sort((a, b) => (a.ort || "zzz").localeCompare(b.ort || "zzz"));
    }
    // date = default (Reihenfolge vom Backend)
    return result;
  }, [projects, searchTerm, configFilter, nbFilter, sortBy]);

  // ─── Error State ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="factro-center">
        <div className="factro-error">
          <AlertTriangle size={48} />
          <h2>{error}</h2>
          <p>Diese Funktion ist nur für berechtigte Benutzer verfügbar.</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="factro-center">
      {/* Header */}
      <div className="factro-header">
        <div className="factro-header-left">
          <div className="factro-header-icon">
            <Link2 size={24} />
          </div>
          <div>
            <h1>Factro Pipeline</h1>
            <p className="factro-subtitle">
              {stats ? `${stats.totalProjects} Projekte · ${stats.soldProjects} verkauft` : "Projektmanagement-Integration"}
            </p>
          </div>
        </div>
        <div className="factro-header-right">
          {tab === "pipeline" && configs.length > 1 && (
            <div className="factro-config-filter">
              <button
                className={`factro-filter-btn ${configFilter === null ? "factro-filter-btn--active" : ""}`}
                onClick={() => setConfigFilter(null)}
              >
                Alle
              </button>
              {configs.map((c) => {
                const kat = getKategorie(c.name);
                const count = projects.filter(p => p.configId === c.id).length;
                return (
                  <button
                    key={c.id}
                    className={`factro-filter-btn ${configFilter === c.id ? "factro-filter-btn--active" : ""}`}
                    onClick={() => setConfigFilter(configFilter === c.id ? null : c.id)}
                    title={c.name}
                    style={configFilter === c.id && kat ? { borderColor: kat.color, background: kat.bg } : undefined}
                  >
                    {kat && <span className="factro-filter-dot" style={{ background: kat.color }} />}
                    {c.name.replace("NIVOMA ", "")}
                    <span className="factro-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
          {tab === "pipeline" && uniqueNbNames.length > 0 && (
            <select
              className="factro-nb-filter"
              value={nbFilter || ""}
              onChange={(e) => setNbFilter(e.target.value || null)}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,255,255,0.1)",
                background: nbFilter ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)", color: nbFilter ? "#60a5fa" : "#94a3b8",
                cursor: "pointer", maxWidth: 180,
              }}
            >
              <option value="">Alle NB</option>
              {uniqueNbNames.map(nb => (
                <option key={nb} value={nb}>{nb}</option>
              ))}
            </select>
          )}
          {tab === "pipeline" && (
            <select
              className="factro-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,255,255,0.1)",
                background: sortBy !== "date" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)", color: sortBy !== "date" ? "#60a5fa" : "#94a3b8",
                cursor: "pointer",
              }}
            >
              <option value="date">Sortierung: Datum</option>
              <option value="nb">Sortierung: Netzbetreiber</option>
              <option value="kwp">Sortierung: kWp</option>
              <option value="ort">Sortierung: Ort</option>
            </select>
          )}
          {tab === "pipeline" && (
            <div className="factro-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Projekt suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          {isStaffUser && (
            <button
              className="factro-btn"
              onClick={() => setBatchNetzanfrageOpen(true)}
              style={{ background: "rgba(59,130,246,.15)", color: "#60a5fa" }}
            >
              <Send size={16} />
              Batch-NA
            </button>
          )}
          <button
            className="factro-btn factro-btn-primary"
            onClick={handlePoll}
            disabled={polling}
          >
            {polling ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {polling ? "Sync..." : "Synchronisieren"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="factro-tabs">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            className={`factro-tab ${tab === t.id ? "factro-tab--active" : ""}`}
            onClick={() => {
              setTab(t.id);
              if (t.id === "logs") loadLogs(1, logFilter);
            }}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.id === "pipeline" && stats && (
              <span className="factro-tab-count">{stats.totalProjects}</span>
            )}
            {t.id === "actions" && actionStats && actionStats.pending > 0 && (
              <span className="factro-tab-count" style={{ background: "rgba(245,158,11,.2)", color: "#f59e0b" }}>
                {actionStats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="factro-loading">
          <Loader2 size={32} className="spin" />
          <span>Lade Factro-Daten...</span>
        </div>
      ) : (
        <>
          {tab === "pipeline" && (
            <PipelineBoard
              projects={filteredProjects}
              stats={stats}
              onCardClick={openDetail}
            />
          )}
          {tab === "configs" && isAdmin && (
            <ConfigsTab
              configs={configs}
              onRefresh={loadConfigs}
            />
          )}
          {tab === "logs" && (
            <LogsTab
              logs={logs}
              total={logsTotal}
              page={logsPage}
              filter={logFilter}
              onFilterChange={(f) => { setLogFilter(f); loadLogs(1, f); }}
              onPageChange={(p) => loadLogs(p, logFilter)}
            />
          )}
          {tab === "actions" && (
            <ActionsTab
              actions={actions}
              stats={actionStats}
              loading={actionsLoading}
              total={actionsTotal}
              page={actionsPage}
              filter={actionsFilter}
              onFilterChange={(f) => { setActionsFilter(f); loadActions(1, f); }}
              onPageChange={(p) => loadActions(p)}
              onExecute={handleActionExecute}
              onDismiss={handleActionDismiss}
              onCardClick={openDetail}
            />
          )}
          {tab === "poll" && (
            <PollTab polling={polling} onPoll={handlePoll} />
          )}
        </>
      )}

      {/* Detail Panel Overlay */}
      {(selectedProject || detailLoading) && (
        <ProjectDetailPanel
          project={selectedProject}
          loading={detailLoading}
          onClose={closeDetail}
          onSave={handleSaveProject}
          onCreateInstallation={handleCreateInstallation}
          onRefresh={async (projectId) => {
            loadProjects();
            loadStats();
            const refreshed = await apiGet(`/factro/projects/${projectId}`);
            setSelectedProject(refreshed);
          }}
          isStaff={isStaffUser}
        />
      )}

      {/* Batch-Netzanfrage Modal */}
      {batchNetzanfrageOpen && (
        <BatchNetzanfrageModal
          onClose={() => setBatchNetzanfrageOpen(false)}
          onComplete={() => { loadProjects(); loadStats(); }}
        />
      )}

    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Pipeline Board (Kanban)
// ═════════════════════════════════════════════════════════════════════════════

function PipelineBoard({
  projects,
  stats,
  onCardClick,
}: {
  projects: FactroProjectItem[];
  stats: ProjectStats | null;
  onCardClick: (id: number) => void;
}) {
  const columns = useMemo(() => {
    return PIPELINE_COLUMNS.map((col) => {
      const statuses = [col.key, ...(col.extraStatuses || [])];
      const items = projects.filter((p) => statuses.includes(p.status));
      const overdueCount = items.filter((p) => isProjectOverdue(p)).length;
      return { ...col, items, overdueCount };
    });
  }, [projects]);

  return (
    <div className="factro-board-wrapper">
      {/* Stats Bar – Ops Center style */}
      {stats && (
        <div className="factro-stats-bar">
          <div className="factro-stat-card">
            <span className="factro-stat-icon"><Database size={15} /></span>
            <div>
              <div className="factro-stat-value">{stats.totalProjects}</div>
              <div className="factro-stat-label">Projekte</div>
            </div>
          </div>
          <div className="factro-stat-card factro-stat-card--gold">
            <span className="factro-stat-icon"><Zap size={15} /></span>
            <div>
              <div className="factro-stat-value">{stats.soldProjects}</div>
              <div className="factro-stat-label">Verkauft</div>
            </div>
          </div>
          <div className="factro-stat-card factro-stat-card--green">
            <span className="factro-stat-icon"><CheckCircle2 size={15} /></span>
            <div>
              <div className="factro-stat-value">{stats.withInstallation}</div>
              <div className="factro-stat-label">Mit Netzanmeldung</div>
            </div>
          </div>
          {stats.overdueCount > 0 && (
            <div className="factro-stat-card factro-stat-card--red">
              <span className="factro-stat-icon"><AlertTriangle size={15} /></span>
              <div>
                <div className="factro-stat-value">{stats.overdueCount}</div>
                <div className="factro-stat-label">Überfällig</div>
              </div>
            </div>
          )}
          <div className="factro-stat-card factro-stat-card--amber">
            <span className="factro-stat-icon"><Send size={15} /></span>
            <div>
              <div className="factro-stat-value">{stats.withNetzanfrage}</div>
              <div className="factro-stat-label">Mit NA</div>
            </div>
          </div>
          <div className="factro-stats-divider" />
          {stats.configs.map((c) => {
            const kat = getKategorie(c.name);
            const count = projects.filter(p => p.configId === c.id).length;
            if (!kat) return null;
            return (
              <div key={c.id} className="factro-stat-card" style={{ borderColor: `${kat.color}33` }}>
                <span className="factro-stat-icon" style={{ color: kat.color, background: kat.bg }}>{kat.label.charAt(0)}</span>
                <div>
                  <div className="factro-stat-value">{count}</div>
                  <div className="factro-stat-label">{kat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Board */}
      <div className="factro-board">
        {columns.map((col) => (
          <div key={col.key} className="factro-column" data-status={col.key}>
            <div className="factro-column-header">
              <span className="factro-column-dot" style={{ background: col.dot, color: col.dot }} />
              <span className="factro-column-title">{col.label}</span>
              <span className="factro-column-count">{col.items.length}</span>
              {col.overdueCount > 0 && (
                <span className="factro-column-overdue" title={`${col.overdueCount} überfällig`}>
                  <AlertTriangle size={11} /> {col.overdueCount}
                </span>
              )}
            </div>
            <div className="factro-column-cards">
              {col.items.length === 0 ? (
                <div className="factro-column-empty">Keine Projekte</div>
              ) : (
                col.items.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => onCardClick(p.id)} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Project Card ───────────────────────────────────────────────────────────

function ProjectCard({ project: p, onClick }: { project: FactroProjectItem; onClick: () => void }) {
  const addr = compactAddress(p);
  const overdue = isProjectOverdue(p);
  const overdueDays = getOverdueDays(p);
  const emailCount = p._count?.emailLogs || 0;
  const cardClasses = ["factro-card"];
  if (p.isSold) cardClasses.push("factro-card--sold");
  if (overdue) cardClasses.push("factro-card--overdue");

  return (
    <div className={cardClasses.join(" ")} onClick={onClick}>
      {/* Header: #number + Customer Name */}
      <div className="factro-card-header">
        {p.factroNumber && <span className="factro-card-number">#{p.factroNumber}</span>}
        <span className="factro-card-name">{p.customerName || p.title}</span>
      </div>

      {/* Firma */}
      {p.firmenname && (
        <div className="factro-card-firma">
          <Building2 size={11} /> {p.firmenname}
        </div>
      )}

      {/* VNB-Name */}
      {(p.nbName || p.installation?.netzbetreiber?.name) && (
        <div className="factro-card-vnb">
          <Building2 size={10} /> {p.nbName || p.installation?.netzbetreiber?.name}
        </div>
      )}

      {/* Baunity Email */}
      {p.dedicatedEmail && (
        <div
          className="factro-card-email"
          title="Klicken zum Kopieren"
          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.dedicatedEmail!); }}
        >
          <Mail size={10} /> {p.dedicatedEmail}
        </div>
      )}

      {/* Meta: kWp Badge + Ort */}
      <div className="factro-card-meta">
        {p.totalKwp != null && p.totalKwp > 0 && (
          <span className="factro-card-kwp">
            <Sun size={11} /> {Number(p.totalKwp).toFixed(2)} kWp
          </span>
        )}
        {addr && (
          <span className="factro-card-addr">
            <MapPin size={11} /> {addr}
          </span>
        )}
      </div>

      {/* Vorgangsnummer */}
      {p.vorgangsnummer && (
        <div className="factro-card-vnb">
          <FileText size={10} /> {p.vorgangsnummer}
        </div>
      )}

      {/* Badges */}
      <div className="factro-card-badges">
        {p.installation && (
          <span className="factro-badge factro-badge--green">
            <ArrowRight size={10} /> #{p.installation.publicId}
          </span>
        )}
        {overdue ? (
          <span className="factro-card-overdue-badge" title={`${overdueDays} Tage ohne VNB-Antwort`}>
            <AlertTriangle size={10} /> {overdueDays}T
          </span>
        ) : p.netzanfrageGestelltAm ? (
          <span className="factro-badge factro-badge--amber" title={`Gestellt am ${new Date(p.netzanfrageGestelltAm).toLocaleDateString("de-DE")}`}>
            <Send size={10} /> NA gestellt
          </span>
        ) : null}
        {emailCount > 0 && (
          <span className="factro-card-email-count" title={`${emailCount} Email${emailCount > 1 ? "s" : ""} gesendet`}>
            <Mail size={10} /> {emailCount}
          </span>
        )}
        {p.status === "NETZANMELDUNG_ERSTELLT" && !p.installation && (
          <span className="factro-badge factro-badge--blue">NA erstellt</span>
        )}
      </div>

      {/* Kategorie-Badge */}
      {(() => {
        const kat = getKategorie(p.config?.name);
        return kat ? (
          <div className="factro-card-kategorie" style={{ color: kat.color, background: kat.bg }}>
            {kat.label}
          </div>
        ) : p.config ? (
          <div className="factro-card-config">{p.config.name}</div>
        ) : null;
      })()}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Project Detail Panel (Slide-Over) – Professionelles Tabbed Layout
// ═════════════════════════════════════════════════════════════════════════════

type DetailTab = "overview" | "comments" | "documents" | "history" | "emails" | "actions";

// ─── Netzanfrage Types ──────────────────────────────────────────────────

interface NetzanfragePreviewData {
  category: string;
  vnbEmail: string | null;
  vnbName: string | null;
  subject: string;
  body: string;
  missingFields: string[];
  canSend: boolean;
  leistungKw: number | null;
  eigentuemer: string | null;
}

function ProjectDetailPanel({
  project,
  loading,
  onClose,
  onSave,
  onCreateInstallation,
  onRefresh,
  isStaff,
}: {
  project: FactroProjectItem | null;
  loading: boolean;
  onClose: () => void;
  onSave: (id: number, data: Record<string, any>) => void;
  onCreateInstallation: (id: number, templatePayload?: { templateTyp: string; anzahlSpeicher?: number; anzahlWr?: number }) => Promise<any>;
  onRefresh: (projectId: number) => Promise<void>;
  isStaff: boolean;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [creatingInstallation, setCreatingInstallation] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slide-in animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Netzanfrage
  const [netzanfrageModal, setNetzanfrageModal] = useState(false);
  const [netzanfragePreview, setNetzanfragePreview] = useState<NetzanfragePreviewData | null>(null);
  const [netzanfrageLoading, setNetzanfrageLoading] = useState(false);
  const [netzanfrageSending, setNetzanfrageSending] = useState(false);
  const [netzanfrageVnbEmail, setNetzanfrageVnbEmail] = useState("");
  const [netzanfrageSubject, setNetzanfrageSubject] = useState("");
  const [netzanfrageBody, setNetzanfrageBody] = useState("");
  const [netzanfrageLeistungKw, setNetzanfrageLeistungKw] = useState("");
  const [netzanfrageRegenerating, setNetzanfrageRegenerating] = useState(false);

  // Template-Dialog für Speicher-Projekte
  const [templateModal, setTemplateModal] = useState(false);
  const [templateAnzahlSpeicher, setTemplateAnzahlSpeicher] = useState(1);
  const [templateAnzahlWr, setTemplateAnzahlWr] = useState(1);
  const [templatePreview, setTemplatePreview] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Erkennt ob Projekt ein Speicher-Template hat
  const detectedTemplateTyp = useMemo(() => {
    if (!project?.config?.name) return null;
    const name = project.config.name.toLowerCase();
    if (name.includes("großbatterie") || name.includes("grossbatterie") || name.includes("großspeicher")) return "GROSSSPEICHER";
    if (name.includes("schwarmspeicher") || name.includes("schwarm")) return "SCHWARMSPEICHER";
    return null;
  }, [project?.config?.name]);

  // Template-Preview laden
  const loadTemplatePreview = useCallback(async (typ: string, anzSp: number, anzWr: number) => {
    setTemplateLoading(true);
    try {
      const data = await apiGet(`/factro/templates/speicher/${typ}?anzahlSpeicher=${anzSp}&anzahlWr=${anzWr}`);
      setTemplatePreview(data);
    } catch { /* ignore */ }
    finally { setTemplateLoading(false); }
  }, []);

  // Template-Preview beim Öffnen laden
  useEffect(() => {
    if (templateModal && detectedTemplateTyp) {
      loadTemplatePreview(detectedTemplateTyp, templateAnzahlSpeicher, templateAnzahlWr);
    }
  }, [templateModal, detectedTemplateTyp, templateAnzahlSpeicher, templateAnzahlWr, loadTemplatePreview]);

  const handleNetzanfragePreview = useCallback(async (leistungKw?: number) => {
    if (!project) return;
    setNetzanfrageModal(true);
    if (!leistungKw) setNetzanfrageLoading(true);
    else setNetzanfrageRegenerating(true);
    try {
      const url = leistungKw
        ? `/factro/netzanfrage/${project.id}/preview?leistungKw=${leistungKw}`
        : `/factro/netzanfrage/${project.id}/preview`;
      const data = await apiGet(url);
      setNetzanfragePreview(data);
      setNetzanfrageVnbEmail(prev => leistungKw ? prev : (data.vnbEmail || ""));
      setNetzanfrageSubject(data.subject || "");
      setNetzanfrageBody(data.body || "");
      if (!leistungKw && data.leistungKw) {
        setNetzanfrageLeistungKw(String(data.leistungKw));
      }
    } catch (err) {
      console.error("Netzanfrage-Preview Fehler:", err);
      if (!leistungKw) setNetzanfragePreview(null);
    } finally {
      setNetzanfrageLoading(false);
      setNetzanfrageRegenerating(false);
    }
  }, [project]);

  const handleLeistungChange = useCallback((val: string) => {
    setNetzanfrageLeistungKw(val);
    const kw = parseFloat(val);
    if (kw > 0 && project) {
      handleNetzanfragePreview(kw);
    }
  }, [project, handleNetzanfragePreview]);

  const handleNetzanfrageSend = useCallback(async () => {
    if (!project || !netzanfrageVnbEmail) return;
    setNetzanfrageSending(true);
    try {
      await apiPost(`/factro/netzanfrage/${project.id}/send`, {
        vnbEmail: netzanfrageVnbEmail,
        subject: netzanfrageSubject,
        body: netzanfrageBody,
      });
      alert("Netzanfrage erfolgreich gesendet!");
      setNetzanfrageModal(false);
      // Sofort Daten refreshen (Badge, Status, Detail-Panel)
      onRefresh(project.id);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Fehler beim Senden");
    } finally {
      setNetzanfrageSending(false);
    }
  }, [project, netzanfrageVnbEmail, netzanfrageSubject, netzanfrageBody, onRefresh]);

  // Documents
  const [documents, setDocuments] = useState<FactroDocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Comments
  const [comments, setComments] = useState<FactroCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [syncingComments, setSyncingComments] = useState(false);

  const commentCount = (project as any)?.comments?.length ?? comments.length;

  // Project-level Actions
  const [projectActions, setProjectActions] = useState<FactroCommentActionItem[]>([]);
  const [projectActionsLoading, setProjectActionsLoading] = useState(false);

  const loadProjectActions = useCallback(async (projectId: number) => {
    setProjectActionsLoading(true);
    try {
      const data = await apiGet(`/factro/comment-actions/projects/${projectId}/comment-actions`);
      setProjectActions(data.actions || []);
    } catch {
      setProjectActions([]);
    } finally {
      setProjectActionsLoading(false);
    }
  }, []);

  const handleProjectActionExecute = useCallback(async (actionId: number) => {
    if (!confirm("Aktion als ausgeführt markieren?")) return;
    try {
      await apiPost(`/factro/comment-actions/${actionId}/execute`, {});
      if (project) loadProjectActions(project.id);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Fehler beim Ausführen");
    }
  }, [project, loadProjectActions]);

  const handleProjectActionDismiss = useCallback(async (actionId: number) => {
    if (!confirm("Aktion verwerfen?")) return;
    try {
      await apiPost(`/factro/comment-actions/${actionId}/dismiss`, {});
      if (project) loadProjectActions(project.id);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Fehler beim Verwerfen");
    }
  }, [project, loadProjectActions]);

  // Reminder
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  const loadReminderCount = useCallback(async (projectId: number) => {
    try {
      const data = await apiGet(`/factro/netzanfrage/${projectId}/reminder-count`);
      setReminderCount(data.count || 0);
    } catch {
      setReminderCount(0);
    }
  }, []);

  const handleSendReminder = useCallback(async () => {
    if (!project) return;
    if (!confirm(`Erinnerung #${reminderCount + 1} an VNB senden?`)) return;
    setSendingReminder(true);
    try {
      const result = await apiPost(`/factro/netzanfrage/${project.id}/send-reminder`, {});
      alert(`Erinnerung #${result.reminderNumber} erfolgreich gesendet!`);
      setReminderCount(result.reminderNumber);
      onRefresh(project.id);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Fehler beim Senden der Erinnerung");
    } finally {
      setSendingReminder(false);
    }
  }, [project, reminderCount, onRefresh]);

  const loadDocuments = useCallback(async (projectId: number) => {
    setDocsLoading(true);
    try {
      const data = await apiGet(`/factro/projects/${projectId}/documents`);
      setDocuments(data);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  const loadComments = useCallback(async (projectId: number) => {
    setCommentsLoading(true);
    try {
      const data = await apiGet(`/factro/projects/${projectId}/comments`);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleImportDocs = async () => {
    if (!project) return;
    setImporting(true);
    try {
      await apiPost(`/factro/projects/${project.id}/import-documents`, {});
      await loadDocuments(project.id);
    } catch {
      // ignore
    } finally {
      setImporting(false);
    }
  };

  const handleSyncComments = async () => {
    if (!project) return;
    setSyncingComments(true);
    try {
      await apiPost(`/factro/projects/${project.id}/sync-comments`, {});
      await loadComments(project.id);
    } catch {
      // ignore
    } finally {
      setSyncingComments(false);
    }
  };

  useEffect(() => {
    if (project) {
      loadDocuments(project.id);
      loadComments(project.id);
      loadProjectActions(project.id);
      if (project.netzanfrageGestelltAm) {
        loadReminderCount(project.id);
      } else {
        setReminderCount(0);
      }
      setForm({
        customerName: project.customerName || "",
        customerType: project.customerType || "",
        contactName: project.contactName || "",
        contactEmail: project.contactEmail || "",
        contactPhone: project.contactPhone || "",
        strasse: project.strasse || "",
        hausNr: project.hausNr || "",
        plz: project.plz || "",
        ort: project.ort || "",
        totalKwp: project.totalKwp ?? "",
        nbName: project.nbName || project.installation?.netzbetreiber?.name || "",
        gemarkung: project.gemarkung || "",
        flur: project.flur || "",
        flurstueck: project.flurstueck || "",
        firmenname: project.firmenname || "",
        bundesland: project.bundesland || "",
        vorgangsnummer: project.vorgangsnummer || "",
        modulAnzahl: project.modulAnzahl ?? "",
      });
      setEditing(false);
      setActiveTab("overview");
    }
  }, [project]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleSave = () => {
    if (!project) return;
    const numberFields = ["totalKwp", "modulAnzahl"];
    const data: Record<string, any> = {};
    for (const [key, val] of Object.entries(form)) {
      if (numberFields.includes(key)) {
        data[key] = val === "" ? null : Number(val);
      } else {
        data[key] = val || null;
      }
    }
    onSave(project.id, data);
    setEditing(false);
  };

  const handleCreateInst = async () => {
    if (!project) return;
    // Speicher-Projekte → Template-Dialog
    if (detectedTemplateTyp && !project.installationId) {
      setTemplateAnzahlSpeicher(1);
      setTemplateAnzahlWr(1);
      setTemplateModal(true);
      return;
    }
    setCreatingInstallation(true);
    await onCreateInstallation(project.id);
    setCreatingInstallation(false);
  };

  const handleCreateInstWithTemplate = async () => {
    if (!project || !detectedTemplateTyp) return;
    setCreatingInstallation(true);
    setTemplateModal(false);
    const result = await onCreateInstallation(project.id, {
      templateTyp: detectedTemplateTyp,
      anzahlSpeicher: templateAnzahlSpeicher,
      anzahlWr: templateAnzahlWr,
    });
    setCreatingInstallation(false);
    if (result?.success) {
      setTemplatePreview(null);
    }
  };

  const handleCreateInstOhneTemplate = async () => {
    if (!project) return;
    setCreatingInstallation(true);
    setTemplateModal(false);
    await onCreateInstallation(project.id);
    setCreatingInstallation(false);
  };

  const handleStatusChange = (status: string) => {
    if (!project) return;
    onSave(project.id, { status });
    setStatusDropdown(false);
  };

  const ad = project?.additionalData;
  const pendingActionsCount = projectActions.filter(a => a.status === "PENDING").length;
  const statusCol = PIPELINE_COLUMNS.find(c => c.key === project?.status);

  return (
    <>
      {/* ─── Slide-in Overlay ─── */}
      <div className={`fp-overlay ${visible ? "fp-overlay--visible" : ""}`} onClick={handleClose} />
      <div className={`fp-panel ${visible ? "fp-panel--visible" : ""}`} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="fp-loading">
            <Loader2 size={24} className="spin" />
          </div>
        ) : project ? (
          <>
            {/* ─── Header ─── */}
            <div className="fp-header">
              <div className="fp-header__top">
                <div className="fp-header__id">
                  <span className={`factro-status-badge factro-status--${project.status.toLowerCase()}`} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                    {statusCol?.label || project.status}
                  </span>
                  {project.isSold && <span className="factro-badge factro-badge--gold">VERKAUFT</span>}
                  {project.factroNumber && (
                    <span className="factro-badge factro-badge--blue">
                      <Hash size={10} /> {project.factroNumber}
                    </span>
                  )}
                  {(() => {
                    const kat = getKategorie(project.config?.name);
                    return kat ? (
                      <span className="factro-card-kategorie" style={{ color: kat.color, background: kat.bg, fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>
                        {kat.label}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="fp-header__actions">
                  {editing ? (
                    <button className="factro-btn factro-btn-primary factro-btn-sm" onClick={handleSave}>
                      <Save size={14} /> Speichern
                    </button>
                  ) : (
                    <button className="fp-icon-btn" onClick={() => setEditing(true)} title="Bearbeiten">
                      <Edit3 size={15} />
                    </button>
                  )}
                  <button className="fp-icon-btn" onClick={() => onRefresh(project.id)} title="Aktualisieren">
                    <RefreshCw size={15} />
                  </button>
                  {project.factroTaskId && (
                    <a href="https://cloud.factro.com" target="_blank" rel="noopener noreferrer" className="fp-icon-btn" title="In Factro öffnen">
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <button className="fp-close" onClick={handleClose} title="Schließen (Esc)">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <h2 className="fp-header__title">{project.customerName || project.title}</h2>
              {project.firmenname && (
                <div className="fp-header__firma">
                  <Building2 size={13} /> {project.firmenname}
                </div>
              )}

              {/* Meta row */}
              <div className="fp-header__meta">
                {(project.plz || project.ort) && (
                  <span className="fp-header__meta-item">
                    <MapPin size={12} /> {[project.plz, project.ort].filter(Boolean).join(" ")}
                  </span>
                )}
                {project.nbName && (
                  <span className="fp-header__meta-item">
                    <Building2 size={12} /> {project.nbName}
                  </span>
                )}
                {project.totalKwp && (
                  <span className="fp-header__meta-item">
                    <Zap size={12} /> {Number(project.totalKwp).toFixed(2)} kWp
                  </span>
                )}
                {project.installation && (
                  <a href={`/installations/${project.installation.id}`} className="factro-badge factro-badge--green" style={{ textDecoration: "none", fontSize: 11 }}>
                    <ArrowRight size={10} /> #{project.installation.publicId}
                  </a>
                )}
              </div>

              {/* Dedicated Email */}
              {project.dedicatedEmail && (
                <div
                  className="fp-header__email"
                  onClick={() => {
                    navigator.clipboard.writeText(project.dedicatedEmail!);
                    setCopyFeedback(true);
                    setTimeout(() => setCopyFeedback(false), 2000);
                  }}
                  title="Klicken zum Kopieren"
                  style={{ marginTop: 10, display: "inline-flex" }}
                >
                  <Mail size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  {project.dedicatedEmail}
                  <span className="fp-header__email-copy">{copyFeedback ? "Kopiert!" : "Kopieren"}</span>
                </div>
              )}
            </div>

            {/* ─── Tabs ─── */}
              <div className="fp-tabs">
                <button
                  className={`fp-tab ${activeTab === "overview" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <Eye size={14} /> Übersicht
                </button>
                <button
                  className={`fp-tab ${activeTab === "comments" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("comments")}
                >
                  <MessageSquare size={14} /> Kommentare
                  {commentCount > 0 && <span className="fp-tab__count">{commentCount}</span>}
                </button>
                <button
                  className={`fp-tab ${activeTab === "documents" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("documents")}
                >
                  <FileText size={14} /> Dokumente
                  {documents.length > 0 && <span className="fp-tab__count">{documents.length}</span>}
                </button>
                <button
                  className={`fp-tab ${activeTab === "history" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <Activity size={14} /> Verlauf
                </button>
                <button
                  className={`fp-tab ${activeTab === "emails" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("emails")}
                >
                  <Mail size={14} /> Emails
                </button>
                <button
                  className={`fp-tab ${activeTab === "actions" ? "fp-tab--active" : ""}`}
                  onClick={() => setActiveTab("actions")}
                >
                  <Zap size={14} /> Aktionen
                  {pendingActionsCount > 0 && (
                    <span className="fp-tab__count" style={{ background: "rgba(245,158,11,.2)", color: "#f59e0b" }}>
                      {pendingActionsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* ─── Overdue Alert ─── */}
              {project.netzanfrageGestelltAm && isProjectOverdue(project) && (
                <div className="fp-alert fp-alert--danger" style={{ margin: "0 24px", marginTop: 12 }}>
                  <AlertTriangle size={16} />
                  <span>Keine VNB-Antwort seit {getOverdueDays(project)} Tagen</span>
                  {isStaff && reminderCount < 3 && (
                    <button
                      className="factro-quickaction factro-quickaction--danger"
                      onClick={handleSendReminder}
                      disabled={sendingReminder}
                      style={{ marginLeft: "auto" }}
                    >
                      {sendingReminder ? <Loader2 size={12} className="spin" /> : <Mail size={12} />}
                      Erinnerung senden {reminderCount > 0 && `(${reminderCount}/3)`}
                    </button>
                  )}
                  {reminderCount >= 3 && (
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.7 }}>Max. Erinnerungen erreicht</span>
                  )}
                </div>
              )}

              {/* ─── Quick Actions ─── */}
              <div className="fp-quickactions">
                {!project.installationId && (
                  <button
                    className="factro-quickaction factro-quickaction--primary"
                    onClick={handleCreateInst}
                    disabled={creatingInstallation}
                  >
                    {creatingInstallation ? <Loader2 size={12} className="spin" /> : <Plus size={12} />}
                    Netzanmeldung erstellen
                  </button>
                )}
                {["NEU", "GEPRÜFT"].includes(project.status) && (
                  <button
                    className="factro-quickaction factro-quickaction--primary"
                    onClick={() => handleNetzanfragePreview()}
                  >
                    <Send size={12} /> Netzanfrage senden
                  </button>
                )}
                {project.status === "NETZANFRAGE" && project.netzanfrageGestelltAm && (
                  <span className="factro-quickaction factro-quickaction--disabled">
                    <Clock size={12} /> Warte auf VNB... ({getOverdueDays(project)}T)
                  </span>
                )}
                {project.status === "BEIM_NB" && isProjectOverdue(project) && isStaff && reminderCount < 3 && (
                  <button
                    className="factro-quickaction factro-quickaction--danger"
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                  >
                    {sendingReminder ? <Loader2 size={12} className="spin" /> : <Mail size={12} />}
                    Erinnerung senden
                  </button>
                )}
                {project.status === "BEIM_NB" && !isProjectOverdue(project) && project.netzanfrageGestelltAm && (
                  <span className="factro-quickaction factro-quickaction--disabled">
                    <Clock size={12} /> NA gestellt am {new Date(project.netzanfrageGestelltAm).toLocaleDateString("de-DE")}
                  </span>
                )}
                {project.status === "KORREKTUR" && (
                  <span className="factro-quickaction" style={{ color: "#f59e0b", borderColor: "rgba(245,158,11,.3)" }}>
                    <Edit3 size={12} /> Korrektur bearbeiten
                  </span>
                )}
                {project.status === "GENEHMIGT" && (
                  <span className="factro-quickaction factro-quickaction--success">
                    <CheckCircle2 size={12} /> Genehmigt
                  </span>
                )}
                {project.status === "ABGELEHNT" && (
                  <span className="factro-quickaction factro-quickaction--danger">
                    <AlertTriangle size={12} /> Widerspruch prüfen
                  </span>
                )}
                {project.factroTaskId && (
                  <a href="https://cloud.factro.com" target="_blank" rel="noopener noreferrer" className="factro-quickaction">
                    <ExternalLink size={12} /> Factro
                  </a>
                )}
                {project.datenraumLink && (
                  <a href={project.datenraumLink} target="_blank" rel="noopener noreferrer" className="factro-quickaction">
                    <FileText size={12} /> Datenraum
                  </a>
                )}
                {project.googleMapsLink && (
                  <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer" className="factro-quickaction">
                    <MapPin size={12} /> Maps
                  </a>
                )}
                {/* Status Dropdown */}
                <div className="factro-status-dropdown-wrapper" style={{ marginLeft: "auto" }}>
                  <button
                    className="factro-quickaction"
                    onClick={() => setStatusDropdown(!statusDropdown)}
                  >
                    Status <ChevronDown size={12} />
                  </button>
                  {statusDropdown && (
                    <div className="factro-status-dropdown">
                      {PIPELINE_COLUMNS.map((col) => (
                        <button
                          key={col.key}
                          className="factro-status-dropdown-item"
                          onClick={() => handleStatusChange(col.key)}
                        >
                          <span style={{ background: col.dot, width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />
                          {col.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Tab Content ─── */}
              <div className="fp-content">
                {activeTab === "overview" && (
                  <OverviewTab project={project} ad={ad} form={form} setForm={setForm} editing={editing} onRefresh={onRefresh} />
                )}
                {activeTab === "comments" && (
                  <CommentsTab
                    comments={comments}
                    loading={commentsLoading}
                    syncing={syncingComments}
                    onSync={handleSyncComments}
                  />
                )}
                {activeTab === "documents" && (
                  <DocumentsTab
                    documents={documents}
                    loading={docsLoading}
                    importing={importing}
                    onImport={handleImportDocs}
                  />
                )}
                {activeTab === "history" && (
                  <HistoryTab syncLogs={project.syncLogs || []} />
                )}
                {activeTab === "emails" && project && (
                  <EmailsTab projectId={project.id} />
                )}
                {activeTab === "actions" && (
                  <ProjectActionsTab
                    actions={projectActions}
                    loading={projectActionsLoading}
                    onExecute={handleProjectActionExecute}
                    onDismiss={handleProjectActionDismiss}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>

      {/* ─── Netzanfrage Modal ─── */}
      {/* ─── Template-Dialog für Speicher-Projekte ─── */}
      {templateModal && detectedTemplateTyp && (
        <>
          <div className="factro-detail-overlay" style={{ zIndex: 1100 }} onClick={() => setTemplateModal(false)} />
          <div className="factro-netzanfrage-modal" style={{ maxWidth: 560 }}>
            <div className="factro-netzanfrage-header">
              <h3 style={{ margin: 0, fontSize: 15 }}>
                <Zap size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
                Speicher-Template: {detectedTemplateTyp === "GROSSSPEICHER" ? "Großspeicher" : "Schwarmspeicher"}
              </h3>
              <button className="factro-btn factro-btn-sm factro-btn-ghost" onClick={() => setTemplateModal(false)}>
                <X size={16} />
              </button>
            </div>

            {templateLoading ? (
              <div style={{ padding: 32, textAlign: "center" }}><Loader2 size={24} className="spin" /></div>
            ) : templatePreview ? (
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Template-Info */}
                <div style={{ padding: "8px 10px", background: "rgba(59,130,246,.08)", borderRadius: 6, border: "1px solid rgba(59,130,246,.2)", fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "#60a5fa" }}>{templatePreview.template.label}</div>
                  <div style={{ color: "rgba(255,255,255,.6)" }}>{templatePreview.template.beschreibung}</div>
                </div>

                {/* Betreiber */}
                <div style={{ padding: "8px 10px", background: "rgba(255,255,255,.04)", borderRadius: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Anlagenbetreiber</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Firma</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.betreiber.firma}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Vertreter</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.betreiber.vertreter}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Adresse</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.betreiber.strasse}, {templatePreview.template.betreiber.plz} {templatePreview.template.betreiber.ort}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Telefon</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.betreiber.telefon}</span>
                  </div>
                </div>

                {/* WR-Info */}
                <div style={{ padding: "8px 10px", background: "rgba(255,255,255,.04)", borderRadius: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Wechselrichter</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Hersteller</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.wechselrichter.hersteller}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Modell</span>
                    <span style={{ color: "rgba(255,255,255,.9)", fontSize: 11 }}>{templatePreview.template.wechselrichter.modell}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Leistung</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.wechselrichter.leistungKw.toLocaleString("de-DE")} kW / {templatePreview.template.wechselrichter.leistungKva.toLocaleString("de-DE")} kVA</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>ZEREZ-ID</span>
                    <span style={{ color: templatePreview.zerezGefunden ? "#4ade80" : "#f59e0b", fontWeight: 500 }}>
                      {templatePreview.zerezGefunden ? templatePreview.zerezId : "Nicht gefunden — manuell nachtragen"}
                    </span>
                  </div>
                </div>

                {/* Speicher-Info */}
                <div style={{ padding: "8px 10px", background: "rgba(255,255,255,.04)", borderRadius: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Batteriespeicher</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Hersteller</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.speicher.hersteller}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Modell</span>
                    <span style={{ color: "rgba(255,255,255,.9)", fontSize: 11 }}>{templatePreview.template.speicher.modell}</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Kapazität</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.speicher.kapazitaetKwh.toLocaleString("de-DE")} kWh / Einheit</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Kopplung</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.speicher.kopplung}-gekoppelt</span>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Batterietyp</span>
                    <span style={{ color: "rgba(255,255,255,.9)" }}>{templatePreview.template.speicher.batterietyp}</span>
                  </div>
                </div>

                {/* Anzahl-Eingabe */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 3 }}>Anzahl Speicher</label>
                    <input
                      type="number" min={1} max={200} value={templateAnzahlSpeicher}
                      onChange={e => setTemplateAnzahlSpeicher(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 3 }}>Anzahl WR / Skids</label>
                    <input
                      type="number" min={1} max={200} value={templateAnzahlWr}
                      onChange={e => setTemplateAnzahlWr(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* Gesamt-Zusammenfassung */}
                <div style={{ padding: "8px 10px", background: "rgba(34,197,94,.08)", borderRadius: 6, border: "1px solid rgba(34,197,94,.2)", fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Gesamt Speicherkapazität</span>
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>
                      {(templatePreview.template.speicher.kapazitaetKwh * templateAnzahlSpeicher).toLocaleString("de-DE")} kWh
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ color: "rgba(255,255,255,.5)" }}>Gesamt WR-Leistung</span>
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>
                      {(templatePreview.template.wechselrichter.leistungKw * templateAnzahlWr).toLocaleString("de-DE")} kW
                    </span>
                  </div>
                </div>

                {/* Aktionen */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    className="factro-btn factro-btn-sm"
                    onClick={handleCreateInstOhneTemplate}
                    disabled={creatingInstallation}
                    style={{ flex: "0 0 auto" }}
                  >
                    Ohne Template
                  </button>
                  <button
                    className="factro-btn factro-btn-primary factro-btn-sm"
                    onClick={handleCreateInstWithTemplate}
                    disabled={creatingInstallation}
                    style={{ flex: 1 }}
                  >
                    {creatingInstallation ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
                    {creatingInstallation ? "Wird erstellt..." : "Netzanmeldung mit Template erstellen"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,.4)" }}>
                Template konnte nicht geladen werden
              </div>
            )}
          </div>
        </>
      )}

      {netzanfrageModal && (
        <>
          <div className="factro-detail-overlay" style={{ zIndex: 1100 }} onClick={() => setNetzanfrageModal(false)} />
          <div className="factro-netzanfrage-modal">
            <div className="factro-netzanfrage-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0 }}><Send size={18} /> Netzanfrage senden</h3>
                {netzanfragePreview?.category && (
                  <span className={`factro-card-kategorie factro-card-kategorie--${
                    netzanfragePreview.category === "batteriespeicher" ? "blue" :
                    netzanfragePreview.category === "dachflaeche" ? "yellow" :
                    netzanfragePreview.category === "schwarmspeicher" ? "purple" : "green"
                  }`} style={{ fontSize: 11 }}>
                    {netzanfragePreview.category === "batteriespeicher" ? "Batteriespeicher" :
                     netzanfragePreview.category === "dachflaeche" ? "Dachfläche" :
                     netzanfragePreview.category === "schwarmspeicher" ? "Schwarmspeicher" :
                     netzanfragePreview.category === "recycling" ? "Recycling" : "Sonstige"}
                  </span>
                )}
              </div>
              <button className="factro-btn factro-btn-sm factro-btn-ghost" onClick={() => setNetzanfrageModal(false)}>
                <X size={16} />
              </button>
            </div>

            {netzanfrageLoading ? (
              <div className="factro-netzanfrage-loading">
                <Loader2 size={24} className="spin" />
                <span>Vorschau wird geladen...</span>
              </div>
            ) : netzanfragePreview ? (
              <div className="factro-netzanfrage-content">
                {/* Warnungen */}
                {netzanfragePreview.missingFields.length > 0 && (
                  <div className="factro-netzanfrage-warning">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Fehlende Felder:</strong> {netzanfragePreview.missingFields.join(", ")}
                    </div>
                  </div>
                )}

                {/* Leistung (kW) - nur bei Speicher-Kategorien */}
                {netzanfragePreview.category && ["batteriespeicher", "schwarmspeicher"].includes(netzanfragePreview.category) && (
                  <div className="factro-netzanfrage-field">
                    <label>
                      Speicherleistung (kW)
                      {netzanfrageRegenerating && <Loader2 size={12} className="spin" style={{ marginLeft: 6 }} />}
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        value={netzanfrageLeistungKw}
                        onChange={e => setNetzanfrageLeistungKw(e.target.value)}
                        onBlur={e => {
                          const kw = parseFloat(e.target.value);
                          if (kw > 0) handleLeistungChange(e.target.value);
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const kw = parseFloat(netzanfrageLeistungKw);
                            if (kw > 0) handleLeistungChange(netzanfrageLeistungKw);
                          }
                        }}
                        placeholder="z.B. 10000"
                        className="factro-netzanfrage-input"
                        style={{ maxWidth: 200 }}
                      />
                      {netzanfrageLeistungKw && parseFloat(netzanfrageLeistungKw) >= 1000 && (
                        <span className="factro-netzanfrage-hint" style={{ whiteSpace: "nowrap" }}>
                          = {(parseFloat(netzanfrageLeistungKw) / 1000).toFixed(1)} MW
                        </span>
                      )}
                    </div>
                    <span className="factro-netzanfrage-hint">
                      {netzanfragePreview.leistungKw
                        ? `Automatisch erkannt: ${netzanfragePreview.leistungKw.toLocaleString("de-DE")} kW — Wert ändern um Text neu zu generieren`
                        : "Aus Kommentaren nicht erkennbar — bitte manuell angeben, Enter/Tab drücken zum Generieren"}
                    </span>
                  </div>
                )}

                {/* VNB Email */}
                <div className="factro-netzanfrage-field">
                  <label>Empfänger (VNB-Email)</label>
                  <input
                    type="email"
                    value={netzanfrageVnbEmail}
                    onChange={e => setNetzanfrageVnbEmail(e.target.value)}
                    placeholder="vnb@example.de"
                    className="factro-netzanfrage-input"
                  />
                  {netzanfragePreview.vnbName && (
                    <span className="factro-netzanfrage-hint">{netzanfragePreview.vnbName}</span>
                  )}
                </div>

                {/* Betreff */}
                <div className="factro-netzanfrage-field">
                  <label>Betreff</label>
                  <input
                    type="text"
                    value={netzanfrageSubject}
                    onChange={e => setNetzanfrageSubject(e.target.value)}
                    className="factro-netzanfrage-input"
                  />
                </div>

                {/* Email-Text */}
                <div className="factro-netzanfrage-field">
                  <label>Email-Text</label>
                  <textarea
                    value={netzanfrageBody}
                    onChange={e => setNetzanfrageBody(e.target.value)}
                    className="factro-netzanfrage-textarea"
                    rows={18}
                  />
                </div>

                {/* Info */}
                <div className="factro-netzanfrage-info">
                  <Mail size={14} />
                  <span>Absender: netzanmeldung@lecagmbh.de · CC: info@baunity.de</span>
                </div>

                {/* Aktionen */}
                <div className="factro-netzanfrage-actions">
                  <button className="factro-btn factro-btn-sm" onClick={() => setNetzanfrageModal(false)}>
                    Abbrechen
                  </button>
                  <button
                    className="factro-btn factro-btn-primary factro-btn-sm"
                    onClick={handleNetzanfrageSend}
                    disabled={netzanfrageSending || !netzanfrageVnbEmail}
                  >
                    {netzanfrageSending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                    {netzanfrageSending ? "Wird gesendet..." : "Netzanfrage senden"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="factro-netzanfrage-loading">
                <AlertTriangle size={24} />
                <span>Vorschau konnte nicht geladen werden</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ─── Übersicht-Tab: Collapsible Sections ─────────────────────────────────────

function OverviewTab({
  project, ad, form, setForm, editing, onRefresh,
}: {
  project: FactroProjectItem;
  ad: Record<string, string> | null | undefined;
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  editing: boolean;
  onRefresh: (projectId: number) => Promise<void>;
}) {
  const hasNbContact = ad?.nbAnsprechpartner || ad?.nbTelefon || ad?.nbEmail || ad?.nbDurchwahl || ad?.nbFax || ad?.nbAdresse;
  const hasBankhaus = ad?.bankhaus || ad?.bankhausAnsprechpartner || ad?.bankhausTelefon || ad?.bankhausEmail || ad?.bankhausAdresse;
  const hasStatik = ad?.statikbueroName || ad?.statikbueroAnsprechpartner || ad?.statikbueroTelefon || ad?.statikbueroEmail || ad?.statikbueroAdresse;
  const hasProjektParams = ad?.vertriebsmodell || ad?.sanierung || ad?.pachtNetto || ad?.jahresertrag || ad?.grundbuchStatus || ad?.belastungEuro || ad?.vollmachtErhaltenAm || ad?.wiedervorlage || ad?.nabDatum;
  const hasSonstiges = ad?.auftragsnummer || ad?.informationen;
  const hasLinks = project.datenraumLink || project.googleMapsLink;

  return (
    <div className="factro-detail-body">
      {/* 1. Kundendaten */}
      <CollapsibleSection title="Kundendaten" icon={<User2 size={15} />} defaultOpen>
        <div className="factro-detail-grid">
          <DetailField label="Kundenname" field="customerName" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Firma" field="firmenname" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Kundentyp" field="customerType" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Ansprechpartner" field="contactName" form={form} setForm={setForm} editing={editing} />
          <DetailField label="E-Mail" field="contactEmail" form={form} setForm={setForm} editing={editing} icon={<Mail size={12} />} />
          <DetailField label="Telefon" field="contactPhone" form={form} setForm={setForm} editing={editing} icon={<Phone size={12} />} />
          <ReadOnlyField label="Eigentümer" value={ad?.eigentuemer} />
          <ReadOnlyField label="Geburtsdatum" value={ad?.geburtsdatum} />
        </div>
      </CollapsibleSection>

      {/* 1b. Anlagenbetreiber */}
      {(() => {
        const td = project.installation?.technicalData;
        const betreiber = td && typeof td === "object" ? (td as any).betreiber : {
          firma: "NIVOMA GmbH",
          vertreter: "Niklas Baumgärtner",
          strasse: "Jahnstraße 31",
          plz: "76689",
          ort: "Karlsdorf-Neuthard",
          telefon: "0721-98618238",
        };
        return (
          <CollapsibleSection title="Anlagenbetreiber" icon={<Briefcase size={15} />} defaultOpen>
            <div className="factro-detail-grid">
              <ReadOnlyField label="Firma" value={betreiber.firma} />
              <ReadOnlyField label="Vertreter" value={betreiber.vertreter} />
              <ReadOnlyField label="Adresse" value={[betreiber.strasse, [betreiber.plz, betreiber.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")} />
              <ReadOnlyField label="Telefon" value={betreiber.telefon} />
              {betreiber.email && <ReadOnlyField label="E-Mail" value={betreiber.email} />}
            </div>
          </CollapsibleSection>
        );
      })()}

      {/* 2. Standort & Flurstück */}
      <CollapsibleSection title="Standort & Flurstück" icon={<MapPin size={15} />} defaultOpen>
        <div className="factro-detail-grid">
          <DetailField label="Straße" field="strasse" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Hausnr." field="hausNr" form={form} setForm={setForm} editing={editing} small />
          <DetailField label="PLZ" field="plz" form={form} setForm={setForm} editing={editing} small />
          <DetailField label="Ort" field="ort" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Bundesland" field="bundesland" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Gemarkung" field="gemarkung" form={form} setForm={setForm} editing={editing} />
          <DetailField label="Flur" field="flur" form={form} setForm={setForm} editing={editing} small />
          <DetailField label="Flurstück" field="flurstueck" form={form} setForm={setForm} editing={editing} small />
          <ReadOnlyField label="Amtsgericht" value={ad?.amtsgericht} />
          <ReadOnlyField label="Grundbuch von" value={ad?.grundbuchVon} />
          <ReadOnlyField label="Blatt" value={ad?.grundbuchBlatt} />
          <ReadOnlyField label="Objektadresse" value={ad?.objektadresse} />
        </div>
        {project.googleMapsLink && (
          <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer" className="factro-detail-link">
            <MapPin size={12} /> Google Maps
          </a>
        )}
      </CollapsibleSection>

      {/* 3. Technische Daten */}
      <CollapsibleSection title="Technische Daten" icon={<Sun size={15} />} defaultOpen>
        <div className="factro-detail-grid">
          <DetailField label="Gesamt kWp" field="totalKwp" form={form} setForm={setForm} editing={editing} small type="number" />
          <DetailField label="Module" field="modulAnzahl" form={form} setForm={setForm} editing={editing} small type="number" />
          <ReadOnlyField label="Dachneigung" value={ad?.dachneigung} />
          <ReadOnlyField label="Kabelweg NVP" value={ad?.kabelwegNvp} />
        </div>
      </CollapsibleSection>

      {/* 3b. Speicher-Vorlagen */}
      <SpeicherTemplateSection />

      {/* 4. Netzbetreiber */}
      <CollapsibleSection title="Netzbetreiber" icon={<Building2 size={15} />} defaultOpen={!!hasNbContact || !!project.netzanfrageGestelltAm}>
        {/* NA-Tracking Info */}
        {project.netzanfrageGestelltAm && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            <span className="factro-badge factro-badge--amber">
              <Send size={10} /> NA gestellt am {new Date(project.netzanfrageGestelltAm).toLocaleDateString("de-DE")}
            </span>
            {project.netzanfrageVnbEmail && (
              <span className="factro-badge factro-badge--blue">
                <Mail size={10} /> {project.netzanfrageVnbEmail}
              </span>
            )}
            {(() => {
              const days = getOverdueDays(project);
              return days > 0 ? (
                <span className={`factro-badge ${days > OVERDUE_THRESHOLD_DAYS ? "factro-badge--red" : "factro-badge--amber"}`}>
                  <Clock size={10} /> {days} Tage
                </span>
              ) : null;
            })()}
          </div>
        )}
        <div className="factro-detail-grid">
          <DetailField label="Netzbetreiber" field="nbName" form={form} setForm={setForm} editing={editing} />
          {editing ? (
            <DetailField label="Vorgangsnummer" field="vorgangsnummer" form={form} setForm={setForm} editing={editing} />
          ) : (
            <InlineVorgangsnummer
              projectId={project.id}
              value={project.vorgangsnummer || ""}
              onSaved={(val, emailsMatched) => {
                setForm((f: Record<string, any>) => ({ ...f, vorgangsnummer: val }));
                // Refresh statt onSave, da InlineVorgangsnummer bereits den PATCH gemacht hat
                onRefresh(project.id);
              }}
            />
          )}
          <ReadOnlyField label="Ansprechpartner" value={ad?.nbAnsprechpartner} />
          <ReadOnlyField label="Telefon" value={ad?.nbTelefon} />
          <ReadOnlyField label="Durchwahl" value={ad?.nbDurchwahl} />
          <ReadOnlyField label="Fax" value={ad?.nbFax} />
          <ReadOnlyField label="E-Mail" value={ad?.nbEmail} />
          <ReadOnlyField label="Adresse" value={ad?.nbAdresse} />
          <ReadOnlyField label="Frist Netzanfrage" value={ad?.fristNetzanfrage} />
          <ReadOnlyField label="Frist Netzzusage" value={ad?.fristNetzzusage} />
        </div>
      </CollapsibleSection>

      {/* 5. Projekt-Parameter */}
      {hasProjektParams && (
        <CollapsibleSection title="Projekt-Parameter" icon={<Zap size={15} />}>
          <div className="factro-detail-grid">
            <ReadOnlyField label="Vertriebsmodell" value={ad?.vertriebsmodell} />
            <ReadOnlyField label="Sanierung" value={ad?.sanierung} />
            <ReadOnlyField label="Pacht netto" value={ad?.pachtNetto} />
            <ReadOnlyField label="Jahresertrag" value={ad?.jahresertrag} />
            <ReadOnlyField label="Grundbuch-Status" value={ad?.grundbuchStatus} />
            <ReadOnlyField label="Belastung" value={ad?.belastungEuro} />
            <ReadOnlyField label="Belastung eingetragen" value={ad?.belastungEingetragenAm} />
            <ReadOnlyField label="Vollmacht erhalten" value={ad?.vollmachtErhaltenAm} />
            <ReadOnlyField label="Wiedervorlage" value={ad?.wiedervorlage} />
            <ReadOnlyField label="NAB-Datum" value={ad?.nabDatum} />
          </div>
        </CollapsibleSection>
      )}

      {/* 6. Bankhaus */}
      {hasBankhaus && (
        <CollapsibleSection title="Bankhaus" icon={<Landmark size={15} />}>
          <div className="factro-detail-grid">
            <ReadOnlyField label="Bankhaus" value={ad?.bankhaus} />
            <ReadOnlyField label="Ansprechpartner" value={ad?.bankhausAnsprechpartner} />
            <ReadOnlyField label="Telefon" value={ad?.bankhausTelefon} />
            <ReadOnlyField label="E-Mail" value={ad?.bankhausEmail} />
            <ReadOnlyField label="Adresse" value={ad?.bankhausAdresse} />
          </div>
        </CollapsibleSection>
      )}

      {/* 7. Statikbüro */}
      {hasStatik && (
        <CollapsibleSection title="Statikbüro" icon={<Building2 size={15} />}>
          <div className="factro-detail-grid">
            <ReadOnlyField label="Name" value={ad?.statikbueroName} />
            <ReadOnlyField label="Ansprechpartner" value={ad?.statikbueroAnsprechpartner} />
            <ReadOnlyField label="Telefon" value={ad?.statikbueroTelefon} />
            <ReadOnlyField label="E-Mail" value={ad?.statikbueroEmail} />
            <ReadOnlyField label="Adresse" value={ad?.statikbueroAdresse} />
          </div>
        </CollapsibleSection>
      )}

      {/* 8. Sonstiges */}
      {hasSonstiges && (
        <CollapsibleSection title="Sonstiges" icon={<FileText size={15} />}>
          <div className="factro-detail-grid">
            <ReadOnlyField label="Auftragsnummer" value={ad?.auftragsnummer} />
          </div>
          {ad?.informationen && (
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary, rgba(255,255,255,0.7))", lineHeight: 1.55, whiteSpace: "pre-wrap", padding: "10px 12px", background: "var(--bg-elevated, #151518)", borderRadius: 8, border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
              {ad.informationen}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* 9. Links */}
      {hasLinks && (
        <CollapsibleSection title="Links" icon={<ExternalLink size={15} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {project.datenraumLink && (
              <a href={project.datenraumLink} target="_blank" rel="noopener noreferrer" className="factro-detail-link">
                <ExternalLink size={13} /> Datenraum
              </a>
            )}
            {project.googleMapsLink && (
              <a href={project.googleMapsLink} target="_blank" rel="noopener noreferrer" className="factro-detail-link">
                <MapPin size={13} /> Google Maps
              </a>
            )}
            {project.installation && (
              <a href={`/installations/${project.installation.id}`} className="factro-detail-link">
                <ArrowRight size={13} /> Netzanmeldung #{project.installation.publicId}
              </a>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* 10. Meta (collapsed per default) */}
      <CollapsibleSection title="Meta-Informationen" icon={<Database size={15} />}>
        <div className="factro-detail-meta" style={{ margin: 0 }}>
          {project.factroNumber && (
            <div className="factro-meta-row">
              <span className="factro-meta-label">Factro Nr.</span>
              <span className="factro-meta-value">#{project.factroNumber}</span>
            </div>
          )}
          {project.factroTaskState && (
            <div className="factro-meta-row">
              <span className="factro-meta-label">Factro Status</span>
              <span className="factro-meta-value">{project.factroTaskState}</span>
            </div>
          )}
          <div className="factro-meta-row">
            <span className="factro-meta-label">Factro Task ID</span>
            <span className="factro-meta-value mono">{project.factroTaskId}</span>
          </div>
          <div className="factro-meta-row">
            <span className="factro-meta-label">Importiert</span>
            <span className="factro-meta-value">{formatDate(project.importedAt)}</span>
          </div>
          {project.factroCreatedAt && (
            <div className="factro-meta-row">
              <span className="factro-meta-label">In Factro erstellt</span>
              <span className="factro-meta-value">{formatDate(project.factroCreatedAt)}</span>
            </div>
          )}
          <div className="factro-meta-row">
            <span className="factro-meta-label">Letzter Sync</span>
            <span className="factro-meta-value">{project.lastSyncAt ? formatDate(project.lastSyncAt) : "–"}</span>
          </div>
          {project.config && (
            <div className="factro-meta-row">
              <span className="factro-meta-label">Config</span>
              <span className="factro-meta-value">{project.config.name}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ─── Speicher-Vorlagen (Großspeicher / Schwarmspeicher) ──────────────────────

const SPEICHER_VORLAGEN = {
  GROSSSPEICHER: {
    label: "Großspeicher",
    color: "#f59e0b",
    wr: {
      Hersteller: "Delta Electronics",
      Modell: "PCS6000 MV Skid (PCSC2782 x2)",
      Leistung: "5.500 kW / 5.564 kVA",
      "ZEREZ-ID": "ZE-7CMF-Z1E8-0001",
    },
    batterie: {
      Hersteller: "AlphaESS",
      Modell: "AlphaCS-H20-DC-LC-EX",
      "Kapazität": "5.015,9 kWh / Einheit",
      Kopplung: "DC-gekoppelt",
      Batterietyp: "LiFePO4 (LFP)",
    },
  },
  SCHWARMSPEICHER: {
    label: "Schwarmspeicher",
    color: "#a855f7",
    wr: {
      Hersteller: "Langfang IN-Power Electric Co., Ltd.",
      Modell: "INPPCS-125/0.4-W-14-A2-OS",
      Leistung: "125 kW / 137,5 kVA",
      "ZEREZ-ID": "ZE-JYGC-BKP6-0001",
    },
    batterie: {
      Hersteller: "AlphaESS",
      Modell: "Storion-LC-TB125",
      "Kapazität": "261,2 kWh / Einheit",
      Kopplung: "AC-gekoppelt",
      Batterietyp: "LiFePO4 (LFP)",
    },
  },
} as const;

function SpeicherTemplateSection() {
  const [active, setActive] = useState<"GROSSSPEICHER" | "SCHWARMSPEICHER" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = (typ: "GROSSSPEICHER" | "SCHWARMSPEICHER") => {
    const v = SPEICHER_VORLAGEN[typ];
    const lines = [
      `── Wechselrichter ──`,
      ...Object.entries(v.wr).map(([k, val]) => `${k}: ${val}`),
      ``,
      `── Batteriespeicher ──`,
      ...Object.entries(v.batterie).map(([k, val]) => `${k}: ${val}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied("all-" + typ);
    setTimeout(() => setCopied(null), 1500);
  };

  const vorlage = active ? SPEICHER_VORLAGEN[active] : null;

  return (
    <CollapsibleSection title="Speicher-Vorlage" icon={<Database size={15} />}>
      <div style={{ display: "flex", gap: 8, marginBottom: active ? 12 : 0 }}>
        <button
          onClick={() => setActive(active === "GROSSSPEICHER" ? null : "GROSSSPEICHER")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: `1px solid ${active === "GROSSSPEICHER" ? "rgba(245,158,11,.4)" : "rgba(255,255,255,.08)"}`,
            borderRadius: 8,
            background: active === "GROSSSPEICHER" ? "rgba(245,158,11,.1)" : "rgba(255,255,255,.03)",
            color: active === "GROSSSPEICHER" ? "#f59e0b" : "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Zap size={14} />
          Großspeicher
        </button>
        <button
          onClick={() => setActive(active === "SCHWARMSPEICHER" ? null : "SCHWARMSPEICHER")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: `1px solid ${active === "SCHWARMSPEICHER" ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.08)"}`,
            borderRadius: 8,
            background: active === "SCHWARMSPEICHER" ? "rgba(168,85,247,.1)" : "rgba(255,255,255,.03)",
            color: active === "SCHWARMSPEICHER" ? "#a855f7" : "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Package size={14} />
          Schwarmspeicher
        </button>
      </div>

      {active && vorlage && (
        <div style={{
          border: `1px solid rgba(255,255,255,.06)`,
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {/* Wechselrichter */}
          <div style={{ padding: "8px 12px", background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
            Wechselrichter
          </div>
          {Object.entries(vorlage.wr).map(([label, value]) => (
            <div
              key={label}
              onClick={() => copyValue(label, value)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 12px",
                borderBottom: "1px solid rgba(255,255,255,.04)",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: "#64748b", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#e2e8f0", display: "flex", alignItems: "center", gap: 4 }}>
                {value}
                {copied === label
                  ? <Check size={12} style={{ color: "#34d399" }} />
                  : <span style={{ color: "#475569", fontSize: 10 }}>📋</span>
                }
              </span>
            </div>
          ))}

          {/* Batteriespeicher */}
          <div style={{ padding: "8px 12px", background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)", borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
            Batteriespeicher
          </div>
          {Object.entries(vorlage.batterie).map(([label, value]) => (
            <div
              key={label}
              onClick={() => copyValue(label, value)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 12px",
                borderBottom: "1px solid rgba(255,255,255,.04)",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: "#64748b", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#e2e8f0", display: "flex", alignItems: "center", gap: 4 }}>
                {value}
                {copied === label
                  ? <Check size={12} style={{ color: "#34d399" }} />
                  : <span style={{ color: "#475569", fontSize: 10 }}>📋</span>
                }
              </span>
            </div>
          ))}

          {/* Alles kopieren Button */}
          <button
            onClick={() => copyAll(active)}
            style={{
              width: "100%",
              padding: "8px",
              border: "none",
              background: "rgba(255,255,255,.03)",
              color: copied === "all-" + active ? "#34d399" : vorlage.color,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {copied === "all-" + active ? (
              <><Check size={14} /> Kopiert!</>
            ) : (
              <>Alle Daten kopieren</>
            )}
          </button>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ─── CollapsibleSection Component ────────────────────────────────────────────

function CollapsibleSection({
  title, icon, children, defaultOpen = false, count,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`factro-collapsible ${open ? "factro-collapsible--open" : ""}`}>
      <button className="factro-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="factro-collapsible-icon"><ChevronRight size={14} /></span>
        {icon && <span className="factro-collapsible-title-icon">{icon}</span>}
        <span style={{ flex: 1 }}>{title}</span>
        {count != null && count > 0 && <span className="factro-collapsible-count">{count}</span>}
      </button>
      <div className="factro-collapsible-body">{children}</div>
    </div>
  );
}

// ─── Comments Tab: Timeline/Chat ─────────────────────────────────────────────

function CommentsTab({
  comments, loading, syncing, onSync,
}: {
  comments: FactroCommentItem[];
  loading: boolean;
  syncing: boolean;
  onSync: () => void;
}) {
  // Separate top-level and replies
  const topLevel = useMemo(() => comments.filter((c) => !c.parentCommentId), [comments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, FactroCommentItem[]>();
    for (const c of comments) {
      if (c.parentCommentId) {
        const arr = map.get(c.parentCommentId) || [];
        arr.push(c);
        map.set(c.parentCommentId, arr);
      }
    }
    return map;
  }, [comments]);

  return (
    <>
      <div className="factro-comment-sync-bar">
        <span className="factro-comment-count">
          {comments.length} Kommentar{comments.length !== 1 ? "e" : ""}
        </span>
        <button
          className="factro-btn factro-btn-sm"
          onClick={onSync}
          disabled={syncing}
        >
          {syncing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          {syncing ? "Synce..." : "Kommentare syncen"}
        </button>
      </div>

      {loading ? (
        <div className="factro-detail-loading">
          <Loader2 size={20} className="spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="factro-comment-empty">
          <div className="empty-icon-bg"><MessageSquare size={24} style={{ opacity: 0.4 }} /></div>
          <p style={{ fontSize: 13, fontWeight: 500 }}>Keine Kommentare vorhanden</p>
          <p style={{ fontSize: 12 }}>Klicke "Kommentare syncen" zum Importieren</p>
        </div>
      ) : (
        <div className="factro-comment-timeline">
          {topLevel.map((c) => (
            <CommentItem key={c.id} comment={c} replies={repliesByParent.get(c.factroCommentId)} />
          ))}
        </div>
      )}
    </>
  );
}

function CommentItem({ comment, replies }: { comment: FactroCommentItem; replies?: FactroCommentItem[] }) {
  const [showReplies, setShowReplies] = useState(false);
  const initials = getInitials(comment.creatorName);
  const isReply = !!comment.parentCommentId;

  // Render HTML with @mentions highlighted
  const renderText = (text: string | null) => {
    if (!text) return null;
    // Replace @mentions with highlighted spans
    const parts = text.split(/(@\S+(?:\s\S+)?)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="mention-highlight">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <>
      <div className="factro-comment-item">
        <div className={`factro-comment-avatar ${isReply ? "factro-comment-avatar--reply" : ""}`}>
          {initials}
        </div>
        <div className="factro-comment-bubble">
          <div className="factro-comment-header">
            <span className="factro-comment-author">
              {comment.creatorName || "Unbekannt"}
            </span>
            <span className="factro-comment-time">{timeAgo(comment.factroCreatedAt)}</span>
          </div>
          <div className="factro-comment-text">
            {renderText(comment.textPlain)}
          </div>
          {replies && replies.length > 0 && !showReplies && (
            <button className="factro-comment-replies-toggle" onClick={() => setShowReplies(true)}>
              <MessageSquare size={12} /> {replies.length} Antwort{replies.length !== 1 ? "en" : ""} anzeigen
            </button>
          )}
          {replies && replies.length > 0 && showReplies && (
            <>
              <button className="factro-comment-replies-toggle" onClick={() => setShowReplies(false)}>
                Antworten ausblenden
              </button>
              <div className="factro-comment-replies">
                {replies.map((r) => (
                  <CommentItem key={r.id} comment={r} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({
  documents, loading, importing, onImport,
}: {
  documents: FactroDocumentItem[];
  loading: boolean;
  importing: boolean;
  onImport: () => void;
}) {
  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, FactroDocumentItem[]>();
    for (const doc of documents) {
      const cat = doc.kategorie || "SONSTIGE";
      const arr = map.get(cat) || [];
      arr.push(doc);
      map.set(cat, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [documents]);

  return (
    <div style={{ padding: "16px 20px", animation: "slideUp 0.2s ease" }}>
      <div className="factro-comment-sync-bar" style={{ margin: "0 0 16px", padding: "12px 16px" }}>
        <span className="factro-comment-count">
          {documents.length} Dokument{documents.length !== 1 ? "e" : ""}
        </span>
        <button
          className="factro-btn factro-btn-sm"
          onClick={onImport}
          disabled={importing}
          title="Dokumente aus Factro importieren"
        >
          {importing ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
          {importing ? "Importiere..." : "Importieren"}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "#94a3b8" }}>
          <Loader2 size={20} className="spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="factro-comment-empty">
          <div className="empty-icon-bg"><FileText size={24} style={{ opacity: 0.4 }} /></div>
          <p style={{ fontSize: 13, fontWeight: 500 }}>Keine Dokumente vorhanden</p>
        </div>
      ) : (
        grouped.map(([cat, docs]) => (
          <div key={cat} className="factro-docs-group">
            <div className="factro-docs-group-title">{cat} ({docs.length})</div>
            <div className="factro-docs-list">
              {docs.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/documents/${doc.id}/download?view=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="factro-doc-item"
                >
                  <span className="factro-doc-icon">
                    {doc.dateityp?.startsWith("image/") ? <Image size={16} /> : <File size={16} />}
                  </span>
                  <div className="factro-doc-info">
                    <span className="factro-doc-name">{doc.originalName}</span>
                    <span className="factro-doc-meta">
                      {doc.dateigroesse ? `${(doc.dateigroesse / 1024).toFixed(0)} KB` : "–"}
                    </span>
                  </div>
                  <ExternalLink size={12} style={{ color: "#64748b", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ syncLogs }: { syncLogs: SyncLog[] }) {
  if (syncLogs.length === 0) {
    return (
      <div className="factro-comment-empty">
        <div className="empty-icon-bg"><Activity size={24} style={{ opacity: 0.4 }} /></div>
        <p style={{ fontSize: 13, fontWeight: 500 }}>Kein Sync-Verlauf vorhanden</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 20px", animation: "slideUp 0.2s ease" }}>
      <div className="factro-detail-logs">
        {syncLogs.map((log) => (
          <div key={log.id} className={`factro-detail-log ${!log.success ? "factro-detail-log--error" : ""}`}>
            <span style={{ display: "flex", alignItems: "center" }} className={log.success ? "log-status--ok" : "log-status--error"}>
              {log.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            </span>
            <span className="factro-detail-log-action">{log.action}</span>
            <span className="factro-detail-log-time">{timeAgo(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Emails Tab ─────────────────────────────────────────────────────────────

interface EmailOutgoing {
  id: number;
  recipientEmail: string;
  subject: string;
  status: string;
  fromEmail: string | null;
  fromName: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  sentAt: string;
}

interface EmailIncoming {
  id: number;
  subject: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string;
  bodyHtml: string | null;
  bodyText: string | null;
  receivedAt: string;
  aiType: string | null;
  aiSummary: string | null;
}

function EmailsTab({ projectId }: { projectId: number }) {
  const [outgoing, setOutgoing] = useState<EmailOutgoing[]>([]);
  const [incoming, setIncoming] = useState<EmailIncoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet(`/factro/projects/${projectId}/emails`)
      .then((data: any) => {
        if (!cancelled) {
          setOutgoing(data.outgoing || []);
          setIncoming(data.incoming || []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="factro-comment-empty">
        <Loader2 size={20} className="animate-spin" style={{ opacity: 0.5 }} />
      </div>
    );
  }

  if (outgoing.length === 0 && incoming.length === 0) {
    return (
      <div className="factro-comment-empty">
        <div className="empty-icon-bg"><Mail size={24} style={{ opacity: 0.4 }} /></div>
        <p style={{ fontSize: 13, fontWeight: 500 }}>Keine Emails vorhanden</p>
      </div>
    );
  }

  // Alle Emails in eine einheitliche Liste (sortiert nach Datum desc)
  const combined: { key: string; dir: "out" | "in"; date: string; subject: string | null; party: string; bodyHtml: string | null; bodyText: string | null; aiType?: string | null; aiSummary?: string | null }[] = [];

  for (const e of outgoing) {
    combined.push({ key: `out-${e.id}`, dir: "out", date: e.sentAt, subject: e.subject, party: e.recipientEmail, bodyHtml: e.bodyHtml, bodyText: e.bodyText });
  }
  for (const e of incoming) {
    combined.push({ key: `in-${e.id}`, dir: "in", date: e.receivedAt, subject: e.subject, party: e.fromAddress, bodyHtml: e.bodyHtml, bodyText: e.bodyText, aiType: e.aiType, aiSummary: e.aiSummary });
  }

  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ padding: "16px 20px", animation: "slideUp 0.2s ease" }}>
      <div className="factro-emails-list">
        {combined.map((em) => {
          const isExpanded = expandedId === em.key;
          return (
            <div key={em.key} className={`factro-email-item factro-email-item--${em.dir}`}>
              <div className="factro-email-header" onClick={() => setExpandedId(isExpanded ? null : em.key)} style={{ cursor: "pointer" }}>
                <span className={`factro-email-dir factro-email-dir--${em.dir}`}>
                  {em.dir === "out" ? "↑" : "↓"}
                </span>
                <span className="factro-email-date">
                  {new Date(em.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {" "}
                  {new Date(em.date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="factro-email-subject">{em.subject || "(kein Betreff)"}</span>
                <span className="factro-email-party">{em.party}</span>
                {em.aiType && <span className="factro-badge factro-badge--blue" style={{ fontSize: 10, padding: "1px 5px" }}>{em.aiType}</span>}
                <ChevronRight size={14} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", opacity: 0.5, flexShrink: 0 }} />
              </div>
              {isExpanded && (
                <div className="factro-email-body">
                  {em.aiSummary && <div className="factro-email-summary"><strong>KI-Zusammenfassung:</strong> {em.aiSummary}</div>}
                  {em.bodyHtml ? (
                    <div className="factro-email-html" dangerouslySetInnerHTML={{ __html: em.bodyHtml }} />
                  ) : em.bodyText ? (
                    <pre className="factro-email-text">{em.bodyText}</pre>
                  ) : (
                    <p style={{ opacity: 0.5, fontSize: 12 }}>Kein Inhalt verfügbar</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inline Vorgangsnummer (ohne Edit-Modus) ────────────────────────────────

function InlineVorgangsnummer({
  projectId,
  value,
  onSaved,
}: {
  projectId: number;
  value: string;
  onSaved: (val: string, emailsMatched?: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await apiPatch(`/factro/projects/${projectId}`, { vorgangsnummer: trimmed || null });
      onSaved(trimmed, result?.emailsMatched);
      setIsEditing(false);
    } catch {
      alert("Vorgangsnummer speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setDraft(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="factro-field factro-field--editing">
        <label>Vorgangsnummer</label>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            placeholder="z.B. UEWM-33891"
            autoFocus
            disabled={saving}
            style={{ flex: 1 }}
          />
          {saving && <Loader2 size={14} className="spin" />}
        </div>
      </div>
    );
  }

  return (
    <div className="factro-field" onClick={() => setIsEditing(true)} style={{ cursor: "pointer" }}>
      <label>Vorgangsnummer</label>
      {value ? (
        <span className="factro-field-value">
          <Hash size={12} style={{ opacity: 0.5 }} /> {value}
        </span>
      ) : (
        <span
          className="factro-field-value text-muted"
          style={{
            border: "1px dashed var(--border-color, #d0d5dd)",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "12px",
          }}
        >
          Vorgangsnummer eingeben...
        </span>
      )}
    </div>
  );
}

// ─── Detail Field Component ─────────────────────────────────────────────────

function DetailField({
  label, field, form, setForm, editing, icon, small, type = "text",
}: {
  label: string;
  field: string;
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  editing: boolean;
  icon?: React.ReactNode;
  small?: boolean;
  type?: string;
}) {
  const value = form[field] ?? "";

  if (editing) {
    return (
      <div className="factro-field factro-field--editing">
        <label>{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={label}
        />
      </div>
    );
  }

  return (
    <div className="factro-field">
      <label>{label}</label>
      <span className="factro-field-value">
        {icon} {value || <span className="text-muted">–</span>}
      </span>
    </div>
  );
}

// ─── ReadOnly Field (for additionalData) ────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="factro-field">
      <label>{label}</label>
      <span className="factro-field-value">{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Configs Tab (Admin only)
// ═════════════════════════════════════════════════════════════════════════════

function ConfigsTab({ configs, onRefresh }: { configs: FactroConfig[]; onRefresh: () => void }) {
  const [testingConfig, setTestingConfig] = useState<number | null>(null);

  const handleTest = async (configId: number) => {
    setTestingConfig(configId);
    try {
      const result = await apiPost(`/factro/configs/${configId}/test`, {});
      alert(result.success ? "Verbindung erfolgreich!" : `Fehler: ${result.error}`);
    } catch {
      alert("Verbindungstest fehlgeschlagen");
    } finally {
      setTestingConfig(null);
    }
  };

  const handleDelete = async (configId: number) => {
    if (!confirm("Konfiguration wirklich löschen?")) return;
    try {
      await apiDelete(`/factro/configs/${configId}`);
      onRefresh();
    } catch {
      alert("Löschen fehlgeschlagen");
    }
  };

  return (
    <div className="factro-content">
      <div className="factro-section">
        <h3>Factro-Konfigurationen</h3>
        {configs.length === 0 ? (
          <div className="factro-empty">
            <Settings2 size={48} className="empty-icon" />
            <p>Keine Konfigurationen vorhanden</p>
          </div>
        ) : (
          <div className="factro-configs-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kunde</th>
                  <th>Status</th>
                  <th>Projekte</th>
                  <th>Letztes Polling</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr key={config.id}>
                    <td className="config-cell-name">{config.name}</td>
                    <td>{config.kunde?.name ?? <span className="text-muted">–</span>}</td>
                    <td>
                      <span className={`config-toggle ${config.isActive ? "config-toggle--active" : "config-toggle--inactive"}`}>
                        {config.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td>{config._count?.factroProjects ?? 0}</td>
                    <td>{timeAgo(config.lastPollAt)}</td>
                    <td className="config-actions">
                      <button
                        className="factro-btn factro-btn-sm factro-btn-ghost"
                        onClick={() => handleTest(config.id)}
                        disabled={testingConfig === config.id}
                        title="Verbindung testen"
                      >
                        {testingConfig === config.id ? <Loader2 size={14} className="spin" /> : <TestTube size={14} />}
                      </button>
                      <button
                        className="factro-btn factro-btn-sm factro-btn-danger"
                        onClick={() => handleDelete(config.id)}
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Logs Tab
// ═════════════════════════════════════════════════════════════════════════════

function LogsTab({
  logs, total, page, filter, onFilterChange, onPageChange,
}: {
  logs: SyncLog[];
  total: number;
  page: number;
  filter: string;
  onFilterChange: (f: string) => void;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="factro-content">
      <div className="factro-section">
        <div className="section-header">
          <h3>Synchronisations-Protokoll</h3>
          <div className="log-filters">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="factro-select"
            >
              <option value="">Alle Aktionen</option>
              <option value="IMPORT">Import</option>
              <option value="SOLD_DETECTED">Verkauft erkannt</option>
              <option value="STATUS_SYNC">Status-Sync</option>
              <option value="MANUAL_SOLD">Manuell verkauft</option>
              <option value="INSTALLATION_CREATED">Installation erstellt</option>
            </select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="factro-empty">
            <FileText size={48} className="empty-icon" />
            <p>Keine Log-Einträge gefunden</p>
          </div>
        ) : (
          <>
            <div className="factro-log-list">
              {logs.map((log) => (
                <div key={log.id} className={`factro-log-item factro-log-item--detailed ${!log.success ? "factro-log-item--error" : ""}`}>
                  <div className="log-row-main">
                    <span className={`log-status ${log.success ? "log-status--ok" : "log-status--error"}`}>
                      {log.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    </span>
                    <span className="log-action-badge">{log.action}</span>
                    {log.config && <span className="log-config-name">{log.config.name}</span>}
                    {log.factroTaskId && (
                      <span className="log-task-id" title={log.factroTaskId}>
                        Task: {log.factroTaskId.slice(0, 8)}...
                      </span>
                    )}
                    {log.factroProjectId && (
                      <span className="log-install-id">Projekt #{log.factroProjectId}</span>
                    )}
                    {log.installationId && (
                      <span className="log-install-id">Installation #{log.installationId}</span>
                    )}
                    <span className="log-time">{formatDate(log.createdAt)}</span>
                  </div>
                  {log.errorMessage && (
                    <div className="log-error">{log.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="factro-pagination">
                <button
                  className="factro-btn factro-btn-sm factro-btn-ghost"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Zurück
                </button>
                <span className="pagination-info">Seite {page} von {totalPages} ({total} Einträge)</span>
                <button
                  className="factro-btn factro-btn-sm factro-btn-ghost"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Poll Tab
// ═════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// Actions Tab (Haupt-Tab) — Globale Übersicht aller Comment Actions
// ═══════════════════════════════════════════════════════════════════════════════

function ActionCard({
  action,
  onExecute,
  onDismiss,
  onProjectClick,
  showProject = true,
}: {
  action: FactroCommentActionItem;
  onExecute: (id: number) => void;
  onDismiss: (id: number) => void;
  onProjectClick?: (projectId: number) => void;
  showProject?: boolean;
}) {
  const typeInfo = ACTION_TYPE_LABELS[action.actionType] || { label: action.actionType, color: "#6b7280", bg: "rgba(107,114,128,.12)", icon: "?" };
  const prioInfo = PRIORITY_COLORS[action.priority] || PRIORITY_COLORS.NORMAL;
  const isPending = action.status === "PENDING";

  return (
    <div
      className="factro-action-card"
      style={{
        borderLeft: `3px solid ${typeInfo.color}`,
        opacity: isPending ? 1 : 0.6,
      }}
    >
      <div className="factro-action-card-header">
        <span className="factro-action-type-badge" style={{ color: typeInfo.color, background: typeInfo.bg }}>
          {typeInfo.icon} {typeInfo.label}
        </span>
        <span className="factro-action-prio-badge" style={{ color: prioInfo.color, background: prioInfo.bg }}>
          {action.priority}
        </span>
        <span className="factro-action-status-badge" style={{
          color: isPending ? "#f59e0b" : action.status === "EXECUTED" ? "#22c55e" : action.status === "DISMISSED" ? "#6b7280" : "#ef4444",
          background: isPending ? "rgba(245,158,11,.12)" : action.status === "EXECUTED" ? "rgba(34,197,94,.12)" : "rgba(107,114,128,.12)",
        }}>
          {action.status === "PENDING" ? "Offen" : action.status === "EXECUTED" ? "Erledigt" : action.status === "DISMISSED" ? "Verworfen" : action.status}
        </span>
      </div>

      <div className="factro-action-card-title">{action.title}</div>

      {action.description && (
        <div className="factro-action-card-desc">{action.description.slice(0, 200)}</div>
      )}

      <div className="factro-action-card-meta">
        {action.factroComment?.creatorName && (
          <span><User2 size={11} /> {action.factroComment.creatorName}</span>
        )}
        {action.factroComment?.factroCreatedAt && (
          <span><Calendar size={11} /> {formatDate(action.factroComment.factroCreatedAt)}</span>
        )}
        {showProject && action.factroProject && (
          <span
            className="factro-action-project-link"
            onClick={(e) => { e.stopPropagation(); onProjectClick?.(action.factroProject!.id); }}
          >
            {action.factroProject.factroNumber && `#${action.factroProject.factroNumber} `}
            {action.factroProject.customerName || action.factroProject.title}
          </span>
        )}
      </div>

      {action.factroComment?.textPlain && (
        <div className="factro-action-card-comment">
          <MessageSquare size={11} /> {action.factroComment.textPlain.slice(0, 150)}{action.factroComment.textPlain.length > 150 ? "..." : ""}
        </div>
      )}

      {isPending && (
        <div className="factro-action-card-buttons">
          <button className="factro-btn factro-btn-sm factro-btn-primary" onClick={() => onExecute(action.id)}>
            <Check size={13} /> Erledigt
          </button>
          <button className="factro-btn factro-btn-sm factro-btn-ghost" onClick={() => onDismiss(action.id)}>
            <X size={13} /> Verwerfen
          </button>
        </div>
      )}
    </div>
  );
}

function ActionsTab({
  actions, stats, loading, total, page, filter, onFilterChange, onPageChange, onExecute, onDismiss, onCardClick,
}: {
  actions: FactroCommentActionItem[];
  stats: CommentActionStats | null;
  loading: boolean;
  total: number;
  page: number;
  filter: { status: string; actionType: string };
  onFilterChange: (f: { status: string; actionType: string }) => void;
  onPageChange: (p: number) => void;
  onExecute: (id: number) => void;
  onDismiss: (id: number) => void;
  onCardClick: (projectId: number) => void;
}) {
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="factro-content" style={{ padding: "16px 20px" }}>
      {/* Stats */}
      {stats && (
        <div className="factro-action-stats">
          <div className="factro-action-stat" style={{ borderColor: "#f59e0b" }}>
            <div className="factro-action-stat-value" style={{ color: "#f59e0b" }}>{stats.pending}</div>
            <div className="factro-action-stat-label">Offen</div>
          </div>
          <div className="factro-action-stat" style={{ borderColor: "#22c55e" }}>
            <div className="factro-action-stat-value" style={{ color: "#22c55e" }}>{stats.executed}</div>
            <div className="factro-action-stat-label">Erledigt</div>
          </div>
          <div className="factro-action-stat" style={{ borderColor: "#6b7280" }}>
            <div className="factro-action-stat-value" style={{ color: "#6b7280" }}>{stats.dismissed}</div>
            <div className="factro-action-stat-label">Verworfen</div>
          </div>
          {stats.byType && Object.keys(stats.byType).length > 0 && (
            <div className="factro-action-stat-types">
              {Object.entries(stats.byType).map(([type, count]) => {
                const info = ACTION_TYPE_LABELS[type];
                return info ? (
                  <span key={type} className="factro-action-type-mini" style={{ color: info.color, background: info.bg }}>
                    {info.icon} {info.label}: {count}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="factro-action-filters">
        <select
          value={filter.status}
          onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
          className="factro-action-filter-select"
        >
          <option value="">Alle Status</option>
          <option value="PENDING">Offen</option>
          <option value="EXECUTED">Erledigt</option>
          <option value="DISMISSED">Verworfen</option>
        </select>
        <select
          value={filter.actionType}
          onChange={(e) => onFilterChange({ ...filter, actionType: e.target.value })}
          className="factro-action-filter-select"
        >
          <option value="">Alle Typen</option>
          {Object.entries(ACTION_TYPE_LABELS).map(([key, info]) => (
            <option key={key} value={key}>{info.icon} {info.label}</option>
          ))}
        </select>
        <span className="factro-action-filter-count">{total} Ergebnis{total !== 1 ? "se" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 32, textAlign: "center" }}><Loader2 size={24} className="spin" /></div>
      ) : actions.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,.4)" }}>
          <Zap size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
          <div>Keine Aktionen gefunden</div>
        </div>
      ) : (
        <div className="factro-action-list">
          {actions.map((a) => (
            <ActionCard key={a.id} action={a} onExecute={onExecute} onDismiss={onDismiss} onProjectClick={onCardClick} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="factro-pagination" style={{ marginTop: 12 }}>
          <button className="factro-btn factro-btn-sm factro-btn-ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Zurück
          </button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Seite {page} / {totalPages}</span>
          <button className="factro-btn factro-btn-sm factro-btn-ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Project Actions Tab (Detail-Panel) — Actions pro Projekt
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectActionsTab({
  actions,
  loading,
  onExecute,
  onDismiss,
}: {
  actions: FactroCommentActionItem[];
  loading: boolean;
  onExecute: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const pending = actions.filter(a => a.status === "PENDING");
  const done = actions.filter(a => a.status !== "PENDING");

  return (
    <div style={{ padding: "12px 0" }}>
      {loading ? (
        <div style={{ padding: 32, textAlign: "center" }}><Loader2 size={20} className="spin" /></div>
      ) : actions.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: 13 }}>
          <Zap size={24} style={{ marginBottom: 6, opacity: 0.3 }} />
          <div>Keine Aktionen für dieses Projekt</div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8, padding: "0 4px" }}>
                Offene Aktionen ({pending.length})
              </div>
              <div className="factro-action-list">
                {pending.map(a => (
                  <ActionCard key={a.id} action={a} onExecute={onExecute} onDismiss={onDismiss} showProject={false} />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.3)", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8, padding: "0 4px" }}>
                Erledigte Aktionen ({done.length})
              </div>
              <div className="factro-action-list">
                {done.map(a => (
                  <ActionCard key={a.id} action={a} onExecute={onExecute} onDismiss={onDismiss} showProject={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PollTab({ polling, onPoll }: { polling: boolean; onPoll: () => void }) {
  return (
    <div className="factro-content">
      <div className="factro-section">
        <h3>Manuelles Polling</h3>
        <p className="section-description">
          Synchronisiert neue Tasks aus Factro und prüft den "Verkauft"-Status.
          Automatisches Polling läuft alle 15 Minuten.
        </p>
        <div className="poll-action">
          <button
            className="factro-btn factro-btn-primary factro-btn-lg"
            onClick={onPoll}
            disabled={polling}
          >
            {polling ? (
              <>
                <Loader2 size={20} className="spin" />
                Synchronisierung läuft...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Jetzt synchronisieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
