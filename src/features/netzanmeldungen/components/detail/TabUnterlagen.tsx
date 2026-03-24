/**
 * NB-Unterlagen Checkliste — prüft gegen vorhandene Dokumente
 */
import { useState, useEffect } from "react";

interface Props { crmId: number; kwp: number; installationId?: number }
interface Item { id: number; phase: number; bezeichnung: string; beschreibung?: string; vdeNummer?: string; erforderlich: boolean; status: string; dokumentPfad?: string }
interface Dok { titel: string; metadata?: any; createdAt: string }

const PHASE_LABELS = ["", "⚠ VOR NB-Anfrage", "🔧 Vor Errichtung", "🔌 Inbetriebsetzung", "🏆 Betriebserlaubnis"];
const PHASE_COLORS = ["", "#ef4444", "#eab308", "#38bdf8", "#22c55e"];

// Auto-Match: Dokument-Titel gegen Checkliste-Bezeichnung
function matchDokToItem(dokTitel: string, itemBez: string): boolean {
  const d = dokTitel.toLowerCase().replace(/📄\s*/g, "");
  const b = itemBez.toLowerCase();
  // Exakte Teilstring-Matches
  const keywords = b.split(/[\s()/]+/).filter(w => w.length > 2);
  const matched = keywords.filter(kw => d.includes(kw));
  return matched.length >= Math.ceil(keywords.length * 0.4);
}

export default function TabUnterlagen({ crmId, kwp }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [docs, setDocs] = useState<Dok[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/crm/projekte/${crmId}/checkliste`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      fetch(`/api/crm/projekte/${crmId}/aktivitaeten`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
    ]).then(([cl, acts]) => {
      setItems(cl);
      setDocs((acts || []).filter((a: any) => a.typ === "DOKUMENT").map((a: any) => ({
        titel: a.titel || "", metadata: a.metadata, createdAt: a.createdAt,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [crmId]);

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Laden...</div>;

  // Auto-Match: Welche Checkliste-Items haben ein passendes Dokument?
  const enrichedItems = items.map(item => {
    if (item.status !== "OFFEN") return { ...item, matchedDoc: null }; // Schon erledigt
    const match = docs.find(d => matchDokToItem(d.titel, item.bezeichnung));
    return { ...item, matchedDoc: match || null };
  });

  const fulfilled = enrichedItems.filter(i => i.status !== "OFFEN" || i.matchedDoc).length;
  const isMS = kwp >= 135;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>📋 NB-Unterlagen</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{isMS ? "VDE-AR-N 4110 (MS)" : "VDE-AR-N 4105 (NS)"} · {kwp} kWp · {docs.length} Dokumente vorhanden</div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: fulfilled === items.length ? "#22c55e" : "#f97316" }}>{fulfilled}/{items.length}</span>
      </div>

      {/* Fortschrittsbalken */}
      <div style={{ height: 8, background: "rgba(255,255,255,0.03)", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ width: items.length > 0 ? `${(fulfilled / items.length) * 100}%` : "0%", height: "100%", background: fulfilled === items.length ? "#22c55e" : "linear-gradient(90deg, #D4A843, #eab308)", borderRadius: 4, transition: "width 0.5s" }} />
      </div>

      {/* Readiness-Banner */}
      {items.length > 0 && (
        <div style={{
          padding: "10px 16px", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 10,
          background: fulfilled === items.filter(i => i.phase === 1).length ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
          border: `1px solid ${fulfilled === items.filter(i => i.phase === 1).length ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
        }}>
          <span style={{ fontSize: 16 }}>{fulfilled >= items.filter(i => i.phase === 1 && i.erforderlich).length ? "✅" : "⛔"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: fulfilled >= items.filter(i => i.phase === 1 && i.erforderlich).length ? "#22c55e" : "#ef4444" }}>
              {fulfilled >= items.filter(i => i.phase === 1 && i.erforderlich).length ? "NB-Anfrage kann gestellt werden" : `${items.filter(i => i.phase === 1 && i.erforderlich && i.status === "OFFEN").length} Pflicht-Unterlagen fehlen`}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Phase 1 Pflicht-Unterlagen geprüft</div>
          </div>
        </div>
      )}

      {[1, 2, 3, 4].map(phase => {
        const phaseItems = enrichedItems.filter(i => i.phase === phase);
        if (!phaseItems.length) return null;
        const phaseDone = phaseItems.filter(i => i.status !== "OFFEN" || i.matchedDoc).length;
        return (
          <div key={phase} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: PHASE_COLORS[phase] }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: PHASE_COLORS[phase] }}>{PHASE_LABELS[phase]}</span>
              <span style={{ fontSize: 10, color: "#475569" }}>({phaseDone}/{phaseItems.length})</span>
              {phaseDone === phaseItems.length && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓ KOMPLETT</span>}
            </div>
            {phaseItems.map(item => {
              const isDone = item.status !== "OFFEN";
              const hasMatch = !!item.matchedDoc;
              const ok = isDone || hasMatch;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: ok ? "rgba(34,197,94,0.02)" : "rgba(17,20,35,0.95)", border: `1px solid ${ok ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ok ? "✅" : "⬜"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: ok ? "#22c55e" : "#e2e8f0" }}>{item.bezeichnung}</div>
                    {item.beschreibung && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{item.beschreibung.substring(0, 100)}</div>}
                    {hasMatch && !isDone && (
                      <div style={{ fontSize: 10, color: "#38bdf8", marginTop: 3 }}>
                        📎 Gefunden: {item.matchedDoc!.titel.replace("📄 ", "").substring(0, 50)} · {new Date(item.matchedDoc!.createdAt).toLocaleDateString("de-DE")}
                      </div>
                    )}
                  </div>
                  {item.erforderlich && !ok && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>PFLICHT</span>}
                  {ok && <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>{isDone ? item.status : "MATCH"}</span>}
                  {!ok && <button style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: "#a5b4fc", cursor: "pointer" }}>↑ Upload</button>}
                </div>
              );
            })}
          </div>
        );
      })}

      {items.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>Checkliste wird beim ersten Zugriff generiert.</div>}
    </div>
  );
}
