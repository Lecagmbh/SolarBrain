/**
 * Montage-Planung Tab — Terminplanung, Team-Zuweisung, Checkliste, IBN
 */
import { useState, useEffect } from "react";

interface MontageData {
  montageDatum?: string;
  montageZeit?: string;
  ibnDatum?: string;
  ibnZeit?: string;
  monteur?: string;
  team?: string;
  notizen?: string;
  checkliste: Record<string, boolean>;
}

const CHECKLISTE_ITEMS = [
  { key: "material_bestellt", label: "Material bestellt", gruppe: "Vorbereitung" },
  { key: "material_geliefert", label: "Material geliefert", gruppe: "Vorbereitung" },
  { key: "geruest_organisiert", label: "Gerüst organisiert", gruppe: "Vorbereitung" },
  { key: "kunde_informiert", label: "Kunde über Termin informiert", gruppe: "Vorbereitung" },
  { key: "nb_genehmigung", label: "NB-Genehmigung vorhanden", gruppe: "Vorbereitung" },
  { key: "dc_montage", label: "DC-Montage (Module + Strings)", gruppe: "Montage" },
  { key: "ac_montage", label: "AC-Montage (WR + Verkabelung)", gruppe: "Montage" },
  { key: "speicher_montage", label: "Speicher-Montage", gruppe: "Montage" },
  { key: "zaehler_umbau", label: "Zählerumbau/-anpassung", gruppe: "Montage" },
  { key: "wallbox_montage", label: "Wallbox-Montage", gruppe: "Montage" },
  { key: "funktionstest", label: "Funktionstest durchgeführt", gruppe: "Abnahme" },
  { key: "ibn_protokoll", label: "IBN-Protokoll erstellt", gruppe: "Abnahme" },
  { key: "kunde_eingewiesen", label: "Kunde eingewiesen", gruppe: "Abnahme" },
  { key: "fotos_gemacht", label: "Dokumentationsfotos erstellt", gruppe: "Abnahme" },
];

interface Props {
  crmId: number;
  installationId?: number | null;
}

export default function TabMontage({ crmId, installationId }: Props) {
  const [data, setData] = useState<MontageData>({ checkliste: {} });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Daten laden aus CRM-Projekt customFields
  useEffect(() => {
    const token = localStorage.getItem("baunity_token") || "";
    fetch(`/api/crm/projekte/${crmId}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p?.customFields?.montage) {
          setData({ checkliste: {}, ...p.customFields.montage });
        }
        if (p?.geplantIbnTermin) {
          const d = new Date(p.geplantIbnTermin);
          setData(prev => ({
            ...prev,
            ibnDatum: prev.ibnDatum || d.toISOString().split("T")[0],
          }));
        }
      })
      .catch(() => {});
  }, [crmId]);

  // Speichern in customFields.montage
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("baunity_token") || "";
      // Bestehendes Projekt laden für customFields merge
      const getResp = await fetch(`/api/crm/projekte/${crmId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const existing = getResp.ok ? await getResp.json() : {};
      const customFields = { ...(existing.customFields || {}), montage: data };

      const body: any = { customFields };
      // IBN-Termin auch als eigenes Feld speichern
      if (data.ibnDatum) {
        body.geplantIbnTermin = `${data.ibnDatum}T${data.ibnZeit || "09:00"}:00.000Z`;
      }

      await fetch(`/api/crm/projekte/${crmId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (key: string) => {
    setData(prev => ({
      ...prev,
      checkliste: { ...prev.checkliste, [key]: !prev.checkliste[key] },
    }));
  };

  const completedCount = Object.values(data.checkliste).filter(Boolean).length;
  const totalCount = CHECKLISTE_ITEMS.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const gruppen = ["Vorbereitung", "Montage", "Abnahme"];

  return (
    <div className="f" style={{ padding: "12px 16px" }}>
      {/* Header mit Fortschritt */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Montage-Planung</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {completedCount}/{totalCount} Punkte erledigt ({progress}%)
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saved ? "#22c55e" : "#D4A843",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "Speichern..." : saved ? "Gespeichert ✓" : "Speichern"}
        </button>
      </div>

      {/* Fortschrittsbalken */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 16 }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: progress === 100 ? "#22c55e" : "#D4A843",
          borderRadius: 3,
          transition: "width 0.3s ease",
        }} />
      </div>

      {/* Termine */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Montage-Termin
          </div>
          <input
            type="date"
            value={data.montageDatum || ""}
            onChange={e => setData(prev => ({ ...prev, montageDatum: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="time"
            value={data.montageZeit || "08:00"}
            onChange={e => setData(prev => ({ ...prev, montageZeit: e.target.value }))}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </div>
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            IBN-Termin
          </div>
          <input
            type="date"
            value={data.ibnDatum || ""}
            onChange={e => setData(prev => ({ ...prev, ibnDatum: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="time"
            value={data.ibnZeit || "09:00"}
            onChange={e => setData(prev => ({ ...prev, ibnZeit: e.target.value }))}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </div>
      </div>

      {/* Team */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Team & Monteur
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            placeholder="Monteur / Elektriker"
            value={data.monteur || ""}
            onChange={e => setData(prev => ({ ...prev, monteur: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Team / Firma"
            value={data.team || ""}
            onChange={e => setData(prev => ({ ...prev, team: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Checkliste */}
      {gruppen.map(gruppe => {
        const items = CHECKLISTE_ITEMS.filter(i => i.gruppe === gruppe);
        const done = items.filter(i => data.checkliste[i.key]).length;
        return (
          <div key={gruppe} style={{ ...cardStyle, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f8fafc" }}>{gruppe}</div>
              <div style={{ fontSize: 10, color: done === items.length ? "#22c55e" : "#64748b" }}>
                {done}/{items.length}
              </div>
            </div>
            {items.map(item => (
              <label
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  fontSize: 12,
                  color: data.checkliste[item.key] ? "#22c55e" : "#94a3b8",
                  cursor: "pointer",
                  textDecoration: data.checkliste[item.key] ? "line-through" : "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!data.checkliste[item.key]}
                  onChange={() => toggleCheck(item.key)}
                  style={{ accentColor: "#D4A843" }}
                />
                {item.label}
              </label>
            ))}
          </div>
        );
      })}

      {/* Notizen */}
      <div style={{ ...cardStyle, marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Notizen
        </div>
        <textarea
          value={data.notizen || ""}
          onChange={e => setData(prev => ({ ...prev, notizen: e.target.value }))}
          placeholder="Besonderheiten, Zugang, Material-Hinweise..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(15,15,30,0.7)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 8,
  padding: "10px 12px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 12,
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};
