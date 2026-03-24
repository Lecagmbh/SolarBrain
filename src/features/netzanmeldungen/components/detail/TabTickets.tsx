/**
 * Tickets-Tab — Zeigt Tickets für dieses Projekt, erstellen + antworten
 */
import { useState, useEffect } from "react";

interface Ticket { id: number; title: string; message: string; status: string; priority: string; context: string; authorName: string; createdAt: string; replies?: any[] }
interface Props { crmId: number; installationId?: number | null }

const PRIO_COLORS: Record<string, { bg: string; c: string }> = {
  critical: { bg: "rgba(239,68,68,0.08)", c: "#ef4444" },
  high: { bg: "rgba(249,115,22,0.08)", c: "#f97316" },
  normal: { bg: "rgba(234,179,8,0.08)", c: "#eab308" },
  low: { bg: "rgba(100,116,139,0.08)", c: "#64748b" },
};
const STATUS_COLORS: Record<string, { bg: string; c: string }> = {
  open: { bg: "rgba(239,68,68,0.08)", c: "#ef4444" },
  in_progress: { bg: "rgba(212,168,67,0.08)", c: "#D4A843" },
  waiting: { bg: "rgba(234,179,8,0.08)", c: "#eab308" },
  resolved: { bg: "rgba(34,197,94,0.08)", c: "#22c55e" },
  wontfix: { bg: "rgba(100,116,139,0.08)", c: "#64748b" },
};
const CTX_ICONS: Record<string, string> = { vde_form: "📋", technik: "⚡", kunde: "👤", standort: "📍", nb: "🏢", dokument: "📄", allgemein: "📌" };

export default function TabTickets({ crmId, installationId }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [newCtx, setNewCtx] = useState("allgemein");
  const [newPrio, setNewPrio] = useState("normal");

  const load = () => {
    if (!installationId) { setLoading(false); return; }
    fetch(`/api/tickets/installation/${installationId}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setTickets).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [installationId]);

  const createTicket = async () => {
    if (!newTitle.trim() || !installationId) return;
    await fetch("/api/tickets", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installationId, title: newTitle, message: newMsg, context: newCtx, priority: newPrio }),
    });
    setNewTitle(""); setNewMsg(""); setShowNew(false); load();
  };

  if (!installationId) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Keine Installation verknüpft</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Tickets benötigen eine verknüpfte Installation.</div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  const open = tickets.filter(t => t.status === "open" || t.status === "in_progress");
  const closed = tickets.filter(t => t.status === "resolved" || t.status === "wontfix");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>🎫 Tickets {open.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginLeft: 6 }}>{open.length} offen</span>}</div>
        <button onClick={() => setShowNew(!showNew)} style={{ background: "#D4A843", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Neues Ticket</button>
      </div>

      {showNew && (
        <div style={{ background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.12)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titel..." style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 8 }} />
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Beschreibung..." rows={2} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={newCtx} onChange={e => setNewCtx(e.target.value)} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 11, outline: "none" }}>
              {Object.entries(CTX_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
            <select value={newPrio} onChange={e => setNewPrio(e.target.value)} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontSize: 11, outline: "none" }}>
              {["low", "normal", "high", "critical"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={createTicket} disabled={!newTitle.trim()} style={{ background: newTitle.trim() ? "#22c55e" : "#1e1e3a", color: newTitle.trim() ? "#fff" : "#475569", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: newTitle.trim() ? "pointer" : "default", marginLeft: "auto" }}>Erstellen</button>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Offene Tickets */}
      {open.map(t => {
        const pc = PRIO_COLORS[t.priority] || PRIO_COLORS.normal;
        const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
        return (
          <div key={t.id} style={{ padding: "12px 16px", background: "rgba(17,20,35,0.95)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 6, borderLeft: `3px solid ${pc.c}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{CTX_ICONS[t.context] || "📌"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{t.title}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: pc.bg, color: pc.c }}>{t.priority}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.c }}>{t.status}</span>
              </div>
            </div>
            {t.message && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, lineHeight: 1.5 }}>{t.message}</div>}
            <div style={{ fontSize: 10, color: "#475569" }}>{t.authorName || "System"} · {new Date(t.createdAt).toLocaleDateString("de-DE")}</div>
          </div>
        );
      })}

      {/* Geschlossene */}
      {closed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Geschlossen ({closed.length})</div>
          {closed.map(t => (
            <div key={t.id} style={{ padding: "8px 14px", background: "rgba(17,20,35,0.5)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 4, opacity: 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{CTX_ICONS[t.context] || ""} {t.title}</span>
                <span style={{ fontSize: 10, color: "#22c55e" }}>✓ {t.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tickets.length === 0 && !showNew && (
        <div style={{ padding: 24, textAlign: "center", color: "#22c55e", fontSize: 13 }}>✓ Keine Tickets — alles erledigt</div>
      )}
    </div>
  );
}
