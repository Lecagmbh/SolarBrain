import { useState, useEffect } from "react";
import { C, cardStyle, badgeStyle } from "../../crm.styles";
import { fetchProjekte, fetchAktivitaeten } from "../../api/crmApi";
import type { CrmProjekt, CrmAktivitaet } from "../../types/crm.types";

export default function CrmHistorieTab() {
  const [aktivitaeten, setAktivitaeten] = useState<(CrmAktivitaet & { projektTitel?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await fetchProjekte({ limit: 20 });
        const allActs: (CrmAktivitaet & { projektTitel?: string })[] = [];
        for (const p of items.slice(0, 10)) {
          const acts = await fetchAktivitaeten(p.id);
          allActs.push(...(acts || []).map((a: CrmAktivitaet) => ({ ...a, projektTitel: p.titel })));
        }
        allActs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAktivitaeten(allActs.slice(0, 50));
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;

  const typColors: Record<string, { bg: string; color: string }> = {
    KI_AKTION: { bg: "rgba(251,146,60,0.12)", color: "#fb923c" },
    NB_EMAIL: { bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
    SYSTEM: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    EMAIL: { bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
    STATUSAENDERUNG: { bg: "rgba(167,139,250,0.12)", color: "#f0d878" },
    DOKUMENT: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  };

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Änderungshistorie</div>

      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 1, background: C.border }} />
        {aktivitaeten.map((a, i) => {
          const tc = typColors[a.typ] || { bg: "rgba(255,255,255,0.04)", color: C.textMuted };
          return (
            <div key={a.id || i} className="crm-fade" style={{ marginBottom: 12, position: "relative" }}>
              <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%", background: tc.color, border: `2px solid ${C.bgPanel}` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: tc.color }}>{a.projektTitel?.substring(0, 30)}</span>
                <span style={badgeStyle(tc.bg, tc.color)}>{a.typ}</span>
              </div>
              <div style={{ fontSize: 12, color: C.text }}>{a.titel}</div>
              {a.beschreibung && <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{a.beschreibung}</div>}
              <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
                {new Date(a.createdAt).toLocaleString("de-DE")}
              </div>
            </div>
          );
        })}
        {aktivitaeten.length === 0 && <div style={{ color: C.textMuted, padding: 30, textAlign: "center" }}>Noch keine Aktivitäten.</div>}
      </div>
    </div>
  );
}
