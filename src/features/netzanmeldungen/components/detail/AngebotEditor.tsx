/**
 * Angebot-Editor v5 — sevdesk-Style, mit Backend-Persistierung
 * Speichert in CrmAngebot Tabelle, lädt bestehende Angebote, Verlauf aus API
 */
import { useState, useEffect, useCallback } from "react";
import { C, ff, mono, Card, Title, Label, Inp, Sel, Badge, BarBtn, AnimNum } from "./angebot/AngebotUI";
import AngebotPositionen, { type Pos } from "./angebot/AngebotPositionen";
import AngebotOptionen from "./angebot/AngebotOptionen";

interface Props { crmId: number; projekt: any }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

const headers = () => {
  const token = localStorage.getItem("baunity_token") || "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

interface AngebotFromApi {
  id: number;
  angebotNummer: string;
  status: string;
  positionen: any[];
  nettoGesamt: number;
  bruttoGesamt: number;
  schlusstext?: string;
  einleitung?: string;
  gueltigBis?: string;
  createdAt: string;
  gesendetAm?: string;
  angesehenAm?: string;
  angenommenAm?: string;
  abgelehntAm?: string;
}

export default function AngebotEditor({ crmId, projekt: p }: Props) {
  const [showVerlauf, setShowVerlauf] = useState(false);
  const [nettoModus, setNettoModus] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [angebotId, setAngebotId] = useState<number | null>(null);
  const [angebotNummer, setAngebotNummer] = useState("");
  const [status, setStatus] = useState("ENTWURF");
  const [allAngebote, setAllAngebote] = useState<AngebotFromApi[]>([]);

  const [emp] = useState({ kontakt: p?.kundenName || "—", strasse: p?.strasse || "", plz: p?.plz || "", ort: p?.ort || "" });
  const [fusstext, setFusstext] = useState("Bitte überweisen Sie den Betrag unter Angabe der Angebotsnummer auf das unten angegebene Konto.\n\nMit freundlichen Grüßen\nLeCa GmbH & Co. KG");
  const [gueltigBis, setGueltigBis] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const [pos, setPos] = useState<Pos[]>([
    { id: 1, bez: "PV-Module " + (p?.modulTyp || ""), menge: p?.modulAnzahl || 1, einheit: "Stk", preis: 125, ust: 0, rabatt: 0 },
    { id: 2, bez: "Wechselrichter " + (p?.wechselrichterTyp || ""), menge: 1, einheit: "Stk", preis: 0, ust: 0, rabatt: 0 },
    { id: 3, bez: "Montage + Inbetriebnahme", menge: 1, einheit: "psch", preis: 0, ust: 0, rabatt: 0 },
    { id: 4, bez: "Netzanmeldung & VDE-Dokumentation", menge: 1, einheit: "psch", preis: 450, ust: 19, rabatt: 0 },
  ]);

  // Bestehende Angebote laden
  const loadAngebote = useCallback(async () => {
    try {
      const resp = await fetch(`/api/crm/angebote?projektId=${crmId}`, { headers: headers(), credentials: "include" });
      if (resp.ok) {
        const items: AngebotFromApi[] = await resp.json();
        setAllAngebote(items);
        // Neuestes Angebot laden
        if (items.length > 0) {
          const latest = items[0];
          setAngebotId(latest.id);
          setAngebotNummer(latest.angebotNummer);
          setStatus(latest.status);
          if (latest.schlusstext) setFusstext(latest.schlusstext);
          if (latest.gueltigBis) setGueltigBis(latest.gueltigBis.split("T")[0]);
          if (Array.isArray(latest.positionen) && latest.positionen.length > 0) {
            setPos(latest.positionen.map((po: any, i: number) => ({
              id: i + 1,
              bez: po.bezeichnung || "",
              menge: Number(po.menge) || 1,
              einheit: po.einheit || "Stk",
              preis: Number(po.einzelpreis) || 0,
              ust: Number(po.mwstSatz) || 0,
              rabatt: Number(po.rabatt) || 0,
            })));
          }
        }
      }
    } catch { /* */ }
  }, [crmId]);

  useEffect(() => { loadAngebote(); }, [loadAngebote]);

  const netto = pos.reduce((s, po) => { const b = po.menge * po.preis; return s + b - b * po.rabatt / 100; }, 0);
  const ustB = pos.reduce((s, po) => { const b = po.menge * po.preis - po.menge * po.preis * po.rabatt / 100; return s + b * po.ust / 100; }, 0);
  const brutto = netto + ustB;

  const updPos = (id: number, k: string, v: any) => setPos(ps => ps.map(x => x.id === id ? { ...x, [k]: v } : x));
  const addPos = () => setPos([...pos, { id: Date.now(), bez: "", menge: 1, einheit: "Stk", preis: 0, ust: 0, rabatt: 0 }]);
  const delPos = (id: number) => setPos(ps => ps.filter(x => x.id !== id));
  const addFromKatalog = (produkt: any) => {
    setPos(prev => [...prev, {
      id: Date.now(),
      bez: `${produkt.hersteller} ${produkt.modell}`,
      menge: 1,
      einheit: produkt.einheit || "Stk",
      preis: produkt.preisVerkauf ? Number(produkt.preisVerkauf) : 0,
      ust: 19,
      rabatt: 0,
    }]);
  };

  // Angebot speichern (erstellen oder aktualisieren)
  const handleSave = async () => {
    setSaving(true);
    try {
      const positionen = pos.map(po => ({
        bezeichnung: po.bez, menge: po.menge, einheit: po.einheit,
        einzelpreis: po.preis, mwstSatz: po.ust, rabatt: po.rabatt,
      }));

      if (angebotId) {
        // Update
        await fetch(`/api/crm/angebote/${angebotId}`, {
          method: "PUT", headers: headers(), credentials: "include",
          body: JSON.stringify({ positionen, schlusstext: fusstext, gueltigBis: gueltigBis ? new Date(gueltigBis) : undefined }),
        });
      } else {
        // Create
        const resp = await fetch("/api/crm/angebote", {
          method: "POST", headers: headers(), credentials: "include",
          body: JSON.stringify({
            organisationId: p?.organisationId || 1,
            projektId: crmId,
            titel: `Angebot ${p?.kundenName || p?.titel || ""}`.trim(),
            positionen,
            schlusstext: fusstext,
            gueltigBis: gueltigBis ? new Date(gueltigBis) : undefined,
          }),
        });
        if (resp.ok) {
          const created = await resp.json();
          setAngebotId(created.id);
          setAngebotNummer(created.angebotNummer);
          setStatus(created.status);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadAngebote();
    } catch { /* */ }
    setSaving(false);
  };

  // Status ändern (Senden)
  const handleSend = async () => {
    if (!angebotId) {
      await handleSave();
      return;
    }
    if (!confirm("Angebot als gesendet markieren?")) return;
    await fetch(`/api/crm/angebote/${angebotId}/status`, {
      method: "POST", headers: headers(), credentials: "include",
      body: JSON.stringify({ status: "GESENDET" }),
    });
    setStatus("GESENDET");
    loadAngebote();
  };

  // PDF generieren
  const generatePdf = async () => {
    if (!angebotId) await handleSave();
    setPdfLoading(true);
    try {
      const res = await fetch("/api/crm/angebote/pdf", {
        method: "POST", credentials: "include", headers: headers(),
        body: JSON.stringify({ projektId: crmId, positionen: pos.map(po => ({ bezeichnung: po.bez, menge: po.menge, einheit: po.einheit, einzelpreis: po.preis, mwstSatz: po.ust })) }),
      });
      if (res.ok) { const d = await res.json(); window.open(`/api/crm/angebote/pdf/${d.pdfPath.split("/").pop()}`, "_blank"); }
    } catch { /* */ }
    setPdfLoading(false);
  };

  // Verlauf aus API
  const verlauf = allAngebote.map((a, i) => ({
    v: allAngebote.length - i,
    betrag: Number(a.bruttoGesamt),
    status: a.status === "ENTWURF" ? "Entwurf" : a.status === "GESENDET" ? "Gesendet" : a.status === "ANGESEHEN" ? "Angesehen" : a.status === "ANGENOMMEN" ? "Angenommen" : a.status === "ABGELEHNT" ? "Abgelehnt" : a.status,
    date: new Date(a.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    note: a.id === angebotId ? "Aktuelle Version" : `Version ${allAngebote.length - i}`,
  })).reverse();

  const STATUS_MAP: Record<string, string> = { ENTWURF: "Entwurf", GESENDET: "Gesendet", ANGESEHEN: "Angesehen", ANGENOMMEN: "Angenommen", ABGELEHNT: "Abgelehnt" };

  return (
    <div style={{ fontFamily: ff, color: C.text }}>
      <style>{CSS}</style>

      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>📝 Angebot</span>
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: mono }}>{angebotNummer || "Neu"}</span>
          <Badge status={STATUS_MAP[status] || status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontFamily: mono, color: C.accent, fontWeight: 600, marginRight: 8 }}>
            <AnimNum value={brutto} /> €
          </span>
          <BarBtn onClick={handleSave}>{saving ? "⏳" : saved ? "✓" : "💾"}</BarBtn>
          <BarBtn onClick={() => setShowVerlauf(!showVerlauf)} active={showVerlauf}>Verlauf</BarBtn>
          <BarBtn onClick={generatePdf}>{pdfLoading ? "⏳" : "PDF"}</BarBtn>
          <button onClick={handleSend} style={{ background: `linear-gradient(135deg, ${C.accent}, #00c080)`, border: "none", borderRadius: 7, padding: "7px 16px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: ff, boxShadow: `0 2px 12px ${C.accentGlow}` }}>
            {status === "ENTWURF" ? "Senden" : "Erneut senden"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          {/* Empfänger + Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, animation: "fadeIn 0.4s both" }}>
            <Card>
              <Title>Empfänger</Title>
              <Label required>Kontakt</Label>
              <Inp value={emp.kontakt} readOnly />
              <div style={{ marginTop: 8 }}><Label>Anschrift</Label><Inp value={emp.strasse} readOnly /></div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, marginTop: 8 }}>
                <Inp value={emp.plz} readOnly /><Inp value={emp.ort} readOnly />
              </div>
            </Card>
            <Card>
              <Title>Informationen</Title>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div><Label>Nummer</Label><Inp value={angebotNummer || "Wird generiert"} isMono readOnly /></div>
                <div><Label>Datum</Label><Inp type="date" value={new Date().toISOString().split("T")[0]} readOnly /></div>
              </div>
              <div style={{ marginTop: 8 }}>
                <Label>Gültig bis</Label>
                <Inp type="date" value={gueltigBis} onChange={(e: any) => setGueltigBis(e.target.value)} />
              </div>
            </Card>
          </div>

          {/* Positionen */}
          <Card style={{ marginBottom: 16, padding: "24px 20px", animation: "fadeIn 0.4s 0.1s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", marginBottom: 14 }}>
              <Title>Positionen</Title>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {["Brutto", "Netto"].map(m => (
                  <button key={m} onClick={() => setNettoModus(m === "Netto")} style={{ background: (m === "Netto") === nettoModus ? C.accentGlow : "transparent", border: "none", padding: "5px 14px", color: (m === "Netto") === nettoModus ? C.accent : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: ff }}>{m}</button>
                ))}
              </div>
            </div>
            <AngebotPositionen pos={pos} onUpdate={updPos} onAdd={addPos} onAddFromKatalog={addFromKatalog} onDelete={delPos} nettoModus={nettoModus} />

            {/* Summen */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 8, marginTop: 8 }}>
              <div style={{ width: 340 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 13, color: C.textSoft }}>Netto</span>
                  <span style={{ fontSize: 13, fontFamily: mono, color: C.text }}><AnimNum value={netto} /> €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 13, color: C.textSoft }}>Umsatzsteuer</span>
                  <span style={{ fontSize: 13, fontFamily: mono, color: C.text }}><AnimNum value={ustB} /> €</span>
                </div>
                <div style={{ height: 1, background: C.borderHover, margin: "6px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Gesamt</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: mono, background: `linear-gradient(135deg, ${C.accent}, ${C.accentAlt})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    <AnimNum value={brutto} /> €
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Fußtext + Optionen */}
          <AngebotOptionen fusstext={fusstext} onFusstextChange={setFusstext} />
        </div>

        {/* Verlauf Sidebar */}
        {showVerlauf && (
          <div style={{ width: 280, flexShrink: 0, background: "rgba(12,12,18,0.9)", borderLeft: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px", animation: "fadeIn 0.3s both", alignSelf: "flex-start" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Verlauf ({allAngebote.length})</div>
            {verlauf.length === 0 && (
              <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: 20 }}>Noch keine Versionen</div>
            )}
            {verlauf.map((v, i) => (
              <div key={i} style={{ paddingBottom: 14, borderBottom: i < verlauf.length - 1 ? `1px solid ${C.border}` : "none", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>v{v.v} · {v.betrag.toLocaleString("de-DE")} €</span>
                  <Badge status={v.status} />
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{v.note} · {v.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
