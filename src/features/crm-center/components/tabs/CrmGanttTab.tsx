import { useState, useEffect } from "react";
import { C, fmt } from "../../crm.styles";
import { fetchProjekte } from "../../api/crmApi";
import { stageInfo } from "../../types/crm.types";
import type { CrmProjekt } from "../../types/crm.types";

export default function CrmGanttTab() {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjekte({ limit: 100 }).then(r => setProjekte(r.items)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;

  const minDate = new Date(); minDate.setMonth(minDate.getMonth() - 3);
  const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 3);
  const totalDays = (maxDate.getTime() - minDate.getTime()) / 86400000;

  // Month headers
  const months: Date[] = [];
  const d = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (d <= maxDate) { months.push(new Date(d)); d.setMonth(d.getMonth() + 1); }

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Gantt-Ansicht</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 900 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 8, paddingLeft: 200 }}>
            {months.map((m, i) => {
              const start = Math.max(0, (m.getTime() - minDate.getTime()) / 86400000);
              const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
              const end = Math.min(totalDays, (mEnd.getTime() - minDate.getTime()) / 86400000);
              return (
                <div key={i} style={{ width: `${((end - start) / totalDays) * 100}%`, fontSize: 10, color: C.textMuted, padding: "4px 8px", borderLeft: `1px solid ${C.border}`, fontFamily: "'DM Mono', monospace" }}>
                  {m.toLocaleString("de-DE", { month: "short", year: "2-digit" })}
                </div>
              );
            })}
          </div>
          {projekte.map(p => {
            const created = new Date(p.createdAt);
            const start = Math.max(0, (created.getTime() - minDate.getTime()) / 86400000);
            const end = p.abgeschlossenAm
              ? Math.max(start + 7, (new Date(p.abgeschlossenAm).getTime() - minDate.getTime()) / 86400000)
              : Math.min(start + 60, totalDays);
            const si = stageInfo(p.stage);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", marginBottom: 4, height: 28 }}>
                <div style={{ width: 200, fontSize: 10, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10, flexShrink: 0 }}>{p.titel}</div>
                <div style={{ flex: 1, position: "relative", height: "100%" }}>
                  <div style={{
                    position: "absolute", left: `${(start / totalDays) * 100}%`, width: `${Math.max(1, ((end - start) / totalDays) * 100)}%`,
                    height: 18, top: 5, borderRadius: 4, background: `linear-gradient(90deg, ${si.color}40, ${si.color}20)`,
                    border: `1px solid ${si.color}50`,
                  }}>
                    <div style={{ fontSize: 8, color: si.color, padding: "2px 6px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden" }}>{si.label}</div>
                  </div>
                  {/* IBN Termin marker */}
                  {p.geplantIbnTermin && (() => {
                    const ibn = (new Date(p.geplantIbnTermin).getTime() - minDate.getTime()) / 86400000;
                    if (ibn < 0 || ibn > totalDays) return null;
                    return <div style={{ position: "absolute", left: `${(ibn / totalDays) * 100}%`, top: 2, width: 2, height: 24, background: C.green, borderRadius: 1 }} title="IBN-Termin" />;
                  })()}
                </div>
              </div>
            );
          })}
          {projekte.length === 0 && <div style={{ color: C.textMuted, textAlign: "center", padding: 40 }}>Keine Projekte</div>}
        </div>
      </div>
    </div>
  );
}
