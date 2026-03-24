/**
 * Baunity D2D Lead-Wizard — Premium Dashboard Aesthetic
 * ======================================================
 * 6 Steps · Mobile-first · Touch-optimized · GPS-aware
 * Uses inline styles for guaranteed rendering (Tailwind v4 lazy-load issue)
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../../config/storage";

const API = import.meta.env.VITE_API_BASE || "/api";

interface LeadData {
  kundentyp: "privat" | "gewerbe"; firma: string; vorname: string; nachname: string; telefon: string; email: string;
  strasse: string; hausnummer: string; plz: string; ort: string; lat: number | null; lng: number | null; gpsStatus: string;
  stromverbrauch: number; strompreis: number; personenAnzahl: number; heizungsart: string;
  eAutoVorhanden: boolean; eAutoGeplant: boolean; wpVorhanden: boolean; wpGeplant: boolean;
  dachtyp: string; dacheindeckung: string; dacheindeckungSonstige: string;
  neigung: number; ausrichtung: string; verschattung: string; dachflaeche: number; geschaetzteKwp: number;
  zaehlerschrank: string; zaehlerschrankPlatz: boolean;
  speicherGewuenscht: boolean; speicherKwh: number;
  wallboxGewuenscht: boolean; wallboxKw: number;
  finanzierung: string; zeitrahmen: string;
  ergebnis: string; interesse: number; naechsteSchritte: string; notizen: string; terminDatum: string;
  fotos: { id: string; data: string; typ: string; name: string }[];
  signatur: string; unterschrieben: boolean;
}

const INIT: LeadData = {
  kundentyp: "privat", firma: "", vorname: "", nachname: "", telefon: "", email: "",
  strasse: "", hausnummer: "", plz: "", ort: "", lat: null, lng: null, gpsStatus: "",
  stromverbrauch: 4000, strompreis: 0.35, personenAnzahl: 3, heizungsart: "gas",
  eAutoVorhanden: false, eAutoGeplant: false, wpVorhanden: false, wpGeplant: false,
  dachtyp: "satteldach", dacheindeckung: "ziegel", dacheindeckungSonstige: "",
  neigung: 30, ausrichtung: "S", verschattung: "keine", dachflaeche: 40, geschaetzteKwp: 10,
  zaehlerschrank: "gut", zaehlerschrankPlatz: true,
  speicherGewuenscht: false, speicherKwh: 10, wallboxGewuenscht: false, wallboxKw: 11,
  finanzierung: "kauf", zeitrahmen: "3-6-monate",
  ergebnis: "INTERESSIERT", interesse: 3, naechsteSchritte: "", notizen: "", terminDatum: "",
  fotos: [], signatur: "", unterschrieben: false,
};

const STEPS = ["Kunde", "Standort", "Verbrauch", "Dach", "Extras", "Abschluss"];

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#060a14", card: "rgba(15,23,42,0.5)", cardBorder: "rgba(255,255,255,0.06)",
  cardHover: "rgba(255,255,255,0.1)", gold: "#D4A843", goldBright: "#EAD068",
  goldGlow: "rgba(212,168,67,0.08)", goldBorder: "rgba(212,168,67,0.4)",
  goldBg: "rgba(212,168,67,0.06)", green: "#22c55e", greenBorder: "rgba(34,197,94,0.25)",
  greenBg: "rgba(34,197,94,0.03)", red: "#ef4444", blue: "#60a5fa",
  text1: "#f8fafc", text2: "#e2e8f0", text3: "#94a3b8", text4: "#64748b", text5: "#334155",
  inputBg: "rgba(6,10,20,0.6)", inputBorder: "rgba(255,255,255,0.06)",
  focusBorder: "rgba(212,168,67,0.35)", focusRing: "rgba(212,168,67,0.06)",
};

const S = {
  page: { minHeight: "100vh", background: C.bg, color: C.text2, fontFamily: "'Inter',system-ui,sans-serif", WebkitFontSmoothing: "antialiased" as const, position: "relative" as const, overflowX: "hidden" as const },
  wrap: { maxWidth: 640, margin: "0 auto", padding: "24px 16px 130px", position: "relative" as const, zIndex: 1 },
  card: { background: "rgba(12,20,38,0.65)", border: `1px solid rgba(212,168,67,0.08)`, borderRadius: 18, padding: "22px 20px", marginBottom: 16, backdropFilter: "blur(12px)", transition: "border-color .2s", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" },
  cardTitle: { fontSize: 12, fontWeight: 800, color: C.gold, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 18, display: "flex", alignItems: "center", gap: 8, margin: 0, marginTop: 0, paddingBottom: 14, borderBottom: "1px solid rgba(212,168,67,0.06)" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 },
  input: { width: "100%", minHeight: 48, padding: "12px 16px", background: "rgba(6,10,20,0.7)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, color: C.text1, fontSize: 15, fontFamily: "inherit", outline: "none", transition: "all .2s", boxSizing: "border-box" as const },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { marginBottom: 18 },
  chips: { display: "flex", flexWrap: "wrap" as const, gap: 8 },
};

// ── Components ───────────────────────────────────────────────────────────────

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      minHeight: 46, padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6, transition: "all .2s", fontFamily: "inherit", userSelect: "none" as const,
      border: active ? `1.5px solid ${C.gold}` : `1px solid rgba(255,255,255,0.08)`,
      color: active ? C.gold : C.text3,
      background: active ? "rgba(212,168,67,0.08)" : "rgba(6,10,20,0.5)",
      boxShadow: active ? "0 0 16px rgba(212,168,67,0.1), inset 0 0 12px rgba(212,168,67,0.03)" : "none",
      transform: active ? "scale(1.02)" : "scale(1)",
    }}>{children}</button>
  );
}

function Chips({ items, value, onChange }: { items: [string, string][]; value: string; onChange: (v: string) => void }) {
  return <div style={S.chips}>{items.map(([v, l]) => <Chip key={v} active={value === v} onClick={() => onChange(v)}>{l}</Chip>)}</div>;
}

function Toggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 14px", borderRadius: 10, minHeight: 48, cursor: "pointer", transition: "all .15s",
      marginBottom: 8, fontFamily: "inherit",
      border: `1px solid ${on ? C.greenBorder : "rgba(255,255,255,0.04)"}`,
      background: on ? C.greenBg : "rgba(6,10,20,0.4)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: on ? C.text2 : C.text3 }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 11, position: "relative", transition: "background .2s", flexShrink: 0,
        background: on ? C.green : "rgba(255,255,255,0.08)",
      }}>
        <div style={{
          position: "absolute", top: 2, left: 2, width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "transform .2s", transform: on ? "translateX(18px)" : "none",
        }} />
      </div>
    </button>
  );
}

function SliderInput({ label, min, max, step, value, unit, onChange }: { label: string; min: number; max: number; step: number; value: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ ...S.label, width: 80, flexShrink: 0, marginBottom: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: C.gold, height: 5 }} />
      <input type="number" min={min} max={max} step={step} value={value}
        onChange={e => { const v = Number(e.target.value); if (!isNaN(v)) onChange(v); }}
        style={{
          width: 80, padding: "8px 10px", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
          borderRadius: 8, color: C.gold, fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono',monospace",
          textAlign: "center", outline: "none", MozAppearance: "textfield" as any, boxSizing: "border-box",
        }} />
      <span style={{ fontSize: 10, color: C.text4, width: 40, flexShrink: 0 }}>{unit}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={S.field}><span style={S.label}>{label}</span>{children}</div>;
}

function SumRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid rgba(255,255,255,0.03)`, fontSize: 12 }}>
      <span style={{ color: C.text4 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || C.text2, textAlign: "right", maxWidth: "55%" }}>{value}</span>
    </div>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={S.card}>
      <div style={S.cardTitle}><span style={{ fontSize: 16 }}>{icon}</span> {title}</div>
      {children}
    </div>
  );
}

// ── CSS for elements that need pseudo-classes ────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800;900&display=swap');
input:focus,textarea:focus,select:focus{border-color:${C.focusBorder}!important;box-shadow:0 0 0 3px ${C.focusRing}!important}
input::placeholder,textarea::placeholder{color:${C.text5}}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
@media(max-width:500px){.lw-grid2{grid-template-columns:1fr!important}.lw-photos{grid-template-columns:repeat(2,1fr)!important}}
`;

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LeadWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<LeadData>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sigCanvas = useRef<HTMLCanvasElement>(null);
  const [photoTarget, setPhotoTarget] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const u = (p: Partial<LeadData>) => setD(prev => ({ ...prev, ...p }));

  // GPS
  const getGPS = async () => {
    u({ gpsStatus: "loading" });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          u({ lat: pos.coords.latitude, lng: pos.coords.longitude, gpsStatus: "ok" });
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
            const g = await r.json(); const a = g.address || {};
            u({ strasse: a.road || "", hausnummer: a.house_number || "", plz: a.postcode || "", ort: a.city || a.town || a.village || "" });
          } catch {}
        },
        async () => {
          try { const r = await fetch("https://ipapi.co/json/"); const g = await r.json(); if (g.latitude) u({ lat: g.latitude, lng: g.longitude, ort: g.city || "", plz: g.postal || "", gpsStatus: "ip" }); else u({ gpsStatus: "error" }); } catch { u({ gpsStatus: "error" }); }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else u({ gpsStatus: "error" });
  };
  useEffect(() => { if (step === 1 && !d.lat) getGPS(); }, [step]);
  useEffect(() => { const k = Math.round(Math.floor(d.dachflaeche / 5) * 0.4 * 10) / 10; if (Math.abs(k - d.geschaetzteKwp) > 1) u({ geschaetzteKwp: k }); }, [d.dachflaeche]);

  // Photos
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const typ = photoTarget;
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader();
      r.onload = () => {
        const newFoto = { id: `${Date.now()}-${Math.random()}`, data: r.result as string, typ, name: f.name };
        setD(prev => ({ ...prev, fotos: [...prev.fotos, newFoto] }));
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };
  const photosOf = (t: string) => d.fotos.filter(f => f.typ === t);

  // Signature
  const initSig = () => { const c = sigCanvas.current; if (!c) return; const x = c.getContext("2d"); if (!x) return; c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; x.scale(2, 2); x.strokeStyle = "#1a1a1a"; x.lineWidth = 2; x.lineCap = "round"; x.lineJoin = "round"; };
  useEffect(() => { if (step === 5 && !d.unterschrieben) setTimeout(initSig, 100); }, [step, d.unterschrieben]);
  const sigStart = (e: React.MouseEvent | React.TouchEvent) => { const c = sigCanvas.current; if (!c) return; setIsDrawing(true); const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.beginPath(); x.moveTo(p.clientX - r.left, p.clientY - r.top); };
  const sigMove = (e: React.MouseEvent | React.TouchEvent) => { if (!isDrawing) return; const c = sigCanvas.current; if (!c) return; const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.lineTo(p.clientX - r.left, p.clientY - r.top); x.stroke(); };
  const sigEnd = () => setIsDrawing(false);
  const sigClear = () => { const c = sigCanvas.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); u({ signatur: "", unterschrieben: false }); };
  const sigConfirm = () => { const c = sigCanvas.current; if (c) u({ signatur: c.toDataURL("image/png"), unterschrieben: true }); };

  // Economics
  const yKwh = Math.round(d.geschaetzteKwp * 950); const ev = Math.min(Math.round(yKwh * 0.3), d.stromverbrauch); const ei = yKwh - ev;
  const sav = Math.round(ev * d.strompreis + ei * 0.082); const cost = Math.round(d.geschaetzteKwp * 1400 + (d.speicherGewuenscht ? d.speicherKwh * 800 : 0) + (d.wallboxGewuenscht ? 1200 : 0));
  const amort = sav > 0 ? (cost / sav).toFixed(1) : "–";

  // Submit
  const submit = async () => {
    setSubmitting(true);
    try {
      const t = getAuthToken();
      const r = await fetch(`${API}/d2d/lead`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          vorname: d.vorname, nachname: d.nachname, email: d.email, telefon: d.telefon, kundentyp: d.kundentyp, firma: d.firma,
          strasse: d.strasse, hausnummer: d.hausnummer, plz: d.plz, ort: d.ort, lat: d.lat, lng: d.lng, ergebnis: d.ergebnis,
          signatur: d.signatur || undefined,
          notes: [d.naechsteSchritte ? `➡️ ${d.naechsteSchritte}` : null, d.notizen || null, d.terminDatum ? `📅 ${d.terminDatum}` : null, `${"⭐".repeat(d.interesse)}`].filter(Boolean).join("\n"),
          technical: { dachtyp: d.dachtyp, dacheindeckung: d.dacheindeckung === "sonstige" ? d.dacheindeckungSonstige : d.dacheindeckung, neigung: d.neigung, ausrichtung: d.ausrichtung, verschattung: d.verschattung, dachflaeche: d.dachflaeche, geschaetzteKwp: d.geschaetzteKwp, stromverbrauch: d.stromverbrauch, strompreis: d.strompreis, personenAnzahl: d.personenAnzahl, heizungsart: d.heizungsart, eAuto: d.eAutoVorhanden ? "vorhanden" : d.eAutoGeplant ? "geplant" : "nein", waermepumpe: d.wpVorhanden ? "vorhanden" : d.wpGeplant ? "geplant" : "nein", speicher: d.speicherGewuenscht ? d.speicherKwh : 0, wallbox: d.wallboxGewuenscht ? d.wallboxKw : 0, finanzierung: d.finanzierung, zeitrahmen: d.zeitrahmen, zaehlerschrank: d.zaehlerschrank, zaehlerschrankPlatz: d.zaehlerschrankPlatz, ergebnis: d.ergebnis, interesse: d.interesse, ersparnis: sav },
          fotos: d.fotos.length,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        alert(`Lead ${data.publicId} erfolgreich erstellt!`);
        nav("/netzanmeldungen");
      } else {
        const err = await r.text().catch(() => "");
        console.error("Lead-Fehler:", r.status, err);
        alert(`Fehler ${r.status}: ${err || "Unbekannter Fehler"}`);
      }
    } catch (e: any) { console.error("Netzwerkfehler:", e); alert("Netzwerkfehler: " + e.message); } finally { setSubmitting(false); }
  };

  const canNext = () => { if (step === 0) return d.vorname && d.nachname && (d.telefon || d.email); if (step === 1) return d.strasse && d.plz && d.ort; return true; };
  const PHOTOS: [string, string][] = [["dach","🏠 Dach"],["zaehler","📦 Zähler"],["umgebung","🌳 Umgebung"],["stromrechnung","📄 Rechnung"],["detail","🔍 Detail"],["sonstiges","📸 Sonstige"]];

  const gpsColor = d.gpsStatus === "ok" ? C.green : d.gpsStatus === "error" ? C.red : "#60a5fa";
  const gpsBorder = d.gpsStatus === "ok" ? "rgba(34,197,94,0.3)" : d.gpsStatus === "error" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.2)";
  const gpsBg = d.gpsStatus === "ok" ? "rgba(34,197,94,0.04)" : d.gpsStatus === "error" ? "rgba(239,68,68,0.04)" : "rgba(59,130,246,0.04)";

  const btnBase: React.CSSProperties = { flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", minHeight: 52, transition: "all .2s", letterSpacing: "-0.01em" };

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <div style={{ position: "fixed", top: "-30%", left: "10%", width: "60%", height: "60%", background: "radial-gradient(ellipse,rgba(212,168,67,0.025),transparent 70%)", pointerEvents: "none" }} />
      <input type="file" accept="image/*" capture="environment" multiple ref={fileRef} style={{ display: "none" }} onChange={handlePhoto} />

      <div style={S.wrap}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text1, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.1 }}>
            Neuer <span style={{ color: C.gold, textShadow: "0 0 40px rgba(212,168,67,0.25)" }}>Lead</span>
          </h1>
          <p style={{ fontSize: 12, color: C.text4, marginTop: 8, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>SCHRITT {step + 1} VON {STEPS.length}</p>
        </div>

        {/* Step nav */}
        <div style={{ display: "flex", gap: 3, marginBottom: 28, background: "rgba(12,20,38,0.5)", borderRadius: 14, padding: "4px 4px", border: "1px solid rgba(255,255,255,0.04)" }}>
          {STEPS.map((s, i) => (
            <div key={s} onClick={() => i < step && setStep(i)} style={{
              flex: 1, textAlign: "center", padding: "10px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
              cursor: i <= step ? "pointer" : "default", transition: "all .2s", borderRadius: 10,
              color: i < step ? C.green : i === step ? C.bg : C.text5,
              background: i === step ? C.gold : "transparent",
              boxShadow: i === step ? "0 2px 12px rgba(212,168,67,0.25)" : "none",
            }}>
              {s}
            </div>
          ))}
        </div>

        {/* STEP 0: KUNDE */}
        {step === 0 && <Card icon="👤" title="Kundendaten">
          <Field label="Kundentyp"><Chips items={[["privat","🏠 Privat"],["gewerbe","🏢 Gewerbe"]]} value={d.kundentyp} onChange={v => u({ kundentyp: v as any })} /></Field>
          {d.kundentyp === "gewerbe" && <Field label="Firma"><input style={S.input} value={d.firma} onChange={e => u({ firma: e.target.value })} placeholder="Firmenname" /></Field>}
          <div className="lw-grid2" style={S.row}>
            <Field label="Vorname *"><input style={S.input} value={d.vorname} onChange={e => u({ vorname: e.target.value })} placeholder="Max" /></Field>
            <Field label="Nachname *"><input style={S.input} value={d.nachname} onChange={e => u({ nachname: e.target.value })} placeholder="Mustermann" /></Field>
          </div>
          <Field label="Telefon *"><input style={S.input} type="tel" value={d.telefon} onChange={e => u({ telefon: e.target.value })} placeholder="+49 171 1234567" /></Field>
          <Field label="E-Mail"><input style={S.input} type="email" value={d.email} onChange={e => u({ email: e.target.value })} placeholder="max@beispiel.de" /></Field>
        </Card>}

        {/* STEP 1: STANDORT */}
        {step === 1 && <Card icon="📍" title="Standort">
          <button onClick={getGPS} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, border: `1px solid ${gpsBorder}`, background: gpsBg, color: gpsColor, fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 48, fontFamily: "inherit", marginBottom: 14 }}>
            {d.gpsStatus === "loading" ? "📡 Suche Position..." : d.gpsStatus === "ok" ? "✓ GPS-Position erfasst" : d.gpsStatus === "ip" ? "📡 Standort über IP erkannt" : d.gpsStatus === "error" ? "✗ GPS nicht verfügbar — manuell eingeben" : "📡 GPS-Position übernehmen"}
          </button>
          <div className="lw-grid2" style={S.row}>
            <Field label="Straße *"><input style={S.input} value={d.strasse} onChange={e => u({ strasse: e.target.value })} placeholder="Hauptstraße" /></Field>
            <Field label="Hausnr."><input style={S.input} value={d.hausnummer} onChange={e => u({ hausnummer: e.target.value })} placeholder="42" /></Field>
          </div>
          <div className="lw-grid2" style={S.row}>
            <Field label="PLZ *"><input style={S.input} value={d.plz} onChange={e => u({ plz: e.target.value })} placeholder="77933" maxLength={5} /></Field>
            <Field label="Ort *"><input style={S.input} value={d.ort} onChange={e => u({ ort: e.target.value })} placeholder="Lahr" /></Field>
          </div>
        </Card>}

        {/* STEP 2: VERBRAUCH */}
        {step === 2 && <Card icon="⚡" title="Verbrauch & Haushalt">
          <Field label="Personen im Haushalt">
            <Chips items={[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6+"]]} value={String(d.personenAnzahl)}
              onChange={v => { const n = parseInt(v); let s = n * 1200 + 800; if (d.eAutoVorhanden) s += 2500; if (d.wpVorhanden) s += 4000; u({ personenAnzahl: n, stromverbrauch: s }); }} />
          </Field>
          <SliderInput label="Verbrauch" min={1000} max={25000} step={100} value={d.stromverbrauch} unit="kWh" onChange={v => u({ stromverbrauch: v })} />
          <SliderInput label="Strompreis" min={0.20} max={0.55} step={0.01} value={d.strompreis} unit="€/kWh" onChange={v => u({ strompreis: v })} />
          <Field label="Heizung"><Chips items={[["gas","🔥 Gas"],["oel","🛢 Öl"],["fernwaerme","🏭 Fern"],["strom","⚡ Strom"],["wp","♨️ WP"],["holz","🪵 Holz"]]} value={d.heizungsart} onChange={v => u({ heizungsart: v })} /></Field>
          <Toggle on={d.eAutoVorhanden} label="🚗 E-Auto vorhanden" onToggle={() => u({ eAutoVorhanden: !d.eAutoVorhanden, eAutoGeplant: false })} />
          {!d.eAutoVorhanden && <Toggle on={d.eAutoGeplant} label="🚗 E-Auto geplant" onToggle={() => u({ eAutoGeplant: !d.eAutoGeplant })} />}
          <Toggle on={d.wpVorhanden} label="♨️ Wärmepumpe vorhanden" onToggle={() => u({ wpVorhanden: !d.wpVorhanden, wpGeplant: false })} />
          {!d.wpVorhanden && <Toggle on={d.wpGeplant} label="♨️ Wärmepumpe geplant" onToggle={() => u({ wpGeplant: !d.wpGeplant })} />}
          <div style={{ marginTop: 10, padding: "10px 14px", background: C.goldBg, border: `1px solid rgba(212,168,67,0.08)`, borderRadius: 10, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
            <b style={{ color: C.gold }}>💡</b> E-Auto +2.500 kWh · Wärmepumpe +4.000 kWh
          </div>
        </Card>}

        {/* STEP 3: DACH */}
        {step === 3 && <Card icon="🏠" title="Dach & Technik">
          <Field label="Dachtyp"><Chips items={[["satteldach","Sattel"],["flachdach","Flach"],["pultdach","Pult"],["walmdach","Walm"],["zeltdach","Zelt"],["mansarddach","Mansard"]]} value={d.dachtyp} onChange={v => u({ dachtyp: v, neigung: v === "flachdach" ? 10 : 30 })} /></Field>
          <Field label="Eindeckung"><Chips items={[["ziegel","Ziegel"],["beton","Beton"],["metall","Metall"],["bitumen","Bitumen"],["schiefer","Schiefer"],["sonstige","Sonstige"]]} value={d.dacheindeckung} onChange={v => u({ dacheindeckung: v })} /></Field>
          {d.dacheindeckung === "sonstige" && <Field label="Welche?"><input style={S.input} value={d.dacheindeckungSonstige} onChange={e => u({ dacheindeckungSonstige: e.target.value })} placeholder="Eindeckung eingeben" /></Field>}
          <SliderInput label="Neigung" min={0} max={60} step={5} value={d.neigung} unit="°" onChange={v => u({ neigung: v })} />
          <Field label="Ausrichtung"><Chips items={[["S","Süd"],["SO","SO"],["SW","SW"],["O","Ost"],["W","West"],["NO","NO"],["NW","NW"],["N","Nord"]]} value={d.ausrichtung} onChange={v => u({ ausrichtung: v })} /></Field>
          <Field label="Verschattung"><Chips items={[["keine","☀️ Keine"],["gering","🌤 Gering"],["mittel","⛅ Mittel"],["stark","☁️ Stark"]]} value={d.verschattung} onChange={v => u({ verschattung: v })} /></Field>
          <SliderInput label="Dachfläche" min={10} max={300} step={5} value={d.dachflaeche} unit="m²" onChange={v => u({ dachflaeche: v })} />
          <SliderInput label="Anlagengröße" min={2} max={50} step={0.5} value={d.geschaetzteKwp} unit="kWp" onChange={v => u({ geschaetzteKwp: v })} />
          <Field label="Zählerschrank"><Chips items={[["gut","✅ Gut"],["mittel","⚠️ Mittel"],["schlecht","❌ Erneuerung"]]} value={d.zaehlerschrank} onChange={v => u({ zaehlerschrank: v })} /></Field>
          <Toggle on={d.zaehlerschrankPlatz} label="📦 Platz im Zählerschrank" onToggle={() => u({ zaehlerschrankPlatz: !d.zaehlerschrankPlatz })} />
        </Card>}

        {/* STEP 4: EXTRAS */}
        {step === 4 && <Card icon="🔋" title="Extras & Wünsche">
          <Toggle on={d.speicherGewuenscht} label="🔋 Batteriespeicher" onToggle={() => u({ speicherGewuenscht: !d.speicherGewuenscht })} />
          {d.speicherGewuenscht && <SliderInput label="Kapazität" min={5} max={30} step={1} value={d.speicherKwh} unit="kWh" onChange={v => u({ speicherKwh: v })} />}
          <Toggle on={d.wallboxGewuenscht} label="🔌 Wallbox" onToggle={() => u({ wallboxGewuenscht: !d.wallboxGewuenscht })} />
          {d.wallboxGewuenscht && <SliderInput label="Leistung" min={3.7} max={22} step={0.1} value={d.wallboxKw} unit="kW" onChange={v => u({ wallboxKw: Math.round(v * 10) / 10 })} />}
          <Field label="Finanzierung"><Chips items={[["kauf","💰 Kauf"],["kredit","🏦 Kredit"],["leasing","📋 Leasing"],["miete","🏠 Miete"]]} value={d.finanzierung} onChange={v => u({ finanzierung: v })} /></Field>
          <Field label="Zeitrahmen"><Chips items={[["sofort","⚡ Sofort"],["1-3","1-3 M."],["3-6","3-6 M."],["6-12","6-12 M."],["offen","🤷 Offen"]]} value={d.zeitrahmen} onChange={v => u({ zeitrahmen: v })} /></Field>
          <Field label={`Fotos (${d.fotos.length} aufgenommen)`}>
            {/* Kategorie-Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {PHOTOS.map(([typ, lbl]) => {
                const count = photosOf(typ).length;
                return (
                  <button key={typ} type="button" onClick={() => { setPhotoTarget(typ); setTimeout(() => fileRef.current?.click(), 50); }}
                    style={{
                      minHeight: 44, padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                      border: count > 0 ? `1.5px solid ${C.green}` : `1px solid rgba(255,255,255,0.08)`,
                      color: count > 0 ? C.green : C.text3,
                      background: count > 0 ? "rgba(34,197,94,0.06)" : "rgba(6,10,20,0.5)",
                      transition: "all .15s",
                    }}>
                    {lbl}
                    {count > 0 && <span style={{ background: C.green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, marginLeft: 2 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
            {/* Foto-Vorschau */}
            {d.fotos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {d.fotos.map(f => (
                  <div key={f.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", border: "1px solid rgba(212,168,67,0.1)" }}>
                    <img src={f.data} alt={f.typ} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "2px 4px", fontSize: 8, color: "#fff", textAlign: "center" }}>
                      {PHOTOS.find(([t]) => t === f.typ)?.[1] || f.typ}
                    </span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setD(prev => ({ ...prev, fotos: prev.fotos.filter(x => x.id !== f.id) })); }}
                      style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "#fff", fontSize: 11, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </Card>}

        {/* STEP 5: ABSCHLUSS */}
        {step === 5 && <>
          <Card icon="📊" title="Gesprächsergebnis">
            <Field label="Ergebnis"><Chips items={[["INTERESSIERT","👍 Interessiert"],["TERMIN_VEREINBART","📅 Termin"],["ANGEBOT_ERSTELLT","📋 Angebot"],["NICHT_INTERESSIERT","👎 Kein Int."],["KEIN_KONTAKT","🚪 Nicht da"]]} value={d.ergebnis} onChange={v => u({ ergebnis: v })} /></Field>
            <Field label="Interesse">
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => u({ interesse: n })} style={{
                    width: 42, height: 42, borderRadius: 10, border: `1px solid ${d.interesse >= n ? C.goldBorder : C.inputBorder}`,
                    background: d.interesse >= n ? C.goldBg : "rgba(6,10,20,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, cursor: "pointer", transition: "all .15s",
                    boxShadow: d.interesse >= n ? `0 0 8px ${C.goldGlow}` : "none",
                  }}>⭐</button>
                ))}
              </div>
            </Field>
            {d.ergebnis === "TERMIN_VEREINBART" && <Field label="Termin"><input style={S.input} type="datetime-local" value={d.terminDatum} onChange={e => u({ terminDatum: e.target.value })} /></Field>}
            <Field label="Nächste Schritte"><input style={S.input} value={d.naechsteSchritte} onChange={e => u({ naechsteSchritte: e.target.value })} placeholder="Angebot senden, Rückruf..." /></Field>
            <Field label="Notizen"><textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={d.notizen} onChange={e => u({ notizen: e.target.value })} placeholder="Besonderheiten, Einwände..." rows={3} /></Field>
          </Card>

          <Card icon="✅" title="Zusammenfassung">
            <SumRow label="Kunde" value={`${d.vorname} ${d.nachname}`} />
            <SumRow label="Kontakt" value={d.telefon || d.email || "–"} />
            <SumRow label="Standort" value={`${d.strasse} ${d.hausnummer}, ${d.plz} ${d.ort}`} />
            <SumRow label="Verbrauch" value={`${d.stromverbrauch.toLocaleString()} kWh · ${d.strompreis.toFixed(2)}€`} />
            <SumRow label="Dach" value={`${d.dachtyp} · ${d.neigung}° ${d.ausrichtung}`} />
            <SumRow label="Anlage" value={`${d.geschaetzteKwp} kWp · ${d.dachflaeche} m²`} />
            {d.speicherGewuenscht && <SumRow label="Speicher" value={`${d.speicherKwh} kWh`} />}
            {d.wallboxGewuenscht && <SumRow label="Wallbox" value={`${d.wallboxKw} kW`} />}
            <SumRow label="Finanzierung" value={`${d.finanzierung} · ${d.zeitrahmen}`} />
            <SumRow label="Fotos" value={`${d.fotos.length} Stück`} />

            {/* Unterschrift */}
            <div style={{ marginTop: 16 }}>
              <div style={S.cardTitle}><span style={{ fontSize: 16 }}>✍️</span> Kundenunterschrift</div>
              {d.unterschrieben ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <div style={{ color: C.green, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>✓ Unterschrieben</div>
                  <img src={d.signatur} alt="Unterschrift" style={{ maxHeight: 80, margin: "0 auto", display: "block", borderRadius: 8, border: `1px solid rgba(34,197,94,0.2)`, background: "rgba(255,255,255,0.95)" }} />
                  <button onClick={() => u({ unterschrieben: false, signatur: "" })} style={{ marginTop: 10, padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)", color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Erneut unterschreiben</button>
                </div>
              ) : (
                <div style={{ border: `1px solid rgba(212,168,67,0.12)`, borderRadius: 12, overflow: "hidden", background: "rgba(6,10,20,0.3)" }}>
                  <div style={{ textAlign: "center", fontSize: 10, color: C.text4, fontStyle: "italic", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Bitte hier unterschreiben</div>
                  <canvas ref={sigCanvas} style={{ width: "100%", height: 160, display: "block", touchAction: "none", cursor: "crosshair", background: "rgba(255,255,255,0.97)" }}
                    onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd}
                    onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd} />
                  <div style={{ display: "flex", gap: 8, padding: "8px 12px", background: "rgba(15,23,42,0.5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <button onClick={sigClear} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: "rgba(6,10,20,0.4)", color: C.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✕ Löschen</button>
                    <button onClick={sigConfirm} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✓ Bestätigen</button>
                  </div>
                </div>
              )}
            </div>

            {/* Wirtschaftlichkeit */}
            <div style={{ marginTop: 16, background: C.goldBg, border: `1px solid rgba(212,168,67,0.12)`, borderRadius: 12, padding: 14 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, marginTop: 0 }}>💶 Wirtschaftlichkeit</h3>
              <SumRow label="Jahresertrag" value={`${yKwh.toLocaleString()} kWh`} />
              <SumRow label="Eigenverbrauch" value={`${ev.toLocaleString()} kWh`} />
              <SumRow label="Ersparnis/Jahr" value={`${sav.toLocaleString()}€`} color={C.green} />
              <SumRow label="Geschätzte Kosten" value={`${cost.toLocaleString()}€`} />
              <SumRow label="Amortisation" value={`~${amort} Jahre`} color={C.gold} />
            </div>
          </Card>
        </>}
      </div>

      {/* Footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "rgba(6,10,20,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${C.cardBorder}`, display: "flex", gap: 10, zIndex: 100 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={{ ...btnBase, background: "rgba(15,23,42,0.5)", border: `1px solid ${C.cardBorder}`, color: C.text4 }}>← Zurück</button>
          : <button onClick={() => nav(-1)} style={{ ...btnBase, background: "rgba(15,23,42,0.5)", border: `1px solid ${C.cardBorder}`, color: C.text4 }}>✕ Abbrechen</button>}
        {step < STEPS.length - 1
          ? <button disabled={!canNext()} onClick={() => setStep(s => s + 1)} style={{ ...btnBase, background: `linear-gradient(135deg,${C.gold},${C.goldBright})`, border: "none", color: C.bg, boxShadow: "0 2px 16px rgba(212,168,67,0.2)", opacity: canNext() ? 1 : 0.35 }}>Weiter →</button>
          : <button disabled={submitting || !d.unterschrieben} onClick={submit} style={{ ...btnBase, background: `linear-gradient(135deg,${C.gold},${C.goldBright})`, border: "none", color: C.bg, boxShadow: "0 2px 16px rgba(212,168,67,0.2)", opacity: !submitting && d.unterschrieben ? 1 : 0.35 }}>{submitting ? "Speichern..." : d.unterschrieben ? "✓ Lead speichern" : "✍️ Erst unterschreiben"}</button>}
      </div>
    </div>
  );
}
