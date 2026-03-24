/**
 * Positions-Tabelle mit Animation (Slide-in/out, Zebra, Hover)
 * + Produkt-Picker aus CRM-Katalog
 */
import { useState, useEffect } from "react";
import { C, mono, ff, Sel, AnimNum } from "./AngebotUI";

export interface Pos { id: number; bez: string; menge: number; einheit: string; preis: number; ust: number; rabatt: number }

interface KatalogProdukt {
  id: number; typ: string; hersteller: string; modell: string;
  preisVerkauf?: number; einheit?: string; technischeDaten: Record<string, any>;
}

interface Props {
  pos: Pos[];
  onUpdate: (id: number, key: string, value: any) => void;
  onAdd: () => void;
  onAddFromKatalog?: (produkt: KatalogProdukt) => void;
  onDelete: (id: number) => void;
  nettoModus: boolean;
}

const GRID = "40px 1fr 74px 62px 100px 62px 74px 106px 36px";

export default function AngebotPositionen({ pos, onUpdate, onAdd, onAddFromKatalog, onDelete, nettoModus }: Props) {
  const [removing, setRemoving] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleDelete = (id: number) => {
    setRemoving(id);
    setTimeout(() => { onDelete(id); setRemoving(null); }, 280);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 4, padding: "7px 8px", borderBottom: `1px solid ${C.borderHover}` }}>
        {["", "Produkt oder Service", "Menge", "", `Preis (${nettoModus ? "Netto" : "Brutto"})`, "USt.", "Rabatt", "Betrag", ""].map((h, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: [2, 4, 5, 6, 7].includes(i) ? "right" : "left" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {pos.map((p, idx) => {
        const base = p.menge * p.preis;
        const betrag = base - base * p.rabatt / 100;
        return (
          <div key={p.id} style={{
            display: "grid", gridTemplateColumns: GRID, gap: 4, padding: "4px 8px", alignItems: "center",
            borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
            opacity: removing === p.id ? 0 : 1, transform: removing === p.id ? "translateX(20px) scaleY(0.8)" : "none",
            maxHeight: removing === p.id ? 0 : 200, overflow: "hidden",
            transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <span style={{ fontSize: 13, color: C.textFaint, fontFamily: mono, textAlign: "center" }}>{idx + 1}.</span>
            <input value={p.bez} onChange={e => onUpdate(p.id, "bez", e.target.value)} placeholder="🔍 Produkt suchen"
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "7px 8px", color: C.text, fontSize: 13, fontWeight: 500, outline: "none", fontFamily: ff, transition: "border 0.15s" }}
              onFocus={e => e.target.style.borderColor = C.border} onBlur={e => e.target.style.borderColor = "transparent"} />
            <input type="number" value={p.menge} onChange={e => onUpdate(p.id, "menge", parseFloat(e.target.value) || 0)}
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "7px 6px", color: C.text, fontSize: 13, textAlign: "right", outline: "none", fontFamily: mono }} />
            <Sel value={p.einheit} onChange={(v: string) => onUpdate(p.id, "einheit", v)} options={["Stk", "Set", "psch", "m", "m²", "kWp", "h"]} style={{ padding: "7px 4px", fontSize: 11 }} />
            <div style={{ display: "flex", alignItems: "center" }}>
              <input type="number" value={p.preis} onChange={e => onUpdate(p.id, "preis", parseFloat(e.target.value) || 0)}
                style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "7px 4px", color: C.text, fontSize: 13, textAlign: "right", outline: "none", fontFamily: mono }} />
              <span style={{ fontSize: 10, color: C.textFaint, marginLeft: 2 }}>€</span>
            </div>
            <Sel value={`${p.ust}%`} onChange={(v: string) => onUpdate(p.id, "ust", parseInt(v))} options={["19%", "7%", "0%"]} style={{ padding: "7px 2px", fontSize: 11, textAlign: "right" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <input type="number" value={p.rabatt} onChange={e => onUpdate(p.id, "rabatt", parseFloat(e.target.value) || 0)}
                style={{ width: 36, background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "7px 2px", color: C.text, fontSize: 13, textAlign: "right", outline: "none", fontFamily: mono }} />
              <span style={{ fontSize: 10, color: C.textFaint }}>%</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right", fontFamily: mono }}>
              {betrag.toLocaleString("de-DE", { minimumFractionDigits: 2 })} <span style={{ fontSize: 10, color: C.textMuted }}>€</span>
            </span>
            <button onClick={() => handleDelete(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, color: C.textFaint, fontSize: 14, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.dangerDim; e.currentTarget.style.color = C.danger; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textFaint; }}>🗑</button>
          </div>
        );
      })}

      {/* Add Links */}
      <div style={{ display: "flex", gap: 16, padding: "14px 8px" }}>
        <button onClick={onAdd} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: ff }}>+ Position hinzufügen</button>
        <button onClick={() => setShowPicker(true)} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: ff }}>+ Produkt auswählen</button>
      </div>

      {showPicker && (
        <ProduktPicker
          onSelect={(p) => {
            onAddFromKatalog?.(p);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── Produkt-Picker Modal ────────────────────────────────────
function ProduktPicker({ onSelect, onClose }: { onSelect: (p: KatalogProdukt) => void; onClose: () => void }) {
  const [produkte, setProdukte] = useState<KatalogProdukt[]>([]);
  const [search, setSearch] = useState("");
  const [typ, setTyp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("baunity_token") || "";
    const params = new URLSearchParams();
    if (typ) params.set("typ", typ);
    if (search) params.set("search", search);
    fetch(`/api/crm/produkte?${params}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setProdukte)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typ, search]);

  const TYPEN = [
    { key: "", label: "Alle" },
    { key: "MODUL", label: "☀️ Module" },
    { key: "WECHSELRICHTER", label: "⚡ WR" },
    { key: "SPEICHER", label: "🔋 Speicher" },
    { key: "WALLBOX", label: "🔌 Wallbox" },
    { key: "ZUBEHOER", label: "🔧 Zubehör" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 20, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Produkt aus Katalog</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Suche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#f8fafc", outline: "none" }}
          />
          <select value={typ} onChange={e => setTyp(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#f8fafc", outline: "none" }}>
            {TYPEN.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Laden...</div>
          ) : produkte.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Keine Produkte gefunden</div>
          ) : (
            produkte.map(p => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  padding: "10px 12px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: "#e2e8f0", cursor: "pointer", textAlign: "left", fontSize: 12, transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.hersteller} {p.modell}</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                    {p.typ} {p.technischeDaten?.leistungWp ? `· ${p.technischeDaten.leistungWp} Wp` : ""} {p.technischeDaten?.kapazitaetKwh ? `· ${p.technischeDaten.kapazitaetKwh} kWh` : ""}
                  </div>
                </div>
                {p.preisVerkauf != null && (
                  <span style={{ fontWeight: 600, color: "#22c55e", fontFamily: mono, fontSize: 13 }}>
                    {Number(p.preisVerkauf).toFixed(2)} €
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
