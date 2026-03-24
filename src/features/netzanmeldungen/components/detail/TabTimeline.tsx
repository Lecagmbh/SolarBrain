/**
 * Timeline-Tab — Vollständige Historie: wer hat wann was gemacht
 * Lädt Aktivitäten + Kommentare zusammen, sortiert nach Datum.
 */
import { useState, useEffect } from "react";

interface Props { crmId: number }

interface Event { id: number; date: Date; who: string; action: string; detail: string; color: string; icon: string; typ: string }

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  SYSTEM: { icon: "⚙", color: "#f97316" },
  STATUSAENDERUNG: { icon: "🔄", color: "#D4A843" },
  EMAIL: { icon: "📧", color: "#eab308" },
  NB_EMAIL: { icon: "📨", color: "#3b82f6" },
  KI_AKTION: { icon: "🤖", color: "#ef4444" },
  DOKUMENT: { icon: "📄", color: "#06b6d4" },
  ANRUF: { icon: "📞", color: "#22c55e" },
  WHATSAPP: { icon: "💬", color: "#25D366" },
  ANGEBOT: { icon: "📝", color: "#06b6d4" },
  BESUCH: { icon: "🏠", color: "#f0d878" },
  NOTIZ: { icon: "📌", color: "#64748b" },
  KOMMENTAR: { icon: "💬", color: "#EAD068" },
};

export default function TabTimeline({ crmId }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/crm/projekte/${crmId}/aktivitaeten`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/crm/projekte/${crmId}/kommentare`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
    ]).then(([acts, comments]) => {
      const mapped: Event[] = [
        ...(acts || []).map((a: any) => ({
          id: a.id, date: new Date(a.createdAt), who: "System", action: a.titel, detail: a.beschreibung || "",
          color: TYPE_CONFIG[a.typ]?.color || "#64748b", icon: TYPE_CONFIG[a.typ]?.icon || "📋", typ: a.typ,
        })),
        ...(comments || []).map((c: any) => {
          const m = c.text?.match(/^\[([^\]]+)\]\s*/);
          const who = c.isSystem ? "System" : m ? m[1] : "User";
          const text = m ? c.text.replace(m[0], "") : c.text;
          return { id: c.id + 100000, date: new Date(c.createdAt), who, action: text.substring(0, 80), detail: text.length > 80 ? text.substring(80) : "",
            color: c.isSystem ? "#f97316" : "#EAD068", icon: c.isSystem ? "⚙" : "💬", typ: "KOMMENTAR" };
        }),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());
      setEvents(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [crmId]);

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  const visible = showAll ? events : events.slice(0, 30);
  let lastDate = "";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>📜 Timeline</div>
        <span style={{ fontSize: 12, color: "#64748b" }}>{events.length} Einträge</span>
      </div>

      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }} />

        {visible.map((e, i) => {
          const dateStr = e.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;

          return (
            <div key={e.id}>
              {showDate && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", padding: "8px 0 4px", marginLeft: -28, paddingLeft: 28, background: "rgba(10,10,15,0.8)", position: "sticky", top: 140, zIndex: 1 }}>
                  {dateStr}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}
                onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.02)"; }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {/* Dot on timeline */}
                <div style={{ position: "absolute", left: -22, top: 12, width: 12, height: 12, borderRadius: "50%", background: e.color + "20", border: `2px solid ${e.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: e.color }} />
                </div>

                {/* Time */}
                <div style={{ width: 42, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}>
                    {e.date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Icon */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: e.color + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{e.icon}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: e.color }}>{e.who}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0", marginLeft: 6 }}>{e.action}</span>
                  </div>
                  {e.detail && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{e.detail}</div>}
                </div>

                {/* Typ Badge */}
                <span style={{ fontSize: 8, fontWeight: 600, color: e.color, background: e.color + "10", padding: "2px 6px", borderRadius: 4, alignSelf: "flex-start", marginTop: 4 }}>{e.typ}</span>
              </div>
            </div>
          );
        })}
      </div>

      {events.length > 30 && !showAll && (
        <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: "12px", marginTop: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", borderRadius: 8, color: "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Alle {events.length} Einträge anzeigen
        </button>
      )}
      {events.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>Noch keine Aktivitäten.</div>}
    </div>
  );
}
