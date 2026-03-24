/**
 * AufgabenPage - Zentrales Inbox-Dashboard für proaktive Aufgaben
 * Zeigt alle offenen InboxItems mit Kategorie-Tabs, Snooze und Resolve.
 * Inline Email-Popup: KI generiert Email → User prüft/editiert → Absenden → Erledigt.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "../services/apiClient";

// Vollständiges Interface (inkl. netzbetreiber aus Backend)
interface InboxItemExtended {
  id: number;
  installationId: number;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  actions: { type: string; label: string }[] | null;
  metadata: Record<string, unknown> | null;
  autoCreated: boolean;
  resolvedAt: string | null;
  createdAt: string;
  category: string | null;
  sourceType: string | null;
  dueDate: string | null;
  snoozedUntil: string | null;
  assignedToId: number | null;
  installation: {
    id: number;
    publicId: string;
    customerName: string | null;
    gridOperator: string | null;
    phase: string | null;
    zustand: string | null;
    status: string | null;
    contactEmail: string | null;
    netzbetreiber: { id: number; name: string; email: string | null } | null;
  };
}

interface InboxResponse {
  items: InboxItemExtended[];
  total: number;
}

interface InboxCounts {
  total: number;
  critical: number;
  high: number;
  byCategory: Record<string, number>;
}

// Kategorie-Tabs
const CATEGORIES = [
  { key: "alle", label: "Alle", icon: "📋" },
  { key: "rueckfrage", label: "Rückfragen", icon: "❓" },
  { key: "genehmigung", label: "Genehmigungen", icon: "✅" },
  { key: "ibn", label: "IBN", icon: "⚡" },
  { key: "nachfassen", label: "Nachfassen", icon: "📞" },
  { key: "einreichung", label: "Einreichung", icon: "📤" },
  { key: "mastr", label: "MaStR", icon: "🏛️" },
  { key: "dokumente", label: "Dokumente", icon: "📄" },
] as const;

// Priority-Farben
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  NORMAL: "#D4A843",
  LOW: "#64748b",
};

const PRIORITY_BG: Record<string, string> = {
  CRITICAL: "rgba(239,68,68,0.12)",
  HIGH: "rgba(245,158,11,0.10)",
  NORMAL: "rgba(212,168,67,0.08)",
  LOW: "rgba(100,116,139,0.06)",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Kritisch",
  HIGH: "Hoch",
  NORMAL: "Normal",
  LOW: "Niedrig",
};

const SOURCE_LABELS: Record<string, string> = {
  EMAIL: "Email-Analyse",
  CRON: "Automatisch",
  SYSTEM: "System",
  MANUAL: "Manuell",
  STATUS_CHANGE: "Status-Wechsel",
};

// Email-Action Mapping: InboxItem-Type → Email-Konfiguration
const EMAIL_ACTION_CONFIG: Record<string, { label: string; emailType: string }> = {
  nachfassen_nb: { label: "NB nachfassen", emailType: "nachfassen" },
  email_rueckfrage: { label: "Antwort verfassen", emailType: "rueckfrage_antwort" },
  rueckfrage_beantworten: { label: "Antwort verfassen", emailType: "rueckfrage_antwort" },
  installation_ueberfaellig: { label: "NB nachfassen", emailType: "nachfassen" },
};

type ActionStep = "generating" | "editing" | "sending" | "done" | "error";

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "gestern";
  return `vor ${diffD} Tagen`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AufgabenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeCategory = searchParams.get("category") || "alle";
  const [snoozeId, setSnoozeId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Email-Action State
  const [actionItem, setActionItem] = useState<InboxItemExtended | null>(null);
  const [actionStep, setActionStep] = useState<ActionStep>("generating");
  const [emailTo, setEmailTo] = useState("");
  const [emailToName, setEmailToName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Escape schließt Snooze-Dropdown und Email-Popup
  useEffect(() => {
    if (snoozeId === null && !actionItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (actionItem && actionStep !== "sending") {
          closePopup();
        } else if (snoozeId !== null) {
          setSnoozeId(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [snoozeId, actionItem, actionStep]);

  // Click Outside schließt Snooze-Dropdown
  useEffect(() => {
    if (snoozeId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".snooze-dropdown") && !target.closest(".aufgaben-btn--snooze")) {
        setSnoozeId(null);
      }
    };
    window.addEventListener("click", handler, { capture: true });
    return () => window.removeEventListener("click", handler, { capture: true });
  }, [snoozeId]);

  // Daten laden
  const { data, isLoading } = useQuery<InboxResponse>({
    queryKey: ["aufgaben", "inbox"],
    queryFn: () => apiGet("/v2/inbox"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: counts } = useQuery<InboxCounts>({
    queryKey: ["aufgaben", "counts"],
    queryFn: () => apiGet("/v2/inbox/counts"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Resolve (item-spezifischer Loading-State)
  const resolveMut = useMutation({
    mutationFn: (id: number) => {
      setResolvingId(id);
      return apiPost(`/v2/inbox/${id}/resolve`, {});
    },
    onSuccess: () => {
      setResolvingId(null);
      queryClient.invalidateQueries({ queryKey: ["aufgaben"] });
    },
    onError: () => {
      setResolvingId(null);
    },
  });

  // Snooze mit optimistic update
  const snoozeMut = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) => {
      const until = new Date();
      until.setDate(until.getDate() + days);
      return apiPost(`/v2/inbox/${id}/snooze`, { until: until.toISOString() });
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["aufgaben", "inbox"] });
      const prev = queryClient.getQueryData<InboxResponse>(["aufgaben", "inbox"]);
      if (prev) {
        queryClient.setQueryData<InboxResponse>(["aufgaben", "inbox"], {
          items: prev.items.filter((i) => i.id !== id),
          total: prev.total - 1,
        });
      }
      setSnoozeId(null);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["aufgaben", "inbox"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aufgaben"] });
    },
  });

  // Filtern nach Kategorie
  const items = useMemo(() => {
    if (!data?.items) return [];
    if (activeCategory === "alle") return data.items;
    return data.items.filter((i) => i.category === activeCategory);
  }, [data?.items, activeCategory]);

  // Gruppiere nach Priorität
  const grouped = useMemo(() => {
    const groups: Record<string, InboxItemExtended[]> = {
      CRITICAL: [],
      HIGH: [],
      NORMAL: [],
      LOW: [],
    };
    for (const item of items) {
      const p = item.priority || "NORMAL";
      (groups[p] || groups.NORMAL).push(item);
    }
    return groups;
  }, [items]);

  const handleResolve = useCallback((id: number) => {
    resolveMut.mutate(id);
  }, [resolveMut]);

  // --- Email Action Logic ---

  function closePopup() {
    setActionItem(null);
    setActionStep("generating");
    setEmailTo("");
    setEmailToName("");
    setEmailSubject("");
    setEmailBody("");
    setActionError(null);
  }

  async function startEmailAction(item: InboxItemExtended) {
    const nb = item.installation.netzbetreiber;
    if (!nb?.email) {
      // Kein NB-Email → zur Detailseite navigieren
      navigate(`/netzanmeldungen/${item.installationId}`);
      return;
    }

    const config = EMAIL_ACTION_CONFIG[item.type];
    if (!config) return;

    setActionItem(item);
    setActionStep("generating");
    setActionError(null);
    setEmailTo(nb.email);
    setEmailToName(nb.name || nb.email);

    try {
      const result = await apiPost<{ subject: string; body: string }>("/ai/generate-email", {
        installationId: item.installationId,
        emailType: config.emailType,
      });
      setEmailSubject(result.subject || "");
      setEmailBody(result.body || "");
      setActionStep("editing");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Email-Generierung fehlgeschlagen";
      setActionError(msg);
      setActionStep("error");
    }
  }

  async function sendEmail() {
    if (!actionItem) return;
    setActionStep("sending");
    setActionError(null);

    try {
      await apiPost(`/installation/${actionItem.installationId}/send-email`, {
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
      });
      // Item als erledigt markieren
      await apiPost(`/v2/inbox/${actionItem.id}/resolve`, {});
      queryClient.invalidateQueries({ queryKey: ["aufgaben"] });
      setActionStep("done");
      // Auto-close nach 1.5s
      setTimeout(() => closePopup(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Senden fehlgeschlagen";
      setActionError(msg);
      setActionStep("error");
    }
  }

  function regenerateEmail() {
    if (!actionItem) return;
    startEmailAction(actionItem);
  }

  return (
    <>
      <style>{`
        .aufgaben-page { padding: 24px 32px; max-width: 1200px; }
        .aufgaben-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .aufgaben-title { font-size: 24px; font-weight: 700; color: white; }
        .aufgaben-count { font-size: 13px; color: rgba(255,255,255,0.4); padding: 4px 12px; background: rgba(255,255,255,0.06); border-radius: 20px; }
        .aufgaben-count strong { color: #f87171; font-weight: 600; }

        .aufgaben-tabs { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
        .aufgaben-tab { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); border: 1px solid transparent; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .aufgaben-tab:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
        .aufgaben-tab--active { background: rgba(212,168,67,0.15); border-color: rgba(212,168,67,0.3); color: #a5b4fc; }
        .aufgaben-tab-count { font-size: 11px; min-width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 9px; background: rgba(255,255,255,0.08); }
        .aufgaben-tab--active .aufgaben-tab-count { background: rgba(212,168,67,0.3); color: #c7d2fe; }

        .aufgaben-section { margin-bottom: 20px; }
        .aufgaben-section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; padding-left: 4px; }

        .aufgaben-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 8px; transition: all 0.15s; cursor: default; position: relative; }
        .aufgaben-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .aufgaben-card--critical { border-left: 3px solid #ef4444; }
        .aufgaben-card--high { border-left: 3px solid #f59e0b; }
        .aufgaben-card--normal { border-left: 3px solid #D4A843; }
        .aufgaben-card--low { border-left: 3px solid #475569; }

        .aufgaben-card-body { flex: 1; min-width: 0; }
        .aufgaben-card-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px; }
        .aufgaben-card-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
        .aufgaben-card-meta span { display: flex; align-items: center; gap: 3px; }
        .aufgaben-card-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.5; max-height: 40px; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; }

        .aufgaben-card-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .aufgaben-badge { font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 500; }
        .aufgaben-badge--source { background: rgba(212,168,67,0.12); color: #a5b4fc; }
        .aufgaben-badge--due { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .aufgaben-badge--due-overdue { background: rgba(239,68,68,0.15); color: #f87171; }
        .aufgaben-badge--category { background: rgba(34,197,94,0.12); color: #4ade80; }

        .aufgaben-card-actions { display: flex; gap: 6px; align-items: center; }
        .aufgaben-btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .aufgaben-btn--view { background: rgba(212,168,67,0.12); color: #EAD068; border-color: rgba(212,168,67,0.2); }
        .aufgaben-btn--view:hover { background: rgba(212,168,67,0.2); }
        .aufgaben-btn--resolve { background: rgba(34,197,94,0.12); color: #4ade80; border-color: rgba(34,197,94,0.2); }
        .aufgaben-btn--resolve:hover { background: rgba(34,197,94,0.2); }
        .aufgaben-btn--resolve:disabled { opacity: 0.5; cursor: not-allowed; }
        .aufgaben-btn--snooze { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); }
        .aufgaben-btn--snooze:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
        .aufgaben-btn--action { background: rgba(139,92,246,0.15); color: #f0d878; border-color: rgba(139,92,246,0.25); }
        .aufgaben-btn--action:hover { background: rgba(139,92,246,0.25); color: #c4b5fd; }

        .aufgaben-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .aufgaben-card-time { font-size: 11px; color: rgba(255,255,255,0.25); white-space: nowrap; }
        .aufgaben-card-priority { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border-radius: 4px; }

        .aufgaben-empty { text-align: center; padding: 60px 20px; }
        .aufgaben-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .aufgaben-empty-text { font-size: 16px; color: rgba(255,255,255,0.5); font-weight: 500; }
        .aufgaben-empty-sub { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        .aufgaben-loading { display: flex; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; color: rgba(255,255,255,0.4); }
        .aufgaben-spinner { width: 20px; height: 20px; border: 2px solid rgba(212,168,67,0.3); border-top-color: #D4A843; border-radius: 50%; animation: aufgaben-spin 0.6s linear infinite; }
        @keyframes aufgaben-spin { to { transform: rotate(360deg); } }

        .snooze-dropdown { position: absolute; right: 18px; top: 50px; background: #1e1e2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 6px; z-index: 10; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .snooze-option { padding: 8px 16px; font-size: 13px; color: rgba(255,255,255,0.7); cursor: pointer; border-radius: 6px; white-space: nowrap; }
        .snooze-option:hover { background: rgba(255,255,255,0.08); color: white; }

        /* Email Action Popup */
        .aktion-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; }
        .aktion-popup { width: 640px; max-width: 94vw; max-height: 90vh; overflow-y: auto; background: #1a1a2e; border: 1px solid rgba(139,92,246,0.25); border-radius: 16px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .aktion-popup-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 4px; }
        .aktion-popup-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
        .aktion-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .aktion-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .aktion-input:focus { border-color: rgba(139,92,246,0.5); }
        .aktion-input[readonly] { opacity: 0.6; cursor: default; }
        .aktion-textarea { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px; font-family: inherit; line-height: 1.6; resize: vertical; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .aktion-textarea:focus { border-color: rgba(139,92,246,0.5); }
        .aktion-field { margin-bottom: 16px; }
        .aktion-buttons { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .aktion-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .aktion-btn--cancel { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }
        .aktion-btn--cancel:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .aktion-btn--regen { background: rgba(139,92,246,0.12); color: #f0d878; border-color: rgba(139,92,246,0.2); }
        .aktion-btn--regen:hover { background: rgba(139,92,246,0.2); }
        .aktion-btn--send { background: rgba(34,197,94,0.2); color: #4ade80; border-color: rgba(34,197,94,0.3); }
        .aktion-btn--send:hover { background: rgba(34,197,94,0.3); }
        .aktion-btn--send:disabled { opacity: 0.5; cursor: not-allowed; }
        .aktion-generating { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 0; }
        .aktion-generating-spinner { width: 36px; height: 36px; border: 3px solid rgba(139,92,246,0.2); border-top-color: #f0d878; border-radius: 50%; animation: aufgaben-spin 0.7s linear infinite; }
        .aktion-generating-text { font-size: 14px; color: rgba(255,255,255,0.5); }
        .aktion-success { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; }
        .aktion-success-icon { font-size: 48px; }
        .aktion-success-text { font-size: 16px; font-weight: 600; color: #4ade80; }
        .aktion-error-msg { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px; color: #f87171; font-size: 13px; margin-bottom: 16px; }
      `}</style>

      <div className="aufgaben-page">
        {/* Header */}
        <div className="aufgaben-header">
          <div className="aufgaben-title">Aufgaben</div>
          {counts && (
            <div className="aufgaben-count">
              {counts.total} offen
              {counts.critical > 0 && <> &middot; <strong>{counts.critical} kritisch</strong></>}
            </div>
          )}
        </div>

        {/* Kategorie-Tabs */}
        <div className="aufgaben-tabs">
          {CATEGORIES.map(({ key, label, icon }) => {
            const count = key === "alle"
              ? (counts?.total || 0)
              : (counts?.byCategory[key] || 0);
            return (
              <button
                key={key}
                className={`aufgaben-tab ${activeCategory === key ? "aufgaben-tab--active" : ""}`}
                onClick={() => setSearchParams(key === "alle" ? {} : { category: key })}
              >
                <span>{icon}</span>
                {label}
                {count > 0 && <span className="aufgaben-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="aufgaben-loading">
            <div className="aufgaben-spinner" />
            Lade Aufgaben...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="aufgaben-empty">
            <div className="aufgaben-empty-icon">
              {activeCategory === "alle" ? "✅" : "📭"}
            </div>
            <div className="aufgaben-empty-text">
              {activeCategory === "alle"
                ? "Keine offenen Aufgaben"
                : `Keine offenen ${CATEGORIES.find(c => c.key === activeCategory)?.label || "Aufgaben"}`}
            </div>
            <div className="aufgaben-empty-sub">
              {activeCategory === "alle"
                ? "Alle Aufgaben sind erledigt. Gut gemacht!"
                : "In dieser Kategorie ist alles erledigt."}
            </div>
          </div>
        )}

        {/* Grouped Items */}
        {!isLoading && (["CRITICAL", "HIGH", "NORMAL", "LOW"] as const).map((priority) => {
          const group = grouped[priority] || [];
          if (group.length === 0) return null;
          return (
            <div className="aufgaben-section" key={priority}>
              <div
                className="aufgaben-section-title"
                style={{ color: PRIORITY_COLORS[priority] || "#94a3b8" }}
              >
                {PRIORITY_LABELS[priority]} ({group.length})
              </div>
              {group.map((item) => {
                const isResolving = resolvingId === item.id;
                const emailConfig = EMAIL_ACTION_CONFIG[item.type];
                return (
                  <div
                    key={item.id}
                    className={`aufgaben-card aufgaben-card--${priority.toLowerCase()}`}
                  >
                    <div className="aufgaben-card-body">
                      <div className="aufgaben-card-title">{item.title}</div>
                      <div className="aufgaben-card-meta">
                        <span>{item.installation.publicId}</span>
                        {item.installation.customerName && <span>· {item.installation.customerName}</span>}
                        {item.installation.gridOperator && <span>· {item.installation.gridOperator}</span>}
                      </div>

                      {item.description && (
                        <div className="aufgaben-card-desc">{item.description}</div>
                      )}

                      <div className="aufgaben-card-badges">
                        {item.sourceType && (
                          <span className="aufgaben-badge aufgaben-badge--source">
                            {SOURCE_LABELS[item.sourceType] || item.sourceType}
                          </span>
                        )}
                        {item.category && (
                          <span className="aufgaben-badge aufgaben-badge--category">
                            {CATEGORIES.find(c => c.key === item.category)?.label || item.category}
                          </span>
                        )}
                        {item.dueDate && (() => {
                          const days = daysUntil(item.dueDate);
                          const overdue = days < 0;
                          return (
                            <span className={`aufgaben-badge ${overdue ? "aufgaben-badge--due-overdue" : "aufgaben-badge--due"}`}>
                              {overdue ? `${Math.abs(days)}d überfällig` : days === 0 ? "Heute fällig" : `Fällig: ${formatDate(item.dueDate)}`}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="aufgaben-card-actions">
                        {emailConfig && (
                          <button
                            className="aufgaben-btn aufgaben-btn--action"
                            onClick={() => startEmailAction(item)}
                          >
                            ✉ {emailConfig.label}
                          </button>
                        )}
                        <button
                          className="aufgaben-btn aufgaben-btn--view"
                          onClick={() => navigate(`/netzanmeldungen/${item.installationId}`)}
                        >
                          Öffnen
                        </button>
                        <button
                          className="aufgaben-btn aufgaben-btn--resolve"
                          onClick={() => handleResolve(item.id)}
                          disabled={isResolving}
                        >
                          {isResolving ? "Wird erledigt..." : "Erledigt ✓"}
                        </button>
                        <button
                          className="aufgaben-btn aufgaben-btn--snooze"
                          onClick={() => setSnoozeId(snoozeId === item.id ? null : item.id)}
                        >
                          Snooze
                        </button>
                      </div>
                    </div>

                    <div className="aufgaben-card-right">
                      <div className="aufgaben-card-time">{timeAgo(item.createdAt)}</div>
                      <div
                        className="aufgaben-card-priority"
                        style={{
                          color: PRIORITY_COLORS[item.priority],
                          background: PRIORITY_BG[item.priority],
                        }}
                      >
                        {PRIORITY_LABELS[item.priority] || item.priority}
                      </div>
                    </div>

                    {/* Snooze Dropdown */}
                    {snoozeId === item.id && (
                      <div className="snooze-dropdown">
                        {[
                          { days: 1, label: "1 Tag" },
                          { days: 3, label: "3 Tage" },
                          { days: 7, label: "1 Woche" },
                        ].map(({ days, label }) => (
                          <div
                            key={days}
                            className="snooze-option"
                            onClick={() => snoozeMut.mutate({ id: item.id, days })}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Email Action Popup */}
      {actionItem && (
        <div className="aktion-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && actionStep !== "sending") closePopup();
        }}>
          <div className="aktion-popup">
            <div className="aktion-popup-title">
              ✉ {EMAIL_ACTION_CONFIG[actionItem.type]?.label || "Email senden"}
            </div>
            <div className="aktion-popup-sub">
              {actionItem.installation.publicId} — {actionItem.installation.customerName || "Kunde"}
              {actionItem.installation.gridOperator && ` — ${actionItem.installation.gridOperator}`}
            </div>

            {/* Step: Generating */}
            {actionStep === "generating" && (
              <div className="aktion-generating">
                <div className="aktion-generating-spinner" />
                <div className="aktion-generating-text">KI generiert Email...</div>
              </div>
            )}

            {/* Step: Editing */}
            {actionStep === "editing" && (
              <>
                <div className="aktion-field">
                  <div className="aktion-label">Empfänger</div>
                  <input
                    className="aktion-input"
                    value={`${emailToName} <${emailTo}>`}
                    readOnly
                  />
                </div>
                <div className="aktion-field">
                  <div className="aktion-label">Betreff</div>
                  <input
                    className="aktion-input"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="aktion-field">
                  <div className="aktion-label">Nachricht</div>
                  <textarea
                    className="aktion-textarea"
                    rows={15}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
                <div className="aktion-buttons">
                  <button className="aktion-btn aktion-btn--cancel" onClick={closePopup}>
                    Abbrechen
                  </button>
                  <button className="aktion-btn aktion-btn--regen" onClick={regenerateEmail}>
                    Neu generieren
                  </button>
                  <button
                    className="aktion-btn aktion-btn--send"
                    onClick={sendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim()}
                  >
                    Senden
                  </button>
                </div>
              </>
            )}

            {/* Step: Sending */}
            {actionStep === "sending" && (
              <div className="aktion-generating">
                <div className="aktion-generating-spinner" />
                <div className="aktion-generating-text">Wird gesendet...</div>
              </div>
            )}

            {/* Step: Done */}
            {actionStep === "done" && (
              <div className="aktion-success">
                <div className="aktion-success-icon">✅</div>
                <div className="aktion-success-text">Email gesendet & Aufgabe erledigt</div>
              </div>
            )}

            {/* Step: Error */}
            {actionStep === "error" && (
              <>
                <div className="aktion-error-msg">
                  {actionError || "Ein unbekannter Fehler ist aufgetreten."}
                </div>
                <div className="aktion-buttons">
                  <button className="aktion-btn aktion-btn--cancel" onClick={closePopup}>
                    Schließen
                  </button>
                  <button className="aktion-btn aktion-btn--regen" onClick={regenerateEmail}>
                    Erneut versuchen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
