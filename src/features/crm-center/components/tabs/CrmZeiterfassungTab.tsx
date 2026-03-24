import { useState, useEffect } from "react";
import { C, cardStyle, btnPrimary, inputStyle } from "../../crm.styles";
import { fetchProjekte } from "../../api/crmApi";
import { api } from "../../../../modules/api/client";
import type { CrmProjekt } from "../../types/crm.types";

interface Zeiteintrag { id: number; projektId: number; userId: number; datum: string; dauerMinuten: number; beschreibung?: string; kategorie?: string }

export default function CrmZeiterfassungTab() {
  const [eintraege, setEintraege] = useState<Zeiteintrag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/crm/zeit").then(r => setEintraege(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalStunden = eintraege.reduce((s, e) => s + e.dauerMinuten, 0) / 60;

  // Group by user
  const byUser: Record<number, { total: number; count: number }> = {};
  for (const e of eintraege) {
    if (!byUser[e.userId]) byUser[e.userId] = { total: 0, count: 0 };
    byUser[e.userId].total += e.dauerMinuten;
    byUser[e.userId].count++;
  }

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;

  return (
    <div className="crm-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>Zeiterfassung & Übersicht</div>
        <button style={btnPrimary}>+ Zeit buchen</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Gesamt", v: `${totalStunden.toFixed(1)}h`, c: C.green },
          { l: "Einträge", v: eintraege.length, c: C.blue },
          { l: "Mitarbeiter", v: Object.keys(byUser).length, c: C.primary },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.c }} />
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{k.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.textBright }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Nach Mitarbeiter</div>
          {Object.entries(byUser).map(([uid, data]) => (
            <div key={uid} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", ...cardStyle, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: C.text }}>User #{uid}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{(data.total / 60).toFixed(1)}h</span>
            </div>
          ))}
          {Object.keys(byUser).length === 0 && <div style={{ color: C.textMuted, padding: 20, textAlign: "center" }}>Keine Einträge</div>}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Letzte Einträge</div>
          {eintraege.slice(0, 10).map(e => (
            <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 12px", ...cardStyle, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.accent, minWidth: 50, fontFamily: "'DM Mono'" }}>{(e.dauerMinuten / 60).toFixed(1)}h</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{e.beschreibung || "—"}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{new Date(e.datum).toLocaleDateString("de-DE")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
