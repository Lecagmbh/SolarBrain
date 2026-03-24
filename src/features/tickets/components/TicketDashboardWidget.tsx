import { useTicketStats } from "../hooks/useTicketStats";
import { useMyTickets } from "../hooks/useTickets";
import { getContextMeta, getPriorityMeta } from "../constants";

const C = {
  bgCard: "rgba(12,12,20,0.85)", border: "rgba(212,168,67,0.08)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
  red: "#f87171", redBg: "rgba(248,113,113,0.12)",
  green: "#34d399", greenBg: "rgba(52,211,153,0.12)",
  yellow: "#fbbf24", yellowBg: "rgba(251,191,36,0.12)",
  orange: "#fb923c", orangeBg: "rgba(251,146,60,0.12)",
};

export function TicketDashboardWidget({ onNavigate }: { onNavigate?: () => void }) {
  const { stats, loading: statsLoading } = useTicketStats();
  const { tickets: myTickets, loading: myLoading } = useMyTickets();

  if (statsLoading || myLoading) {
    return <WidgetShell><div style={{ color: C.textMuted, fontSize: 12, textAlign: "center", padding: 20 }}>Tickets laden...</div></WidgetShell>;
  }

  const criticalCount = stats?.byPriority?.critical || 0;

  return (
    <WidgetShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textBright, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          Tickets
          {criticalCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: C.redBg, color: C.red }}>{criticalCount} kritisch</span>
          )}
        </h3>
        {onNavigate && (
          <button onClick={onNavigate} style={{ fontSize: 11, color: C.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Alle anzeigen →
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
        <KpiBox label="Offen" value={stats?.open || 0} color={C.red} bg={C.redBg} />
        <KpiBox label="In Arbeit" value={stats?.inProgress || 0} color={C.yellow} bg={C.yellowBg} />
        <KpiBox label="Wartend" value={stats?.waiting || 0} color={C.orange} bg={C.orangeBg} />
        <KpiBox label="Erledigt" value={stats?.resolved || 0} color={C.green} bg={C.greenBg} />
      </div>

      {/* Context breakdown */}
      {stats?.byContext && Object.keys(stats.byContext).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Nach Kontext</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(stats.byContext).map(([ctx, count]) => {
              const meta = getContextMeta(ctx);
              return (
                <span key={ctx} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: meta.bg, color: meta.color }}>
                  {meta.label}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* My tickets */}
      {myTickets.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Meine Tickets</div>
          {myTickets.slice(0, 5).map(t => {
            const prio = getPriorityMeta(t.priority);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 11, color: C.text }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: prio.color }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                {t.installation && <span style={{ color: C.textMuted, fontSize: 10 }}>{t.installation.publicId}</span>}
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function WidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: 16,
    }}>
      {children}
    </div>
  );
}

function KpiBox({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 600, color, opacity: 0.8 }}>{label}</div>
    </div>
  );
}
