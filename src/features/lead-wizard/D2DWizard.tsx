/**
 * Baunity D2D Lead-Wizard
 * =======================
 * Uses GridNetz wizard CSS framework (wizard-redesign.css)
 * but with D2D-specific steps and Baunity gold branding.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "../../config/storage";

// Import GridNetz wizard CSS framework
import "../../wizard/wizard.css";
import "../../wizard/styles/variables.css";
import "../../wizard/styles/wizard-redesign.css";

const API = import.meta.env.VITE_API_BASE || "/api";

// ── Step Config ──────────────────────────────────────────────────────────────
const STEP_DEFS = [
  { key: "kunde", label: "Kunde", icon: "👤", desc: "Kontaktdaten des Interessenten" },
  { key: "standort", label: "Standort", icon: "📍", desc: "Adresse und GPS-Position" },
  { key: "verbrauch", label: "Verbrauch", icon: "⚡", desc: "Stromverbrauch und Haushalt" },
  { key: "dach", label: "Dach", icon: "🏠", desc: "Dachtyp und technische Daten" },
  { key: "extras", label: "Extras", icon: "🔋", desc: "Speicher, Wallbox, Fotos" },
  { key: "abschluss", label: "Abschluss", icon: "✅", desc: "Ergebnis und Unterschrift" },
];

// ── Data Model ───────────────────────────────────────────────────────────────
interface D {
  kundentyp: string; firma: string; vorname: string; nachname: string; telefon: string; email: string;
  strasse: string; hausnummer: string; plz: string; ort: string; lat: number | null; lng: number | null; gpsStatus: string;
  stromverbrauch: number; strompreis: number; personen: number; heizung: string;
  eAuto: string; wp: string;
  dachtyp: string; eindeckung: string; eindeckungSonstige: string;
  neigung: number; ausrichtung: string; verschattung: string; dachflaeche: number; kwp: number;
  zs: string; zsPlatz: boolean;
  speicher: boolean; speicherKwh: number; wallbox: boolean; wallboxKw: number;
  fin: string; zeit: string;
  ergebnis: string; interesse: number; schritte: string; notizen: string; termin: string;
  fotos: { id: string; data: string; typ: string; name: string }[];
  signatur: string; signed: boolean;
}

const INIT: D = {
  kundentyp: "privat", firma: "", vorname: "", nachname: "", telefon: "", email: "",
  strasse: "", hausnummer: "", plz: "", ort: "", lat: null, lng: null, gpsStatus: "",
  stromverbrauch: 4000, strompreis: 0.35, personen: 3, heizung: "gas", eAuto: "nein", wp: "nein",
  dachtyp: "satteldach", eindeckung: "ziegel", eindeckungSonstige: "",
  neigung: 30, ausrichtung: "S", verschattung: "keine", dachflaeche: 40, kwp: 10,
  zs: "gut", zsPlatz: true,
  speicher: false, speicherKwh: 10, wallbox: false, wallboxKw: 11,
  fin: "kauf", zeit: "3-6",
  ergebnis: "INTERESSIERT", interesse: 3, schritte: "", notizen: "", termin: "",
  fotos: [], signatur: "", signed: false,
};

// ── Baunity override CSS (gold instead of indigo) ────────────────────────────
const BAUNITY_CSS = `
  .wizard-header-progress-fill {
    background: linear-gradient(90deg, #D4A843, #22c55e) !important;
    box-shadow: 0 0 12px rgba(212,168,67,0.4) !important;
  }
  .wizard-header-progress-text { color: #D4A843 !important; }
  .wizard-header-badge {
    background: rgba(212,168,67,0.1) !important;
    border-color: rgba(212,168,67,0.3) !important;
    color: #EAD068 !important;
  }
  .wizard-nav-step.active { color: #D4A843 !important; }
  .wizard-nav-step.active .wizard-nav-dot {
    background: #D4A843 !important; border-color: #D4A843 !important;
    box-shadow: 0 0 10px rgba(212,168,67,0.5) !important;
  }
  .wizard-nav-step.active::after {
    background: linear-gradient(90deg, #D4A843, #c49a3a) !important;
  }
  .wizard-btn-primary, .wizard-footer-next {
    background: linear-gradient(135deg, #D4A843, #EAD068) !important;
    color: #060B18 !important;
    box-shadow: 0 4px 20px rgba(212,168,67,0.25) !important;
  }
  .wizard-progress-ring-bar { stroke: #D4A843 !important; }

  /* Form styling */
  .d2d-section { margin-bottom: 28px; }
  .d2d-section-title {
    font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4);
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px;
    padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .d2d-field { margin-bottom: 18px; }
  .d2d-label {
    display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5);
    margin-bottom: 8px; letter-spacing: 0.02em;
  }
  .d2d-input {
    width: 100%; min-height: 48px; padding: 13px 16px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; color: #f5f5f7; font-size: 15px; font-family: inherit;
    outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .d2d-input:focus {
    border-color: rgba(212,168,67,0.4);
    box-shadow: 0 0 0 3px rgba(212,168,67,0.08);
    background: rgba(255,255,255,0.06);
  }
  .d2d-input::placeholder { color: rgba(255,255,255,0.2); }
  .d2d-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .d2d-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .d2d-chip {
    padding: 11px 18px; border-radius: 12px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5);
    display: flex; align-items: center; gap: 6px; min-height: 46px; user-select: none;
  }
  .d2d-chip:hover { border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
  .d2d-chip.on {
    border-color: #D4A843; color: #D4A843; background: rgba(212,168,67,0.08);
    box-shadow: 0 0 16px rgba(212,168,67,0.06);
  }
  .d2d-toggle {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-radius: 14px; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
    margin-bottom: 10px; min-height: 52px; transition: all 0.2s;
  }
  .d2d-toggle.on { border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.04); }
  .d2d-toggle-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5); }
  .d2d-toggle.on .d2d-toggle-label { color: rgba(255,255,255,0.9); }
  .d2d-toggle-sw {
    width: 44px; height: 24px; border-radius: 12px;
    background: rgba(255,255,255,0.1); position: relative; transition: background 0.3s; flex-shrink: 0;
  }
  .d2d-toggle.on .d2d-toggle-sw { background: #22c55e; }
  .d2d-toggle-sw::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 20px; height: 20px; border-radius: 50%; background: #fff;
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  .d2d-toggle.on .d2d-toggle-sw::after { transform: translateX(20px); }
  .d2d-slider { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .d2d-slider-label {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.4);
    width: 90px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .d2d-slider input[type=range] { flex: 1; accent-color: #D4A843; height: 6px; }
  .d2d-slider-val {
    min-width: 80px; padding: 10px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #D4A843; font-size: 14px; font-weight: 600; text-align: center;
    font-family: 'JetBrains Mono', monospace;
  }
  .d2d-slider-val input {
    width: 60px; background: none; border: none; color: #D4A843;
    font-size: 14px; font-weight: 600; text-align: center; outline: none;
    font-family: 'JetBrains Mono', monospace; -moz-appearance: textfield;
  }
  .d2d-slider-val input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .d2d-slider-unit { font-size: 11px; color: rgba(255,255,255,0.3); margin-left: 2px; }
  .d2d-gps {
    width: 100%; padding: 14px 18px; border-radius: 14px; border: none;
    min-height: 52px; cursor: pointer; display: flex; align-items: center; gap: 10px;
    font-size: 14px; font-weight: 600; font-family: inherit; margin-bottom: 18px; transition: all 0.2s;
  }
  .d2d-gps.idle { background: rgba(59,130,246,0.06); color: #60a5fa; box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2); }
  .d2d-gps.ok { background: rgba(34,197,94,0.06); color: #22c55e; box-shadow: inset 0 0 0 1px rgba(34,197,94,0.25); }
  .d2d-gps.err { background: rgba(239,68,68,0.06); color: #ef4444; box-shadow: inset 0 0 0 1px rgba(239,68,68,0.2); }
  .d2d-stars { display: flex; gap: 8px; }
  .d2d-star {
    width: 48px; height: 48px; border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; cursor: pointer; transition: all 0.2s;
  }
  .d2d-star.on {
    border-color: #D4A843; background: rgba(212,168,67,0.08);
    box-shadow: 0 0 14px rgba(212,168,67,0.08);
  }
  .d2d-tip {
    padding: 14px 18px; border-radius: 14px;
    background: rgba(212,168,67,0.03); border: 1px solid rgba(212,168,67,0.08);
    font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-top: 8px;
  }
  .d2d-tip b { color: #D4A843; }
  .d2d-sum-row {
    display: flex; justify-content: space-between; padding: 11px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px;
  }
  .d2d-sum-l { color: rgba(255,255,255,0.4); }
  .d2d-sum-v { color: #f5f5f7; font-weight: 600; text-align: right; }
  .d2d-hl {
    margin-top: 24px; padding: 24px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(212,168,67,0.05), rgba(212,168,67,0.02));
    border: 1px solid rgba(212,168,67,0.12);
  }
  .d2d-hl h3 {
    font-size: 12px; font-weight: 700; color: #D4A843;
    text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 16px 0;
  }
  .d2d-sig {
    border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 16px;
    overflow: hidden; margin-top: 16px; background: rgba(255,255,255,0.02);
  }
  .d2d-sig canvas {
    width: 100%; height: 140px; display: block; touch-action: none;
    cursor: crosshair; background: rgba(255,255,255,0.97);
  }
  .d2d-sig-bar {
    display: flex; gap: 10px; padding: 12px 16px;
    background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.04);
  }
  .d2d-sig-bar button {
    padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); transition: all 0.15s;
  }
  .d2d-sig-bar .confirm { border-color: rgba(34,197,94,0.3); color: #22c55e; background: rgba(34,197,94,0.06); }
  .d2d-photos { display: flex; flex-wrap: wrap; gap: 8px; }
  .d2d-photo-btn {
    padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit;
    min-height: 46px; transition: all 0.2s; border: none;
  }
  .d2d-photo-btn.empty {
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }
  .d2d-photo-btn.empty:hover { color: #D4A843; box-shadow: inset 0 0 0 1px rgba(212,168,67,0.2); }
  .d2d-photo-btn.has {
    background: rgba(34,197,94,0.06); color: #22c55e;
    box-shadow: inset 0 0 0 1px rgba(34,197,94,0.25);
  }
  .d2d-photo-badge {
    background: #22c55e; color: #fff; font-size: 11px; font-weight: 700;
    padding: 2px 8px; border-radius: 10px;
  }
  /* Hide sidebars on this wizard (single-column) */
  .d2d-wizard .wizard-sidebar-left,
  .d2d-wizard .wizard-sidebar-right { display: none; }
  .d2d-wizard .wizard-body { grid-template-columns: 1fr !important; }
  .d2d-wizard .wizard-content { max-width: 640px; margin: 0 auto; padding: 32px 24px 120px; }
  @media (max-width: 768px) {
    .d2d-row { grid-template-columns: 1fr !important; }
    .d2d-wizard .wizard-content { padding: 20px 16px 120px; }
  }
`;

// ── Component ────────────────────────────────────────────────────────────────

export default function D2DWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<D>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLCanvasElement>(null);
  const [photoTarget, setPhotoTarget] = useState("");
  const [drawing, setDrawing] = useState(false);

  const u = (p: Partial<D>) => setD(v => ({ ...v, ...p }));
  const progress = Math.round(((step + 1) / STEP_DEFS.length) * 100);

  // GPS
  const getGPS = () => {
    u({ gpsStatus: "loading" });
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        u({ lat: pos.coords.latitude, lng: pos.coords.longitude, gpsStatus: "ok" });
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
          const g = await r.json(); const a = g.address || {};
          u({ strasse: a.road || "", hausnummer: a.house_number || "", plz: a.postcode || "", ort: a.city || a.town || a.village || "" });
        } catch {}
      },
      async () => {
        try {
          const r = await fetch("https://ipapi.co/json/"); const g = await r.json();
          if (g.latitude) u({ lat: g.latitude, lng: g.longitude, ort: g.city || "", plz: g.postal || "", gpsStatus: "ip" });
          else u({ gpsStatus: "error" });
        } catch { u({ gpsStatus: "error" }); }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  useEffect(() => { if (step === 1 && !d.lat) getGPS(); }, [step]);

  // Photos
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const typ = photoTarget;
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader();
      r.onload = () => setD(prev => ({ ...prev, fotos: [...prev.fotos, { id: `${Date.now()}-${Math.random()}`, data: r.result as string, typ, name: f.name }] }));
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  // Signature
  const initSig = useCallback(() => {
    const c = sigRef.current; if (!c) return;
    const x = c.getContext("2d"); if (!x) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    x.scale(2, 2); x.strokeStyle = "#1a1a1a"; x.lineWidth = 2; x.lineCap = "round"; x.lineJoin = "round";
  }, []);
  useEffect(() => { if (step === 5 && !d.signed) setTimeout(initSig, 150); }, [step, d.signed, initSig]);

  const sigStart = (e: React.MouseEvent | React.TouchEvent) => { const c = sigRef.current; if (!c) return; setDrawing(true); const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.beginPath(); x.moveTo(p.clientX - r.left, p.clientY - r.top); };
  const sigMove = (e: React.MouseEvent | React.TouchEvent) => { if (!drawing) return; const c = sigRef.current; if (!c) return; const x = c.getContext("2d")!; const r = c.getBoundingClientRect(); const p = "touches" in e ? e.touches[0] : e; x.lineTo(p.clientX - r.left, p.clientY - r.top); x.stroke(); };
  const sigEnd = () => setDrawing(false);

  // Economics
  const yKwh = Math.round(d.kwp * 950);
  const ev = Math.min(Math.round(yKwh * 0.3), d.stromverbrauch);
  const sav = Math.round(ev * d.strompreis + (yKwh - ev) * 0.082);
  const cost = Math.round(d.kwp * 1400 + (d.speicher ? d.speicherKwh * 800 : 0) + (d.wallbox ? 1200 : 0));

  // Submit
  const submit = async () => {
    setSubmitting(true);
    try {
      const t = getAuthToken();
      const r = await fetch(`${API}/d2d/lead`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          vorname: d.vorname, nachname: d.nachname, email: d.email, telefon: d.telefon,
          kundentyp: d.kundentyp, firma: d.firma, strasse: d.strasse, hausnummer: d.hausnummer,
          plz: d.plz, ort: d.ort, lat: d.lat, lng: d.lng, ergebnis: d.ergebnis,
          signatur: d.signatur || undefined,
          notes: [d.schritte ? `➡️ ${d.schritte}` : null, d.notizen || null, d.termin ? `📅 ${d.termin}` : null, `${"⭐".repeat(d.interesse)}`].filter(Boolean).join("\n"),
          technical: { dachtyp: d.dachtyp, dacheindeckung: d.eindeckung === "sonstige" ? d.eindeckungSonstige : d.eindeckung, neigung: d.neigung, ausrichtung: d.ausrichtung, verschattung: d.verschattung, dachflaeche: d.dachflaeche, geschaetzteKwp: d.kwp, stromverbrauch: d.stromverbrauch, strompreis: d.strompreis, personenAnzahl: d.personen, heizungsart: d.heizung, eAuto: d.eAuto, waermepumpe: d.wp, speicher: d.speicher ? d.speicherKwh : 0, wallbox: d.wallbox ? d.wallboxKw : 0, finanzierung: d.fin, zeitrahmen: d.zeit, zaehlerschrank: d.zs, zaehlerschrankPlatz: d.zsPlatz, ergebnis: d.ergebnis, interesse: d.interesse, ersparnis: sav },
          fotos: d.fotos.length,
        }),
      });
      if (r.ok) { const data = await r.json(); alert(`Lead ${data.publicId} erstellt!`); nav("/netzanmeldungen"); }
      else alert("Fehler beim Speichern");
    } catch { alert("Netzwerkfehler"); } finally { setSubmitting(false); }
  };

  const canNext = step === 0 ? (d.vorname && d.nachname && (d.telefon || d.email)) : step === 1 ? (d.strasse && d.plz && d.ort) : true;

  const Chip = ({ on, children, click }: { on: boolean; children: React.ReactNode; click: () => void }) => (
    <div className={`d2d-chip ${on ? "on" : ""}`} onClick={click}>{children}</div>
  );

  const PHOTOS: [string, string][] = [["dach","🏠 Dach"],["zaehler","📦 Zähler"],["umgebung","🌳 Umgebung"],["stromrechnung","📄 Rechnung"],["detail","🔍 Detail"],["sonstiges","📸 Sonstige"]];

  return (
    <div className="wizard-redesign d2d-wizard">
      <style>{BAUNITY_CSS}</style>
      <input type="file" accept="image/*" capture="environment" multiple ref={fileRef} style={{ display: "none" }} onChange={handlePhoto} />

      {/* ═══ HEADER ═══ */}
      <div className="wizard-header">
        <div className="wizard-header-inner">
          <div className="wizard-header-logo">
            <div className="wizard-header-logo-icon">☀️</div>
            <div className="wizard-header-logo-text">
              <h1>BAUNITY</h1>
              <p className="wizard-header-logo-sub">Lead Erfassung</p>
            </div>
          </div>
          <div className="wizard-header-progress">
            <div className="wizard-header-progress-bar">
              <div className="wizard-header-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="wizard-header-progress-text">{progress}%</span>
          </div>
          <span className="wizard-header-badge">D2D Solar</span>
          <div className="wizard-header-actions">
            <button className="wizard-header-btn" onClick={() => nav(-1)}>✕ Schließen</button>
          </div>
        </div>
      </div>

      {/* ═══ STEP NAV ═══ */}
      <div className="wizard-nav">
        <div className="wizard-nav-inner">
          {STEP_DEFS.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <div className={`wizard-nav-connector ${i <= step ? "completed" : ""}`} />}
              <button className={`wizard-nav-step ${i < step ? "completed" : i === step ? "active" : ""}`}
                onClick={() => i < step && setStep(i)} disabled={i > step}>
                <div className="wizard-nav-dot" />
                <span>{s.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="wizard-body">
        <div className="wizard-content">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

              {/* Step Header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{STEP_DEFS[step].icon}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f7", margin: 0 }}>{STEP_DEFS[step].label}</h2>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>{STEP_DEFS[step].desc}</p>
              </div>

              {/* ═══ STEP 0: KUNDE ═══ */}
              {step === 0 && <>
                <div className="d2d-section">
                  <div className="d2d-field"><span className="d2d-label">Kundentyp</span>
                    <div className="d2d-chips"><Chip on={d.kundentyp==="privat"} click={() => u({kundentyp:"privat"})}>🏠 Privat</Chip><Chip on={d.kundentyp==="gewerbe"} click={() => u({kundentyp:"gewerbe"})}>🏢 Gewerbe</Chip></div>
                  </div>
                  {d.kundentyp === "gewerbe" && <div className="d2d-field"><span className="d2d-label">Firma</span><input className="d2d-input" value={d.firma} onChange={e => u({firma:e.target.value})} placeholder="Firmenname" /></div>}
                  <div className="d2d-row">
                    <div className="d2d-field"><span className="d2d-label">Vorname *</span><input className="d2d-input" value={d.vorname} onChange={e => u({vorname:e.target.value})} placeholder="Max" /></div>
                    <div className="d2d-field"><span className="d2d-label">Nachname *</span><input className="d2d-input" value={d.nachname} onChange={e => u({nachname:e.target.value})} placeholder="Mustermann" /></div>
                  </div>
                  <div className="d2d-field"><span className="d2d-label">Telefon *</span><input className="d2d-input" type="tel" value={d.telefon} onChange={e => u({telefon:e.target.value})} placeholder="+49 171 1234567" /></div>
                  <div className="d2d-field"><span className="d2d-label">E-Mail</span><input className="d2d-input" type="email" value={d.email} onChange={e => u({email:e.target.value})} placeholder="max@beispiel.de" /></div>
                </div>
              </>}

              {/* ═══ STEP 1: STANDORT ═══ */}
              {step === 1 && <>
                <button className={`d2d-gps ${d.gpsStatus === "ok" ? "ok" : d.gpsStatus === "error" ? "err" : "idle"}`} onClick={getGPS}>
                  📡 {d.gpsStatus === "loading" ? "Suche..." : d.gpsStatus === "ok" ? "✓ GPS erfasst" : d.gpsStatus === "error" ? "✗ Manuell eingeben" : "GPS-Position übernehmen"}
                </button>
                <div className="d2d-row">
                  <div className="d2d-field"><span className="d2d-label">Straße *</span><input className="d2d-input" value={d.strasse} onChange={e => u({strasse:e.target.value})} placeholder="Hauptstraße" /></div>
                  <div className="d2d-field"><span className="d2d-label">Nr.</span><input className="d2d-input" value={d.hausnummer} onChange={e => u({hausnummer:e.target.value})} placeholder="42" /></div>
                </div>
                <div className="d2d-row">
                  <div className="d2d-field"><span className="d2d-label">PLZ *</span><input className="d2d-input" value={d.plz} onChange={e => u({plz:e.target.value})} placeholder="77933" maxLength={5} /></div>
                  <div className="d2d-field"><span className="d2d-label">Ort *</span><input className="d2d-input" value={d.ort} onChange={e => u({ort:e.target.value})} placeholder="Lahr" /></div>
                </div>
              </>}

              {/* ═══ STEP 2: VERBRAUCH ═══ */}
              {step === 2 && <>
                <div className="d2d-field"><span className="d2d-label">Personen</span>
                  <div className="d2d-chips">{[1,2,3,4,5,6].map(n => <Chip key={n} on={d.personen===n} click={() => { const v = n*1200+800; u({personen:n, stromverbrauch:v}); }}>{n}{n===6?"+":""}</Chip>)}</div>
                </div>
                <div className="d2d-slider"><span className="d2d-slider-label">Verbrauch</span><input type="range" min={1000} max={25000} step={100} value={d.stromverbrauch} onChange={e => u({stromverbrauch:Number(e.target.value)})} /><div className="d2d-slider-val"><input value={d.stromverbrauch} onChange={e => u({stromverbrauch:Number(e.target.value)})} /><span className="d2d-slider-unit">kWh</span></div></div>
                <div className="d2d-slider"><span className="d2d-slider-label">Strompreis</span><input type="range" min={0.20} max={0.55} step={0.01} value={d.strompreis} onChange={e => u({strompreis:Number(e.target.value)})} /><div className="d2d-slider-val"><input value={d.strompreis.toFixed(2)} onChange={e => u({strompreis:Number(e.target.value)})} /><span className="d2d-slider-unit">€</span></div></div>
                <div className="d2d-field"><span className="d2d-label">Heizung</span>
                  <div className="d2d-chips">{[["gas","🔥 Gas"],["oel","🛢 Öl"],["fw","🏭 Fern"],["strom","⚡ Strom"],["wp","♨️ WP"],["holz","🪵 Holz"]].map(([v,l]) => <Chip key={v} on={d.heizung===v} click={() => u({heizung:v})}>{l}</Chip>)}</div>
                </div>
                <div className="d2d-field"><span className="d2d-label">E-Auto</span>
                  <div className="d2d-chips"><Chip on={d.eAuto==="nein"} click={() => u({eAuto:"nein"})}>Nein</Chip><Chip on={d.eAuto==="vorhanden"} click={() => u({eAuto:"vorhanden"})}>🚗 Vorhanden</Chip><Chip on={d.eAuto==="geplant"} click={() => u({eAuto:"geplant"})}>🚗 Geplant</Chip></div>
                </div>
                <div className="d2d-field"><span className="d2d-label">Wärmepumpe</span>
                  <div className="d2d-chips"><Chip on={d.wp==="nein"} click={() => u({wp:"nein"})}>Nein</Chip><Chip on={d.wp==="vorhanden"} click={() => u({wp:"vorhanden"})}>♨️ Vorhanden</Chip><Chip on={d.wp==="geplant"} click={() => u({wp:"geplant"})}>♨️ Geplant</Chip></div>
                </div>
                <div className="d2d-tip"><b>💡</b> E-Auto +2.500 kWh · Wärmepumpe +4.000 kWh — erhöht Eigenverbrauch.</div>
              </>}

              {/* ═══ STEP 3: DACH ═══ */}
              {step === 3 && <>
                <div className="d2d-field"><span className="d2d-label">Dachtyp</span><div className="d2d-chips">{[["satteldach","Sattel"],["flachdach","Flach"],["pultdach","Pult"],["walmdach","Walm"],["zeltdach","Zelt"]].map(([v,l]) => <Chip key={v} on={d.dachtyp===v} click={() => u({dachtyp:v, neigung:v==="flachdach"?10:30})}>{l}</Chip>)}</div></div>
                <div className="d2d-field"><span className="d2d-label">Eindeckung</span><div className="d2d-chips">{[["ziegel","Ziegel"],["beton","Beton"],["metall","Metall"],["bitumen","Bitumen"],["schiefer","Schiefer"],["sonstige","Sonstige"]].map(([v,l]) => <Chip key={v} on={d.eindeckung===v} click={() => u({eindeckung:v})}>{l}</Chip>)}</div></div>
                {d.eindeckung === "sonstige" && <div className="d2d-field"><input className="d2d-input" value={d.eindeckungSonstige} onChange={e => u({eindeckungSonstige:e.target.value})} placeholder="Welche Eindeckung?" /></div>}
                <div className="d2d-slider"><span className="d2d-slider-label">Neigung</span><input type="range" min={0} max={60} step={5} value={d.neigung} onChange={e => u({neigung:Number(e.target.value)})} /><div className="d2d-slider-val">{d.neigung}°</div></div>
                <div className="d2d-field"><span className="d2d-label">Ausrichtung</span><div className="d2d-chips">{[["S","Süd"],["SO","SO"],["SW","SW"],["O","Ost"],["W","West"],["NO","NO"],["NW","NW"],["N","Nord"]].map(([v,l]) => <Chip key={v} on={d.ausrichtung===v} click={() => u({ausrichtung:v})}>{l}</Chip>)}</div></div>
                <div className="d2d-field"><span className="d2d-label">Verschattung</span><div className="d2d-chips">{[["keine","☀️ Keine"],["gering","🌤 Gering"],["mittel","⛅ Mittel"],["stark","☁️ Stark"]].map(([v,l]) => <Chip key={v} on={d.verschattung===v} click={() => u({verschattung:v})}>{l}</Chip>)}</div></div>
                <div className="d2d-slider"><span className="d2d-slider-label">Dachfläche</span><input type="range" min={10} max={300} step={5} value={d.dachflaeche} onChange={e => u({dachflaeche:Number(e.target.value)})} /><div className="d2d-slider-val"><input value={d.dachflaeche} onChange={e => u({dachflaeche:Number(e.target.value)})} /><span className="d2d-slider-unit">m²</span></div></div>
                <div className="d2d-slider"><span className="d2d-slider-label">Anlage</span><input type="range" min={2} max={50} step={0.5} value={d.kwp} onChange={e => u({kwp:Number(e.target.value)})} /><div className="d2d-slider-val"><input value={d.kwp} onChange={e => u({kwp:Number(e.target.value)})} /><span className="d2d-slider-unit">kWp</span></div></div>
                <div className="d2d-field"><span className="d2d-label">Zählerschrank</span><div className="d2d-chips">{[["gut","✅ Gut"],["mittel","⚠️ Mittel"],["schlecht","❌ Erneuerung"]].map(([v,l]) => <Chip key={v} on={d.zs===v} click={() => u({zs:v})}>{l}</Chip>)}</div></div>
                <div className={`d2d-toggle ${d.zsPlatz?"on":""}`} onClick={() => u({zsPlatz:!d.zsPlatz})}><span className="d2d-toggle-label">📦 Platz im Zählerschrank</span><div className="d2d-toggle-sw" /></div>
              </>}

              {/* ═══ STEP 4: EXTRAS ═══ */}
              {step === 4 && <>
                <div className={`d2d-toggle ${d.speicher?"on":""}`} onClick={() => u({speicher:!d.speicher})}><span className="d2d-toggle-label">🔋 Batteriespeicher</span><div className="d2d-toggle-sw" /></div>
                {d.speicher && <div className="d2d-slider"><span className="d2d-slider-label">Kapazität</span><input type="range" min={5} max={30} value={d.speicherKwh} onChange={e => u({speicherKwh:Number(e.target.value)})} /><div className="d2d-slider-val"><input value={d.speicherKwh} onChange={e => u({speicherKwh:Number(e.target.value)})} /><span className="d2d-slider-unit">kWh</span></div></div>}
                <div className={`d2d-toggle ${d.wallbox?"on":""}`} onClick={() => u({wallbox:!d.wallbox})}><span className="d2d-toggle-label">🔌 Wallbox</span><div className="d2d-toggle-sw" /></div>
                {d.wallbox && <div className="d2d-slider"><span className="d2d-slider-label">Leistung</span><input type="range" min={3.7} max={22} step={0.1} value={d.wallboxKw} onChange={e => u({wallboxKw:Math.round(Number(e.target.value)*10)/10})} /><div className="d2d-slider-val"><input value={d.wallboxKw} onChange={e => u({wallboxKw:Number(e.target.value)})} /><span className="d2d-slider-unit">kW</span></div></div>}
                <div className="d2d-field"><span className="d2d-label">Finanzierung</span><div className="d2d-chips">{[["kauf","💰 Kauf"],["kredit","🏦 Kredit"],["leasing","📋 Leasing"],["miete","🏠 Miete"]].map(([v,l]) => <Chip key={v} on={d.fin===v} click={() => u({fin:v})}>{l}</Chip>)}</div></div>
                <div className="d2d-field"><span className="d2d-label">Zeitrahmen</span><div className="d2d-chips">{[["sofort","⚡ Sofort"],["1-3","1-3 M."],["3-6","3-6 M."],["6-12","6-12 M."],["offen","🤷 Offen"]].map(([v,l]) => <Chip key={v} on={d.zeit===v} click={() => u({zeit:v})}>{l}</Chip>)}</div></div>
                <div className="d2d-field"><span className="d2d-label">Fotos ({d.fotos.length})</span>
                  <div className="d2d-photos">
                    {PHOTOS.map(([t,l]) => { const c = d.fotos.filter(f => f.typ === t).length; return (
                      <button key={t} className={`d2d-photo-btn ${c > 0 ? "has" : "empty"}`} onClick={() => { setPhotoTarget(t); setTimeout(() => fileRef.current?.click(), 50); }}>
                        {l} {c > 0 && <span className="d2d-photo-badge">{c}</span>}
                      </button>
                    ); })}
                  </div>
                </div>
              </>}

              {/* ═══ STEP 5: ABSCHLUSS ═══ */}
              {step === 5 && <>
                <div className="d2d-field"><span className="d2d-label">Ergebnis</span><div className="d2d-chips">{[["INTERESSIERT","👍 Interessiert"],["TERMIN_VEREINBART","📅 Termin"],["ANGEBOT_ERSTELLT","📋 Angebot"],["NICHT_INTERESSIERT","👎 Kein Int."],["KEIN_KONTAKT","🚪 Nicht da"]].map(([v,l]) => <Chip key={v} on={d.ergebnis===v} click={() => u({ergebnis:v})}>{l}</Chip>)}</div></div>
                <div className="d2d-field"><span className="d2d-label">Interesse</span><div className="d2d-stars">{[1,2,3,4,5].map(n => <div key={n} className={`d2d-star ${d.interesse>=n?"on":""}`} onClick={() => u({interesse:n})}>⭐</div>)}</div></div>
                {d.ergebnis === "TERMIN_VEREINBART" && <div className="d2d-field"><span className="d2d-label">Termin</span><input className="d2d-input" type="datetime-local" value={d.termin} onChange={e => u({termin:e.target.value})} /></div>}
                <div className="d2d-field"><span className="d2d-label">Nächste Schritte</span><input className="d2d-input" value={d.schritte} onChange={e => u({schritte:e.target.value})} placeholder="Angebot senden, Rückruf..." /></div>
                <div className="d2d-field"><span className="d2d-label">Notizen</span><textarea className="d2d-input" style={{ minHeight: 80, resize: "vertical" }} value={d.notizen} onChange={e => u({notizen:e.target.value})} placeholder="Besonderheiten, Einwände..." /></div>

                {/* Summary */}
                <div className="d2d-section" style={{ marginTop: 24 }}>
                  <div className="d2d-section-title">Zusammenfassung</div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Kunde</span><span className="d2d-sum-v">{d.vorname} {d.nachname}</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Kontakt</span><span className="d2d-sum-v">{d.telefon || d.email}</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Standort</span><span className="d2d-sum-v">{d.strasse} {d.hausnummer}, {d.plz} {d.ort}</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Verbrauch</span><span className="d2d-sum-v">{d.stromverbrauch.toLocaleString()} kWh · {d.strompreis.toFixed(2)}€</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Dach</span><span className="d2d-sum-v">{d.dachtyp} · {d.neigung}° {d.ausrichtung}</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Anlage</span><span className="d2d-sum-v" style={{ color: "#D4A843" }}>{d.kwp} kWp · {d.dachflaeche} m²</span></div>
                  {d.speicher && <div className="d2d-sum-row"><span className="d2d-sum-l">Speicher</span><span className="d2d-sum-v">{d.speicherKwh} kWh</span></div>}
                  {d.wallbox && <div className="d2d-sum-row"><span className="d2d-sum-l">Wallbox</span><span className="d2d-sum-v">{d.wallboxKw} kW</span></div>}
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Fotos</span><span className="d2d-sum-v">{d.fotos.length}</span></div>
                </div>

                {/* Signature */}
                <div className="d2d-section">
                  <div className="d2d-section-title">✍️ Kundenunterschrift</div>
                  {d.signed ? (
                    <div style={{ textAlign: "center", padding: 20, background: "rgba(34,197,94,0.04)", borderRadius: 16, border: "1px solid rgba(34,197,94,0.15)" }}>
                      <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 16 }}>✓ Unterschrieben</div>
                      <img src={d.signatur} alt="" style={{ maxHeight: 70, margin: "10px auto", display: "block", borderRadius: 8, background: "#fafafa", border: "1px solid rgba(34,197,94,0.2)" }} />
                      <button onClick={() => u({signed:false, signatur:""})} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Erneut unterschreiben</button>
                    </div>
                  ) : (
                    <div className="d2d-sig">
                      <div style={{ textAlign: "center", padding: 8, fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Bitte hier unterschreiben</div>
                      <canvas ref={sigRef} onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd} onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd} />
                      <div className="d2d-sig-bar">
                        <button onClick={() => { const c = sigRef.current; if (c) c.getContext("2d")!.clearRect(0,0,c.width,c.height); u({signatur:"",signed:false}); }}>✕ Löschen</button>
                        <button className="confirm" onClick={() => { const c = sigRef.current; if (c) u({signatur:c.toDataURL("image/png"), signed:true}); }}>✓ Bestätigen</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Economics */}
                <div className="d2d-hl">
                  <h3>💶 Wirtschaftlichkeit</h3>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Jahresertrag</span><span className="d2d-sum-v">{yKwh.toLocaleString()} kWh</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Eigenverbrauch</span><span className="d2d-sum-v">{ev.toLocaleString()} kWh</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Ersparnis/Jahr</span><span className="d2d-sum-v" style={{ color: "#22c55e", fontSize: 16 }}>{sav.toLocaleString()}€</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Kosten</span><span className="d2d-sum-v">~{cost.toLocaleString()}€</span></div>
                  <div className="d2d-sum-row"><span className="d2d-sum-l">Amortisation</span><span className="d2d-sum-v" style={{ color: "#D4A843", fontSize: 18, fontWeight: 800 }}>~{sav > 0 ? (cost/sav).toFixed(1) : "–"} Jahre</span></div>
                </div>
              </>}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="wizard-footer" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 24px", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, zIndex: 100 }}>
        <button onClick={() => step > 0 ? setStep(step-1) : nav(-1)} className="wizard-btn wizard-btn-secondary" style={{ flex: 1, minHeight: 52 }}>
          {step > 0 ? "← Zurück" : "✕ Abbrechen"}
        </button>
        {step < 5 ? (
          <button onClick={() => canNext && setStep(step+1)} disabled={!canNext} className="wizard-btn wizard-btn-primary" style={{ flex: 1, minHeight: 52, background: "linear-gradient(135deg,#D4A843,#EAD068)", color: "#060B18", opacity: canNext ? 1 : 0.3 }}>
            Weiter →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting || !d.signed} className="wizard-btn wizard-btn-primary" style={{ flex: 1, minHeight: 52, background: "linear-gradient(135deg,#D4A843,#EAD068)", color: "#060B18", opacity: !submitting && d.signed ? 1 : 0.3 }}>
            {submitting ? "Speichern..." : d.signed ? "✓ Lead speichern" : "✍️ Erst unterschreiben"}
          </button>
        )}
      </div>
    </div>
  );
}
