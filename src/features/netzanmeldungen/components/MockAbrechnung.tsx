/**
 * Mock: Abrechnungs-Center — Flexible Preise pro Kunde
 * Admin kann pro Kunde einstellen: Was wird berechnet, wie viel, welches Modell
 */
import { useState } from "react";

const C = {
  bg: "#060b18", card: "rgba(17,20,35,0.95)", border: "rgba(255,255,255,0.06)",
  text: "#e2e8f0", dim: "#64748b", muted: "#94a3b8",
  accent: "#D4A843", blue: "#3b82f6", green: "#22c55e", orange: "#f59e0b", red: "#ef4444", purple: "#f0d878",
};

// Mock-Daten: Kunden mit ihren Abrechnungs-Einstellungen
const KUNDEN = [
  {
    id: 24, name: "NOVATT GmbH (NIVOMA)", type: "crm",
    model: "CRM-Abo + Einzelabrechnung",
    aboPreis: 299, aboInterval: "monatlich",
    positionen: [
      { leistung: "CRM-Abo (Basis)", preis: 299, einheit: "Monat", typ: "abo", aktiv: true },
      { leistung: "Netzanmeldung (Admin. Bearbeitung)", preis: 0, einheit: "Stück", typ: "einzeln", aktiv: true, hinweis: "Im Abo enthalten" },
      { leistung: "VDE-Dokumentation", preis: 0, einheit: "Stück", typ: "einzeln", aktiv: true, hinweis: "Im Abo enthalten" },
      { leistung: "NB-Kommunikation (Nachfragen)", preis: 0, einheit: "Stück", typ: "einzeln", aktiv: true, hinweis: "Im Abo enthalten" },
      { leistung: "Express-Bearbeitung (<24h)", preis: 49, einheit: "Stück", typ: "einzeln", aktiv: false },
    ],
    stats: { anmeldungen: 251, abgerechnet: 0, offen: 0, umsatz: 2691 },
  },
  {
    id: 7, name: "Lumina Solar GmbH", type: "wizard",
    model: "Einzelabrechnung",
    aboPreis: 0, aboInterval: null,
    positionen: [
      { leistung: "Netzanmeldung (Admin. Bearbeitung)", preis: 89, einheit: "Stück", typ: "einzeln", aktiv: true },
      { leistung: "VDE-Dokumentation", preis: 0, einheit: "Stück", typ: "inklusive", aktiv: true, hinweis: "Inklusive" },
      { leistung: "NB-Nachfrage (1.)", preis: 0, einheit: "Stück", typ: "inklusive", aktiv: true },
      { leistung: "NB-Nachfrage (2.+)", preis: 15, einheit: "Stück", typ: "einzeln", aktiv: true },
      { leistung: "Zählerwechsel-Koordination", preis: 25, einheit: "Stück", typ: "einzeln", aktiv: false },
    ],
    stats: { anmeldungen: 89, abgerechnet: 78, offen: 11, umsatz: 6942 },
  },
  {
    id: 30, name: "Sol-Living GmbH", type: "wizard",
    model: "Einzelabrechnung (Whitelabel)",
    aboPreis: 0, aboInterval: null,
    positionen: [
      { leistung: "Netzanmeldung (Admin. Bearbeitung)", preis: 50, einheit: "Stück", typ: "einzeln", aktiv: true },
      { leistung: "Sub: Fabian Kulla GmbH", preis: 50, einheit: "Stück", typ: "einzeln", aktiv: true, hinweis: "Wird unter Sol-Living abgerechnet" },
      { leistung: "Sub: Deutsche WP Werke", preis: 50, einheit: "Stück", typ: "einzeln", aktiv: true, hinweis: "Wird unter Sol-Living abgerechnet" },
      { leistung: "VDE-Dokumentation", preis: 0, einheit: "Stück", typ: "inklusive", aktiv: true },
    ],
    stats: { anmeldungen: 42, abgerechnet: 38, offen: 4, umsatz: 2100 },
  },
  {
    id: 5, name: "EHBB GmbH", type: "wizard",
    model: "Einzelabrechnung",
    aboPreis: 0, aboInterval: null,
    positionen: [
      { leistung: "Netzanmeldung (Admin. Bearbeitung)", preis: 89, einheit: "Stück", typ: "einzeln", aktiv: true },
      { leistung: "VDE-Dokumentation", preis: 0, einheit: "Stück", typ: "inklusive", aktiv: true },
    ],
    stats: { anmeldungen: 12, abgerechnet: 12, offen: 0, umsatz: 1068 },
  },
];

const MODELS = [
  { key: "einzeln", label: "Einzelabrechnung", desc: "Pro Netzanmeldung wird einzeln abgerechnet", icon: "📄" },
  { key: "abo", label: "CRM-Abo + Einzeln", desc: "Monatliches Abo + optionale Einzelleistungen", icon: "🔄" },
  { key: "staffel", label: "Staffelpreise", desc: "Preis sinkt mit Volumen (z.B. ab 50 Stück günstiger)", icon: "📊" },
  { key: "flat", label: "Flatrate", desc: "Alles inklusive für einen festen Monatspreis", icon: "♾️" },
];

export default function MockAbrechnung() {
  const [selectedKunde, setSelectedKunde] = useState(KUNDEN[0]);
  const [editMode, setEditMode] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", padding: "24px 32px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Mock: Abrechnungs-Center</h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>Flexible Preismodelle pro Kunde — Admin kann alles konfigurieren</p>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Kunden-Liste links */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Kunden</div>
          {KUNDEN.map(k => (
            <button key={k.id} onClick={() => { setSelectedKunde(k); setEditMode(false); }}
              style={{
                display: "block", width: "100%", padding: "12px 14px", marginBottom: 4, borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: selectedKunde.id === k.id ? `${C.accent}12` : C.card,
                borderLeft: `3px solid ${selectedKunde.id === k.id ? C.accent : "transparent"}`,
              }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: selectedKunde.id === k.id ? C.accent : C.text }}>{k.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.dim }}>{k.model}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.green }}>{k.stats.umsatz.toLocaleString("de-DE")} €</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 9, color: C.muted }}>{k.stats.anmeldungen} Anm.</span>
                <span style={{ fontSize: 9, color: C.green }}>{k.stats.abgerechnet} abger.</span>
                {k.stats.offen > 0 && <span style={{ fontSize: 9, color: C.orange }}>{k.stats.offen} offen</span>}
              </div>
            </button>
          ))}

          {/* Gesamt-Stats */}
          <div style={{ marginTop: 16, padding: "12px 14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 6 }}>Gesamt</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{KUNDEN.reduce((s, k) => s + k.stats.umsatz, 0).toLocaleString("de-DE")} €</div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{KUNDEN.reduce((s, k) => s + k.stats.anmeldungen, 0)} Anmeldungen gesamt</div>
          </div>
        </div>

        {/* Kunden-Detail rechts */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedKunde.name}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Kunde #{selectedKunde.id} · {selectedKunde.model}</div>
            </div>
            <button onClick={() => setEditMode(!editMode)} style={{
              background: editMode ? C.green : C.accent, color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {editMode ? "💾 Speichern" : "✏️ Bearbeiten"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Anmeldungen", value: selectedKunde.stats.anmeldungen, color: C.text },
              { label: "Abgerechnet", value: selectedKunde.stats.abgerechnet, color: C.green },
              { label: "Offen", value: selectedKunde.stats.offen, color: selectedKunde.stats.offen > 0 ? C.orange : C.green },
              { label: "Umsatz", value: `${selectedKunde.stats.umsatz.toLocaleString("de-DE")} €`, color: C.green },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Abrechnungsmodell */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Abrechnungsmodell</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {MODELS.map(m => (
                <div key={m.key} style={{
                  padding: "12px", borderRadius: 8, cursor: editMode ? "pointer" : "default", textAlign: "center",
                  background: selectedKunde.model.toLowerCase().includes(m.key) ? `${C.accent}15` : "rgba(255,255,255,0.02)",
                  border: selectedKunde.model.toLowerCase().includes(m.key) ? `1px solid ${C.accent}40` : `1px solid ${C.border}`,
                  opacity: editMode ? 1 : (selectedKunde.model.toLowerCase().includes(m.key) ? 1 : 0.4),
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preisliste */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Leistungen & Preise</div>
              {editMode && <button style={{ fontSize: 11, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Position hinzufügen</button>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Leistung", "Typ", "Preis", "Einheit", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "8px 16px", fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedKunde.positionen.map((pos, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{pos.leistung}</div>
                      {pos.hinweis && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{pos.hinweis}</div>}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                        background: pos.typ === "abo" ? `${C.accent}15` : pos.typ === "inklusive" ? `${C.green}15` : `${C.orange}15`,
                        color: pos.typ === "abo" ? C.accent : pos.typ === "inklusive" ? C.green : C.orange,
                      }}>
                        {pos.typ === "abo" ? "Abo" : pos.typ === "inklusive" ? "Inklusive" : "Einzeln"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {editMode ? (
                        <input defaultValue={pos.preis} style={{ width: 60, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", color: C.text, fontSize: 13, fontWeight: 600, textAlign: "right" }} />
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: pos.preis > 0 ? C.text : C.green, fontFamily: "monospace" }}>
                          {pos.preis > 0 ? `${pos.preis.toFixed(2)} €` : "0,00 €"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: C.dim }}>/{pos.einheit}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                        background: pos.aktiv ? `${C.green}15` : `${C.dim}15`,
                        color: pos.aktiv ? C.green : C.dim,
                      }}>
                        {pos.aktiv ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {editMode && (
                        <button style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 14 }}>⚙</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Abo-Details (nur wenn Abo-Modell) */}
          {selectedKunde.aboPreis > 0 && (
            <div style={{ marginTop: 16, background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>🔄 CRM-Abo</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Monatliche Abrechnung · Nächste Rechnung: 01.04.2026</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>{selectedKunde.aboPreis} €</div>
                  <div style={{ fontSize: 10, color: C.dim }}>/Monat netto</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
