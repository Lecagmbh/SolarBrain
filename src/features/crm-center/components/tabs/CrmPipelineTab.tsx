import { useState, useEffect } from "react";
import { C, fmt, badgeStyle } from "../../crm.styles";
import { fetchProjekte, changeStage } from "../../api/crmApi";
import { FLOW_STAGES, stageInfo, anlagenTypInfo } from "../../types/crm.types";
import type { CrmProjekt, CrmStage } from "../../types/crm.types";

export default function CrmPipelineTab({ onSelect }: { onSelect: (p: CrmProjekt) => void }) {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchProjekte({ limit: 200 })
      .then(r => setProjekte(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Pipeline / Kanban</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
        {FLOW_STAGES.map(stage => {
          const items = projekte.filter(p => p.stage === stage.key);
          const total = items.reduce((x, p) => x + (p.geschaetzterWert || 0), 0);
          return (
            <div key={stage.key} style={{ flex: "1 0 180px", minWidth: 180 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: stage.color }}>{stage.icon} {stage.label}</span>
                <span style={{ fontSize: 9, background: "rgba(255,255,255,0.04)", borderRadius: 99, padding: "1px 6px", color: C.textMuted, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Σ {fmt(total)}</div>
              {items.map(p => (
                <div key={p.id} onClick={() => onSelect(p)} className="crm-card" style={{
                  background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "10px 12px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textBright, marginBottom: 3 }}>{p.titel}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{p.ansprechpartner || p.kundenName}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(p.geschaetzterWert)}</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {p.anlagenTypen.slice(0, 2).map(t => {
                        const a = anlagenTypInfo(t);
                        return <span key={t} style={{ fontSize: 8, background: a.color + "15", color: a.color, padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>{a.icon}</span>;
                      })}
                    </div>
                  </div>
                  {p.prioritaet === "DRINGEND" && (
                    <div style={{ marginTop: 4 }}>
                      <span style={badgeStyle(C.redBg, C.red)}>DRINGEND</span>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: C.textMuted, fontSize: 10, border: `1px dashed ${C.border}`, borderRadius: 8 }}>Keine Projekte</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
