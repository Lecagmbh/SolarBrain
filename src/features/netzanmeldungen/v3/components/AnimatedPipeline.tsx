/**
 * Animated Pipeline — Baunity D2D Sales Pipeline
 * ZU KONTAKTIEREN → KONTAKTIERT → QUALIFIZIERT | DISQUALIFIZIERT
 */
import { useCountUp } from "../hooks/useCountUp";
import type { PipelineCounts } from "../types";

function PipelineStage({ label, count, color, sub, active, onClick, delay = 0, pulse }: {
  label: string; count: number; color: string; sub?: string; active: boolean; onClick: () => void; delay?: number; pulse?: boolean;
}) {
  const animated = useCountUp(count, 1400);
  return (
    <div className={`pipe-stage ${active ? "active" : ""}`}
      style={{ "--bg": color, "--bc": color + "60", animationDelay: `${delay}ms` } as any}
      onClick={onClick}>
      <div className="count" style={{ color, textShadow: `0 0 24px ${color}50, 0 0 48px ${color}20` }}>{animated}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color, opacity: 0.95, marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{sub}</div>}
      {pulse && count > 0 && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}80, 0 0 16px ${color}40`, animation: "flowPulse 1s infinite" }} />
      )}
      <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${color}80, transparent)`, boxShadow: `0 0 8px ${color}40` }} />
    </div>
  );
}

interface Props {
  counts: PipelineCounts;
  activeFilter: string | null;
  onFilter: (key: string) => void;
  isStaff: boolean;
}

// Map counts to 3-stage pipeline
function mapCounts(counts: PipelineCounts) {
  return {
    zuKontaktieren: (counts as any).lead || counts.eingang || 0,
    kontaktiert: (counts as any).kontaktiert || counts.beim_nb || 0,
    qualifiziert: (counts as any).qualifiziert || counts.rueckfrage || counts.genehmigt || 0,
    disqualifiziert: (counts as any).disqualifiziert || 0,
  };
}

export default function AnimatedPipeline({ counts, activeFilter, onFilter }: Props) {
  const d2d = mapCounts(counts);
  const gesamt = d2d.zuKontaktieren + d2d.kontaktiert + d2d.qualifiziert;

  return (
    <div style={{ padding: "14px 24px 10px" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", minWidth: 500 }}>
        <PipelineStage label="ZU KONTAKTIEREN" count={d2d.zuKontaktieren} color="#D4A843" active={activeFilter === "lead" || activeFilter === "eingang"} onClick={() => onFilter("lead")} delay={0} pulse={d2d.zuKontaktieren > 0} />
        <PipelineStage label="KONTAKTIERT" count={d2d.kontaktiert} color="#3b82f6" sub="In Bearbeitung" active={activeFilter === "kontaktiert" || activeFilter === "beim_nb"} onClick={() => onFilter("kontaktiert")} delay={80} />
        <PipelineStage label="QUALIFIZIERT" count={d2d.qualifiziert} color="#22c55e" sub="Angebot möglich" active={activeFilter === "qualifiziert"} onClick={() => onFilter("qualifiziert")} delay={160} />

        {/* Gesamt + Disqualifiziert */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90, paddingTop: 4 }}>
          <div style={{ textAlign: "center", padding: "10px 8px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", letterSpacing: -1 }}>{gesamt}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#71717a", letterSpacing: 0.5 }}>GESAMT</div>
          </div>
          <div
            onClick={() => onFilter("disqualifiziert")}
            style={{
              textAlign: "center", padding: "6px 8px", borderRadius: 8, cursor: "pointer",
              background: activeFilter === "disqualifiziert" ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
              border: activeFilter === "disqualifiziert" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(239,68,68,0.15)",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{d2d.disqualifiziert}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#ef4444", opacity: 0.7, letterSpacing: 0.3 }}>DISQUALIFIZIERT</div>
          </div>
        </div>
      </div>
    </div>
  );
}
