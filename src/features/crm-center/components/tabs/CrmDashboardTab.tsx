import { useState, useEffect } from "react";
import { C, fmt, badgeStyle, cardStyle } from "../../crm.styles";
import { fetchPipelineStats, fetchProjekte } from "../../api/crmApi";
import { FLOW_STAGES, stageInfo } from "../../types/crm.types";
import type { CrmProjekt, PipelineStats } from "../../types/crm.types";

export default function CrmDashboardTab({ onSelect }: { onSelect: (p: CrmProjekt) => void }) {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPipelineStats(), fetchProjekte({ limit: 100 })])
      .then(([s, p]) => { setStats(s); setProjekte(p.items); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;
  if (!stats) return <div style={{ color: C.textMuted, padding: 40 }}>Keine Daten</div>;

  const s = stats.summary;

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 20 }}>Dashboard</div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Aktive Projekte", value: s.aktiv, color: C.primary },
          { label: "Pipeline-Wert", value: fmt(s.pipelineWert), color: C.primaryLight },
          { label: "NB-Vorgänge aktiv", value: s.nbAktiv, color: C.yellow },
          { label: "Conversion Rate", value: `${s.conversionRate}%`, color: C.orange },
          { label: "Genehmigt / Fertig", value: s.gewonnen, color: C.green },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.color }} />
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.textBright, letterSpacing: -1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Projekte nach Stage + Pipeline Wert */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>Projekte nach Stage</div>
          {FLOW_STAGES.map(stage => {
            const items = projekte.filter(p => p.stage === stage.key);
            if (!items.length) return null;
            const total = items.reduce((x, p) => x + (p.geschaetzterWert || 0), 0);
            return (
              <div key={stage.key} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{stage.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, textTransform: "uppercase" }}>{stage.label}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>({items.length})</span>
                  <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto", fontFamily: "'DM Mono', monospace" }}>{fmt(total)}</span>
                </div>
                {items.map(p => (
                  <div key={p.id} onClick={() => onSelect(p)} style={{ padding: "8px 12px", ...cardStyle, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.15s" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.titel}</span>
                      <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 8 }}>{p.kundenName}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(p.geschaetzterWert)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>Pipeline-Übersicht</div>
          {stats.stages.map(st => {
            const info = stageInfo(st.stage);
            const pct = s.total > 0 ? (st.count / s.total) * 100 : 0;
            return (
              <div key={st.stage} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, width: 24, textAlign: "center" }}>{info.icon}</span>
                <span style={{ fontSize: 11, color: C.textDim, width: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.label}</span>
                <div style={{ flex: 1, height: 16, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: info.color + "60", borderRadius: 4, minWidth: st.count > 0 ? 8 : 0, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono', monospace", minWidth: 24, textAlign: "right" }}>{st.count}</span>
                <span style={{ fontSize: 10, color: C.accent, fontFamily: "'DM Mono', monospace", minWidth: 80, textAlign: "right" }}>{fmt(st.wert)}</span>
              </div>
            );
          })}

          <div style={{ ...cardStyle, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright, marginBottom: 8 }}>Kennzahlen</div>
            {[
              ["Ø Verkaufszyklus", `${s.avgCycleDays} Tage`],
              ["Conversion Rate", `${s.conversionRate}%`],
              ["Gewonnen-Wert", fmt(s.gewonnenWert)],
              ["Pipeline gesamt", fmt(s.pipelineWert)],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
