/**
 * EMAIL COMMAND CENTER - INTELLIGENT HUB v2
 * 3-Spalten Layout: Smart Filter | Email-Liste | Detail/KI-Analyse
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail, Send, Zap, FileText, Settings, BarChart3, Clock, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Search, Plus, Edit3,
  Play, Pause, Eye, ChevronRight, Calendar, Users,
  Palette, Code, Sparkles, Activity,
  ToggleLeft, ToggleRight,
  Inbox, AlertCircle, Rocket, Target, Loader2,
  Archive, MailOpen, Paperclip, Link2,
  Building2, Bot, Shield, SkipForward, ExternalLink,
  Star, ArrowLeft, MessageSquare, Copy, X, Filter,
  FileQuestion, UserCircle, SendHorizonal,
} from "lucide-react";
import { apiGet, apiPost, apiPatch } from "../modules/api/client";
import "./EmailCommandCenter.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type TabKey = "inbox" | "dashboard" | "escalations" | "templates" | "triggers" | "queue" | "logs" | "settings";

interface Stats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  activeTemplates: number;
  activeTriggers: number;
  recentLogs: any[];
  pendingQueue: any[];
}

interface Template {
  id: number;
  slug: string;
  name: string;
  description?: string;
  category: string;
  subject: string;
  bodyHtml: string;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  triggerCount: number;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Trigger {
  id: number;
  name: string;
  description?: string;
  eventType: string;
  conditions?: string;
  templateId: number;
  template?: { id: number; slug: string; name: string };
  delayMinutes: number;
  recipientType: string;
  recipientEmail?: string;
  isActive: boolean;
  totalSent: number;
  lastTriggeredAt?: string;
}

interface QueueItem {
  id: number;
  recipientEmail: string;
  subject: string;
  status: string;
  scheduledFor: string;
  attempts: number;
  templateName?: string;
  createdAt: string;
}

interface LogEntry {
  id: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: string;
  templateSlug?: string;
  templateName?: string;
  sentAt: string;
  errorMessage?: string;
}

interface InboxEmail {
  id: string;
  externalId?: string;
  subject: string;
  from: string;
  fromName?: string;
  fromAddress?: string;
  to: string[];
  cc?: string[];
  date: string;
  receivedAt?: string;
  direction: string;
  assigned: boolean;
  installationId?: number;
  installationPublicId?: string;
  factroProjectId?: number;
  factroProjectTitle?: string;
  netzbetreiberId?: number;
  netzbetreiberName?: string;
  matchMethod?: string;
  matchScore?: number;
  aiType?: string;
  aiConfidence?: number;
  aiSummary?: string;
  isRead: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  preview?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: any[];
  folder?: string;
}

interface VnbSummary {
  id: number;
  name: string;
  emailCount: number;
  unreadCount: number;
}

interface EscalationItem {
  id: number;
  type: string;
  reason: string;
  status: string;
  scheduledFor: string;
  executedAt?: string;
  actionTaken?: string;
  installation?: { id: number; publicId: string; customerName?: string };
  factroProject?: { id: number; title: string };
}

interface DashboardStats {
  topVnb: { id: number; name: string; count: number }[];
  aiTypes: Record<string, number>;
  pendingEscalations: number;
  escalationsByType: Record<string, { pending: number; executed: number }>;
  matchRate: number;
  totalEmails: number;
  matchedEmails: number;
  unmatchedEmails: number;
  unreadCount: number;
}

interface Mailbox {
  address: string;
  count: number;
}

type SmartFilterKey = "all" | "unread" | "action" | "vnb" | "confirmation" | "customer" | "sent";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const TABS: { key: TabKey; label: string; icon: typeof Mail; color: string }[] = [
  { key: "inbox", label: "Posteingang", icon: Inbox, color: "#3b82f6" },
  { key: "dashboard", label: "Dashboard", icon: BarChart3, color: "#EAD068" },
  { key: "escalations", label: "Eskalationen", icon: AlertTriangle, color: "#ef4444" },
  { key: "templates", label: "Templates", icon: FileText, color: "#22c55e" },
  { key: "triggers", label: "Trigger", icon: Zap, color: "#f59e0b" },
  { key: "queue", label: "Queue", icon: Clock, color: "#06b6d4" },
  { key: "logs", label: "Historie", icon: Activity, color: "#ec4899" },
  { key: "settings", label: "Einstellungen", icon: Settings, color: "#64748b" },
];

const AI_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; statusLabel?: string; statusIcon?: string }> = {
  GENEHMIGUNG:          { label: "Genehmigung",          bg: "rgba(34,197,94,.2)",    text: "#22c55e",  statusLabel: "Genehmigt",     statusIcon: "check" },
  ABLEHNUNG:            { label: "Ablehnung",            bg: "rgba(239,68,68,.2)",    text: "#ef4444",  statusLabel: "Abgelehnt",     statusIcon: "x" },
  RUECKFRAGE:           { label: "Rückfrage",            bg: "rgba(251,191,36,.2)",   text: "#fbbf24",  statusLabel: "Aktion nötig",  statusIcon: "zap" },
  EINGANGSBESTAETIGUNG: { label: "Eingangsbestätigung",  bg: "rgba(59,130,246,.2)",   text: "#3b82f6",  statusLabel: "Bestätigt",     statusIcon: "check" },
  INBETRIEBSETZUNG:     { label: "IBN",                  bg: "rgba(139,92,246,.2)",   text: "#EAD068",  statusLabel: "IBN",           statusIcon: "zap" },
  STATUS_UPDATE:        { label: "Status-Update",        bg: "rgba(100,116,139,.2)",  text: "#94a3b8" },
  PORTAL_NOTIFICATION:  { label: "Portal",               bg: "rgba(100,116,139,.15)", text: "#64748b" },
  AUTO_REPLY:           { label: "Auto-Reply",           bg: "rgba(100,116,139,.15)", text: "#64748b" },
  NEWSLETTER:           { label: "Newsletter",           bg: "rgba(100,116,139,.15)", text: "#64748b" },
  ZAEHLERANTRAG:        { label: "Zählerantrag",         bg: "rgba(6,182,212,.2)",    text: "#06b6d4",  statusLabel: "Zählerantrag",  statusIcon: "file" },
  FRISTABLAUF:          { label: "Fristablauf",          bg: "rgba(239,68,68,.3)",    text: "#f87171",  statusLabel: "Dringend",      statusIcon: "alert" },
  FEHLENDE_DATEN:       { label: "Fehlende Daten",       bg: "rgba(251,191,36,.2)",   text: "#fbbf24",  statusLabel: "Aktion nötig",  statusIcon: "zap" },
  SONSTIGE:             { label: "Sonstige",             bg: "rgba(100,116,139,.15)", text: "#64748b" },
};

const SMART_FILTERS: { key: SmartFilterKey; label: string; icon: typeof Mail; aiTypes?: string[] }[] = [
  { key: "all",          label: "Alle Emails",    icon: Mail },
  { key: "unread",       label: "Ungelesen",      icon: MailOpen },
  { key: "action",       label: "Aktion nötig",   icon: Zap,           aiTypes: ["RUECKFRAGE", "FEHLENDE_DATEN", "FRISTABLAUF"] },
  { key: "vnb",          label: "VNB Antworten",  icon: Building2,     aiTypes: ["GENEHMIGUNG", "ABLEHNUNG", "EINGANGSBESTAETIGUNG"] },
  { key: "confirmation", label: "Bestätigungen",  icon: CheckCircle2,  aiTypes: ["EINGANGSBESTAETIGUNG", "STATUS_UPDATE"] },
  { key: "customer",     label: "Kunden",         icon: UserCircle,    aiTypes: ["SONSTIGE"] },
  { key: "sent",         label: "Gesendet",       icon: Send },
];

const EVENT_LABELS: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  INSTALLATION_CREATED: { label: "Neue Anlage", color: "#22c55e", icon: Plus },
  INSTALLATION_SUBMITTED: { label: "Eingereicht", color: "#3b82f6", icon: Send },
  INSTALLATION_STATUS_CHANGED: { label: "Status geändert", color: "#EAD068", icon: RefreshCw },
  INSTALLATION_APPROVED: { label: "Genehmigt", color: "#22c55e", icon: CheckCircle2 },
  INSTALLATION_REJECTED: { label: "Abgelehnt", color: "#ef4444", icon: XCircle },
  INSTALLATION_COMPLETED: { label: "Abgeschlossen", color: "#06b6d4", icon: CheckCircle2 },
  DOCUMENT_UPLOADED: { label: "Dokument hochgeladen", color: "#f59e0b", icon: FileText },
  DOCUMENT_MISSING: { label: "Dokument fehlt", color: "#f97316", icon: AlertTriangle },
  INVOICE_CREATED: { label: "Rechnung erstellt", color: "#10b981", icon: FileText },
  INVOICE_SENT: { label: "Rechnung versendet", color: "#14b8a6", icon: Send },
  INVOICE_OVERDUE: { label: "Rechnung überfällig", color: "#ef4444", icon: AlertCircle },
  NB_SUBMITTED: { label: "Beim Netzbetreiber", color: "#D4A843", icon: Rocket },
  NB_RESPONSE_RECEIVED: { label: "NB-Antwort", color: "#EAD068", icon: Inbox },
  MANUAL_TRIGGER: { label: "Manuell", color: "#64748b", icon: Target },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "rgba(251, 191, 36, 0.2)", text: "#fbbf24", label: "Wartend" },
  SCHEDULED: { bg: "rgba(59, 130, 246, 0.2)", text: "#3b82f6", label: "Geplant" },
  PROCESSING: { bg: "rgba(139, 92, 246, 0.2)", text: "#EAD068", label: "Wird gesendet" },
  SENT: { bg: "rgba(34, 197, 94, 0.2)", text: "#22c55e", label: "Gesendet" },
  FAILED: { bg: "rgba(239, 68, 68, 0.2)", text: "#ef4444", label: "Fehlgeschlagen" },
  CANCELLED: { bg: "rgba(100, 116, 139, 0.2)", text: "#64748b", label: "Abgebrochen" },
};

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM: "System",
  STATUS_UPDATE: "Status-Updates",
  DOCUMENT: "Dokumente",
  INVOICE: "Rechnungen",
  REMINDER: "Erinnerungen",
  NOTIFICATION: "Benachrichtigungen",
  WELCOME: "Willkommen",
  CUSTOM: "Benutzerdefiniert",
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  if (hours < 24) return `vor ${hours} Std`;
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return formatDate(iso);
}

function formatTimeOnly(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Gestern";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function getStatusBadge(aiType?: string): { label: string; className: string } | null {
  if (!aiType) return null;
  switch (aiType) {
    case "RUECKFRAGE":
    case "FEHLENDE_DATEN":
      return { label: "Aktion nötig", className: "ecc-status-badge--action" };
    case "FRISTABLAUF":
      return { label: "Dringend", className: "ecc-status-badge--urgent" };
    case "GENEHMIGUNG":
      return { label: "Genehmigt", className: "ecc-status-badge--approved" };
    case "ABLEHNUNG":
      return { label: "Abgelehnt", className: "ecc-status-badge--rejected" };
    case "EINGANGSBESTAETIGUNG":
      return { label: "Bestätigt", className: "ecc-status-badge--confirmed" };
    case "ZAEHLERANTRAG":
      return { label: "Zählerantrag", className: "ecc-status-badge--meter" };
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INBOX TAB - SMART 3-COLUMN LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

function InboxTab() {
  // State
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [vnbSummary, setVnbSummary] = useState<VnbSummary[]>([]);
  const [selectedVnb, setSelectedVnb] = useState<number | null>(null);
  const [smartFilter, setSmartFilter] = useState<SmartFilterKey>("all");
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);
  const [escalationCount, setEscalationCount] = useState({ overdue: 0, soon: 0 });
  const [autoReplyDraft, setAutoReplyDraft] = useState<string | null>(null);
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);
  const [showEscalationPanel, setShowEscalationPanel] = useState(false);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);

  // Computed filter params
  const getFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (search) params.set("search", search);
    if (selectedVnb) params.set("netzbetreiberId", String(selectedVnb));
    if (selectedMailbox) params.set("folder", selectedMailbox);

    const filter = SMART_FILTERS.find(f => f.key === smartFilter);
    if (smartFilter === "unread") {
      params.set("isRead", "false");
    } else if (smartFilter === "sent") {
      params.set("direction", "outgoing");
    } else if (filter?.aiTypes) {
      params.set("aiType", filter.aiTypes.join(","));
    }
    return params;
  }, [search, selectedVnb, smartFilter, selectedMailbox]);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = getFilterParams();
      const res = await apiGet(`/email-inbox/emails?${params}`);
      const data = res?.data || res;
      setEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [getFilterParams]);

  const loadVnbSummary = useCallback(async () => {
    try {
      const res = await apiGet("/email-inbox/vnb-summary");
      setVnbSummary(res?.data || []);
    } catch { /* ignore */ }
  }, []);

  const loadMailboxes = useCallback(async () => {
    try {
      const res = await apiGet("/email-inbox/mailboxes");
      setMailboxes(res?.data || []);
    } catch { /* ignore */ }
  }, []);

  const loadEscalationCounts = useCallback(async () => {
    try {
      const res = await apiGet("/email-inbox/escalations?status=PENDING");
      const items: EscalationItem[] = res?.data || [];
      const now = new Date();
      let overdue = 0, soon = 0;
      items.forEach(e => {
        const scheduled = new Date(e.scheduledFor);
        if (scheduled <= now) overdue++;
        else {
          const daysUntil = (scheduled.getTime() - now.getTime()) / 86400000;
          if (daysUntil <= 7) soon++;
        }
      });
      setEscalationCount({ overdue, soon });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadEmails(); }, [loadEmails]);
  useEffect(() => { loadVnbSummary(); loadMailboxes(); loadEscalationCounts(); }, [loadVnbSummary, loadMailboxes, loadEscalationCounts]);

  const loadEmailDetail = async (id: string) => {
    setDetailLoading(true);
    setAutoReplyDraft(null);
    try {
      const res = await apiGet(`/email-inbox/${id}`);
      setSelectedEmail(res?.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiPost(`/email-inbox/${id}/archive`, {});
      loadEmails();
      if (selectedEmail?.id === id) setSelectedEmail(null);
    } catch (err) { console.error(err); }
  };

  const handleGenerateAutoReply = async (id: string) => {
    setAutoReplyLoading(true);
    try {
      const res = await apiGet(`/email-inbox/${id}/autoreply-draft`);
      setAutoReplyDraft(res?.data?.draft || res?.draft || "Kein Entwurf generiert.");
    } catch {
      setAutoReplyDraft("Fehler beim Generieren des Entwurfs.");
    } finally {
      setAutoReplyLoading(false);
    }
  };

  const handleSendAutoReply = async (id: string) => {
    try {
      await apiPost(`/email-inbox/${id}/approve-autoreply`, {});
      setAutoReplyDraft(null);
      loadEmails();
    } catch (err) { console.error(err); }
  };

  const loadEscalations = async () => {
    setEscalationsLoading(true);
    try {
      const res = await apiGet("/email-inbox/escalations?status=PENDING");
      setEscalations(res?.data || []);
    } catch { setEscalations([]); }
    finally { setEscalationsLoading(false); }
  };

  const handleExecuteEscalation = async (id: number) => {
    try {
      await apiPost(`/email-inbox/escalations/${id}/execute`, {});
      loadEscalations();
      loadEscalationCounts();
    } catch (err) { console.error(err); }
  };

  const handleSkipEscalation = async (id: number) => {
    try {
      await apiPost(`/email-inbox/escalations/${id}/skip`, {});
      loadEscalations();
      loadEscalationCounts();
    } catch (err) { console.error(err); }
  };

  // Counts
  const totalCount = emails.length;
  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="ecc-inbox-tab">
      {/* ── Top Bar ── */}
      <div className="ecc-inbox-topbar">
        <div className="ecc-inbox-topbar__left">
          <div className="ecc-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Emails durchsuchen..."
              onKeyDown={(e) => e.key === "Enter" && loadEmails()}
            />
          </div>
          <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={loadEmails}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="ecc-inbox-topbar__right">
          {escalationCount.overdue > 0 && (
            <button
              className="ecc-btn ecc-btn--sm ecc-btn--danger"
              onClick={() => { setShowEscalationPanel(!showEscalationPanel); if (!showEscalationPanel) loadEscalations(); }}
            >
              <AlertTriangle size={14} /> {escalationCount.overdue} Überfällig
            </button>
          )}
          {escalationCount.soon > 0 && (
            <span className="ecc-badge ecc-badge--warn">{escalationCount.soon} bald fällig</span>
          )}
        </div>
      </div>

      {/* ── 3-Column Container ── */}
      <div className="ecc-inbox-container">

        {/* ═══ LEFT: Smart Filter Sidebar ═══ */}
        <aside className="ecc-sidebar">
          {/* Smart Filters */}
          <div className="ecc-sidebar__section">
            <div className="ecc-sidebar__title"><Filter size={12} /> SMART FILTER</div>
            {SMART_FILTERS.map(f => (
              <button
                key={f.key}
                className={`ecc-sidebar__item ${smartFilter === f.key && !selectedVnb && !selectedMailbox ? "ecc-sidebar__item--active" : ""}`}
                onClick={() => { setSmartFilter(f.key); setSelectedVnb(null); setSelectedMailbox(null); }}
              >
                <f.icon size={14} />
                <span className="ecc-sidebar__item-label">{f.label}</span>
                <span className="ecc-sidebar__item-count">
                  {f.key === "all" ? totalCount : f.key === "unread" ? unreadCount : ""}
                </span>
              </button>
            ))}
          </div>

          {/* Postfächer */}
          {mailboxes.length > 0 && (
            <div className="ecc-sidebar__section">
              <div className="ecc-sidebar__title"><Inbox size={12} /> POSTFÄCHER</div>
              {mailboxes.map(mb => (
                <button
                  key={mb.address}
                  className={`ecc-sidebar__item ${selectedMailbox === mb.address ? "ecc-sidebar__item--active" : ""}`}
                  onClick={() => {
                    setSelectedMailbox(selectedMailbox === mb.address ? null : mb.address);
                    setSmartFilter("all");
                    setSelectedVnb(null);
                  }}
                >
                  <Mail size={14} />
                  <span className="ecc-sidebar__item-label">{mb.address.split("@")[0]}</span>
                  <span className="ecc-sidebar__item-count">{mb.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Eskalationen */}
          {(escalationCount.overdue > 0 || escalationCount.soon > 0) && (
            <div className="ecc-sidebar__section">
              <div className="ecc-sidebar__title"><AlertTriangle size={12} /> ESKALATIONEN</div>
              {escalationCount.overdue > 0 && (
                <button
                  className="ecc-sidebar__item ecc-sidebar__item--danger"
                  onClick={() => { setShowEscalationPanel(true); loadEscalations(); }}
                >
                  <AlertCircle size={14} />
                  <span className="ecc-sidebar__item-label">Überfällig (&gt;28T)</span>
                  <span className="ecc-sidebar__item-count ecc-sidebar__item-count--danger">{escalationCount.overdue}</span>
                </button>
              )}
              {escalationCount.soon > 0 && (
                <button className="ecc-sidebar__item ecc-sidebar__item--warn">
                  <Clock size={14} />
                  <span className="ecc-sidebar__item-label">Bald fällig</span>
                  <span className="ecc-sidebar__item-count ecc-sidebar__item-count--warn">{escalationCount.soon}</span>
                </button>
              )}
            </div>
          )}

          {/* VNB Filter */}
          {vnbSummary.length > 0 && (
            <div className="ecc-sidebar__section">
              <div className="ecc-sidebar__title"><Building2 size={12} /> VNB</div>
              {vnbSummary.slice(0, 15).map(vnb => (
                <button
                  key={vnb.id}
                  className={`ecc-sidebar__item ${selectedVnb === vnb.id ? "ecc-sidebar__item--active" : ""}`}
                  onClick={() => {
                    setSelectedVnb(selectedVnb === vnb.id ? null : vnb.id);
                    setSmartFilter("all");
                    setSelectedMailbox(null);
                  }}
                >
                  <span className="ecc-sidebar__vnb-dot" />
                  <span className="ecc-sidebar__item-label">{vnb.name}</span>
                  <span className="ecc-sidebar__item-count">
                    {vnb.emailCount}
                    {vnb.unreadCount > 0 && <span className="ecc-sidebar__unread-dot" />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ═══ CENTER: Email List ═══ */}
        <div className="ecc-email-list">
          {loading ? (
            <div className="ecc-loading"><Loader2 size={28} className="ecc-spin" /></div>
          ) : emails.length === 0 ? (
            <div className="ecc-empty ecc-empty--sm"><Inbox size={40} /><span>Keine Emails gefunden</span></div>
          ) : (
            emails.map((email) => {
              const badge = getStatusBadge(email.aiType);
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div
                  key={email.id}
                  className={`ecc-email-row ${!email.isRead ? "ecc-email-row--unread" : ""} ${isSelected ? "ecc-email-row--selected" : ""}`}
                  onClick={() => loadEmailDetail(String(email.id))}
                >
                  {/* Row 1: Sender + Status Badge + Time */}
                  <div className="ecc-email-row__top">
                    <span className="ecc-email-row__sender">
                      {!email.isRead && <span className="ecc-email-row__unread-dot" />}
                      {email.fromName || email.fromAddress || email.from}
                    </span>
                    <span className="ecc-email-row__right">
                      {badge && (
                        <span className={`ecc-status-badge ${badge.className}`}>{badge.label}</span>
                      )}
                      <span className="ecc-email-row__time">{formatTimeOnly(email.receivedAt || email.date)}</span>
                    </span>
                  </div>

                  {/* Row 2: Subject */}
                  <div className="ecc-email-row__subject">{email.subject || "(Kein Betreff)"}</div>

                  {/* Row 3: Anlage-Link + NB + Attachments */}
                  <div className="ecc-email-row__meta">
                    {email.installationPublicId && (
                      <span className="ecc-email-row__link">
                        <Link2 size={10} /> {email.installationPublicId}
                      </span>
                    )}
                    {email.factroProjectTitle && (
                      <span className="ecc-email-row__link">
                        <ExternalLink size={10} /> {email.factroProjectTitle}
                      </span>
                    )}
                    {email.netzbetreiberName && (
                      <span className="ecc-email-row__nb">{email.netzbetreiberName}</span>
                    )}
                    {email.hasAttachments && <Paperclip size={11} className="ecc-email-row__clip" />}
                  </div>

                  {/* Row 4: AI Match Score (if good) */}
                  {email.matchScore && email.matchScore >= 50 && (
                    <div className="ecc-email-row__match">
                      <Bot size={10} /> {email.matchScore}% Match
                      {email.matchMethod && <span> · {email.matchMethod.replace(/_/g, " ").toLowerCase()}</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ═══ RIGHT: Detail Panel / Escalation Panel ═══ */}
        <div className="ecc-detail">
          {showEscalationPanel ? (
            /* ── Escalation Panel ── */
            <div className="ecc-detail__escalation">
              <div className="ecc-detail__panel-header">
                <h3><AlertTriangle size={16} /> Eskalationen — Überfällige Netzanfragen</h3>
                <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => setShowEscalationPanel(false)}>
                  <X size={14} />
                </button>
              </div>
              {escalationsLoading ? (
                <div className="ecc-loading"><Loader2 size={24} className="ecc-spin" /></div>
              ) : escalations.length === 0 ? (
                <div className="ecc-empty ecc-empty--sm"><CheckCircle2 size={32} /><span>Keine offenen Eskalationen</span></div>
              ) : (
                <div className="ecc-escalation-list">
                  {escalations.map(esc => (
                    <div key={esc.id} className="ecc-escalation-card">
                      <div className="ecc-escalation-card__top">
                        {esc.installation?.publicId && (
                          <span className="ecc-email-row__link"><Link2 size={10} /> {esc.installation.publicId}</span>
                        )}
                        {esc.installation?.customerName && (
                          <span className="ecc-escalation-card__customer">{esc.installation.customerName}</span>
                        )}
                      </div>
                      {esc.factroProject?.title && (
                        <div className="ecc-escalation-card__project">{esc.factroProject.title}</div>
                      )}
                      <div className="ecc-escalation-card__reason">{esc.reason}</div>
                      <div className="ecc-escalation-card__meta">
                        <span className={`ecc-status-pill ${esc.type === "ESCALATION" ? "ecc-status-pill--danger" : "ecc-status-pill--warn"}`}>
                          {esc.type === "REMINDER" ? "Erinnerung" : esc.type === "ESCALATION" ? "Eskalation" : "Kunden-Update"}
                        </span>
                        <span>Geplant: {formatDate(esc.scheduledFor)}</span>
                      </div>
                      <div className="ecc-escalation-card__actions">
                        <button className="ecc-btn ecc-btn--sm ecc-btn--primary" onClick={() => handleExecuteEscalation(esc.id)}>
                          <Send size={12} /> Erinnerung senden
                        </button>
                        <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handleSkipEscalation(esc.id)}>
                          <SkipForward size={12} /> Überspringen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : detailLoading ? (
            <div className="ecc-loading"><Loader2 size={28} className="ecc-spin" /></div>
          ) : selectedEmail ? (
            /* ── Email Detail Panel ── */
            <div className="ecc-detail__content">
              {/* A) Email Header */}
              <div className="ecc-detail__header">
                <div className="ecc-detail__subject-row">
                  <h3 className="ecc-detail__subject">{selectedEmail.subject || "(Kein Betreff)"}</h3>
                  {selectedEmail.aiType && (
                    <span className="ecc-ai-badge" style={{
                      background: AI_TYPE_CONFIG[selectedEmail.aiType]?.bg,
                      color: AI_TYPE_CONFIG[selectedEmail.aiType]?.text
                    }}>
                      {AI_TYPE_CONFIG[selectedEmail.aiType]?.label || selectedEmail.aiType}
                    </span>
                  )}
                </div>
                <div className="ecc-detail__sender">
                  <div className="ecc-detail__avatar">{(selectedEmail.fromName || selectedEmail.from || "?")[0].toUpperCase()}</div>
                  <div className="ecc-detail__sender-info">
                    <span className="ecc-detail__sender-name">{selectedEmail.fromName || selectedEmail.fromAddress || selectedEmail.from}</span>
                    <span className="ecc-detail__sender-email">{selectedEmail.fromAddress || selectedEmail.from}</span>
                  </div>
                  <span className="ecc-detail__date">{formatRelativeTime(selectedEmail.receivedAt || selectedEmail.date)}</span>
                </div>
              </div>

              {/* B) Verknüpfte Anlage Bar */}
              {(selectedEmail.installationPublicId || selectedEmail.factroProjectTitle) && (
                <div className="ecc-detail__linked">
                  <div className="ecc-detail__linked-label">VERKNÜPFT</div>
                  <div className="ecc-detail__linked-content">
                    {selectedEmail.installationPublicId && (
                      <a className="ecc-detail__linked-item" href={`/factro-center?highlight=${selectedEmail.factroProjectId || ""}`}>
                        <Link2 size={12} /> {selectedEmail.installationPublicId}
                      </a>
                    )}
                    {selectedEmail.factroProjectTitle && (
                      <span className="ecc-detail__linked-project">
                        <ExternalLink size={12} /> {selectedEmail.factroProjectTitle}
                      </span>
                    )}
                    {selectedEmail.netzbetreiberName && (
                      <span className="ecc-detail__linked-vnb">VNB: {selectedEmail.netzbetreiberName}</span>
                    )}
                  </div>
                  {selectedEmail.matchMethod && (
                    <div className="ecc-detail__linked-match">
                      <Bot size={10} /> {selectedEmail.matchMethod.replace(/_/g, " ")} ({selectedEmail.matchScore || 0}%)
                    </div>
                  )}
                </div>
              )}

              {/* C) Email Body */}
              <div className="ecc-detail__body">
                {selectedEmail.bodyHtml ? (
                  <iframe srcDoc={selectedEmail.bodyHtml} title="Email Content" className="ecc-detail__iframe" />
                ) : (
                  <pre className="ecc-detail__text">{selectedEmail.bodyText || "Kein Inhalt"}</pre>
                )}
              </div>

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="ecc-detail__attachments">
                  <Paperclip size={14} /> <span>{selectedEmail.attachments.length} Anhänge</span>
                  {selectedEmail.attachments.map((att: any, idx: number) => (
                    <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="ecc-detail__attachment-item">
                      <FileText size={12} /> {att.filename || att.name || `Anhang ${idx + 1}`}
                    </a>
                  ))}
                </div>
              )}

              {/* D) KI-Analyse Panel */}
              {selectedEmail.aiType && (
                <div className="ecc-detail__ai-panel">
                  <div className="ecc-detail__ai-header">
                    <Bot size={14} />
                    <span>KI-Analyse</span>
                    <span className="ecc-detail__ai-model">Claude Sonnet</span>
                  </div>
                  {selectedEmail.aiSummary && (
                    <div className="ecc-detail__ai-summary">{selectedEmail.aiSummary}</div>
                  )}
                  <div className="ecc-detail__ai-meta">
                    <span className="ecc-ai-badge" style={{
                      background: AI_TYPE_CONFIG[selectedEmail.aiType]?.bg,
                      color: AI_TYPE_CONFIG[selectedEmail.aiType]?.text
                    }}>
                      {AI_TYPE_CONFIG[selectedEmail.aiType]?.label}
                    </span>
                    {selectedEmail.aiConfidence && (
                      <span className="ecc-detail__ai-conf">{selectedEmail.aiConfidence}% Konfidenz</span>
                    )}
                  </div>
                  <div className="ecc-detail__ai-actions">
                    <button
                      className="ecc-btn ecc-btn--sm ecc-btn--primary"
                      onClick={() => handleGenerateAutoReply(String(selectedEmail.id))}
                      disabled={autoReplyLoading}
                    >
                      {autoReplyLoading ? <Loader2 size={12} className="ecc-spin" /> : <Bot size={12} />}
                      Antwort generieren
                    </button>
                  </div>
                </div>
              )}

              {/* E) Auto-Reply Draft */}
              {autoReplyDraft && (
                <div className="ecc-detail__reply-panel">
                  <div className="ecc-detail__reply-header">
                    <MessageSquare size={14} /> Generierte Antwort
                    <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => setAutoReplyDraft(null)}>
                      <X size={12} />
                    </button>
                  </div>
                  <pre className="ecc-detail__reply-body">{autoReplyDraft}</pre>
                  <div className="ecc-detail__reply-actions">
                    <button className="ecc-btn ecc-btn--sm ecc-btn--primary" onClick={() => handleSendAutoReply(String(selectedEmail.id))}>
                      <Send size={12} /> Senden
                    </button>
                    <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => navigator.clipboard.writeText(autoReplyDraft)}>
                      <Copy size={12} /> Kopieren
                    </button>
                  </div>
                </div>
              )}

              {/* F) Action Bar */}
              <div className="ecc-detail__action-bar">
                <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handleArchive(String(selectedEmail.id))}>
                  <Archive size={14} /> Archivieren
                </button>
                {selectedEmail.factroProjectId && (
                  <a className="ecc-btn ecc-btn--sm ecc-btn--secondary" href={`/factro-center?highlight=${selectedEmail.factroProjectId}`}>
                    <ExternalLink size={14} /> Factro
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* ── Empty State ── */
            <div className="ecc-empty">
              <MailOpen size={56} />
              <span>Wähle eine Email aus</span>
              <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 4 }}>
                Klicke links auf eine Email um Details, KI-Analyse und Aktionen zu sehen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ESCALATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════

function EscalationsTab() {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/email-inbox/escalations?status=${statusFilter}`);
      setEscalations(res?.data || []);
    } catch { setEscalations([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleExecute = async (id: number) => {
    try { await apiPost(`/email-inbox/escalations/${id}/execute`, {}); load(); }
    catch (err) { console.error(err); }
  };

  const handleSkip = async (id: number) => {
    try { await apiPost(`/email-inbox/escalations/${id}/skip`, {}); load(); }
    catch (err) { console.error(err); }
  };

  const typeConfig: Record<string, { label: string; color: string; icon: typeof Mail }> = {
    REMINDER: { label: "Erinnerung", color: "#f59e0b", icon: Clock },
    ESCALATION: { label: "Eskalation", color: "#ef4444", icon: AlertTriangle },
    CUSTOMER_UPDATE: { label: "Kunden-Update", color: "#3b82f6", icon: Users },
  };

  return (
    <div className="ecc-escalations">
      <div className="ecc-panel">
        <div className="ecc-panel__header">
          <h3><Shield size={18} /> Eskalationen</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["PENDING", "EXECUTED", "SKIPPED", "ALL"].map(s => (
              <button key={s} className={`ecc-chip ${statusFilter === s ? "ecc-chip--active" : ""}`} onClick={() => setStatusFilter(s)}>
                {s === "PENDING" ? "Offen" : s === "EXECUTED" ? "Ausgeführt" : s === "SKIPPED" ? "Übersprungen" : "Alle"}
              </button>
            ))}
          </div>
        </div>
        <div className="ecc-panel__body">
          {loading ? (
            <div className="ecc-loading"><Loader2 size={32} className="ecc-spin" /></div>
          ) : escalations.length === 0 ? (
            <div className="ecc-empty"><CheckCircle2 size={48} /><span>Keine offenen Eskalationen</span></div>
          ) : (
            <table className="ecc-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Grund</th>
                  <th>Installation / Projekt</th>
                  <th>Geplant für</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map(esc => {
                  const tc = typeConfig[esc.type] || { label: esc.type, color: "#64748b", icon: AlertCircle };
                  const Icon = tc.icon;
                  return (
                    <tr key={esc.id}>
                      <td>
                        <span className="ecc-status-pill" style={{ background: `${tc.color}22`, color: tc.color }}>
                          <Icon size={12} /> {tc.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{esc.reason}</td>
                      <td>
                        {esc.installation?.publicId && <span className="ecc-link">{esc.installation.publicId}</span>}
                        {esc.factroProject?.title && <span style={{ opacity: 0.7, fontSize: "0.8em", display: "block" }}>{esc.factroProject.title}</span>}
                      </td>
                      <td>{formatDate(esc.scheduledFor)}</td>
                      <td>
                        <span className="ecc-status-pill" style={{
                          background: esc.status === "PENDING" ? "rgba(251,191,36,.2)" : esc.status === "EXECUTED" ? "rgba(34,197,94,.2)" : "rgba(100,116,139,.2)",
                          color: esc.status === "PENDING" ? "#fbbf24" : esc.status === "EXECUTED" ? "#22c55e" : "#94a3b8",
                        }}>
                          {esc.status}
                        </span>
                      </td>
                      <td>
                        {esc.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="ecc-btn ecc-btn--sm ecc-btn--primary" onClick={() => handleExecute(esc.id)} title="Ausführen">
                              <Play size={14} />
                            </button>
                            <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handleSkip(esc.id)} title="Überspringen">
                              <SkipForward size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════════

function DashboardTab({ stats, loading, onRefresh }: { stats: Stats | null; loading: boolean; onRefresh: () => void }) {
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/email-inbox/dashboard-stats");
        setDashStats(res?.data || null);
      } catch { /* ignore */ }
      finally { setDashLoading(false); }
    })();
  }, []);

  if (loading || !stats) {
    return <div className="ecc-loading"><Loader2 size={48} className="ecc-spin" /><span>Lade Dashboard...</span></div>;
  }

  return (
    <div className="ecc-dashboard">
      {/* Stats Grid */}
      <div className="ecc-stats-grid">
        <div className="ecc-stat-card">
          <div className="ecc-stat-icon ecc-stat-icon--purple"><Inbox size={24} /></div>
          <div><div className="ecc-stat-value">{dashStats?.totalEmails?.toLocaleString() || 0}</div><div className="ecc-stat-label">Emails empfangen</div></div>
        </div>
        <div className="ecc-stat-card">
          <div className="ecc-stat-icon ecc-stat-icon--green"><Link2 size={24} /></div>
          <div><div className="ecc-stat-value">{dashStats?.matchRate || 0}%</div><div className="ecc-stat-label">Match-Rate</div></div>
        </div>
        <div className="ecc-stat-card">
          <div className="ecc-stat-icon ecc-stat-icon--yellow"><AlertTriangle size={24} /></div>
          <div><div className="ecc-stat-value">{dashStats?.pendingEscalations || 0}</div><div className="ecc-stat-label">Offene Eskalationen</div></div>
        </div>
        <div className="ecc-stat-card">
          <div className="ecc-stat-icon ecc-stat-icon--red"><MailOpen size={24} /></div>
          <div><div className="ecc-stat-value">{dashStats?.unreadCount || 0}</div><div className="ecc-stat-label">Ungelesen</div></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="ecc-quick-stats">
        <div className="ecc-quick-stat"><Send size={20} /><span><strong>{stats.totalSent?.toLocaleString() || 0}</strong> gesendet</span></div>
        <div className="ecc-quick-stat"><FileText size={20} /><span><strong>{stats.activeTemplates || 0}</strong> aktive Templates</span></div>
        <div className="ecc-quick-stat"><Zap size={20} /><span><strong>{stats.activeTriggers || 0}</strong> aktive Trigger</span></div>
        <div className="ecc-quick-stat"><Calendar size={20} /><span><strong>{stats.sentThisMonth || 0}</strong> diesen Monat</span></div>
      </div>

      {/* Two-Column */}
      {dashStats && !dashLoading && (
        <div className="ecc-dashboard__grid">
          {/* Top VNB */}
          <div className="ecc-panel">
            <div className="ecc-panel__header"><h3><Building2 size={18} /> Emails pro Netzbetreiber (Top 10)</h3></div>
            <div className="ecc-panel__body">
              {dashStats.topVnb.length === 0 ? (
                <div className="ecc-empty ecc-empty--sm"><Building2 size={32} /><span>Keine VNB-Daten</span></div>
              ) : (
                <div className="ecc-bar-list">
                  {dashStats.topVnb.map(vnb => {
                    const maxCount = dashStats.topVnb[0]?.count || 1;
                    return (
                      <div key={vnb.id} className="ecc-bar-item">
                        <span className="ecc-bar-item__label">{vnb.name}</span>
                        <div className="ecc-bar-item__bar">
                          <div className="ecc-bar-item__fill" style={{ width: `${(vnb.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="ecc-bar-item__value">{vnb.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KI-Klassifikation */}
          <div className="ecc-panel">
            <div className="ecc-panel__header"><h3><Bot size={18} /> KI-Klassifikation</h3></div>
            <div className="ecc-panel__body">
              {Object.keys(dashStats.aiTypes).length === 0 ? (
                <div className="ecc-empty ecc-empty--sm"><Bot size={32} /><span>Keine KI-Analysen</span></div>
              ) : (
                <div className="ecc-ai-distribution">
                  {Object.entries(dashStats.aiTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const cfg = AI_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="ecc-ai-dist-item">
                        <span className="ecc-ai-badge" style={{ background: cfg?.bg || "rgba(100,116,139,.15)", color: cfg?.text || "#94a3b8" }}>
                          {cfg?.label || type}
                        </span>
                        <span className="ecc-ai-dist-item__count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Eskalationen */}
      {dashStats && Object.keys(dashStats.escalationsByType).length > 0 && (
        <div className="ecc-panel">
          <div className="ecc-panel__header"><h3><Shield size={18} /> Eskalationen-Übersicht</h3></div>
          <div className="ecc-panel__body">
            <div className="ecc-quick-stats">
              {Object.entries(dashStats.escalationsByType).map(([type, counts]) => (
                <div key={type} className="ecc-quick-stat">
                  <span style={{ fontWeight: 600, color: type === "ESCALATION" ? "#ef4444" : type === "REMINDER" ? "#f59e0b" : "#3b82f6" }}>
                    {type === "REMINDER" ? "Erinnerungen" : type === "ESCALATION" ? "Eskalationen" : "Kunden-Updates"}
                  </span>
                  <span><strong>{counts.pending}</strong> offen</span>
                  <span style={{ color: "#64748b" }}>{counts.executed} ausgeführt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match-Statistik */}
      {dashStats && (
        <div className="ecc-quick-stats" style={{ marginTop: 8 }}>
          <div className="ecc-quick-stat"><Link2 size={18} /><span><strong>{dashStats.matchedEmails}</strong> zugeordnet</span></div>
          <div className="ecc-quick-stat"><AlertCircle size={18} /><span><strong>{dashStats.unmatchedEmails}</strong> nicht zugeordnet</span></div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="ecc-panel">
        <div className="ecc-panel__header">
          <h3><Activity size={18} /> Letzte Aktivitäten</h3>
          <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={onRefresh}><RefreshCw size={16} /></button>
        </div>
        <div className="ecc-panel__body">
          {!stats.recentLogs || stats.recentLogs.length === 0 ? (
            <div className="ecc-empty ecc-empty--sm"><Mail size={32} /><span>Noch keine Emails gesendet</span></div>
          ) : (
            <div className="ecc-activity-list">
              {stats.recentLogs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="ecc-activity-item">
                  <div className={`ecc-activity-icon ${log.status === "SENT" ? "ecc-activity-icon--success" : "ecc-activity-icon--error"}`}>
                    {log.status === "SENT" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="ecc-activity-content">
                    <div className="ecc-activity-title">{log.subject}</div>
                    <div className="ecc-activity-meta">{log.toEmail || log.recipientEmail} · {formatRelativeTime(log.sentAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════════════════════════════════════════

function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/email-center/templates");
      const data = res?.data || res;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setTemplates([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handlePreview = async (template: Template) => {
    try {
      const res = await apiPost(`/email-center/templates/${template.id}/preview`, {});
      setPreviewHtml(res?.html || res?.data?.html || template.bodyHtml || "");
      setSelectedTemplate(template);
    } catch {
      setPreviewHtml(template.bodyHtml || "");
      setSelectedTemplate(template);
    }
  };

  const handleToggle = async (template: Template) => {
    try { await apiPatch(`/email-center/templates/${template.id}`, { isActive: !template.isActive }); loadTemplates(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="ecc-loading"><Loader2 size={32} className="ecc-spin" /></div>;

  return (
    <div className="ecc-templates">
      <div className="ecc-toolbar">
        <button className="ecc-btn ecc-btn--primary"><Plus size={18} /> Neues Template</button>
      </div>
      {templates.length === 0 ? (
        <div className="ecc-empty"><FileText size={64} /><h3>Keine Templates gefunden</h3><p>Erstelle dein erstes Email-Template</p></div>
      ) : (
        <div className="ecc-template-grid">
          {templates.map((template) => (
            <div key={template.id} className={`ecc-template-card ${!template.isActive ? "ecc-template-card--inactive" : ""}`}>
              <div className="ecc-template-card__header">
                <span className="ecc-template-card__category">{CATEGORY_LABELS[template.category] || template.category}</span>
                {template.isSystem && <span className="ecc-template-card__system">System</span>}
              </div>
              <h4 className="ecc-template-card__title">{template.name}</h4>
              <p className="ecc-template-card__subject">{template.subject}</p>
              <div className="ecc-template-card__stats">
                <span><Zap size={14} /> {template.triggerCount || 0} Trigger</span>
                <span><Send size={14} /> {template.sentCount || 0} gesendet</span>
              </div>
              <div className="ecc-template-card__actions">
                <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handlePreview(template)}><Eye size={16} /></button>
                <button className="ecc-btn ecc-btn--sm ecc-btn--secondary"><Edit3 size={16} /></button>
                <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handleToggle(template)}>
                  {template.isActive ? <ToggleRight size={16} className="ecc-icon--success" /> : <ToggleLeft size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedTemplate && previewHtml && (
        <div className="ecc-modal-overlay" onClick={() => { setSelectedTemplate(null); setPreviewHtml(null); }}>
          <div className="ecc-modal ecc-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ecc-modal__header">
              <h3>Vorschau: {selectedTemplate.name}</h3>
              <button className="ecc-modal__close" onClick={() => { setSelectedTemplate(null); setPreviewHtml(null); }}><XCircle size={24} /></button>
            </div>
            <div className="ecc-modal__body">
              <iframe srcDoc={previewHtml} title="Email Preview" className="ecc-preview-iframe" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGERS TAB
// ═══════════════════════════════════════════════════════════════════════════

function TriggersTab() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTriggers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/email-center/triggers");
      const data = res?.data || res;
      setTriggers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setTriggers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTriggers(); }, [loadTriggers]);

  const handleToggle = async (trigger: Trigger) => {
    try { await apiPost(`/email-center/triggers/${trigger.id}/toggle`, {}); loadTriggers(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="ecc-loading"><Loader2 size={32} className="ecc-spin" /></div>;

  return (
    <div className="ecc-triggers">
      <div className="ecc-toolbar">
        <button className="ecc-btn ecc-btn--primary"><Plus size={18} /> Neuer Trigger</button>
      </div>
      {triggers.length === 0 ? (
        <div className="ecc-empty"><Zap size={64} /><h3>Keine Trigger gefunden</h3><p>Erstelle deinen ersten Email-Trigger</p></div>
      ) : (
        <div className="ecc-trigger-list">
          {triggers.map((trigger) => {
            const eventConfig = EVENT_LABELS[trigger.eventType] || { label: trigger.eventType, color: "#D4A843", icon: Zap };
            return (
              <div key={trigger.id} className={`ecc-trigger-card ${!trigger.isActive ? "ecc-trigger-card--inactive" : ""}`}>
                <div className="ecc-trigger-card__left">
                  <div className="ecc-trigger-card__icon" style={{ background: eventConfig.color }}><Zap size={20} /></div>
                  <div className="ecc-trigger-card__info">
                    <h4>{trigger.name}</h4>
                    <div className="ecc-trigger-card__flow">
                      <span>{eventConfig.label}</span><ChevronRight size={14} /><span>{trigger.template?.name || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="ecc-trigger-card__right">
                  <span className="ecc-trigger-card__sent"><Send size={14} /> {trigger.totalSent || 0} gesendet</span>
                  <button className={`ecc-btn ecc-btn--toggle ${trigger.isActive ? "ecc-btn--toggle-active" : "ecc-btn--toggle-paused"}`} onClick={() => handleToggle(trigger)}>
                    {trigger.isActive ? <><Play size={14} /> Aktiv</> : <><Pause size={14} /> Pausiert</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE TAB
// ═══════════════════════════════════════════════════════════════════════════

function QueueTab() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/email-center/queue");
      const data = res?.data || res;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleRetry = async (id: number) => {
    try { await apiPost(`/email-center/queue/${id}/retry`, {}); loadQueue(); }
    catch (err) { console.error(err); }
  };

  const handleCancel = async (id: number) => {
    try { await apiPost(`/email-center/queue/${id}/cancel`, {}); loadQueue(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="ecc-loading"><Loader2 size={32} className="ecc-spin" /></div>;

  return (
    <div className="ecc-queue">
      <div className="ecc-toolbar">
        <button className="ecc-btn ecc-btn--secondary" onClick={loadQueue}><RefreshCw size={16} /> Aktualisieren</button>
      </div>
      {items.length === 0 ? (
        <div className="ecc-empty"><CheckCircle2 size={64} /><h3>Queue ist leer</h3><p>Alle Emails wurden verarbeitet</p></div>
      ) : (
        <div className="ecc-panel">
          <table className="ecc-table">
            <thead><tr><th>Status</th><th>Empfänger</th><th>Betreff</th><th>Geplant für</th><th>Versuche</th><th>Aktionen</th></tr></thead>
            <tbody>
              {items.map((item) => {
                const sc = STATUS_CONFIG[item.status] || { bg: "rgba(100,116,139,0.2)", text: "#64748b", label: item.status };
                return (
                  <tr key={item.id}>
                    <td><span className="ecc-status-pill" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span></td>
                    <td>{item.recipientEmail}</td><td>{item.subject}</td><td>{formatDate(item.scheduledFor)}</td><td>{item.attempts}</td>
                    <td>
                      <div className="ecc-table-actions">
                        {item.status === "FAILED" && <button className="ecc-btn ecc-btn--sm ecc-btn--secondary" onClick={() => handleRetry(item.id)}><RefreshCw size={14} /> Retry</button>}
                        {["PENDING", "SCHEDULED"].includes(item.status) && <button className="ecc-btn ecc-btn--sm ecc-btn--danger" onClick={() => handleCancel(item.id)}><XCircle size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGS TAB
// ═══════════════════════════════════════════════════════════════════════════

function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("/email-center/logs");
      const data = res?.data || res;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setLogs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  if (loading) return <div className="ecc-loading"><Loader2 size={32} className="ecc-spin" /></div>;

  return (
    <div className="ecc-logs">
      {logs.length === 0 ? (
        <div className="ecc-empty"><Activity size={64} /><h3>Keine Logs gefunden</h3><p>Es wurden noch keine Emails gesendet</p></div>
      ) : (
        <div className="ecc-panel">
          <table className="ecc-table">
            <thead><tr><th>Status</th><th>Empfänger</th><th>Betreff</th><th>Template</th><th>Gesendet am</th></tr></thead>
            <tbody>
              {logs.map((log) => {
                const sc = STATUS_CONFIG[log.status] || { bg: "rgba(100,116,139,0.2)", text: "#64748b", label: log.status };
                return (
                  <tr key={log.id}>
                    <td>
                      <span className="ecc-status-pill" style={{ background: sc.bg, color: sc.text }}>
                        {log.status === "SENT" && <CheckCircle2 size={12} />}{log.status === "FAILED" && <XCircle size={12} />}{sc.label}
                      </span>
                    </td>
                    <td>{log.recipientEmail}</td><td>{log.subject}</td><td>{log.templateName || log.templateSlug || "—"}</td><td>{formatDate(log.sentAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════════════

function SettingsTab() {
  return (
    <div className="ecc-settings-grid">
      <div className="ecc-settings-card">
        <div className="ecc-settings-card__header"><Mail size={24} /><h3>SMTP-Konfiguration</h3></div>
        <p>Email-Versand Einstellungen werden in den Company Settings verwaltet.</p>
        <a href="/settings/company" className="ecc-btn ecc-btn--secondary"><Settings size={16} /> Zu den Einstellungen</a>
      </div>
      <div className="ecc-settings-card">
        <div className="ecc-settings-card__header"><Palette size={24} /><h3>White-Label</h3></div>
        <p>Konfiguriere kundenspezifisches Branding für ausgehende Emails.</p>
        <a href="/kunden" className="ecc-btn ecc-btn--secondary"><Users size={16} /> Kunden verwalten</a>
      </div>
      <div className="ecc-settings-card">
        <div className="ecc-settings-card__header"><Clock size={24} /><h3>Queue-Verarbeitung</h3></div>
        <p>Die Queue wird automatisch alle 5 Minuten verarbeitet.</p>
        <div className="ecc-settings-card__info"><span className="ecc-badge ecc-badge--success">Aktiv</span><span>Cron: */5 * * * *</span></div>
      </div>
      <div className="ecc-settings-card">
        <div className="ecc-settings-card__header"><Code size={24} /><h3>Template-Variablen</h3></div>
        <p>Verfügbare Variablen für Email-Templates.</p>
        <button className="ecc-btn ecc-btn--secondary"><FileText size={16} /> Dokumentation</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EmailCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiGet("/email-center/stats");
      setStats(res?.data || res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="ecc-page">
      {/* Background */}
      <div className="ecc-bg">
        <div className="ecc-bg__orb ecc-bg__orb--1" />
        <div className="ecc-bg__orb ecc-bg__orb--2" />
        <div className="ecc-bg__grid" />
      </div>

      {/* Header */}
      <header className="ecc-header">
        <div className="ecc-header__left">
          <div className="ecc-header__icon"><Sparkles size={28} /></div>
          <div>
            <h1 className="ecc-header__title">
              <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.85em" }}>Baunity</span> Email Center
              <span className="ecc-header__ai-tag">AI</span>
            </h1>
            <p className="ecc-header__subtitle">Intelligentes Kommunikations-Hub</p>
          </div>
        </div>
        <div className="ecc-header__actions">
          <button className="ecc-btn ecc-btn--secondary" onClick={loadStats}><RefreshCw size={18} /></button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="ecc-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`ecc-nav__item ${isActive ? "ecc-nav__item--active" : ""}`}
              style={{ "--tab-color": tab.color } as React.CSSProperties}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="ecc-main">
        {activeTab === "inbox" && <InboxTab />}
        {activeTab === "escalations" && <EscalationsTab />}
        {activeTab === "dashboard" && <DashboardTab stats={stats} loading={loading} onRefresh={loadStats} />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "triggers" && <TriggersTab />}
        {activeTab === "queue" && <QueueTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
