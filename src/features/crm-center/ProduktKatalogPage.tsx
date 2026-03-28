/**
 * CRM Produkt-Katalog — Verwaltung aller Produkte für Angebote
 * 8 Typen: Module, Wechselrichter, Speicher, Wallbox, Wärmepumpe, C&I, Utility, Zubehör
 */
import { useState, useEffect, useCallback, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────
interface Produkt {
  id: number;
  typ: string;
  hersteller: string;
  modell: string;
  beschreibung?: string;
  technischeDaten: Record<string, any>;
  preisEinkauf?: number;
  preisVerkauf?: number;
  einheit?: string;
  zerezId?: string;
  istFavorit: boolean;
  tags?: string[];
  active: boolean;
  createdAt: string;
}

interface TypeCount { typ: string; _count: number }

const TYPEN = [
  { key: "MODUL", label: "PV-Module", icon: "☀️", color: "#f59e0b" },
  { key: "WECHSELRICHTER", label: "Wechselrichter", icon: "⚡", color: "#D4A843" },
  { key: "SPEICHER", label: "Speicher", icon: "🔋", color: "#22c55e" },
  { key: "WALLBOX", label: "Wallbox", icon: "🔌", color: "#3b82f6" },
  { key: "WAERMEPUMPE", label: "Wärmepumpe", icon: "🌡️", color: "#ef4444" },
  { key: "CI_SYSTEM", label: "C&I-System", icon: "🏭", color: "#EAD068" },
  { key: "UTILITY", label: "Utility-Scale", icon: "🏗️", color: "#14b8a6" },
  { key: "ZUBEHOER", label: "Zubehör", icon: "🔧", color: "#64748b" },
];

// ── API ──────────────────────────────────────────────────────
const getHeaders = () => {
  const token = localStorage.getItem("baunity_token") || "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

async function fetchProdukte(typ?: string, search?: string): Promise<Produkt[]> {
  const params = new URLSearchParams();
  if (typ) params.set("typ", typ);
  if (search) params.set("search", search);
  const resp = await fetch(`/api/crm/produkte?${params}`, { headers: getHeaders(), credentials: "include" });
  return resp.ok ? resp.json() : [];
}

async function fetchCounts(): Promise<TypeCount[]> {
  const resp = await fetch("/api/crm/produkte/counts", { headers: getHeaders(), credentials: "include" });
  return resp.ok ? resp.json() : [];
}

async function saveProdukt(data: Partial<Produkt> & { id?: number }): Promise<Produkt | null> {
  const url = data.id ? `/api/crm/produkte/${data.id}` : "/api/crm/produkte";
  const method = data.id ? "PUT" : "POST";
  const resp = await fetch(url, { method, headers: getHeaders(), credentials: "include", body: JSON.stringify(data) });
  return resp.ok ? resp.json() : null;
}

async function deleteProdukt(id: number): Promise<boolean> {
  const resp = await fetch(`/api/crm/produkte/${id}`, { method: "DELETE", headers: getHeaders(), credentials: "include" });
  return resp.ok;
}

async function toggleFavorit(id: number): Promise<Produkt | null> {
  const resp = await fetch(`/api/crm/produkte/${id}/favorit`, { method: "PUT", headers: getHeaders(), credentials: "include" });
  return resp.ok ? resp.json() : null;
}

// ── Main Component ──────────────────────────────────────────
export default function ProduktKatalogPage() {
  const [produkte, setProdukte] = useState<Produkt[]>([]);
  const [counts, setCounts] = useState<TypeCount[]>([]);
  const [activeTyp, setActiveTyp] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Produkt | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [items, c] = await Promise.all([
      fetchProdukte(activeTyp || undefined, search || undefined),
      fetchCounts(),
    ]);
    setProdukte(items);
    setCounts(c);
    setLoading(false);
  }, [activeTyp, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const getCount = (typ: string) => counts.find(c => c.typ === typ)?._count || 0;
  const totalCount = counts.reduce((s, c) => s + c._count, 0);

  const handleDelete = async (id: number) => {
    if (!confirm("Produkt löschen?")) return;
    await deleteProdukt(id);
    loadData();
  };

  const handleToggleFavorit = async (id: number) => {
    await toggleFavorit(id);
    loadData();
  };

  const handleSave = async (data: any) => {
    const result = await saveProdukt(data);
    if (result) {
      setShowForm(false);
      setEditItem(null);
      loadData();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060b18", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#f8fafc" }}>Produkt-Katalog</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{totalCount} Produkte in {counts.length} Kategorien</div>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          style={{ background: "#D4A843", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          + Neues Produkt
        </button>
      </div>

      {/* Type Filter Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => setActiveTyp(null)}
          style={{
            ...pillStyle,
            background: !activeTyp ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.04)",
            borderColor: !activeTyp ? "#D4A843" : "rgba(255,255,255,0.08)",
            color: !activeTyp ? "#a5b4fc" : "#94a3b8",
          }}
        >
          Alle ({totalCount})
        </button>
        {TYPEN.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTyp(activeTyp === t.key ? null : t.key)}
            style={{
              ...pillStyle,
              background: activeTyp === t.key ? `${t.color}20` : "rgba(255,255,255,0.04)",
              borderColor: activeTyp === t.key ? t.color : "rgba(255,255,255,0.08)",
              color: activeTyp === t.key ? t.color : "#94a3b8",
            }}
          >
            {t.icon} {t.label} ({getCount(t.key)})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Suche nach Hersteller, Modell..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
            padding: "10px 14px", fontSize: 13, color: "#f8fafc", outline: "none",
          }}
        />
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Laden...</div>
      ) : produkte.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Keine Produkte gefunden</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Erstelle ein neues Produkt oder ändere den Filter</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {produkte.map(p => (
            <ProduktCard
              key={p.id}
              produkt={p}
              onEdit={() => { setEditItem(p); setShowForm(true); }}
              onDelete={() => handleDelete(p.id)}
              onToggleFavorit={() => handleToggleFavorit(p.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProduktFormModal
          initial={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────
function ProduktCard({ produkt, onEdit, onDelete, onToggleFavorit }: {
  produkt: Produkt;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorit: () => void;
}) {
  const typInfo = TYPEN.find(t => t.key === produkt.typ) || TYPEN[7];
  const td = produkt.technischeDaten || {};

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{typInfo.icon}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: typInfo.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {typInfo.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{produkt.hersteller}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{produkt.modell}</div>
          </div>
        </div>
        <button
          onClick={onToggleFavorit}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 0 }}
          title={produkt.istFavorit ? "Favorit entfernen" : "Als Favorit markieren"}
        >
          {produkt.istFavorit ? "⭐" : "☆"}
        </button>
      </div>

      {/* Technische Highlights */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {td.leistungWp && <Chip label={`${td.leistungWp} Wp`} />}
        {td.leistungKw && <Chip label={`${td.leistungKw} kW`} />}
        {td.kapazitaetKwh && <Chip label={`${td.kapazitaetKwh} kWh`} />}
        {td.wirkungsgrad && <Chip label={`η ${td.wirkungsgrad}%`} />}
        {td.ladeleistungKw && <Chip label={`${td.ladeleistungKw} kW Laden`} />}
        {produkt.zerezId && <Chip label={`ZEREZ: ${produkt.zerezId}`} color="#22c55e" />}
      </div>

      {/* Preise */}
      <div style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 8 }}>
        {produkt.preisEinkauf != null && (
          <span style={{ color: "#64748b" }}>
            EK: <span style={{ color: "#f8fafc", fontWeight: 600 }}>{Number(produkt.preisEinkauf).toFixed(2)} €</span>
          </span>
        )}
        {produkt.preisVerkauf != null && (
          <span style={{ color: "#64748b" }}>
            VK: <span style={{ color: "#22c55e", fontWeight: 600 }}>{Number(produkt.preisVerkauf).toFixed(2)} €</span>
          </span>
        )}
        {produkt.einheit && <span style={{ color: "#64748b" }}>/{produkt.einheit}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8, marginTop: 4 }}>
        <button onClick={onEdit} style={btnSmall}>Bearbeiten</button>
        <button onClick={onDelete} style={{ ...btnSmall, color: "#ef4444" }}>Löschen</button>
      </div>
    </div>
  );
}

function Chip({ label, color = "#D4A843" }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color, padding: "2px 8px",
      background: `${color}15`, borderRadius: 4, border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

// ── Form Modal ──────────────────────────────────────────
function ProduktFormModal({ initial, onSave, onClose }: {
  initial: Produkt | null;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [typ, setTyp] = useState(initial?.typ || "MODUL");
  const [hersteller, setHersteller] = useState(initial?.hersteller || "");
  const [modell, setModell] = useState(initial?.modell || "");
  const [beschreibung, setBeschreibung] = useState(initial?.beschreibung || "");
  const [preisEinkauf, setPreisEinkauf] = useState(initial?.preisEinkauf?.toString() || "");
  const [preisVerkauf, setPreisVerkauf] = useState(initial?.preisVerkauf?.toString() || "");
  const [einheit, setEinheit] = useState(initial?.einheit || "Stk");
  const [zerezId, setZerezId] = useState(initial?.zerezId || "");
  const [td, setTd] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial?.technischeDaten || {}).map(([k, v]) => [k, String(v)]))
  );
  const [saving, setSaving] = useState(false);

  const TECH_FIELDS: Record<string, { key: string; label: string; unit: string }[]> = {
    MODUL: [
      { key: "leistungWp", label: "Leistung", unit: "Wp" },
      { key: "wirkungsgrad", label: "Wirkungsgrad", unit: "%" },
      { key: "zellenAnzahl", label: "Zellen", unit: "" },
      { key: "abmessungen", label: "Abmessungen (LxBxH)", unit: "mm" },
      { key: "gewicht", label: "Gewicht", unit: "kg" },
    ],
    WECHSELRICHTER: [
      { key: "leistungKw", label: "AC-Leistung", unit: "kW" },
      { key: "dcLeistungKw", label: "DC-Leistung max", unit: "kW" },
      { key: "mppTracker", label: "MPP-Tracker", unit: "" },
      { key: "wirkungsgrad", label: "Wirkungsgrad", unit: "%" },
      { key: "phasen", label: "Phasen", unit: "" },
    ],
    SPEICHER: [
      { key: "kapazitaetKwh", label: "Kapazität", unit: "kWh" },
      { key: "ladeleistungKw", label: "Ladeleistung", unit: "kW" },
      { key: "entladeleistungKw", label: "Entladeleistung", unit: "kW" },
      { key: "zyklen", label: "Zyklen (80% DoD)", unit: "" },
      { key: "batterietyp", label: "Batterietyp", unit: "" },
    ],
    WALLBOX: [
      { key: "ladeleistungKw", label: "Ladeleistung", unit: "kW" },
      { key: "phasen", label: "Phasen", unit: "" },
      { key: "steckertyp", label: "Steckertyp", unit: "" },
      { key: "smart", label: "Smart-Feature", unit: "" },
    ],
    WAERMEPUMPE: [
      { key: "leistungKw", label: "Heizleistung", unit: "kW" },
      { key: "cop", label: "COP", unit: "" },
      { key: "vorlaufTemp", label: "Vorlauftemp max", unit: "°C" },
      { key: "kaeltemittel", label: "Kältemittel", unit: "" },
    ],
  };

  const fields = TECH_FIELDS[typ] || [];

  const handleSubmit = async () => {
    if (!hersteller || !modell) return alert("Hersteller und Modell sind Pflicht");
    setSaving(true);
    const data: any = {
      typ, hersteller, modell, beschreibung, einheit, zerezId: zerezId || undefined,
      technischeDaten: Object.fromEntries(Object.entries(td).filter(([, v]) => v)),
      preisEinkauf: preisEinkauf ? Number(preisEinkauf) : undefined,
      preisVerkauf: preisVerkauf ? Number(preisVerkauf) : undefined,
    };
    if (initial?.id) data.id = initial.id;
    await onSave(data);
    setSaving(false);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>
            {initial ? "Produkt bearbeiten" : "Neues Produkt"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {/* Typ */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Typ</label>
          <select value={typ} onChange={e => setTyp(e.target.value)} style={inputStyle}>
            {TYPEN.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
          </select>
        </div>

        {/* Grunddaten */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Hersteller *</label>
            <input value={hersteller} onChange={e => setHersteller(e.target.value)} style={inputStyle} placeholder="z.B. SMA, Huawei" />
          </div>
          <div>
            <label style={labelStyle}>Modell *</label>
            <input value={modell} onChange={e => setModell(e.target.value)} style={inputStyle} placeholder="z.B. STP 10.0" />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Beschreibung</label>
          <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={2} />
        </div>

        {/* Preise */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>EK-Preis (€)</label>
            <input type="number" step="0.01" value={preisEinkauf} onChange={e => setPreisEinkauf(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>VK-Preis (€)</label>
            <input type="number" step="0.01" value={preisVerkauf} onChange={e => setPreisVerkauf(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Einheit</label>
            <select value={einheit} onChange={e => setEinheit(e.target.value)} style={inputStyle}>
              <option value="Stk">Stück</option>
              <option value="kWp">kWp</option>
              <option value="kWh">kWh</option>
              <option value="m">Meter</option>
              <option value="psch">Pauschal</option>
            </select>
          </div>
        </div>

        {/* ZEREZ */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>ZEREZ-ID (Marktstammdatenregister)</label>
          <input value={zerezId} onChange={e => setZerezId(e.target.value)} style={inputStyle} placeholder="z.B. SES12345" />
        </div>

        {/* Technische Daten */}
        {fields.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, fontSize: 11, color: "#D4A843", marginBottom: 8, display: "block" }}>
              Technische Daten — {TYPEN.find(t => t.key === typ)?.label}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: "#64748b" }}>{f.label} {f.unit && `(${f.unit})`}</label>
                  <input
                    value={td[f.key] || ""}
                    onChange={e => setTd(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={inputStyle}
                    placeholder={f.unit}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ ...btnSmall, padding: "8px 16px" }}>Abbrechen</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: "#D4A843", color: "#fff", border: "none", borderRadius: 6,
              padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Speichern..." : initial ? "Aktualisieren" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────
const pillStyle: React.CSSProperties = {
  border: "1px solid", borderRadius: 20, padding: "6px 14px",
  fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent",
  transition: "all 0.15s",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(15,15,30,0.8)", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10, padding: "14px 16px",
};

const btnSmall: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600,
  color: "#94a3b8", cursor: "pointer",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
  background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
  padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#f8fafc", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase",
  letterSpacing: 0.5, marginBottom: 4, display: "block",
};
