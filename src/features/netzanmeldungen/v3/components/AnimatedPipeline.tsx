/**
 * Animated Pipeline — Baunity D2D Sales Pipeline
 * LEAD → TERMIN → ANGEBOT → VERKAUFT → INSTALLATION → FERTIG
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

function Arrow({ color = "#64748b" }: { color?: string }) {
  return (
    <div className="pipe-arrow">
      <svg width="24" height="32" viewBox="0 0 24 32">
        <path d="M5 8 L17 16 L5 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.3">
          <animate attributeName="opacity" values="0.15;0.5;0.15" dur="2s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

interface Props {
  counts: PipelineCounts;
  activeFilter: string | null;
  onFilter: (key: string) => void;
  isStaff: boolean;
}

// Map legacy GridNetz counts to D2D pipeline
function mapCounts(counts: PipelineCounts) {
  return {
    lead: (counts as any).lead || counts.eingang || 0,
    termin: (counts as any).termin || counts.beim_nb || 0,
    angebot: (counts as any).angebot || counts.rueckfrage || 0,
    verkauft: (counts as any).verkauft || counts.genehmigt || 0,
    installation: (counts as any).installation || counts.ibn || 0,
    fertig: counts.fertig || 0,
  };
}

export default function AnimatedPipeline({ counts, activeFilter, onFilter }: Props) {
  const d2d = mapCounts(counts);

  return (
    <div style={{ padding: "14px 24px 10px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 700 }}>
        {/* AKQUISE */}
        <div style={{ flex: 1.2 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span className="pipe-label" style={{ "--lc1": "#D4A84320", "--lc2": "#3b82f620", color: "#D4A843" } as any}>AKQUISE</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <PipelineStage label="LEADS" count={d2d.lead} color="#D4A843" active={activeFilter === "lead" || activeFilter === "eingang"} onClick={() => onFilter("lead")} delay={0} pulse={d2d.lead > 0} />
            <PipelineStage label="TERMINE" count={d2d.termin} color="#3b82f6" active={activeFilter === "termin" || activeFilter === "beim_nb"} onClick={() => onFilter("termin")} delay={80} />
            <PipelineStage label="ANGEBOTE" count={d2d.angebot} color="#8b5cf6" active={activeFilter === "angebot" || activeFilter === "rueckfrage"} onClick={() => onFilter("angebot")} delay={160} />
          </div>
        </div>

        <Arrow color="#D4A843" />

        {/* ABSCHLUSS */}
        <div style={{ flex: 1.2 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span className="pipe-label" style={{ "--lc1": "#22c55e20", "--lc2": "#f59e0b20", color: "#22c55e" } as any}>ABSCHLUSS</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <PipelineStage label="VERKAUFT" count={d2d.verkauft} color="#22c55e" active={activeFilter === "verkauft" || activeFilter === "genehmigt"} onClick={() => onFilter("verkauft")} delay={240} />
            <PipelineStage label="INSTALLATION" count={d2d.installation} color="#f59e0b" active={activeFilter === "installation" || activeFilter === "ibn"} onClick={() => onFilter("installation")} delay={320} />
            <PipelineStage label="FERTIG" count={d2d.fertig} color="#64748b" active={activeFilter === "fertig"} onClick={() => onFilter("fertig")} delay={400} />
          </div>
        </div>
      </div>
    </div>
  );
}
