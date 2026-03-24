/**
 * Baunity D2D Wizard Steps
 * ========================
 * 8 Steps für Lead-Erfassung, nutzen den wizardStore.
 * Felder werden in step1-step8 des Stores gespeichert.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useWizardStore } from '../../../stores/wizardStore';

// ── Shared Components ────────────────────────────────────────────────────────

const css = `
.d2d-f{margin-bottom:20px}
.d2d-l{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,.45);margin-bottom:8px;letter-spacing:.03em}
.d2d-i{width:100%;min-height:50px;padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#f5f5f7;font-size:15px;font-family:inherit;outline:none;transition:all .2s;box-sizing:border-box}
.d2d-i:focus{border-color:rgba(212,168,67,.4);box-shadow:0 0 0 3px rgba(212,168,67,.08);background:rgba(255,255,255,.06)}
.d2d-i::placeholder{color:rgba(255,255,255,.2)}
.d2d-r{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.d2d-c{display:flex;flex-wrap:wrap;gap:8px}
.d2d-ch{padding:12px 18px;border-radius:12px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(255,255,255,.5);display:flex;align-items:center;gap:7px;min-height:48px;user-select:none;font-family:inherit}
.d2d-ch:hover{border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.7)}
.d2d-ch.on{border-color:#D4A843;color:#D4A843;background:rgba(212,168,67,.08);box-shadow:0 0 16px rgba(212,168,67,.06)}
.d2d-tg{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:10px;min-height:54px;transition:all .2s}
.d2d-tg.on{border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.04)}
.d2d-tg-l{font-size:15px;font-weight:500;color:rgba(255,255,255,.5)}
.d2d-tg.on .d2d-tg-l{color:rgba(255,255,255,.9)}
.d2d-sw{width:46px;height:26px;border-radius:13px;background:rgba(255,255,255,.1);position:relative;transition:background .3s;flex-shrink:0}
.d2d-tg.on .d2d-sw{background:#22c55e}
.d2d-sw::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .3s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.d2d-tg.on .d2d-sw::after{transform:translateX(20px)}
.d2d-sl{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.d2d-sl-l{font-size:12px;font-weight:600;color:rgba(255,255,255,.4);width:90px;flex-shrink:0;text-transform:uppercase;letter-spacing:.04em}
.d2d-sl input[type=range]{flex:1;accent-color:#D4A843;height:6px}
.d2d-sl-v{min-width:90px;display:flex;align-items:center;gap:4px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.d2d-sl-v input{width:60px;background:none;border:none;color:#D4A843;font-size:15px;font-weight:600;text-align:center;outline:none;font-family:'JetBrains Mono',monospace;-moz-appearance:textfield}
.d2d-sl-v input::-webkit-inner-spin-button{-webkit-appearance:none}
.d2d-sl-u{font-size:11px;color:rgba(255,255,255,.3)}
.d2d-stars{display:flex;gap:8px}
.d2d-star{width:50px;height:50px;border-radius:12px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;transition:all .2s}
.d2d-star.on{border-color:#D4A843;background:rgba(212,168,67,.08);box-shadow:0 0 14px rgba(212,168,67,.08)}
.d2d-tip{padding:14px 18px;border-radius:14px;background:rgba(212,168,67,.03);border:1px solid rgba(212,168,67,.08);font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;margin-top:8px}
.d2d-tip b{color:#D4A843}
.d2d-gps{width:100%;padding:16px 20px;border-radius:14px;border:none;min-height:54px;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;font-family:inherit;margin-bottom:20px;transition:all .2s}
.d2d-gps.idle{background:rgba(59,130,246,.06);color:#60a5fa;box-shadow:inset 0 0 0 1px rgba(59,130,246,.2)}
.d2d-gps.ok{background:rgba(34,197,94,.06);color:#22c55e;box-shadow:inset 0 0 0 1px rgba(34,197,94,.25)}
.d2d-gps.err{background:rgba(239,68,68,.06);color:#ef4444;box-shadow:inset 0 0 0 1px rgba(239,68,68,.2)}
.d2d-sum{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:14px}
.d2d-sum-l{color:rgba(255,255,255,.4)}
.d2d-sum-v{color:#f5f5f7;font-weight:600;text-align:right}
.d2d-hl{margin-top:24px;padding:24px;border-radius:16px;background:linear-gradient(135deg,rgba(212,168,67,.05),rgba(212,168,67,.02));border:1px solid rgba(212,168,67,.12)}
.d2d-hl h3{font-size:12px;font-weight:700;color:#D4A843;text-transform:uppercase;letter-spacing:.08em;margin:0 0 16px}
.d2d-sec{font-size:12px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em;margin:28px 0 16px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.d2d-photos{display:flex;flex-wrap:wrap;gap:8px}
.d2d-ph{padding:11px 16px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;min-height:46px;transition:all .2s;border:none}
.d2d-ph.empty{background:rgba(255,255,255,.03);color:rgba(255,255,255,.4);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.d2d-ph.empty:hover{color:#D4A843;box-shadow:inset 0 0 0 1px rgba(212,168,67,.2)}
.d2d-ph.has{background:rgba(34,197,94,.06);color:#22c55e;box-shadow:inset 0 0 0 1px rgba(34,197,94,.25)}
.d2d-badge{background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
.d2d-sig{border:1.5px dashed rgba(255,255,255,.12);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.02)}
.d2d-sig canvas{width:100%;height:150px;display:block;touch-action:none;cursor:crosshair;background:rgba(255,255,255,.97)}
.d2d-sig-bar{display:flex;gap:10px;padding:12px 16px;background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.04)}
.d2d-sig-bar button{padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.6);transition:all .15s}
.d2d-sig-bar .ok{border-color:rgba(34,197,94,.3);color:#22c55e;background:rgba(34,197,94,.06)}
@media(max-width:640px){.d2d-r{grid-template-columns:1fr!important}}
`;

// Helpers
const Chip = ({ on, children, click }: { on: boolean; children: React.ReactNode; click: () => void }) => (
  <div className={`d2d-ch ${on ? "on" : ""}`} onClick={click}>{children}</div>
);
const Tog = ({ on, label, click }: { on: boolean; label: string; click: () => void }) => (
  <div className={`d2d-tg ${on ? "on" : ""}`} onClick={click}><span className="d2d-tg-l">{label}</span><div className="d2d-sw" /></div>
);
const Sl = ({ label, value, unit, min, max, step, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void }) => (
  <div className="d2d-sl">
    <span className="d2d-sl-l">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    <div className="d2d-sl-v"><input value={value} onChange={e => { const v = Number(e.target.value); if (!isNaN(v)) onChange(v); }} /><span className="d2d-sl-u">{unit}</span></div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: KUNDE
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep1: React.FC = () => {
  const { data, updateStep6 } = useWizardStore();
  const d = data.step6; // Kundendaten in step6 (Betreiber-Step im Original)
  const u = (p: any) => updateStep6(p);
  return <>
    <style>{css}</style>
    <div className="d2d-f"><span className="d2d-l">Kundentyp</span>
      <div className="d2d-c">
        <Chip on={d.kundentyp==="privat"} click={() => u({kundentyp:"privat"})}>🏠 Privat</Chip>
        <Chip on={d.kundentyp==="gewerbe"} click={() => u({kundentyp:"gewerbe"})}>🏢 Gewerbe</Chip>
      </div>
    </div>
    {d.kundentyp === "gewerbe" && <div className="d2d-f"><span className="d2d-l">Firma</span><input className="d2d-i" value={d.firma || ""} onChange={e => u({firma:e.target.value})} placeholder="Firmenname" /></div>}
    <div className="d2d-r">
      <div className="d2d-f"><span className="d2d-l">Vorname *</span><input className="d2d-i" value={d.vorname || ""} onChange={e => u({vorname:e.target.value})} placeholder="Max" /></div>
      <div className="d2d-f"><span className="d2d-l">Nachname *</span><input className="d2d-i" value={d.nachname || ""} onChange={e => u({nachname:e.target.value})} placeholder="Mustermann" /></div>
    </div>
    <div className="d2d-f"><span className="d2d-l">Telefon *</span><input className="d2d-i" type="tel" value={d.telefon || ""} onChange={e => u({telefon:e.target.value})} placeholder="+49 171 1234567" /></div>
    <div className="d2d-f"><span className="d2d-l">E-Mail</span><input className="d2d-i" type="email" value={d.email || ""} onChange={e => u({email:e.target.value})} placeholder="max@beispiel.de" /></div>
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: STANDORT
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep2: React.FC = () => {
  const { data, updateStep2 } = useWizardStore();
  const d = data.step2;
  const u = (p: any) => updateStep2(p);
  const [gps, setGps] = useState("");

  const getGPS = () => {
    setGps("loading");
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        u({ gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude });
        setGps("ok");
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
          const g = await r.json(); const a = g.address || {};
          u({ strasse: a.road || "", hausnummer: a.house_number || "", plz: a.postcode || "", ort: a.city || a.town || a.village || "" });
        } catch {}
      },
      () => setGps("err"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return <>
    <style>{css}</style>
    <button className={`d2d-gps ${gps || "idle"}`} onClick={getGPS}>
      📡 {gps === "loading" ? "Suche..." : gps === "ok" ? "✓ GPS erfasst" : gps === "err" ? "✗ Manuell eingeben" : "GPS-Position übernehmen"}
    </button>
    <div className="d2d-r">
      <div className="d2d-f"><span className="d2d-l">Straße *</span><input className="d2d-i" value={d.strasse || ""} onChange={e => u({strasse:e.target.value})} placeholder="Hauptstraße" /></div>
      <div className="d2d-f"><span className="d2d-l">Nr.</span><input className="d2d-i" value={d.hausnummer || ""} onChange={e => u({hausnummer:e.target.value})} placeholder="42" /></div>
    </div>
    <div className="d2d-r">
      <div className="d2d-f"><span className="d2d-l">PLZ *</span><input className="d2d-i" value={d.plz || ""} onChange={e => u({plz:e.target.value})} placeholder="77933" maxLength={5} /></div>
      <div className="d2d-f"><span className="d2d-l">Ort *</span><input className="d2d-i" value={d.ort || ""} onChange={e => u({ort:e.target.value})} placeholder="Lahr" /></div>
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: VERBRAUCH
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep3: React.FC = () => {
  const { data, updateStep5 } = useWizardStore();
  // Verbrauchsdaten in technicalData speichern (step5 = Technik)
  const td = data.step5 as any;
  const u = (p: any) => updateStep5({ ...td, ...p });
  const personen = td.d2dPersonen || 3;
  const verbrauch = td.d2dVerbrauch || 4000;
  const preis = td.d2dPreis || 0.35;
  const heizung = td.d2dHeizung || "gas";
  const eAuto = td.d2dEAuto || "nein";
  const wp = td.d2dWP || "nein";

  return <>
    <style>{css}</style>
    <div className="d2d-f"><span className="d2d-l">Personen im Haushalt</span>
      <div className="d2d-c">{[1,2,3,4,5,6].map(n => <Chip key={n} on={personen===n} click={() => { const v = n*1200+800; u({d2dPersonen:n, d2dVerbrauch:v}); }}>{n}{n===6?"+":""}</Chip>)}</div>
    </div>
    <Sl label="Verbrauch" value={verbrauch} unit="kWh" min={1000} max={25000} step={100} onChange={v => u({d2dVerbrauch:v})} />
    <Sl label="Strompreis" value={preis} unit="€/kWh" min={0.20} max={0.55} step={0.01} onChange={v => u({d2dPreis:v})} />
    <div className="d2d-f"><span className="d2d-l">Heizung</span>
      <div className="d2d-c">{[["gas","🔥 Gas"],["oel","🛢 Öl"],["fw","🏭 Fern"],["strom","⚡ Strom"],["wp","♨️ WP"],["holz","🪵 Holz"]].map(([v,l]) => <Chip key={v} on={heizung===v} click={() => u({d2dHeizung:v})}>{l}</Chip>)}</div>
    </div>
    <div className="d2d-f"><span className="d2d-l">E-Auto</span>
      <div className="d2d-c"><Chip on={eAuto==="nein"} click={() => u({d2dEAuto:"nein"})}>Nein</Chip><Chip on={eAuto==="vorhanden"} click={() => u({d2dEAuto:"vorhanden"})}>🚗 Vorhanden</Chip><Chip on={eAuto==="geplant"} click={() => u({d2dEAuto:"geplant"})}>🚗 Geplant</Chip></div>
    </div>
    <div className="d2d-f"><span className="d2d-l">Wärmepumpe</span>
      <div className="d2d-c"><Chip on={wp==="nein"} click={() => u({d2dWP:"nein"})}>Nein</Chip><Chip on={wp==="vorhanden"} click={() => u({d2dWP:"vorhanden"})}>♨️ Vorhanden</Chip><Chip on={wp==="geplant"} click={() => u({d2dWP:"geplant"})}>♨️ Geplant</Chip></div>
    </div>
    <div className="d2d-tip"><b>💡</b> E-Auto +2.500 kWh · Wärmepumpe +4.000 kWh — erhöht Eigenverbrauch.</div>
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: DACH
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep4: React.FC = () => {
  const { data, updateStep5 } = useWizardStore();
  const td = data.step5 as any;
  const u = (p: any) => updateStep5({ ...td, ...p });
  const dach = td.d2dDach || "satteldach";
  const eindeckung = td.d2dEindeckung || "ziegel";
  const neigung = td.d2dNeigung ?? 30;
  const richt = td.d2dRicht || "S";
  const schatten = td.d2dSchatten || "keine";
  const flaeche = td.d2dFlaeche ?? 40;
  const kwp = td.d2dKwp ?? 10;
  const zs = td.d2dZS || "gut";
  const zsPlatz = td.d2dZSPlatz !== false;

  return <>
    <style>{css}</style>
    <div className="d2d-f"><span className="d2d-l">Dachtyp</span><div className="d2d-c">{[["satteldach","Sattel"],["flachdach","Flach"],["pultdach","Pult"],["walmdach","Walm"],["zeltdach","Zelt"]].map(([v,l]) => <Chip key={v} on={dach===v} click={() => u({d2dDach:v, d2dNeigung:v==="flachdach"?10:30})}>{l}</Chip>)}</div></div>
    <div className="d2d-f"><span className="d2d-l">Eindeckung</span><div className="d2d-c">{[["ziegel","Ziegel"],["beton","Beton"],["metall","Metall"],["bitumen","Bitumen"],["schiefer","Schiefer"],["sonstige","Sonstige"]].map(([v,l]) => <Chip key={v} on={eindeckung===v} click={() => u({d2dEindeckung:v})}>{l}</Chip>)}</div></div>
    {eindeckung === "sonstige" && <div className="d2d-f"><input className="d2d-i" value={td.d2dEindeckungText || ""} onChange={e => u({d2dEindeckungText:e.target.value})} placeholder="Welche?" /></div>}
    <Sl label="Neigung" value={neigung} unit="°" min={0} max={60} step={5} onChange={v => u({d2dNeigung:v})} />
    <div className="d2d-f"><span className="d2d-l">Ausrichtung</span><div className="d2d-c">{[["S","Süd"],["SO","SO"],["SW","SW"],["O","Ost"],["W","West"],["NO","NO"],["NW","NW"],["N","Nord"]].map(([v,l]) => <Chip key={v} on={richt===v} click={() => u({d2dRicht:v})}>{l}</Chip>)}</div></div>
    <div className="d2d-f"><span className="d2d-l">Verschattung</span><div className="d2d-c">{[["keine","☀️ Keine"],["gering","🌤 Gering"],["mittel","⛅ Mittel"],["stark","☁️ Stark"]].map(([v,l]) => <Chip key={v} on={schatten===v} click={() => u({d2dSchatten:v})}>{l}</Chip>)}</div></div>
    <Sl label="Dachfläche" value={flaeche} unit="m²" min={10} max={300} step={5} onChange={v => u({d2dFlaeche:v})} />
    <Sl label="Anlage" value={kwp} unit="kWp" min={2} max={50} step={0.5} onChange={v => u({d2dKwp:v})} />
    <div className="d2d-f"><span className="d2d-l">Zählerschrank</span><div className="d2d-c">{[["gut","✅ Gut"],["mittel","⚠️ Mittel"],["schlecht","❌ Erneuerung"]].map(([v,l]) => <Chip key={v} on={zs===v} click={() => u({d2dZS:v})}>{l}</Chip>)}</div></div>
    <Tog on={zsPlatz} label="📦 Platz im Zählerschrank" click={() => u({d2dZSPlatz:!zsPlatz})} />
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: TECHNIK (Anlage Details — bleibt original Step5Technik)
// ═══════════════════════════════════════════════════════════════════════════════
// Re-export original
export { Step5Technik as D2DStep5 } from '../step5';

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: EXTRAS
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep6: React.FC = () => {
  const { data, updateStep5 } = useWizardStore();
  const td = data.step5 as any;
  const u = (p: any) => updateStep5({ ...td, ...p });
  const speicher = !!td.d2dSpeicher;
  const speicherKwh = td.d2dSpeicherKwh ?? 10;
  const wallbox = !!td.d2dWallbox;
  const wallboxKw = td.d2dWallboxKw ?? 11;
  const fin = td.d2dFin || "kauf";
  const zeit = td.d2dZeit || "3-6";
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoTarget, setPhotoTarget] = useState("");
  const [fotos, setFotos] = useState<{id:string;typ:string}[]>([]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const typ = photoTarget;
    Array.from(e.target.files).forEach(() => {
      setFotos(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, typ }]);
    });
    e.target.value = "";
  };

  const PHOTOS: [string,string][] = [["dach","🏠 Dach"],["zaehler","📦 Zähler"],["umgebung","🌳 Umgebung"],["rechnung","📄 Rechnung"],["detail","🔍 Detail"],["sonstige","📸 Sonstige"]];

  return <>
    <style>{css}</style>
    <input type="file" accept="image/*" capture="environment" multiple ref={fileRef} style={{display:"none"}} onChange={handlePhoto} />
    <Tog on={speicher} label="🔋 Batteriespeicher" click={() => u({d2dSpeicher:!speicher})} />
    {speicher && <Sl label="Kapazität" value={speicherKwh} unit="kWh" min={5} max={30} step={1} onChange={v => u({d2dSpeicherKwh:v})} />}
    <Tog on={wallbox} label="🔌 Wallbox" click={() => u({d2dWallbox:!wallbox})} />
    {wallbox && <Sl label="Leistung" value={wallboxKw} unit="kW" min={3.7} max={22} step={0.1} onChange={v => u({d2dWallboxKw:Math.round(v*10)/10})} />}
    <div className="d2d-f"><span className="d2d-l">Finanzierung</span><div className="d2d-c">{[["kauf","💰 Kauf"],["kredit","🏦 Kredit"],["leasing","📋 Leasing"],["miete","🏠 Miete"]].map(([v,l]) => <Chip key={v} on={fin===v} click={() => u({d2dFin:v})}>{l}</Chip>)}</div></div>
    <div className="d2d-f"><span className="d2d-l">Zeitrahmen</span><div className="d2d-c">{[["sofort","⚡ Sofort"],["1-3","1-3 M."],["3-6","3-6 M."],["6-12","6-12 M."],["offen","🤷 Offen"]].map(([v,l]) => <Chip key={v} on={zeit===v} click={() => u({d2dZeit:v})}>{l}</Chip>)}</div></div>
    <div className="d2d-f"><span className="d2d-l">Fotos ({fotos.length})</span>
      <div className="d2d-photos">
        {PHOTOS.map(([t,l]) => { const c = fotos.filter(f => f.typ === t).length; return (
          <button key={t} className={`d2d-ph ${c > 0 ? "has" : "empty"}`} onClick={() => { setPhotoTarget(t); setTimeout(() => fileRef.current?.click(), 50); }}>
            {l} {c > 0 && <span className="d2d-badge">{c}</span>}
          </button>
        ); })}
      </div>
    </div>
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: ERGEBNIS
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep7: React.FC = () => {
  const { data, updateStep8 } = useWizardStore();
  const d = data.step8 as any;
  const u = (p: any) => updateStep8(p);
  const ergebnis = d.d2dErgebnis || "INTERESSIERT";
  const interesse = d.d2dInteresse ?? 3;

  return <>
    <style>{css}</style>
    <div className="d2d-f"><span className="d2d-l">Ergebnis</span>
      <div className="d2d-c">{[["INTERESSIERT","👍 Interessiert"],["TERMIN_VEREINBART","📅 Termin"],["ANGEBOT_ERSTELLT","📋 Angebot"],["NICHT_INTERESSIERT","👎 Kein Int."],["KEIN_KONTAKT","🚪 Nicht da"]].map(([v,l]) => <Chip key={v} on={ergebnis===v} click={() => u({d2dErgebnis:v})}>{l}</Chip>)}</div>
    </div>
    <div className="d2d-f"><span className="d2d-l">Interesse</span>
      <div className="d2d-stars">{[1,2,3,4,5].map(n => <div key={n} className={`d2d-star ${interesse>=n?"on":""}`} onClick={() => u({d2dInteresse:n})}>⭐</div>)}</div>
    </div>
    {ergebnis === "TERMIN_VEREINBART" && <div className="d2d-f"><span className="d2d-l">Termin</span><input className="d2d-i" type="datetime-local" value={d.d2dTermin || ""} onChange={e => u({d2dTermin:e.target.value})} /></div>}
    <div className="d2d-f"><span className="d2d-l">Nächste Schritte</span><input className="d2d-i" value={d.d2dSchritte || ""} onChange={e => u({d2dSchritte:e.target.value})} placeholder="Angebot senden, Rückruf..." /></div>
    <div className="d2d-f"><span className="d2d-l">Notizen</span><textarea className="d2d-i" style={{minHeight:90,resize:"vertical"}} value={d.d2dNotizen || ""} onChange={e => u({d2dNotizen:e.target.value})} placeholder="Besonderheiten, Einwände..." /></div>
  </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 8: ABSCHLUSS (Unterschrift + Zusammenfassung)
// ═══════════════════════════════════════════════════════════════════════════════
export const D2DStep8: React.FC = () => {
  const { data, updateStep8 } = useWizardStore();
  const d6 = data.step6; // Kunde
  const d2 = data.step2; // Standort
  const td = data.step5 as any; // Technik/D2D Daten
  const d8 = data.step8 as any;
  const u = (p: any) => updateStep8(p);
  const sigRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const signed = !!d8.d2dSigned;

  const kwp = td.d2dKwp || 10;
  const verbrauch = td.d2dVerbrauch || 4000;
  const preis = td.d2dPreis || 0.35;
  const yKwh = Math.round(kwp * 950);
  const ev = Math.min(Math.round(yKwh * 0.3), verbrauch);
  const sav = Math.round(ev * preis + (yKwh - ev) * 0.082);
  const cost = Math.round(kwp * 1400 + (td.d2dSpeicher ? (td.d2dSpeicherKwh || 10) * 800 : 0) + (td.d2dWallbox ? 1200 : 0));

  useEffect(() => {
    if (!signed) setTimeout(() => {
      const c = sigRef.current; if (!c) return;
      const x = c.getContext("2d"); if (!x) return;
      c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
      x.scale(2, 2); x.strokeStyle = "#1a1a1a"; x.lineWidth = 2; x.lineCap = "round"; x.lineJoin = "round";
    }, 150);
  }, [signed]);

  const sigStart = (e: React.MouseEvent | React.TouchEvent) => { const c = sigRef.current; if (!c) return; setDrawing(true); const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.beginPath(); x.moveTo(p.clientX - r.left, p.clientY - r.top); };
  const sigMove = (e: React.MouseEvent | React.TouchEvent) => { if (!drawing) return; const c = sigRef.current; if (!c) return; const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.lineTo(p.clientX - r.left, p.clientY - r.top); x.stroke(); };
  const sigEnd = () => setDrawing(false);

  return <>
    <style>{css}</style>
    <div className="d2d-sec">Zusammenfassung</div>
    <div className="d2d-sum"><span className="d2d-sum-l">Kunde</span><span className="d2d-sum-v">{d6.vorname} {d6.nachname}</span></div>
    <div className="d2d-sum"><span className="d2d-sum-l">Kontakt</span><span className="d2d-sum-v">{d6.telefon || d6.email}</span></div>
    <div className="d2d-sum"><span className="d2d-sum-l">Standort</span><span className="d2d-sum-v">{d2.strasse} {d2.hausnummer}, {d2.plz} {d2.ort}</span></div>
    <div className="d2d-sum"><span className="d2d-sum-l">Verbrauch</span><span className="d2d-sum-v">{(td.d2dVerbrauch||4000).toLocaleString()} kWh</span></div>
    <div className="d2d-sum"><span className="d2d-sum-l">Dach</span><span className="d2d-sum-v">{td.d2dDach} · {td.d2dNeigung}° {td.d2dRicht}</span></div>
    <div className="d2d-sum"><span className="d2d-sum-l">Anlage</span><span className="d2d-sum-v" style={{color:"#D4A843"}}>{kwp} kWp</span></div>

    <div className="d2d-sec">✍️ Kundenunterschrift</div>
    {signed ? (
      <div style={{textAlign:"center",padding:20,background:"rgba(34,197,94,.04)",borderRadius:16,border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{color:"#22c55e",fontWeight:700,fontSize:16}}>✓ Unterschrieben</div>
        {d8.d2dSignatur && <img src={d8.d2dSignatur} alt="" style={{maxHeight:70,margin:"10px auto",display:"block",borderRadius:8,background:"#fafafa",border:"1px solid rgba(34,197,94,.2)"}} />}
        <button onClick={() => u({d2dSigned:false,d2dSignatur:""})} style={{marginTop:10,padding:"8px 18px",borderRadius:10,border:"1px solid rgba(239,68,68,.15)",background:"rgba(239,68,68,.04)",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer"}}>Erneut</button>
      </div>
    ) : (
      <div className="d2d-sig">
        <div style={{textAlign:"center",padding:8,fontSize:12,color:"rgba(255,255,255,.3)",fontStyle:"italic",borderBottom:"1px solid rgba(255,255,255,.04)"}}>Bitte hier unterschreiben</div>
        <canvas ref={sigRef} onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd} onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd} />
        <div className="d2d-sig-bar">
          <button onClick={() => { const c = sigRef.current; if (c) c.getContext("2d")!.clearRect(0,0,c.width,c.height); }}>✕ Löschen</button>
          <button className="ok" onClick={() => { const c = sigRef.current; if (c) u({d2dSignatur:c.toDataURL("image/png"), d2dSigned:true}); }}>✓ Bestätigen</button>
        </div>
      </div>
    )}

    <div className="d2d-hl">
      <h3>💶 Wirtschaftlichkeit</h3>
      <div className="d2d-sum"><span className="d2d-sum-l">Jahresertrag</span><span className="d2d-sum-v">{yKwh.toLocaleString()} kWh</span></div>
      <div className="d2d-sum"><span className="d2d-sum-l">Eigenverbrauch</span><span className="d2d-sum-v">{ev.toLocaleString()} kWh</span></div>
      <div className="d2d-sum"><span className="d2d-sum-l">Ersparnis/Jahr</span><span className="d2d-sum-v" style={{color:"#22c55e",fontSize:16}}>{sav.toLocaleString()}€</span></div>
      <div className="d2d-sum"><span className="d2d-sum-l">Kosten</span><span className="d2d-sum-v">~{cost.toLocaleString()}€</span></div>
      <div className="d2d-sum"><span className="d2d-sum-l">Amortisation</span><span className="d2d-sum-v" style={{color:"#D4A843",fontSize:18,fontWeight:800}}>~{sav>0?(cost/sav).toFixed(1):"–"} Jahre</span></div>
    </div>
  </>;
};
