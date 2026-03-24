import { useState, useEffect } from "react";
import { C, fmt, cardStyle } from "../../crm.styles";
import { fetchPipelineStats, fetchProjekte } from "../../api/crmApi";
import type { CrmProjekt, PipelineStats } from "../../types/crm.types";

export default function CrmBerichteTab() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);

  useEffect(() => {
    fetchPipelineStats().then(setStats).catch(() => {});
    fetchProjekte({ limit: 200 }).then(r => setProjekte(r.items)).catch(() => {});
  }, []);

  const total = projekte.reduce((s, p) => s + (p.geschaetzterWert || 0), 0);
  const avgWert = projekte.length > 0 ? total / projekte.length : 0;

  // Group by NB (using ort as proxy since we don't have NB name in list)
  const byOrt = projekte.reduce((acc, p) => {
    const key = p.ort || "Unbekannt";
    acc[key] = (acc[key] || 0) + (p.geschaetzterWert || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Projektberichte</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Gesamtwert", v: fmt(total), c: C.primary },
          { l: "Durchschn. Wert", v: fmt(avgWert), c: C.primaryLight },
          { l: "Projekte gesamt", v: projekte.length, c: C.green },
          { l: "Conversion Rate", v: `${stats?.summary.conversionRate || 0}%`, c: C.orange },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.c }} />
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>Wert nach Standort</div>
          {Object.entries(byOrt).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ort, wert]) => (
            <div key={ort} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.textDim, width: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ort}</span>
              <div style={{ flex: 1, height: 16, background: "rgba(255,255,255,0.03)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${total > 0 ? (wert / total) * 100 : 0}%`, height: "100%", background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 4, minWidth: 8 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, minWidth: 90, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(wert)}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 10 }}>Pipeline-Kennzahlen</div>
          {stats && (
            <div style={cardStyle}>
              {[
                ["Aktive Projekte", stats.summary.aktiv],
                ["Pipeline-Wert", fmt(stats.summary.pipelineWert)],
                ["NB-Vorgänge aktiv", stats.summary.nbAktiv],
                ["Avg. Zyklus (Tage)", stats.summary.avgCycleDays],
                ["Gewonnen", stats.summary.gewonnen],
                ["Gewonnen-Wert", fmt(stats.summary.gewonnenWert)],
              ].map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
