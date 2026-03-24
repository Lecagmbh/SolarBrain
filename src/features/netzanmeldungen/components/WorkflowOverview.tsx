/**
 * WORKFLOW OVERVIEW v3.0 — CRM + NB + Abschluss Pipeline
 * Drei Gruppen mit Connector-Pfeilen:
 * CRM (Anfrage → Angebot → Auftrag) → NB (Beim NB → Rückfrage → Genehmigt) → Abschluss (Montage → IBN → Fertig)
 */
import { useStats } from "../hooks/useEnterpriseApi";
import "./WorkflowOverview.css";

interface WorkflowOverviewProps {
  onStatusClick: (status: string | null) => void;
  activeStatus: string | null;
  showCrmStages?: boolean;
}

const C = {
  card: "rgba(15,15,28,0.8)", border: "rgba(255,255,255,0.06)",
  primary: "#D4A843", pL: "#EAD068", accent: "#a5b4fc",
  bright: "#f8fafc", muted: "#64748b",
  green: "#22c55e", red: "#ef4444", cyan: "#06b6d4",
  orange: "#f97316", pink: "#ec4899",
};

const Arrow = ({ color }: { color: string }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "16px 2px 0" }}>
    <svg width="16" height="24" viewBox="0 0 16 24">
      <path d="M3 4 L11 12 L3 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  </div>
);

export function WorkflowOverview({ onStatusClick, activeStatus, showCrmStages = true }: WorkflowOverviewProps) {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 16px", marginBottom: 16 }}>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>Pipeline wird geladen...</div>
      </div>
    );
  }

  const s = stats as any;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* CRM STAGES — nur wenn CRM-Zugang */}
        {showCrmStages && (<>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.primary, textAlign: "center", marginBottom: 6, background: C.primary + "08", borderRadius: 4, padding: "2px 0" }}>CRM</div>
            <div style={{ display: "flex", gap: 3 }}>
              {[
                { l: "ANFRAGE", c: s.eingang || 0, color: C.muted, key: "eingang" },
                { l: "ANGEBOT", c: 0, color: C.cyan, key: null },
                { l: "AUFTRAG", c: 0, color: C.primary, key: null },
              ].map((st, i) => (
                <div key={i} onClick={() => st.key && onStatusClick(activeStatus === st.key ? null : st.key)}
                  style={{ flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 6, background: st.color + "05", cursor: st.key ? "pointer" : "default", transition: "all 0.1s" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: st.color === C.muted ? C.bright : st.color }}>{st.c}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 0.3 }}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
          <Arrow color={C.primary} />
        </>)}

        {/* NB STAGES */}
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.orange, textAlign: "center", marginBottom: 6, background: C.orange + "08", borderRadius: 4, padding: "2px 0" }}>NETZANMELDUNG</div>
          <div style={{ display: "flex", gap: 3 }}>
            {[
              { l: "BEIM NB", c: s.beimNb || 0, color: C.pL, key: "beim-nb", sub: s.avgDaysBeimNb > 0 ? `Ø ${Math.round(s.avgDaysBeimNb)} Tage` : undefined },
              { l: "RÜCKFRAGE", c: s.rueckfrage || 0, color: C.red, key: "rueckfrage", hl: (s.rueckfrage || 0) > 0 },
              { l: "GENEHMIGT", c: s.genehmigt || 0, color: C.green, key: "genehmigt" },
            ].map((st, i) => (
              <div key={i} onClick={() => onStatusClick(activeStatus === st.key ? null : st.key)}
                style={{ flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 6, cursor: "pointer",
                  border: st.hl ? `1px solid ${C.red}25` : "1px solid transparent",
                  background: st.hl ? C.red + "05" : st.color + "04", transition: "all 0.1s" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: st.hl ? C.red : C.bright }}>{st.c}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 0.3 }}>{st.l}</div>
                {st.sub && <div style={{ fontSize: 7, color: st.hl ? C.red : C.muted }}>{st.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {showCrmStages && (<>
          <Arrow color={C.green} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.pink, textAlign: "center", marginBottom: 6, background: C.pink + "08", borderRadius: 4, padding: "2px 0" }}>ABSCHLUSS</div>
            <div style={{ display: "flex", gap: 3 }}>
              {[
                { l: "MONTAGE", c: 0, color: C.pink, key: null },
                { l: "IBN", c: s.ibn || 0, color: C.orange, key: "ibn" },
                { l: "FERTIG", c: s.fertig || 0, color: C.green, key: "fertig" },
              ].map((st, i) => (
                <div key={i} onClick={() => st.key && onStatusClick(activeStatus === st.key ? null : st.key)}
                  style={{ flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 6, background: st.color + "04", cursor: st.key ? "pointer" : "default", transition: "all 0.1s" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: st.color }}>{st.c}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 0.3 }}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </div>

      {/* Legend */}
      {showCrmStages && <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "center" }}>
        {[{ c: C.primary, l: "CRM-Stages" }, { c: C.orange, l: "Netzanmeldung" }, { c: C.pink, l: "Abschluss" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: x.c }} />
            <span style={{ fontSize: 9, color: C.muted }}>{x.l}</span>
          </div>
        ))}
      </div>}

      {/* Active filter indicator */}
      {activeStatus && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 6 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Gefiltert:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>{activeStatus}</span>
          <button onClick={() => onStatusClick(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11 }}>× Aufheben</button>
        </div>
      )}
    </div>
  );
}

export default WorkflowOverview;
