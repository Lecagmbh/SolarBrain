import { useState, useEffect, useRef } from "react";
import { C, fmt, badgeStyle, btnPrimary, btnGhost, cardStyle } from "../crm.styles";
import { fetchProjekt, fetchCheckliste, fetchReadiness, changeStage, fetchKommentare, addKommentar, fetchAktivitaeten, addZeiteintrag } from "../api/crmApi";
import { fetchDokumente, uploadDokument, deleteDokument, createInstallation } from "../api/crmApi";
import { FLOW_STAGES, stageInfo, anlagenTypInfo } from "../types/crm.types";
import type { CrmProjekt, CrmStage, CrmKommentar, CrmAktivitaet, ChecklisteItem, ReadinessStatus, CrmDokument } from "../types/crm.types";
import CrmFlowProgress from "./CrmFlowProgress";

const TABS = [
  { key: "uebersicht", label: "Übersicht" },
  { key: "kommentare", label: "Kommentare" },
  { key: "unterlagen", label: "NB-Unterlagen" },
  { key: "dokumente", label: "Dokumente" },
  { key: "zeit", label: "Aktivitäten" },
];

export default function CrmProjektDetail({ projekt: initial, onClose }: { projekt: CrmProjekt; onClose: () => void }) {
  const [tab, setTab] = useState("uebersicht");
  const [p, setP] = useState(initial);
  const [kommentare, setKommentare] = useState<CrmKommentar[]>([]);
  const [checkliste, setCheckliste] = useState<ChecklisteItem[]>([]);
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [kommentarText, setKommentarText] = useState("");
  const [aktivitaeten, setAktivitaeten] = useState<CrmAktivitaet[]>([]);
  const [dokumente, setDokumente] = useState<CrmDokument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creatingInstallation, setCreatingInstallation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Vollständiges Projekt nachladen (mit installationId etc.)
    fetchProjekt(p.id).then(full => setP(prev => ({ ...prev, ...full }))).catch(() => {});
    fetchKommentare(p.id).then(setKommentare).catch(() => {});
    fetchAktivitaeten(p.id).then(r => setAktivitaeten(r || [])).catch(() => {});
    fetchCheckliste(p.id).then(setCheckliste).catch(() => {});
    fetchReadiness(p.id).then(setReadiness).catch(() => {});
    fetchDokumente(p.id).then(setDokumente).catch(() => {});
  }, [p.id]);

  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const si = stageInfo(p.stage);
  const nextStageLabel = p.stage === "ANFRAGE" ? "→ HV zuordnen" : p.stage === "HV_VERMITTELT" ? "→ Auftrag bestätigen" : p.stage === "AUFTRAG" ? "→ NB-Anfrage" : "Nächster Schritt";
  const nextStageMap: Record<string, CrmStage> = { ANFRAGE: "HV_VERMITTELT", HV_VERMITTELT: "AUFTRAG", AUFTRAG: "NB_ANFRAGE" };
  const nextStage = nextStageMap[p.stage];

  const handleStageChange = async () => {
    if (!nextStage) return;
    setStageLoading(true);
    setStageError(null);
    try {
      await changeStage(p.id, nextStage);
      const updated = await fetchProjekt(p.id);
      setP(prev => ({ ...prev, ...updated }));
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Status-Änderung fehlgeschlagen";
      setStageError(msg);
      setTimeout(() => setStageError(null), 4000);
    } finally {
      setStageLoading(false);
    }
  };

  const handleAddKommentar = async () => {
    if (!kommentarText.trim()) return;
    await addKommentar(p.id, { text: kommentarText });
    setKommentarText("");
    fetchKommentare(p.id).then(setKommentare);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDokument(p.id, file);
      fetchDokumente(p.id).then(setDokumente);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDokument = async (docId: number) => {
    if (!confirm("Dokument wirklich löschen?")) return;
    await deleteDokument(docId);
    fetchDokumente(p.id).then(setDokumente);
  };

  const handleCreateInstallation = async () => {
    if (p.installationId) return;
    if (!confirm("Netzanmeldung aus diesem CRM-Projekt erstellen?")) return;
    setCreatingInstallation(true);
    try {
      const result = await createInstallation(p.id);
      setP(prev => ({ ...prev, installationId: result.installationId }));
    } catch (err: any) {
      alert("Fehler: " + (err?.response?.data?.error || err.message));
    } finally {
      setCreatingInstallation(false);
    }
  };

  // Tab badge counts
  const kommentarCount = kommentare.length || (p._count?.kommentare ?? 0);
  const dokCount = dokumente.length || ((p._count as any)?.dokumente ?? 0);

  return (
    <div className="crm-fade">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onClose} style={btnGhost}>← Zurück</button>
        <span style={{ fontSize: 11, color: C.textMuted }}>Projekte › </span>
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{p.titel}</span>
      </div>

      {/* Header */}
      <div style={{ ...cardStyle, padding: "20px 28px", marginBottom: 20, borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 8 }}>{p.titel}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={badgeStyle(si.color + "20", si.color)}>{si.icon} {si.label}</span>
              <span style={badgeStyle(p.prioritaet === "DRINGEND" ? C.redBg : C.yellowBg, p.prioritaet === "DRINGEND" ? C.red : C.yellow)}>{p.prioritaet}</span>
              {p.tags?.map(t => <span key={t} style={{ fontSize: 9, color: C.primaryLight, background: C.primaryGlow, padding: "2px 6px", borderRadius: 3, fontWeight: 600 }}>{t}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {stageError && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{stageError}</span>}
            {nextStage && (
              <button onClick={handleStageChange} disabled={stageLoading} style={{ ...btnPrimary, opacity: stageLoading ? 0.5 : 1, cursor: stageLoading ? "wait" : "pointer" }}>
                {stageLoading ? "Wird geändert..." : nextStageLabel}
              </button>
            )}
            <button style={btnGhost}>Email senden</button>
          </div>
        </div>
        <CrmFlowProgress currentStage={p.stage} />

        {/* Verknüpfung CRM ↔ Netzanmeldung */}
        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: p.installationId ? "rgba(52,211,153,0.06)" : "rgba(251,191,36,0.06)", border: `1px solid ${p.installationId ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{p.installationId ? "🔗" : "📋"}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: p.installationId ? C.green : C.yellow }}>
                {p.installationId ? `Netzanmeldung #${p.installationId}` : "Keine Netzanmeldung verknüpft"}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted }}>
                {p.installationId ? "CRM-Projekt ist mit Netzanmeldung verknüpft" : "Netzanmeldung kann aus Projektdaten erstellt werden"}
              </div>
            </div>
          </div>
          {p.installationId ? (
            <a href={`/netzanmeldungen/${p.installationId}`} style={{ ...btnGhost, textDecoration: "none", fontSize: 11 }}>
              Zur Netzanmeldung →
            </a>
          ) : (
            <button onClick={handleCreateInstallation} disabled={creatingInstallation} style={{ ...btnPrimary, opacity: creatingInstallation ? 0.5 : 1 }}>
              {creatingInstallation ? "Wird erstellt..." : "Netzanmeldung erstellen"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "rgba(12,12,20,0.7)", borderRadius: 8, padding: 3, marginBottom: 20, border: `1px solid ${C.border}` }}>
        {TABS.map(t => {
          const count = t.key === "kommentare" ? kommentarCount : t.key === "dokumente" ? dokCount : 0;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t.key ? C.primaryGlow : "transparent",
              color: tab === t.key ? C.accent : C.textMuted, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              {t.label}
              {count > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, background: tab === t.key ? C.primary : "rgba(212,168,67,0.2)", color: "#fff", borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Übersicht */}
      {tab === "uebersicht" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 14 }}>Projektdaten</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {[
                ["Kunde", p.kundenName], ["Kontakt", p.ansprechpartner], ["Wert", fmt(p.geschaetzterWert)],
                ["Anlagentypen", p.anlagenTypen.map(t => anlagenTypInfo(t).label).join(" + ")],
                ["Standort", `${p.plz || ""} ${p.ort || ""}`], ["kWp", p.totalKwp],
                ["Quelle", p.quelle], ["Erstellt", new Date(p.createdAt).toLocaleDateString("de-DE")],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 600, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Anlagenbetreiber */}
          {p.anlagenbetreiber && (
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 14 }}>Anlagenbetreiber</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                {[
                  ["Typ", p.anlagenbetreiber.typ === "GEWERBE" ? "Gewerbe" : "Privat"],
                  ["Firma", p.anlagenbetreiber.firma?.name ? `${p.anlagenbetreiber.firma.name}${p.anlagenbetreiber.firma.rechtsform ? ` (${p.anlagenbetreiber.firma.rechtsform})` : ""}` : undefined],
                  ["Vertreter", p.anlagenbetreiber.vertreter],
                  ["Straße", p.anlagenbetreiber.adresse?.strasse],
                  ["Hausnr.", p.anlagenbetreiber.adresse?.hausnummer],
                  ["PLZ", p.anlagenbetreiber.adresse?.plz],
                  ["Ort", p.anlagenbetreiber.adresse?.ort],
                  ["Telefon", p.anlagenbetreiber.kontakt?.telefon],
                  ["Email", p.anlagenbetreiber.kontakt?.email],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 600, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NB-Readiness */}
          <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright, marginBottom: 14 }}>NB-Readiness</div>
            {readiness ? (
              <>
                <div style={{ background: readiness.ready ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${readiness.ready ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: readiness.ready ? C.green : C.red }}>
                    {readiness.ready ? "NB-Anfrage bereit!" : `${readiness.missing.length} Unterlagen fehlen`}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    {readiness.vorAnfrageFulfilled}/{readiness.vorAnfrageTotal} Pflicht-Unterlagen
                  </div>
                </div>
                {readiness.missing.length > 0 && (
                  <div style={{ fontSize: 11, color: C.textDim }}>
                    <b>Fehlt:</b> {readiness.missing.join(", ")}
                  </div>
                )}
              </>
            ) : <div style={{ color: C.textMuted, fontSize: 12 }}>Laden...</div>}
          </div>

          {/* Letzte Kommentare (Preview im Übersicht-Tab) */}
          <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.textBright }}>Letzte Kommentare</div>
              {kommentarCount > 0 && (
                <button onClick={() => setTab("kommentare")} style={{ ...btnGhost, padding: "4px 10px", fontSize: 10 }}>
                  Alle {kommentarCount} anzeigen →
                </button>
              )}
            </div>
            {kommentare.slice(0, 3).map(k => {
              const authorMatch = k.text.match(/^\[([^\]]+)\]\s*/);
              const author = k.isSystem ? "KI-System" : authorMatch ? authorMatch[1] : (k.userId ? `User #${k.userId}` : "Factro");
              const displayText = authorMatch ? k.text.replace(authorMatch[0], "") : k.text.replace(/^↳\s*\[[^\]]+\]\s*/, "");
              return (
                <div key={k.id} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: k.isSystem ? C.orange : C.accent, minWidth: 80, flexShrink: 0, fontSize: 10 }}>{author}</span>
                  <span style={{ color: C.textDim, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayText}</span>
                  <span style={{ color: C.textMuted, fontSize: 9, fontFamily: "'DM Mono'", flexShrink: 0 }}>{new Date(k.createdAt).toLocaleDateString("de-DE")}</span>
                </div>
              );
            })}
            {kommentare.length === 0 && <div style={{ color: C.textMuted, fontSize: 11 }}>Noch keine Kommentare</div>}
          </div>
        </div>
      )}

      {/* Tab: Kommentare */}
      {tab === "kommentare" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={kommentarText} onChange={e => setKommentarText(e.target.value)} placeholder="Kommentar schreiben..." onKeyDown={e => e.key === "Enter" && handleAddKommentar()}
              style={{ flex: 1, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", color: C.text, fontSize: 12, outline: "none" }} />
            <button onClick={handleAddKommentar} style={btnPrimary}>Senden</button>
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 12 }}>{kommentare.length} Kommentare</div>
          {kommentare.map(k => {
            const authorMatch = k.text.match(/^\[([^\]]+)\]\s*/);
            const isReply = k.text.startsWith("↳");
            const author = k.isSystem ? "KI-System" : authorMatch ? authorMatch[1] : (k.userId ? `User #${k.userId}` : "Factro");
            const displayText = authorMatch ? k.text.replace(authorMatch[0], "") : k.text.replace(/^↳\s*\[[^\]]+\]\s*/, "");
            const initials = author.split(" ").map(w => w[0]).join("").substring(0, 2);
            return (
              <div key={k.id} style={{ display: "flex", gap: 10, padding: "10px 14px", ...cardStyle, marginBottom: 6, marginLeft: isReply ? 32 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: k.isSystem ? `linear-gradient(135deg, ${C.primary}, ${C.orange})` : C.primaryGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: k.isSystem ? "#fff" : C.accent, flexShrink: 0 }}>
                  {k.isSystem ? "KI" : initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: k.isSystem ? C.orange : C.text }}>{author}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono'" }}>{new Date(k.createdAt).toLocaleString("de-DE")}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{displayText}</div>
                </div>
              </div>
            );
          })}
          {kommentare.length === 0 && <div style={{ color: C.textMuted, textAlign: "center", padding: 30 }}>Noch keine Kommentare.</div>}
        </div>
      )}

      {/* Tab: NB-Unterlagen */}
      {tab === "unterlagen" && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>NB-Unterlagen Checkliste</div>
          {[1, 2, 3, 4].map(phase => {
            const items = checkliste.filter(i => i.phase === phase);
            if (!items.length) return null;
            const labels = ["", "VOR NB-Anfrage", "Vor Errichtung", "Inbetriebsetzung", "Betriebserlaubnis"];
            const colors = ["", C.red, C.yellow, C.blue, C.green];
            const done = items.filter(i => i.status !== "OFFEN").length;
            return (
              <div key={phase} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: colors[phase] }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: colors[phase] }}>{labels[phase]}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>({done}/{items.length})</span>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", ...cardStyle, marginBottom: 4, background: item.status !== "OFFEN" ? "rgba(52,211,153,0.03)" : C.bgCard }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: item.status !== "OFFEN" ? C.green : "transparent", border: `2px solid ${item.status !== "OFFEN" ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800 }}>
                      {item.status !== "OFFEN" && "✓"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: item.status !== "OFFEN" ? C.green : C.text }}>{item.bezeichnung}</div>
                      {item.beschreibung && <div style={{ fontSize: 10, color: C.textMuted }}>{item.beschreibung}</div>}
                    </div>
                    {item.erforderlich && item.status === "OFFEN" && <span style={badgeStyle(C.redBg, C.red)}>PFLICHT</span>}
                    {item.status !== "OFFEN" && <span style={badgeStyle(C.greenBg, C.green)}>{item.status}</span>}
                  </div>
                ))}
              </div>
            );
          })}
          {checkliste.length === 0 && <div style={{ color: C.textMuted, textAlign: "center", padding: 30 }}>Checkliste wird generiert...</div>}
        </div>
      )}

      {/* Tab: Dokumente */}
      {tab === "dokumente" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.textBright }}>Dokumente</div>
            <div>
              <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? 0.5 : 1 }}>
                {uploading ? "Wird hochgeladen..." : "+ Dokument hochladen"}
              </button>
            </div>
          </div>

          {/* CRM-Dokumente (aus DB) */}
          {dokumente.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>CRM-Dokumente ({dokumente.length})</div>
              {dokumente.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", ...cardStyle, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{d.dateityp?.includes("pdf") ? "📕" : d.dateityp?.includes("image") ? "🖼" : "📄"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{d.originalName}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>
                      {d.kategorie !== "SONSTIGE" && <span style={{ ...badgeStyle(C.blueBg, C.blue), marginRight: 6, fontSize: 8 }}>{d.kategorie}</span>}
                      {d.dateigroesse ? `${Math.round(d.dateigroesse / 1024)}KB` : ""} · {new Date(d.createdAt).toLocaleDateString("de-DE")}
                      {d.uploadedByName && ` · ${d.uploadedByName}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <a href={`/api/crm/dokumente/${d.id}/download?view=true&token=${localStorage.getItem("token") || ""}`} target="_blank" rel="noopener" style={{ ...btnGhost, padding: "4px 8px", fontSize: 10, textDecoration: "none" }}>
                      Ansehen
                    </a>
                    <a href={`/api/crm/dokumente/${d.id}/download?token=${localStorage.getItem("token") || ""}`} style={{ ...btnGhost, padding: "4px 8px", fontSize: 10, textDecoration: "none" }}>
                      Download
                    </a>
                    <button onClick={() => handleDeleteDokument(d.id)} style={{ background: "transparent", border: `1px solid rgba(248,113,113,0.3)`, color: C.red, borderRadius: 4, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Factro-Dokumente (aus Aktivitäten) */}
          {(() => {
            const factroAktDocs = aktivitaeten.filter(a => a.typ === "DOKUMENT");
            if (factroAktDocs.length === 0 && dokumente.length === 0) {
              return <div style={{ color: C.textMuted, textAlign: "center", padding: 30 }}>Keine Dokumente vorhanden. Laden Sie Dokumente hoch.</div>;
            }
            if (factroAktDocs.length === 0) return null;
            return (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Factro-Dokumente ({factroAktDocs.length})</div>
                {factroAktDocs.map(a => {
                  const meta = (a.metadata || {}) as Record<string, any>;
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", ...cardStyle, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{a.titel.replace("📄 ", "")}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>
                          {meta.fileName || ""} {meta.fileSize ? `· ${Math.round(meta.fileSize / 1024)}KB` : ""} · {new Date(a.createdAt).toLocaleDateString("de-DE")}
                        </div>
                      </div>
                      <span style={badgeStyle(C.orangeBg, C.orange)}>Factro</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Aktivitäten */}
      {tab === "zeit" && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textBright, marginBottom: 12 }}>Aktivitäten-Timeline</div>
          {aktivitaeten.length > 0 ? (
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 1, background: C.border }} />
              {aktivitaeten.slice(0, 30).map(a => (
                <div key={a.id} style={{ marginBottom: 10, position: "relative" }}>
                  <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%", background: a.typ === "DOKUMENT" ? C.blue : a.typ === "SYSTEM" ? C.green : C.primary, border: `2px solid ${C.bgPanel}` }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{a.titel}</div>
                  {a.beschreibung && <div style={{ fontSize: 10, color: C.textDim }}>{a.beschreibung.substring(0, 120)}</div>}
                  <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "'DM Mono'" }}>{new Date(a.createdAt).toLocaleString("de-DE")}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: C.textMuted, textAlign: "center", padding: 30 }}>Keine Aktivitäten.</div>
          )}
        </div>
      )}
    </div>
  );
}
