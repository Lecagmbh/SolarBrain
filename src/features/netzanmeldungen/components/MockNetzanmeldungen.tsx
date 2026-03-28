/**
 * Mock: Netzanmeldungen-Seite Redesign v2
 * Pipeline oben, Sidebar links, Tabelle rechts
 */
import { useState } from "react";

const C = {
  bg: "#060b18", card: "rgba(17,20,35,0.95)",
  border: "rgba(255,255,255,0.06)",
  text: "#e2e8f0", dim: "#64748b", muted: "#94a3b8",
  accent: "#D4A843", blue: "#3b82f6", green: "#22c55e", orange: "#f59e0b",
  red: "#ef4444", purple: "#f0d878", cyan: "#06b6d4",
};

const KUNDEN = [
  { id: 7, name: "Lumina Solar GmbH", count: 89 },
  { id: 24, name: "NOVATT GmbH (NIVOMA)", count: 251 },
  { id: 25, name: "Fabian Kulla GmbH", count: 34 },
  { id: 28, name: "Deutsche Wärmepumpen Werke", count: 18 },
  { id: 3, name: "EHBB GmbH", count: 12 },
  { id: 30, name: "Sol-Living GmbH", count: 42 },
];

const ITEMS = [
  { id: 1, type: "crm", name: "Salvador Fernandez Cervantes", kunde: "NOVATT GmbH", status: "beim_nb", kwp: 7.65, ort: "65428 Rüsselsheim", nb: "EVR GmbH", daysAtNb: 5, linked: true, linkedId: "INST-HOLR2C", stage: "AUFTRAG", angebotWert: 48200, kundeId: 24 },
  { id: 2, type: "inst", name: "Thomas Müller", kunde: "Lumina Solar", status: "beim_nb", kwp: 9.8, ort: "60329 Frankfurt", nb: "Syna GmbH", daysAtNb: 12, linked: true, linkedId: "CRM-38", kundeId: 7 },
  { id: 3, type: "crm", name: "Maria Schmidt", kunde: "NOVATT GmbH", status: "crm_anfrage", kwp: 15.2, ort: "64283 Darmstadt", nb: "", daysAtNb: null, linked: false, kundeId: 24 },
  { id: 4, type: "inst", name: "Peter Weber", kunde: "Sol-Living", status: "rueckfrage", kwp: 6.4, ort: "77933 Lahr", nb: "Badenova Netze", daysAtNb: 8, linked: false, rueckfrage: "Schaltplan: String-Angaben fehlen", kundeId: 30 },
  { id: 5, type: "inst", name: "Anna Klein", kunde: "Lumina Solar", status: "genehmigt", kwp: 12.1, ort: "55116 Mainz", nb: "Mainzer Netze", daysAtNb: null, linked: false, kundeId: 7 },
  { id: 6, type: "crm", name: "BESS Projekt Heidelberg", kunde: "NOVATT GmbH", status: "crm_nb_kommunikation", kwp: 250, ort: "69115 Heidelberg", nb: "SWH Netze", daysAtNb: 3, linked: true, linkedId: "INST-KX92M", kundeId: 24 },
  { id: 7, type: "inst", name: "Klaus Bauer", kunde: "Deutsche WP Werke", status: "eingang", kwp: 8.2, ort: "77652 Offenburg", nb: "", daysAtNb: null, linked: false, kundeId: 28 },
  { id: 8, type: "inst", name: "Lisa Hofmann", kunde: "Sol-Living", status: "fertig", kwp: 5.5, ort: "77694 Kehl", nb: "E-Werk Mittelbaden", daysAtNb: null, linked: false, billed: true, kundeId: 30 },
  { id: 9, type: "inst", name: "Markus Braun", kunde: "EHBB GmbH", status: "ibn", kwp: 11.3, ort: "79098 Freiburg", nb: "Badenova Netze", daysAtNb: null, linked: false, kundeId: 3 },
  { id: 10, type: "crm", name: "Schwarm-Projekt Mannheim", kunde: "NOVATT GmbH", status: "crm_auftrag", kwp: 180, ort: "68159 Mannheim", nb: "MVV Netze", daysAtNb: null, linked: false, kundeId: 24 },
];

const SC: Record<string, { l: string; c: string; i: string }> = {
  eingang: { l: "Eingang", c: C.dim, i: "📥" },
  beim_nb: { l: "Beim NB", c: C.blue, i: "🏢" },
  rueckfrage: { l: "Rückfrage", c: C.red, i: "❓" },
  genehmigt: { l: "Genehmigt", c: C.green, i: "✅" },
  ibn: { l: "IBN", c: C.orange, i: "🔧" },
  fertig: { l: "Fertig", c: C.green, i: "🎉" },
  crm_anfrage: { l: "Anfrage", c: C.purple, i: "📥" },
  crm_auftrag: { l: "Auftrag", c: C.accent, i: "✅" },
  crm_nb_kommunikation: { l: "NB-Komm.", c: C.orange, i: "📧" },
  crm_nb_genehmigt: { l: "Genehmigt", c: C.green, i: "✅" },
  crm_eingestellt: { l: "Eingestellt", c: C.dim, i: "⏸" },
};

export default function MockNetzanmeldungen() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKunde, setSelectedKunde] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [kundenOpen, setKundenOpen] = useState(false);

  const filtered = ITEMS.filter(item => {
    if (activeFilter && item.status !== activeFilter) return false;
    if (selectedKunde && item.kundeId !== selectedKunde) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.ort.toLowerCase().includes(q) || item.nb.toLowerCase().includes(q) || item.kunde.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedKundeName = selectedKunde ? KUNDEN.find(k => k.id === selectedKunde)?.name : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══ PIPELINE — Drei Gruppen oben ═══ */}
      <div style={{ padding: "16px 24px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {/* CRM */}
          <PipelineGroup label="CRM" color={C.accent} items={[
            { key: "crm_anfrage", label: "ANFRAGE", count: 164, color: C.purple },
            { key: "crm_auftrag", label: "AUFTRAG", count: 14, color: C.accent },
          ]} activeFilter={activeFilter} onFilter={setActiveFilter} />

          <PipelineArrow />

          {/* Netzanmeldung */}
          <PipelineGroup label="NETZANMELDUNG" color={C.orange} items={[
            { key: "beim_nb", label: "BEIM NB", count: 45, color: C.blue, sub: "Ø 19 Tage" },
            { key: "rueckfrage", label: "RÜCKFRAGE", count: 11, color: C.red },
            { key: "genehmigt", label: "GENEHMIGT", count: 33, color: C.green },
          ]} activeFilter={activeFilter} onFilter={setActiveFilter} />

          <PipelineArrow />

          {/* Abschluss */}
          <PipelineGroup label="ABSCHLUSS" color={C.green} items={[
            { key: "ibn", label: "IBN", count: 3, color: C.orange },
            { key: "fertig", label: "FERTIG", count: 172, color: C.green },
          ]} activeFilter={activeFilter} onFilter={setActiveFilter} />
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>

        {/* ═══ SIDEBAR ═══ */}
        <div style={{ width: 220, borderRight: `1px solid ${C.border}`, padding: "12px 10px", overflowY: "auto", flexShrink: 0 }}>

          {/* Kunden-Auswahl */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Kunde</div>
            <button onClick={() => setKundenOpen(!kundenOpen)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", borderRadius: 6, border: `1px solid ${selectedKunde ? C.accent + "30" : C.border}`,
              background: selectedKunde ? `${C.accent}08` : "rgba(255,255,255,0.02)",
              color: selectedKunde ? C.accent : C.muted, fontSize: 12, cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedKundeName || "Alle Kunden"}</span>
              <span style={{ fontSize: 10, flexShrink: 0 }}>{kundenOpen ? "▲" : "▼"}</span>
            </button>
            {kundenOpen && (
              <div style={{ marginTop: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <button onClick={() => { setSelectedKunde(null); setKundenOpen(false); }} style={dropdownItem(selectedKunde === null)}>
                  <span>Alle Kunden</span><span style={{ fontFamily: "monospace", fontSize: 11 }}>{KUNDEN.reduce((s, k) => s + k.count, 0)}</span>
                </button>
                {KUNDEN.map(k => (
                  <button key={k.id} onClick={() => { setSelectedKunde(k.id); setKundenOpen(false); }} style={dropdownItem(selectedKunde === k.id)}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.name}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, flexShrink: 0 }}>{k.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

          {/* Status-Filter */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Status</div>
            <SidebarBtn label="Alle" count={ITEMS.length} color={C.text} active={activeFilter === null} onClick={() => setActiveFilter(null)} />
            <SidebarBtn label="Eingang" count={4} color={C.dim} active={activeFilter === "eingang"} onClick={() => setActiveFilter(activeFilter === "eingang" ? null : "eingang")} />
            <SidebarBtn label="Beim NB" count={45} color={C.blue} active={activeFilter === "beim_nb"} onClick={() => setActiveFilter(activeFilter === "beim_nb" ? null : "beim_nb")} />
            <SidebarBtn label="Rückfrage" count={11} color={C.red} active={activeFilter === "rueckfrage"} onClick={() => setActiveFilter(activeFilter === "rueckfrage" ? null : "rueckfrage")} dot />
            <SidebarBtn label="Genehmigt" count={33} color={C.green} active={activeFilter === "genehmigt"} onClick={() => setActiveFilter(activeFilter === "genehmigt" ? null : "genehmigt")} />
            <SidebarBtn label="IBN" count={3} color={C.orange} active={activeFilter === "ibn"} onClick={() => setActiveFilter(activeFilter === "ibn" ? null : "ibn")} />
            <SidebarBtn label="Fertig" count={172} color={C.green} active={activeFilter === "fertig"} onClick={() => setActiveFilter(activeFilter === "fertig" ? null : "fertig")} />
          </div>

          <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

          {/* CRM-Status */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>CRM</div>
            <SidebarBtn label="Anfrage" count={164} color={C.purple} active={activeFilter === "crm_anfrage"} onClick={() => setActiveFilter(activeFilter === "crm_anfrage" ? null : "crm_anfrage")} />
            <SidebarBtn label="Auftrag" count={14} color={C.accent} active={activeFilter === "crm_auftrag"} onClick={() => setActiveFilter(activeFilter === "crm_auftrag" ? null : "crm_auftrag")} />
            <SidebarBtn label="NB-Komm." count={35} color={C.orange} active={activeFilter === "crm_nb_kommunikation"} onClick={() => setActiveFilter(activeFilter === "crm_nb_kommunikation" ? null : "crm_nb_kommunikation")} />
            <SidebarBtn label="Eingestellt" count={20} color={C.dim} active={activeFilter === "crm_eingestellt"} onClick={() => setActiveFilter(activeFilter === "crm_eingestellt" ? null : "crm_eingestellt")} />
          </div>

          <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

          {/* Ansichten */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Schnellfilter</div>
            <SidebarBtn label="🔥 Handlungsbedarf" count={11} color={C.red} active={false} onClick={() => {}} />
            <SidebarBtn label="⏰ Überfällig >14d" count={8} color={C.orange} active={false} onClick={() => {}} />
            <SidebarBtn label="📊 Meine Projekte" count={23} color={C.accent} active={false} onClick={() => {}} />
          </div>
        </div>

        {/* ═══ HAUPTBEREICH ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Suchleiste */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input placeholder="Suche nach Name, PLZ, Ort, Netzbetreiber, Kunde..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px 9px 34px", fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.dim }}>🔍</span>
            </div>

            {/* Aktive Filter-Chips */}
            {activeFilter && (() => { const s = SC[activeFilter]; return (
              <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, background: `${s?.c || C.accent}12`, color: s?.c || C.accent, border: `1px solid ${s?.c || C.accent}25`, display: "flex", alignItems: "center", gap: 4 }}>
                {s?.i} {s?.l} <button onClick={() => setActiveFilter(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 13, padding: 0, marginLeft: 2 }}>×</button>
              </span>
            ); })()}
            {selectedKunde && (
              <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, background: `${C.accent}12`, color: C.accent, border: `1px solid ${C.accent}25`, display: "flex", alignItems: "center", gap: 4 }}>
                🏢 {selectedKundeName} <button onClick={() => setSelectedKunde(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 13, padding: 0, marginLeft: 2 }}>×</button>
              </span>
            )}
            {(activeFilter || selectedKunde || searchQuery) && (
              <button onClick={() => { setActiveFilter(null); setSelectedKunde(null); setSearchQuery(""); }}
                style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Alle zurücksetzen</button>
            )}

            <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>{filtered.length} Ergebnisse</span>
          </div>

          {/* Tabelle */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: C.bg, zIndex: 2 }}>
                  {["Projekt", "Status", "kWp", "Netzbetreiber", "Tage", "Ort", ""].map(h => (
                    <th key={h} style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = SC[item.status] || { l: item.status, c: C.dim, i: "•" };
                  const hovered = hoveredId === item.id;
                  return (
                    <tr key={item.id} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}
                      style={{ background: hovered ? "rgba(212,168,67,0.04)" : "transparent", cursor: "pointer", borderLeft: `3px solid ${item.type === "crm" ? C.accent + "40" : "transparent"}`, transition: "background 0.1s" }}>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13 }}>{item.type === "crm" ? "📊" : "⚡"}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>
                              {item.kunde}
                              {(item as any).rueckfrage && <span style={{ color: C.red, marginLeft: 6 }}>⚠ {(item as any).rueckfrage}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: `${s.c}12`, color: s.c }}>{s.i} {s.l}</span>
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.green }}>{item.kwp}</td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: item.nb ? C.muted : C.dim, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nb || "—"}</td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        {item.daysAtNb != null ? (
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: item.daysAtNb > 10 ? C.red : item.daysAtNb > 5 ? C.orange : C.muted }}>{item.daysAtNb}d</span>
                        ) : <span style={{ color: C.dim }}>—</span>}
                      </td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>{item.ort}</td>

                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                        {item.linked ? (
                          <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: item.type === "crm" ? `${C.blue}12` : `${C.accent}12`, color: item.type === "crm" ? C.blue : C.accent }}>
                            {item.type === "crm" ? `⚡ ${item.linkedId}` : `📊 ${item.linkedId}`}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Sub-Komponenten ═══

function PipelineGroup({ label, color, items, activeFilter, onFilter }: {
  label: string; color: string;
  items: { key: string; label: string; count: number; color: string; sub?: string }[];
  activeFilter: string | null; onFilter: (k: string | null) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color, textAlign: "center", marginBottom: 6, background: color + "08", borderRadius: 4, padding: "2px 0" }}>{label}</div>
      <div style={{ display: "flex", gap: 3 }}>
        {items.map(st => (
          <div key={st.key} onClick={() => onFilter(activeFilter === st.key ? null : st.key)}
            style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 6, cursor: "pointer", background: activeFilter === st.key ? `${st.color}15` : `${st.color}05`, border: activeFilter === st.key ? `1px solid ${st.color}30` : "1px solid transparent", transition: "all 0.15s" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: st.color }}>{st.count}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: st.color, letterSpacing: 0.3 }}>{st.label}</div>
            {st.sub && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{st.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 2px 0" }}>
      <svg width="16" height="24" viewBox="0 0 16 24"><path d="M3 4 L11 12 L3 20" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" /></svg>
    </div>
  );
}

function SidebarBtn({ label, count, color, active, onClick, dot }: { label: string; count: number; color: string; active: boolean; onClick: () => void; dot?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
      padding: "6px 8px", borderRadius: 5, border: "none", cursor: "pointer",
      background: active ? `${color}12` : "transparent",
      color: active ? color : C.muted, fontSize: 12, fontWeight: active ? 600 : 400,
      marginBottom: 1, textAlign: "left", transition: "all 0.1s",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: dot ? `0 0 6px ${color}` : "none" }} />
        {label}
      </span>
      <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{count}</span>
    </button>
  );
}

function dropdownItem(active: boolean): React.CSSProperties {
  return {
    display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
    padding: "7px 10px", border: "none", cursor: "pointer", textAlign: "left",
    background: active ? `${C.accent}12` : "transparent",
    color: active ? C.accent : C.muted, fontSize: 11, fontWeight: active ? 600 : 400,
    borderBottom: `1px solid ${C.border}`,
  };
}
