import { useState } from "react";
import { useInstallationTickets } from "../hooks/useTickets";
import { TicketCard } from "./TicketCard";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { TicketDetailView } from "./TicketDetailView";
import type { FieldTicket } from "../constants";
import { getStatusMeta } from "../constants";

const C = {
  bg: "#0a0a12", bgCard: "rgba(12,12,20,0.85)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
};

interface TicketSidebarPanelProps {
  installationId: number;
}

export function TicketSidebarPanel({ installationId }: TicketSidebarPanelProps) {
  const { tickets, loading, refresh } = useInstallationTickets(installationId);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<FieldTicket | null>(null);
  const [filter, setFilter] = useState<string>("");

  const filtered = filter ? tickets.filter(t => t.status === filter) : tickets;
  const openCount = tickets.filter(t => ["open", "in_progress", "waiting"].includes(t.status)).length;

  if (selected) {
    return <TicketDetailView ticketId={selected.id} onBack={() => { setSelected(null); refresh(); }} />;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textBright }}>Tickets</span>
          {openCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
              {openCount} offen
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "none",
            background: C.primary, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          + Ticket
        </button>
      </div>

      {/* Quick filters */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 4, borderBottom: `1px solid ${C.border}` }}>
        {[{ v: "", l: `Alle (${tickets.length})` }, { v: "open", l: "Offen" }, { v: "in_progress", l: "In Arbeit" }, { v: "resolved", l: "Erledigt" }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} style={{
            padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
            border: `1px solid ${filter === f.v ? C.primary : C.border}`,
            background: filter === f.v ? C.primaryGlow : "transparent",
            color: filter === f.v ? C.primary : C.textMuted, cursor: "pointer",
          }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: C.textMuted, fontSize: 12 }}>Laden...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: C.textMuted, fontSize: 12 }}>
            {tickets.length === 0 ? "Keine Tickets vorhanden" : "Keine Tickets mit diesem Filter"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map(t => (
              <TicketCard key={t.id} ticket={t} compact onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTicketDialog
          installationId={installationId}
          onClose={() => setShowCreate(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}
