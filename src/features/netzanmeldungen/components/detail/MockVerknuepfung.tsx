/**
 * Mock: CRM ↔ Installation Verknüpfungs-Transparenz
 * Zeigt wie verknüpfte Projekte dargestellt werden
 */
import { useState } from "react";

const C = {
  bg: "#0a0a0f", card: "rgba(17,20,35,0.95)", border: "rgba(212,168,67,0.08)",
  text: "#e2e8f0", dim: "#64748b", accent: "#D4A843", green: "#22c55e",
  blue: "#3b82f6", orange: "#f59e0b", red: "#ef4444", purple: "#f0d878",
};

const cardStyle = (borderColor: string) => ({
  background: C.card, border: `1px solid ${borderColor}20`, borderRadius: 12,
  borderLeft: `3px solid ${borderColor}`, overflow: "hidden" as const,
});

// Mock-Daten
const MOCK_CRM = {
  id: 42, titel: "PV-Anlage Fernandez", stage: "AUFTRAG", kundenName: "Salvador Fernandez Cervantes",
  kontaktEmail: "salva.f@gmx.de", totalKwp: 7.65, speicherKwh: 6, geschaetzterWert: 48200,
  organisation: "NOVATT GmbH", angebotStatus: "Offen", angebotNr: "ANG-2026-0042",
  createdAt: "2026-02-15", installationId: 2216,
};

const MOCK_INST = {
  id: 2216, publicId: "INST-HOLR2CZPU", status: "beim_nb", customerName: "Salvador Fernandez Cervantes",
  gridOperator: "Energieversorgung Rüsselsheim GmbH", totalKwp: 7.65, daysAtNb: 5,
  nbEmail: "netzanschluss@evr.de", createdAt: "2026-03-16", crmProjektId: 42,
};

const MOCK_TIMELINE = [
  { date: "15.02.2026", source: "crm", icon: "📊", color: C.accent, title: "CRM-Projekt angelegt", detail: "NOVATT GmbH · Anfrage" },
  { date: "18.02.2026", source: "crm", icon: "📝", color: C.orange, title: "Angebot erstellt", detail: "ANG-2026-0042 · 48.200 €" },
  { date: "22.02.2026", source: "crm", icon: "✅", color: C.green, title: "Angebot angenommen", detail: "Stage → AUFTRAG" },
  { date: "01.03.2026", source: "crm", icon: "🤝", color: C.purple, title: "HV zugeordnet", detail: "Christian Zwick" },
  { date: "16.03.2026", source: "inst", icon: "⚡", color: C.blue, title: "Netzanmeldung erstellt", detail: "INST-HOLR2CZPU · aus CRM-Projekt" },
  { date: "16.03.2026", source: "inst", icon: "📄", color: C.green, title: "Dokumente generiert", detail: "Schaltplan, Lageplan, E.1, Vollmacht, Projektmappe" },
  { date: "16.03.2026", source: "inst", icon: "📨", color: C.blue, title: "Beim NB eingereicht", detail: "Energieversorgung Rüsselsheim GmbH" },
  { date: "17.03.2026", source: "inst", icon: "⏳", color: C.dim, title: "Warte auf NB-Antwort", detail: "Tag 1 von ~14" },
];

export default function MockVerknuepfung() {
  const [view, setView] = useState<"crm" | "inst" | "liste">("liste");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", padding: "24px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Mock: CRM ↔ Installation Verknüpfung</h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>So wird die Transparenz zwischen CRM-Projekt und Netzanmeldung dargestellt</p>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(15,15,28,0.5)", borderRadius: 8, padding: 4, border: `1px solid ${C.border}` }}>
        {([["liste", "📋 Listen-Ansicht"], ["crm", "📊 CRM Detail-Panel"], ["inst", "⚡ Installation Detail-Panel"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: view === k ? 700 : 400,
            cursor: "pointer", background: view === k ? `${C.accent}15` : "transparent", color: view === k ? C.accent : C.dim,
          }}>{l}</button>
        ))}
      </div>

      {/* ═══ LISTE ═══ */}
      {view === "liste" && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.dim }}>So sehen verknüpfte Einträge in der Liste aus:</h2>

          {/* CRM-Projekt in Liste */}
          <div style={{ ...cardStyle(C.accent), marginBottom: 8, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{MOCK_CRM.kundenName}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>CRM-{MOCK_CRM.id} · {MOCK_CRM.organisation} · {MOCK_CRM.totalKwp} kWp</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${C.accent}15`, color: C.accent }}>AUFTRAG</span>
                {/* Verknüpfungs-Badge */}
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${C.blue}15`, color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  onClick={() => setView("inst")}>
                  ⚡ NA: BEIM NB <span style={{ fontSize: 8 }}>→</span>
                </span>
              </div>
            </div>
          </div>

          {/* Installation in Liste */}
          <div style={{ ...cardStyle(C.blue), marginBottom: 8, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.blue}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{MOCK_INST.customerName}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{MOCK_INST.publicId} · {MOCK_INST.gridOperator} · {MOCK_INST.totalKwp} kWp</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${C.blue}15`, color: C.blue }}>BEIM NB</span>
                {/* Verknüpfungs-Badge */}
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${C.accent}15`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  onClick={() => setView("crm")}>
                  📊 CRM: AUFTRAG <span style={{ fontSize: 8 }}>→</span>
                </span>
              </div>
            </div>
          </div>

          {/* Unverknüpftes CRM-Projekt */}
          <div style={{ ...cardStyle(C.dim), marginBottom: 8, padding: "14px 18px", opacity: 0.7 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.dim}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Max Mustermann</div>
                  <div style={{ fontSize: 11, color: C.dim }}>CRM-99 · NOVATT GmbH · 12.4 kWp</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${C.orange}15`, color: C.orange }}>ANFRAGE</span>
                <span style={{ fontSize: 10, color: C.dim, fontStyle: "italic" }}>Keine NA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CRM DETAIL ═══ */}
      {view === "crm" && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.dim }}>CRM-Projekt geöffnet — Verknüpfungs-Card oben:</h2>

          {/* Verknüpfungs-Card */}
          <div style={{
            background: `linear-gradient(135deg, ${C.blue}08, ${C.blue}03)`,
            border: `1px solid ${C.blue}25`, borderRadius: 12, padding: "16px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.blue}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚡</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: 0.5 }}>Verknüpfte Netzanmeldung</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 2 }}>{MOCK_INST.publicId}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  {MOCK_INST.gridOperator} · Seit {MOCK_INST.daysAtNb} Tagen beim NB
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: `${C.blue}15`, color: C.blue }}>BEIM NB</span>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Eingereicht: 16.03.2026</div>
              </div>
              <button onClick={() => setView("inst")} style={{
                background: C.blue, color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>→ Öffnen</button>
            </div>
          </div>

          {/* Rest des CRM-Panels (vereinfacht) */}
          <div style={cardStyle(C.accent)}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>📊 CRM-Projekt #{MOCK_CRM.id}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: `${C.accent}15`, color: C.accent }}>AUFTRAG</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Kunde</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{MOCK_CRM.kundenName}</div><div style={{ fontSize: 11, color: C.dim }}>{MOCK_CRM.kontaktEmail}</div></div>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Anlage</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{MOCK_CRM.totalKwp} kWp + {MOCK_CRM.speicherKwh} kWh</div><div style={{ fontSize: 11, color: C.dim }}>Überschusseinspeisung</div></div>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Angebot</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: C.green }}>{MOCK_CRM.geschaetzterWert.toLocaleString("de-DE")} €</div><div style={{ fontSize: 11, color: C.dim }}>{MOCK_CRM.angebotNr} · {MOCK_CRM.angebotStatus}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INSTALLATION DETAIL ═══ */}
      {view === "inst" && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.dim }}>Installation geöffnet — Verknüpfungs-Card oben:</h2>

          {/* Verknüpfungs-Card */}
          <div style={{
            background: `linear-gradient(135deg, ${C.accent}08, ${C.accent}03)`,
            border: `1px solid ${C.accent}25`, borderRadius: 12, padding: "16px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>CRM-Projekt</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 2 }}>CRM-{MOCK_CRM.id} · {MOCK_CRM.organisation}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  Wert: {MOCK_CRM.geschaetzterWert.toLocaleString("de-DE")} € · Angebot: {MOCK_CRM.angebotStatus}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: `${C.accent}15`, color: C.accent }}>AUFTRAG</span>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Seit: 22.02.2026</div>
              </div>
              <button onClick={() => setView("crm")} style={{
                background: C.accent, color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>→ Öffnen</button>
            </div>
          </div>

          {/* Rest des Installation-Panels (vereinfacht) */}
          <div style={cardStyle(C.blue)}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>⚡ {MOCK_INST.publicId}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: `${C.blue}15`, color: C.blue }}>BEIM NB</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Betreiber</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{MOCK_INST.customerName}</div></div>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Netzbetreiber</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{MOCK_INST.gridOperator}</div><div style={{ fontSize: 11, color: C.dim }}>{MOCK_INST.daysAtNb} Tage beim NB</div></div>
                <div><div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase" }}>Leistung</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{MOCK_INST.totalKwp} kWp</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GEMEINSAME TIMELINE ═══ */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.dim }}>Gemeinsame Timeline — CRM + Installation vereint:</h2>
        <div style={cardStyle(C.dim)}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>📖 Projekt-Verlauf</span>
          </div>
          <div style={{ padding: "8px 16px" }}>
            {MOCK_TIMELINE.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < MOCK_TIMELINE.length - 1 ? `1px solid rgba(255,255,255,0.03)` : "none" }}>
                {/* Zeitlinie */}
                <div style={{ width: 60, flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>{e.date.split(".").slice(0, 2).join(".")}</div>
                </div>
                {/* Punkt + Linie */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, border: `2px solid ${e.color}30`, flexShrink: 0 }} />
                  {i < MOCK_TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />}
                </div>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{e.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.title}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
                      background: e.source === "crm" ? `${C.accent}15` : `${C.blue}15`,
                      color: e.source === "crm" ? C.accent : C.blue,
                    }}>
                      {e.source === "crm" ? "CRM" : "NA"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
