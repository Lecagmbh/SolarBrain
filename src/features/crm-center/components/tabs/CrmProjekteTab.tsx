import { useState, useEffect } from "react";
import { C, fmt, badgeStyle, inputStyle, btnPrimary } from "../../crm.styles";
import { fetchProjekte } from "../../api/crmApi";
import { ANLAGEN_TYPEN, stageInfo, anlagenTypInfo } from "../../types/crm.types";
import type { CrmProjekt, CrmAnlagenTyp, CrmStage } from "../../types/crm.types";

const GRUPPEN = [
  { key: "ALLE", label: "Alle Projekte", icon: "◉", filter: null },
  { key: "PV_GROSS", label: "PV Großflächen", icon: "🌾", filter: (p: CrmProjekt) => p.anlagenTypen.includes("PV_FREIFLAECHE") },
  { key: "PV_DACH", label: "PV Dachanlagen", icon: "🏠", filter: (p: CrmProjekt) => p.anlagenTypen.includes("PV_DACH") },
  { key: "SPEICHER", label: "Speicher", icon: "🔋", filter: (p: CrmProjekt) => p.anlagenTypen.some(t => ["GROSSSPEICHER", "SCHWARMSPEICHER"].includes(t)) },
  { key: "KOMBI", label: "Kombi", icon: "🔗", filter: (p: CrmProjekt) => p.anlagenTypen.length > 1 },
];

export default function CrmProjekteTab({ onSelect }: { onSelect: (p: CrmProjekt) => void }) {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [search, setSearch] = useState("");
  const [gruppe, setGruppe] = useState("ALLE");
  const [activeTypen, setActiveTypen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjekte({ limit: 200 })
      .then(r => setProjekte(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleTyp = (key: string) => setActiveTypen(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  let filtered = projekte;
  const grp = GRUPPEN.find(g => g.key === gruppe);
  if (grp?.filter) filtered = filtered.filter(grp.filter);
  if (activeTypen.length) filtered = filtered.filter(p => activeTypen.some(t => p.anlagenTypen.includes(t as CrmAnlagenTyp)));
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.titel.toLowerCase().includes(s) || p.kundenName?.toLowerCase().includes(s) || p.ort?.toLowerCase().includes(s));
  }

  const totalWert = filtered.reduce((s, p) => s + (p.geschaetzterWert || 0), 0);

  if (loading) return <div style={{ color: C.textMuted, padding: 40 }}>Laden...</div>;

  return (
    <div className="crm-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>Projekte</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suche..." style={{ ...inputStyle, width: 250 }} />
          <button style={btnPrimary}>+ Neues Projekt</button>
        </div>
      </div>

      {/* Gruppen Tabs */}
      <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, marginBottom: 12, border: `1px solid ${C.border}` }}>
        {GRUPPEN.map(g => (
          <button key={g.key} onClick={() => setGruppe(g.key)} style={{
            flex: "0 1 auto", padding: "8px 14px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: gruppe === g.key ? C.primaryGlow : "transparent",
            color: gruppe === g.key ? C.accent : C.textMuted,
            display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
          }}>
            <span>{g.icon}</span> {g.label}
          </button>
        ))}
      </div>

      {/* Anlagentyp Filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginRight: 4 }}>Anlagentypen:</span>
        {ANLAGEN_TYPEN.map(t => {
          const active = activeTypen.includes(t.key);
          return (
            <button key={t.key} onClick={() => toggleTyp(t.key)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: active ? t.color + "20" : "rgba(255,255,255,0.03)",
              color: active ? t.color : C.textMuted,
              border: `1px solid ${active ? t.color + "50" : C.border}`,
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          );
        })}
        {activeTypen.length > 0 && <button onClick={() => setActiveTypen([])} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 10, cursor: "pointer" }}>✕ Reset</button>}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, padding: "10px 16px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: C.textDim }}><b style={{ color: C.textBright }}>{filtered.length}</b> Projekte</span>
        <span style={{ width: 1, height: 16, background: C.border }} />
        <span style={{ fontSize: 12, color: C.textDim }}>Wert: <b style={{ color: C.accent, fontFamily: "'DM Mono'" }}>{fmt(totalWert)}</b></span>
      </div>

      {/* Project list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(p => {
          const si = stageInfo(p.stage);
          return (
            <div key={p.id} onClick={() => onSelect(p)} className="crm-card" style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: si.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{si.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{p.titel}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{p.kundenName} · {p.plz} {p.ort}</div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200, justifyContent: "flex-end" }}>
                {p.anlagenTypen.map(t => { const a = anlagenTypInfo(t); return <span key={t} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: a.color + "15", color: a.color }}>{a.icon} {a.label.split(" ")[0]}</span>; })}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                <span style={badgeStyle(si.color + "20", si.color)}>{si.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.accent, minWidth: 90, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(p.geschaetzterWert)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.textMuted, border: `1px dashed ${C.border}`, borderRadius: 10 }}>Keine Projekte gefunden.</div>}
      </div>
    </div>
  );
}
