/**
 * Übersicht-Tab — Refactored: Projekt-Objekt statt 35+ Props
 * VDE-Status wird live aus API geladen (nicht hardcoded)
 * Responsive Grids für Tablets
 */
import { useState, useEffect } from "react";

function CopyField({ label, value }: { label: string; value?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{copied ? "✓ Kopiert" : value}</span>
    </div>
  );
}

interface LogEntry { date: string; time: string; who: string; action: string; detail: string; color: string; icon: string }
interface Doc { n: string; ok: boolean; by?: string; date?: string }

interface Props {
  projekt: Record<string, any>;
  docs: Doc[];
  log: LogEntry[];
  onTabChange: (tab: string) => void;
  alert?: { text: string; from: string; confidence: number; date: string };
}

const S = {
  card: { background: "rgba(17,20,35,0.95)", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 12, overflow: "hidden" as const },
  head: { padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  headT: { fontSize: 12, fontWeight: 700 as const, color: "#e2e8f0", letterSpacing: 0.3 },
  body: { padding: "12px 14px" },
  badge: (bg: string, c: string) => ({ fontSize: 10, fontWeight: 600 as const, padding: "3px 8px", borderRadius: 4, background: bg, color: c, display: "inline-flex" as const, alignItems: "center" as const, gap: 3 }),
  btn: { background: "#D4A843", color: "#fff", border: "none" as const, borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600 as const, cursor: "pointer" as const },
  btnGhost: { background: "rgba(255,255,255,0.04)", color: "#a5b4fc", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" as const },
};

// VDE-Status Komponente — lädt echten Status aus API
// API liefert Array mit { formId, name, norm, completeness: { percent }, missingRequiredCount }
function VdeStatusCard({ installationId, onTabChange }: { installationId?: number; onTabChange: (t: string) => void }) {
  const [forms, setForms] = useState<{ formId: string; name: string; completeness: { percent: number } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!installationId) { setLoading(false); return; }
    const token = localStorage.getItem("baunity_token") || "";
    fetch(`/api/vde-center/status/${installationId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setForms(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [installationId]);

  return (
    <div style={S.card}>
      <div style={S.head}><span style={S.headT}>📋 VDE</span><button onClick={() => onTabChange("vde")} style={{ ...S.btnGhost, fontSize: 9, padding: "2px 8px" }}>Öffnen →</button></div>
      <div style={S.body}>
        {loading ? (
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 8 }}>Laden...</div>
        ) : forms.length > 0 ? (
          forms.map((f, i) => {
            const pct = f.completeness?.percent ?? 0;
            const icon = pct >= 100 ? "✅" : pct > 0 ? "📝" : "⬜";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: i < forms.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 11, color: pct >= 100 ? "#22c55e" : "#e2e8f0", flex: 1, fontWeight: 500 }}>{f.name || f.formId}</span>
                <span style={{ fontSize: 9, color: pct >= 100 ? "#22c55e" : "#64748b" }}>{pct}%</span>
              </div>
            );
          })
        ) : (
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", padding: 8 }}>Keine Formulare</div>
        )}
        {!installationId && <div style={{ fontSize: 10, color: "#f97316", textAlign: "center", padding: 4 }}>Keine Installation verknüpft</div>}
        <button onClick={() => onTabChange("vde")} style={{ ...S.btn, width: "100%", marginTop: 8, fontSize: 11, padding: "6px" }}>VDE Center öffnen</button>
      </div>
    </div>
  );
}

export default function DetailUebersicht({ projekt: p, docs, log, onTabChange, alert }: Props) {
  const docsOk = docs.filter(d => d.ok).length;

  // Werte aus Projekt-Objekt extrahieren
  const hasCrm = true; // Wird nur für CRM-Projekte aufgerufen
  const kwp = p.totalKwp ? Number(p.totalKwp) : 0;
  const angebotWert = p.geschaetzterWert ? `${Number(p.geschaetzterWert).toLocaleString("de-DE")} €` : undefined;
  const angebotNr = `AG-${p.id}`;
  const angebotSt: string | undefined = angebotWert
    ? (p.angebotStatus || (p.angebote && p.angebote[0]?.status) || "Offen")
    : undefined;
  const tickets = 0;

  return (
    <div>
      {/* Alert */}
      {alert && (
        <div style={{ ...S.card, border: "1px solid rgba(239,68,68,0.15)", marginBottom: 12, background: "rgba(239,68,68,0.03)" }}>
          <div style={{ padding: "14px 16px", display: "flex", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Rückfrage von {alert.from}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, marginBottom: 8 }}>"{alert.text}"</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.btn}>Antworten</button>
                <button style={S.btnGhost}>🎫 Ticket erstellen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top: Angebot | Tickets | Anlage — responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: 10 }}>
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>💰 Angebot</span>{angebotSt && <span style={S.badge(angebotSt === "Angenommen" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)", angebotSt === "Angenommen" ? "#22c55e" : "#eab308")}>{angebotSt === "Angenommen" ? "✓ " : ""}{angebotSt}</span>}</div>
          <div style={{ ...S.body, textAlign: "center" }}>
            {angebotWert ? (<>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#06b6d4", letterSpacing: -1 }}>{angebotWert}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{angebotNr}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
                <button style={S.btnGhost}>📄 PDF</button>
                <button style={S.btnGhost}>✏️ Bearbeiten</button>
              </div>
            </>) : (
              <div style={{ padding: "16px 0" }}>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>Noch kein Angebot erstellt</div>
                <button onClick={() => onTabChange("angebot")} style={S.btn}>+ Angebot erstellen</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...S.card, flex: 1 }}>
            <div style={S.head}><span style={S.headT}>🎫 Tickets</span><span style={S.badge(tickets > 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", tickets > 0 ? "#ef4444" : "#22c55e")}>{tickets > 0 ? `${tickets} offen` : "✓ 0"}</span></div>
            <div style={S.body}>
              {tickets > 0 ? (
                <button onClick={() => onTabChange("tix")} style={{ ...S.btnGhost, width: "100%" }}>{tickets} Tickets anzeigen →</button>
              ) : <div style={{ fontSize: 12, color: "#22c55e", textAlign: "center", padding: 8 }}>✓ Keine offenen Tickets</div>}
            </div>
          </div>
          <div style={{ ...S.card, flex: 1 }}>
            <div style={S.head}><span style={S.headT}>🔧 Montage</span></div>
            <div style={{ ...S.body, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b", padding: 4 }}>Noch nicht geplant</div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>⚡ Anlage</span><span style={{ fontSize: 10, color: "#64748b" }}>{p.einspeiseart || "—"} · {p.messkonzept || "—"}</span></div>
          <div style={S.body}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[{ v: kwp || "—", u: "kWp", l: "Leistung", c: "#22c55e" }, { v: 0 || "—", u: "kVA", l: "Wechselrichter", c: "#06b6d4" }, { v: p.speicherKwh ? Number(p.speicherKwh) : "—", u: "kWh", l: "Speicher", c: "#f0d878" }].map(x => (
                <div key={x.u} style={{ flex: 1, background: x.c + "08", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: x.c, letterSpacing: -1 }}>{x.v}</div>
                  <div style={{ fontSize: 10, color: x.c, opacity: 0.7, fontWeight: 600 }}>{x.u}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{x.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div><div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginBottom: 3 }}>MODULE {p.modulAnzahl ? `(${p.modulAnzahl}×)` : ""}</div><div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{p.modulTyp || "—"}</div><div style={{ fontSize: 10, color: "#64748b" }}>{p.modulLeistungWp ? `${p.modulLeistungWp} Wp` : "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#06b6d4", fontWeight: 700, marginBottom: 3 }}>WECHSELRICHTER</div><div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{p.wechselrichterTyp || "—"}</div><div style={{ fontSize: 10, color: "#64748b" }}>{kwp ? `${kwp} kW` : "—"}</div></div>
              <div><div style={{ fontSize: 9, color: "#f0d878", fontWeight: 700, marginBottom: 3 }}>SPEICHER</div><div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{p.speicherTyp || "—"}</div><div style={{ fontSize: 10, color: "#64748b" }}>{p.speicherKwh ? `${Number(p.speicherKwh)} kWh` : "—"}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mitte: Kunde | Standort | Pflichtdocs | VDE — responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>👤 Kunde</span></div>
          <div style={S.body}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{p.kundenName || "—"}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{p.ansprechpartner || ""}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{p.kontaktEmail || "—"}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{p.kontaktTelefon || "—"}</div>
            {p.dedicatedEmail && <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4, fontFamily: "monospace" }}>📧 {p.dedicatedEmail}</div>}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>📍 Standort</span></div>
          <div style={S.body}>
            <CopyField label="Straße" value={p.strasse} />
            {p.hausNr && <CopyField label="Hausnr." value={p.hausNr} />}
            <CopyField label="PLZ" value={p.plz} />
            <CopyField label="Ort" value={p.ort} />
          </div>
        </div>
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>📄 Pflichtdokumente</span><span style={S.badge(docsOk === docs.length ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)", docsOk === docs.length ? "#22c55e" : "#f97316")}>{docsOk}/{docs.length}</span></div>
          <div style={S.body}>
            {docs.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: i < docs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 12 }}>{doc.ok ? "✅" : "❌"}</span>
                <span style={{ fontSize: 11, color: doc.ok ? "#e2e8f0" : "#ef4444", flex: 1, fontWeight: 500 }}>{doc.n}</span>
                {doc.ok && doc.by && <span style={{ fontSize: 9, color: "#64748b" }}>{doc.by} · {doc.date}</span>}
                {!doc.ok && <button style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "2px 8px", fontSize: 9, color: "#a5b4fc", cursor: "pointer" }}>↑ Upload</button>}
              </div>
            ))}
          </div>
        </div>
        <VdeStatusCard installationId={p.installationId} onTabChange={onTabChange} />
      </div>

      {/* Bottom Row: Dokumente-Upload + Letzte 5 Aktivitäten — responsive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
        {/* Drag & Drop Dokumente */}
        <div style={S.card}>
          <div style={S.head}><span style={S.headT}>📎 Dokumente hochladen</span></div>
          <div style={{ padding: "16px 14px" }}>
            <div style={{
              border: "2px dashed rgba(212,168,67,0.15)", borderRadius: 12, padding: "28px 16px",
              textAlign: "center", cursor: "pointer", transition: "all 0.2s",
              background: "rgba(212,168,67,0.02)",
            }}
              onClick={() => onTabChange("docs")}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#D4A843"; e.currentTarget.style.background = "rgba(212,168,67,0.06)"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; e.currentTarget.style.background = "rgba(212,168,67,0.02)"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; e.currentTarget.style.background = "rgba(212,168,67,0.02)"; }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>Dateien hier ablegen</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>oder klicken zum Auswählen</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>PDF, PNG, JPG, DWG — max. 20 MB</div>
            </div>
          </div>
        </div>

        {/* Letzte 5 Aktivitäten */}
        <div style={S.card}>
          <div style={S.head}>
            <span style={S.headT}>📜 Letzte Aktivitäten</span>
            <button onClick={() => onTabChange("verlauf")} style={{ ...S.btnGhost, fontSize: 9, padding: "2px 8px" }}>Alle anzeigen →</button>
          </div>
          <div style={{ padding: "4px 14px" }}>
            {log.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: i < Math.min(log.length, 5) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: e.color + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    <span style={{ fontWeight: 600, color: e.color }}>{e.who}</span> {e.action}
                  </div>
                </div>
                <span style={{ fontSize: 9, color: "#475569", flexShrink: 0, fontFamily: "monospace" }}>{e.date}</span>
              </div>
            ))}
            {log.length === 0 && <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: "#64748b" }}>Noch keine Aktivitäten</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
