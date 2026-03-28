import { useState, useCallback } from "react";
import { useTickets } from "./hooks/useTickets";
import { useTicketStats } from "./hooks/useTicketStats";
import { TicketCard } from "./components/TicketCard";
import { TicketFilters } from "./components/TicketFilters";
import { CreateTicketDialog } from "./components/CreateTicketDialog";
import { TicketDetailView } from "./components/TicketDetailView";
import type { FieldTicket } from "./constants";
import { getContextMeta } from "./constants";

const C = {
  bg: "#06060b", bgCard: "rgba(12,12,20,0.85)", bgCardHover: "rgba(18,18,30,0.95)",
  bgPanel: "#060b18", bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryLight: "#EAD068", primaryGlow: "rgba(212,168,67,0.15)",
  red: "#f87171", redBg: "rgba(248,113,113,0.12)",
  green: "#34d399", greenBg: "rgba(52,211,153,0.12)",
  yellow: "#fbbf24", yellowBg: "rgba(251,191,36,0.12)",
  orange: "#fb923c", orangeBg: "rgba(251,146,60,0.12)",
};

export default function TicketCenterPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [contextFilter, setContextFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<FieldTicket | null>(null);

  const params = {
    ...(statusFilter && { status: statusFilter }),
    ...(contextFilter && { context: contextFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
    limit: 100,
  };

  const { tickets, total, loading, refresh } = useTickets(params);
  const { stats, refresh: refreshStats } = useTicketStats();

  const handleRefresh = useCallback(() => { refresh(); refreshStats(); }, [refresh, refreshStats]);

  if (selectedTicket) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
          <TicketDetailView ticketId={selectedTicket.id} onBack={() => { setSelectedTicket(null); handleRefresh(); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.textBright, margin: 0, letterSpacing: -0.5 }}>Ticket Center</h1>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>Field-Level Tickets, Rückfragen & Aufgaben</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 2px 12px ${C.primary}40`,
          }}>
            + Neues Ticket
          </button>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
            <KpiCard label="Gesamt" value={stats.total} color={C.primary} bg={C.primaryGlow} />
            <KpiCard label="Offen" value={stats.open} color={C.red} bg={C.redBg} />
            <KpiCard label="In Bearbeitung" value={stats.inProgress} color={C.yellow} bg={C.yellowBg} />
            <KpiCard label="Wartend" value={stats.waiting} color={C.orange} bg={C.orangeBg} />
            <KpiCard label="Erledigt" value={stats.resolved} color={C.green} bg={C.greenBg} />
          </div>
        )}

        {/* Context chips */}
        {stats?.byContext && Object.keys(stats.byContext).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {Object.entries(stats.byContext).sort((a, b) => b[1] - a[1]).map(([ctx, count]) => {
              const meta = getContextMeta(ctx);
              const isActive = contextFilter === ctx;
              return (
                <button key={ctx} onClick={() => setContextFilter(isActive ? "" : ctx)} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${isActive ? meta.color : C.border}`,
                  background: isActive ? meta.bg : "transparent",
                  color: isActive ? meta.color : C.textMuted, cursor: "pointer",
                }}>
                  {meta.label} <span style={{ fontWeight: 800 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: 16 }}>
          <TicketFilters
            status={statusFilter}
            context={contextFilter}
            priority={priorityFilter}
            onStatusChange={v => { setStatusFilter(v); }}
            onContextChange={v => { setContextFilter(v); }}
            onPriorityChange={v => { setPriorityFilter(v); }}
          />
        </div>

        {/* Ticket List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Tickets werden geladen...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Keine Tickets gefunden</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Erstelle ein neues Ticket oder ändere die Filter</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{total} Ticket{total !== 1 ? "s" : ""}</div>
            {tickets.map(t => (
              <TicketCard key={t.id} ticket={t} onClick={setSelectedTicket} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTicketDialog
          onClose={() => setShowCreate(false)}
          onCreated={handleRefresh}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{
      background: "rgba(12,12,20,0.85)", border: `1px solid rgba(212,168,67,0.08)`,
      borderRadius: 10, padding: "14px 16px", textAlign: "center",
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{label}</div>
    </div>
  );
}
