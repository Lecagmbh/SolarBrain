/**
 * Fußtext + Weitere Optionen (Skonto, Währung, USt-Regelung, Kontakt)
 */
import { useState } from "react";
import { C, ff, Card, Title, Label, Inp, Sel } from "./AngebotUI";

interface Props {
  fusstext: string;
  onFusstextChange: (v: string) => void;
}

export default function AngebotOptionen({ fusstext, onFusstextChange }: Props) {
  const [opt, setOpt] = useState({
    waehrung: "EUR", skontoTage: "10", skontoProzent: "2",
    kontakt: "Christian Zwick", ustRegel: "standard", zahlungsmethode: "Überweisung", kostenstelle: "",
  });

  return (
    <>
      {/* Fußtext */}
      <Card style={{ marginBottom: 16, animation: "fadeIn 0.4s 0.15s both" }}>
        <Title>Fußtext</Title>
        <textarea value={fusstext} onChange={e => onFusstextChange(e.target.value)} rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "11px 14px", color: C.text, fontSize: 14, lineHeight: 1.65,
            outline: "none", fontFamily: ff, resize: "vertical",
            transition: "border 0.15s, box-shadow 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = C.borderAccent; e.target.style.boxShadow = `0 0 0 3px ${C.accentGlow}`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
      </Card>

      {/* Weitere Optionen */}
      <Card style={{ animation: "fadeIn 0.4s 0.2s both" }}>
        <Title>Weitere Optionen</Title>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <Label>Währung</Label>
            <Sel value={opt.waehrung} onChange={(v: string) => setOpt({ ...opt, waehrung: v })} options={["EUR", "USD", "CHF"]} style={{ width: "100%" }} />
          </div>
          <div>
            <Label>Skonto</Label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Inp value={opt.skontoTage} onChange={(v: string) => setOpt({ ...opt, skontoTage: v })} type="number" isMono style={{ width: 52 }} />
              <span style={{ color: C.textMuted, fontSize: 12 }}>Tage</span>
              <Inp value={opt.skontoProzent} onChange={(v: string) => setOpt({ ...opt, skontoProzent: v })} type="number" isMono style={{ width: 52 }} />
              <span style={{ color: C.textMuted, fontSize: 12 }}>%</span>
            </div>
          </div>
          <div>
            <Label>Umsatzsteuerregelung</Label>
            <Sel value={opt.ustRegel} onChange={(v: string) => setOpt({ ...opt, ustRegel: v })}
              options={[
                { value: "standard", label: "Umsatzsteuerpflichtig" },
                { value: "§4", label: "Steuerfrei §4 UStG" },
                { value: "§13b", label: "Reverse Charge §13b" },
                { value: "§12.3", label: "0% PV §12 Abs. 3 UStG" },
              ]} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <Label>Kontaktperson</Label>
            <Sel value={opt.kontakt} onChange={(v: string) => setOpt({ ...opt, kontakt: v })} options={["Christian Zwick", "Izabela Z.", "Hartmut Bischoff"]} style={{ width: "100%" }} />
          </div>
          <div>
            <Label>Zahlungsmethode</Label>
            <Sel value={opt.zahlungsmethode} onChange={(v: string) => setOpt({ ...opt, zahlungsmethode: v })} options={["Überweisung", "PayPal", "Kreditkarte", "Bar"]} style={{ width: "100%" }} />
          </div>
          <div>
            <Label>Kostenstelle</Label>
            <Sel value={opt.kostenstelle || "—"} onChange={(v: string) => setOpt({ ...opt, kostenstelle: v })} options={["—", "Solar", "Netzanmeldung", "Speicher", "Montage"]} style={{ width: "100%" }} />
          </div>
        </div>
      </Card>
    </>
  );
}
