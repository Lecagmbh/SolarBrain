import { useState, useEffect, useRef } from "react";
import { C, cardStyle, btnPrimary, badgeStyle } from "../../crm.styles";
import { fetchProjekte } from "../../api/crmApi";
import { api } from "../../../../modules/api/client";
import type { CrmProjekt } from "../../types/crm.types";

interface VdeSignature { id: number; name: string; betrieb: string | null; signatureType: string; isDefault: boolean; active: boolean }

export default function CrmFormulareTab() {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [signaturen, setSignaturen] = useState<VdeSignature[]>([]);
  const [tab, setTab] = useState<"uebersicht" | "unterschriften" | "vorlagen">("uebersicht");

  useEffect(() => {
    fetchProjekte({ limit: 100 }).then(r => setProjekte(r.items)).catch(() => {});
    api.get("/signatures").then(r => setSignaturen(r.data || [])).catch(() => {});
  }, []);

  const msProjects = projekte.filter(p => (p.totalKwp || 0) >= 135);
  const nsProjects = projekte.filter(p => (p.totalKwp || 0) < 135);
  const hasEfk = signaturen.some(s => s.active);

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 6 }}>Formular-Center</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Zentrale VDE-Formular-Generierung — Nur EFK / Admin</div>

      <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, marginBottom: 20, border: `1px solid ${C.border}` }}>
        {([["uebersicht", "Übersicht"], ["unterschriften", "Unterschriften"], ["vorlagen", "Formular-Vorlagen"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "10px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: tab === k ? C.primaryGlow : "transparent", color: tab === k ? C.accent : C.textMuted }}>{l}</button>
        ))}
      </div>

      {tab === "uebersicht" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { l: "MS (VDE 4110)", v: msProjects.length, c: C.orange },
              { l: "NS (VDE 4105)", v: nsProjects.length, c: C.blue },
              { l: "Unterschriften", v: signaturen.filter(s => s.active).length, c: hasEfk ? C.green : C.red },
              { l: "Generierbar", v: projekte.length, c: C.primary },
            ].map((k, i) => (
              <div key={i} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.c }} />
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono'" }}>{k.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright }}>{k.v}</div>
              </div>
            ))}
          </div>
          {projekte.map(p => {
            const isMS = (p.totalKwp || 0) >= 135;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", ...cardStyle, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{isMS ? "⚡" : "🔌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.titel}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{p.kundenName} · {Number(p.totalKwp || 0).toFixed(2)} kWp · {isMS ? "VDE 4110 (MS)" : "VDE 4105 (NS)"}</div>
                </div>
                <span style={badgeStyle(hasEfk ? C.greenBg : C.yellowBg, hasEfk ? C.green : C.yellow)}>{hasEfk ? "✓ Signaturbereit" : "⚠ Unterschrift fehlt"}</span>
                <span style={badgeStyle(isMS ? C.orangeBg : C.blueBg, isMS ? C.orange : C.blue)}>{isMS ? "E.1 + E.8 MS" : "E.1 + E.2/E.3 NS"}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "unterschriften" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>Unterschriften-Verwaltung</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>Gespeicherte Unterschriften aus dem VDE-Signatur-System.</div>

          {signaturen.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {signaturen.map(sig => (
                <div key={sig.id} style={{ ...cardStyle, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{sig.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{sig.betrieb || "—"} · {sig.signatureType}</div>
                    </div>
                    <span style={badgeStyle(sig.active ? C.greenBg : C.redBg, sig.active ? C.green : C.red)}>
                      {sig.active ? "✓ Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                  <img src={`/api/signatures/${sig.id}/image`} alt={sig.name} style={{ height: 60, borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", padding: 4 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  {sig.isDefault && <div style={{ fontSize: 10, color: C.accent, marginTop: 6 }}>⭐ Standard-Unterschrift</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 8 }}>Keine Unterschriften gefunden.</div>
              <div style={{ fontSize: 11, color: C.textDim }}>Unterschriften werden unter Einstellungen → Signaturen verwaltet.</div>
            </div>
          )}
        </div>
      )}

      {tab === "vorlagen" && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>Formular-Vorlagen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { id: "E1_MS", name: "E.1 Antragstellung (MS)", norm: "VDE-AR-N 4110", seiten: "1 Seite" },
              { id: "E8_MS", name: "E.8 Datenblatt EZA (MS)", norm: "VDE-AR-N 4110", seiten: "5 Seiten" },
              { id: "E1_NS", name: "E.1 Anmeldung (NS)", norm: "VDE-AR-N 4105", seiten: "1 Seite" },
              { id: "E5", name: "E.5 IBN-Auftrag", norm: "VDE-AR-N 4110", seiten: "3 Seiten" },
              { id: "E11", name: "E.11 IBSE", norm: "VDE-AR-N 4110", seiten: "4 Seiten" },
              { id: "E12", name: "E.12 Konformitätserklärung", norm: "VDE-AR-N 4110", seiten: "2 Seiten" },
            ].map(f => (
              <div key={f.id} style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textBright }}>{f.name}</div>
                  <span style={badgeStyle(C.primaryGlow, C.accent)}>{f.seiten}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{f.norm}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
