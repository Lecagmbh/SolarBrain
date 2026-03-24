/**
 * Verlauf-Tab — Vollständige, bidirektionale Projekt-Timeline
 * Zeigt: Emails, Status-Änderungen, Kommentare, Dokumente, CRM-Sync, KI-Aktionen
 * Für Kunden gefiltert (keine internen Notizen, keine KI-Details)
 */
import { useState, useEffect } from "react";

interface Props {
  installationId: number;
  crmId?: number;
  isStaff?: boolean;
}

interface VerlaufEvent {
  id: string;
  ts: Date;
  type: string;
  author: string;
  title: string;
  detail?: string;
  internal: boolean;
  source: string;
  meta?: Record<string, string>;
}

const TYPE_CFG: Record<string, { icon: string; color: string; label: string }> = {
  EMAIL_IN:     { icon: "📨", color: "#38bdf8", label: "Email empfangen" },
  EMAIL_OUT:    { icon: "📤", color: "#34d399", label: "Email gesendet" },
  STATUS:       { icon: "⚡", color: "#f0d878", label: "Status" },
  COMMENT:      { icon: "💬", color: "#EAD068", label: "Kommentar" },
  CRM_COMMENT:  { icon: "📊", color: "#D4A843", label: "CRM-Kommentar" },
  FACTRO:       { icon: "🔄", color: "#fb923c", label: "Factro" },
  DOCUMENT:     { icon: "📎", color: "#06b6d4", label: "Dokument" },
  SYSTEM:       { icon: "⚙",  color: "#64748b", label: "System" },
  KI:           { icon: "🧠", color: "#f472b6", label: "KI-Analyse" },
  WF_EVENT:     { icon: "📋", color: "#f97316", label: "Workflow" },
};

const badge = (bg: string, c: string, t: string) => (
  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: bg, color: c, whiteSpace: "nowrap" as const }}>{t}</span>
);

export default function TabVerlauf({ installationId, crmId, isStaff = false }: Props) {
  const [events, setEvents] = useState<VerlaufEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("baunity_token") || "";
    const headers = { Authorization: `Bearer ${token}` };
    const opts = { headers, credentials: "include" as const };

    const fetches: Promise<VerlaufEvent[]>[] = [];

    // 1. Installation-Details (statusHistory, comments, emails, documents)
    fetches.push(
      fetch(`/api/installations/${installationId}`, opts)
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          const d = res?.data || res;
          if (!d) return [];
          const items: VerlaufEvent[] = [];

          // Status-History
          (d.statusHistory || []).forEach((sh: any, i: number) => {
            items.push({
              id: `sh-${sh.id || i}`,
              ts: new Date(sh.createdAt || sh.created_at),
              type: "STATUS",
              author: sh.changedByName || sh.changed_by_name || "System",
              title: sh.statusLabel || `${sh.fromStatus || sh.from_status} → ${sh.toStatus || sh.to_status}`,
              internal: false,
              source: "gridnetz",
              meta: { von: sh.fromStatus || sh.from_status || "", nach: sh.toStatus || sh.to_status || "" },
            });
          });

          // Comments
          (d.comments || []).forEach((c: any, i: number) => {
            const m = c.text?.match(/^\[([^\]]+)\]\s*/);
            const who = c.isSystem ? "System" : m ? m[1] : (c.authorName || "User");
            const text = m ? c.text.replace(m[0], "") : c.text;
            items.push({
              id: `com-${c.id || i}`,
              ts: new Date(c.createdAt),
              type: c.isSystem ? "SYSTEM" : (c.isInternal ? "COMMENT" : "COMMENT"),
              author: who,
              title: text,
              detail: undefined,
              internal: c.isInternal || false,
              source: "gridnetz",
            });
          });

          // Documents
          (d.documents || []).forEach((doc: any, i: number) => {
            items.push({
              id: `doc-${doc.id || i}`,
              ts: new Date(doc.createdAt),
              type: "DOCUMENT",
              author: doc.uploadedByName || "Upload",
              title: `Dokument: ${doc.originalName || doc.dateiname || "Datei"}`,
              detail: doc.kategorie ? `Kategorie: ${doc.kategorie}` : undefined,
              internal: false,
              source: "gridnetz",
            });
          });

          return items;
        })
        .catch(() => [])
    );

    // 2. Workflow V2 Timeline Events
    fetches.push(
      fetch(`/api/v2/installations/${installationId}/timeline?limit=100`, opts)
        .then(r => r.ok ? r.json() : { events: [] })
        .then(res => {
          return (res.events || []).map((e: any, i: number) => ({
            id: `wf-${e.id || i}`,
            ts: new Date(e.createdAt),
            type: e.type === "email_sent" ? "EMAIL_OUT" : e.type === "nb_response_received" ? "EMAIL_IN" : e.type === "phase_changed" ? "STATUS" : "WF_EVENT",
            author: e.payload?.source || "Workflow",
            title: e.payload?.comment || e.type.replace(/_/g, " "),
            detail: e.payload ? JSON.stringify(e.payload).substring(0, 200) : undefined,
            internal: e.type === "automation_executed" || e.type === "error_occurred",
            source: "workflow",
            meta: e.payload?.fromPhase ? { phase: `${e.payload.fromPhase}:${e.payload.fromZustand} → ${e.payload.toPhase}:${e.payload.toZustand}` } : undefined,
          }));
        })
        .catch(() => [])
    );

    // 3. Emails für diese Installation
    fetches.push(
      fetch(`/api/installations/${installationId}/emails`, opts)
        .then(r => r.ok ? r.json() : [])
        .then((emails: any) => {
          return (Array.isArray(emails) ? emails : emails?.emails || []).map((e: any, i: number) => ({
            id: `email-${e.id || i}`,
            ts: new Date(e.createdAt || e.sentAt || e.receivedAt),
            type: e.direction === "INCOMING" ? "EMAIL_IN" : "EMAIL_OUT",
            author: e.direction === "INCOMING" ? (e.fromEmail || "NB") : "Baunity",
            title: `${e.direction === "INCOMING" ? "Email empfangen" : "Email gesendet"}: ${e.subject || "—"}`,
            detail: e.bodyText?.substring(0, 200),
            internal: false,
            source: "email",
            meta: { von: e.fromEmail || "", an: e.toEmail || "", betreff: e.subject || "" },
          }));
        })
        .catch(() => [])
    );

    // 4. CRM-Kommentare (wenn verknüpft)
    if (crmId && crmId > 0) {
      fetches.push(
        fetch(`/api/crm/projekte/${crmId}/kommentare`, opts)
          .then(r => r.ok ? r.json() : [])
          .then((comments: any[]) => {
            return (comments || []).map((c: any, i: number) => {
              const m = c.text?.match(/^\[([^\]]+)\]\s*/);
              const who = c.isSystem ? "System" : m ? m[1] : "CRM";
              const text = m ? c.text.replace(m[0], "") : c.text;
              const isFactro = text.includes("Factro") || who.includes("Factro") || (c.source === "factro");
              return {
                id: `crm-${c.id || i}`,
                ts: new Date(c.createdAt),
                type: isFactro ? "FACTRO" : "CRM_COMMENT",
                author: who,
                title: text.substring(0, 120),
                detail: text.length > 120 ? text.substring(120) : undefined,
                internal: false,
                source: isFactro ? "factro" : "crm",
              };
            });
          })
          .catch(() => [])
      );
    }

    Promise.all(fetches).then(results => {
      const all = results.flat();
      // Deduplizierung: gleicher Timestamp + ähnlicher Title = Skip
      const seen = new Set<string>();
      const deduped = all.filter(e => {
        const key = `${e.ts.getTime()}-${e.type}-${e.title.substring(0, 30)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => b.ts.getTime() - a.ts.getTime());
      setEvents(deduped);
    }).finally(() => setLoading(false));
  }, [installationId, crmId]);

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  const filtered = events.filter(e => {
    if (!isStaff && e.internal) return false;
    if (!isStaff && e.type === "KI") return false;
    if (!isStaff && e.type === "WF_EVENT") return false;
    if (filter !== "all" && e.type !== filter) return false;
    return true;
  });

  const visible = showAll ? filtered : filtered.slice(0, 40);
  let lastDate = "";

  const types = [...new Set(events.map(e => e.type))];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>📜 Projekt-Verlauf</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>{filtered.length} Einträge</span>
          {crmId && crmId > 0 && badge("rgba(212,168,67,0.10)", "#EAD068", `CRM #${crmId}`)}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")} style={{
          padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: filter === "all" ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.03)",
          color: filter === "all" ? "#a5b4fc" : "#64748b",
        }}>Alle</button>
        {types.map(t => {
          const cfg = TYPE_CFG[t] || { icon: "📋", color: "#64748b", label: t };
          return (
            <button key={t} onClick={() => setFilter(filter === t ? "all" : t)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: filter === t ? cfg.color + "20" : "rgba(255,255,255,0.03)",
              color: filter === t ? cfg.color : "#64748b",
            }}>{cfg.icon} {cfg.label}</button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }} />

        {visible.map((e, i) => {
          const cfg = TYPE_CFG[e.type] || { icon: "📋", color: "#64748b", label: e.type };
          const dateStr = e.ts.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;

          return (
            <div key={e.id}>
              {showDate && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", padding: "8px 0 4px", marginLeft: -28, paddingLeft: 28, background: "rgba(10,10,15,0.8)", position: "sticky", top: 140, zIndex: 1 }}>
                  {dateStr}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, padding: "8px 4px", position: "relative", borderRadius: 6, transition: "all 0.1s", borderLeft: e.internal ? "2px dashed rgba(251,191,36,0.3)" : "2px solid transparent" }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.03)"; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}>

                {/* Dot */}
                <div style={{ position: "absolute", left: -22, top: 12, width: 12, height: 12, borderRadius: "50%", background: cfg.color + "20", border: `2px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color }} />
                </div>

                {/* Time */}
                <div style={{ width: 42, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}>
                    {e.ts.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Icon */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.color + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{cfg.icon}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{e.author}</span>
                    {badge(cfg.color + "15", cfg.color, cfg.label)}
                    {e.internal && badge("rgba(251,191,36,0.12)", "#fbbf24", "🔒 Intern")}
                    {e.source === "factro" && badge("rgba(251,146,60,0.12)", "#fb923c", "🔄 Factro")}
                    {e.source === "crm" && badge("rgba(212,168,67,0.12)", "#EAD068", "📊 CRM")}
                  </div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{e.title}</div>
                  {e.detail && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{e.detail}</div>}
                  {e.meta && (
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      {Object.entries(e.meta).filter(([,v]) => v).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{k}: {v}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 40 && !showAll && (
        <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: "12px", marginTop: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", borderRadius: 8, color: "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Alle {filtered.length} Einträge anzeigen
        </button>
      )}
      {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>Noch keine Aktivitäten.</div>}
    </div>
  );
}
