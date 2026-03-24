/**
 * PublicFormularPage
 *
 * Öffentliches Multi-Step-Formular für PV-Anlagen-Anmeldungen.
 * Endkunden können hier ihre Daten einreichen, ohne einen Account zu brauchen.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./public-formular.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormConfig {
  slug: string;
  kundeName: string;
  title: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  welcomeText: string | null;
}

interface FormData {
  betreiber: {
    anrede: string;
    vorname: string;
    nachname: string;
    geburtsdatum: string;
    strasse: string;
    hausNr: string;
    plz: string;
    ort: string;
    email: string;
    telefon: string;
    firma: string;
  };
  standort: {
    abweichend: boolean;
    strasse: string;
    hausNr: string;
    plz: string;
    ort: string;
  };
  pvModule: {
    hersteller: string;
    modell: string;
    leistungWp: string;
    anzahl: string;
    ausrichtung: string;
    neigung: string;
  };
  wechselrichter: {
    hersteller: string;
    modell: string;
    leistungKva: string;
    anzahl: string;
    hybrid: boolean;
  };
  speicher: {
    vorhanden: boolean;
    hersteller: string;
    modell: string;
    kapazitaetKwh: string;
    anzahl: string;
    kopplung: string;
  };
  wallbox: {
    vorhanden: boolean;
    hersteller: string;
    modell: string;
    leistungKw: string;
  };
  zaehler: {
    zaehlernummer: string;
    maloId: string;
  };
  einspeiseart: string;
  ibnDatum: string;
  zustimmungen: {
    vollmacht: boolean;
    datenschutz: boolean;
  };
  honeypot: string;
}

const INITIAL_DATA: FormData = {
  betreiber: { anrede: "", vorname: "", nachname: "", geburtsdatum: "", strasse: "", hausNr: "", plz: "", ort: "", email: "", telefon: "", firma: "" },
  standort: { abweichend: false, strasse: "", hausNr: "", plz: "", ort: "" },
  pvModule: { hersteller: "", modell: "", leistungWp: "", anzahl: "", ausrichtung: "", neigung: "" },
  wechselrichter: { hersteller: "", modell: "", leistungKva: "", anzahl: "", hybrid: false },
  speicher: { vorhanden: false, hersteller: "", modell: "", kapazitaetKwh: "", anzahl: "", kopplung: "" },
  wallbox: { vorhanden: false, hersteller: "", modell: "", leistungKw: "" },
  zaehler: { zaehlernummer: "", maloId: "" },
  einspeiseart: "",
  ibnDatum: "",
  zustimmungen: { vollmacht: false, datenschutz: false },
  honeypot: "",
};

const STEPS = [
  { label: "Betreiber", icon: "1" },
  { label: "Standort", icon: "2" },
  { label: "PV & WR", icon: "3" },
  { label: "Speicher", icon: "4" },
  { label: "Zähler", icon: "5" },
  { label: "Absenden", icon: "6" },
];

// ─── Field Components ────────────────────────────────────────────────────────

function TextField({ label, value, onChange, required, placeholder, type = "text", error, className }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  placeholder?: string; type?: string; error?: string; className?: string;
}) {
  return (
    <div className={`field-group ${className || ""}`}>
      <label>{label}{required && <span className="required">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "error" : ""}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, required, options, className, error }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  options: { value: string; label: string }[]; className?: string; error?: string;
}) {
  return (
    <div className={`field-group ${className || ""}`}>
      <label>{label}{required && <span className="required">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={error ? "error" : ""}>
        <option value="">Bitte wählen</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function StepBetreiber({ data, setData, errors }: { data: FormData; setData: (d: FormData) => void; errors: Record<string, string> }) {
  const b = data.betreiber;
  const set = (field: string, value: string) => setData({ ...data, betreiber: { ...b, [field]: value } });

  return (
    <div className="form-card">
      <h2>Anlagenbetreiber</h2>
      <div className="field-grid">
        <SelectField label="Anrede" value={b.anrede} onChange={v => set("anrede", v)}
          options={[{ value: "Herr", label: "Herr" }, { value: "Frau", label: "Frau" }, { value: "Divers", label: "Divers" }, { value: "Firma", label: "Firma" }]} />
        <TextField label="Firma" value={b.firma} onChange={v => set("firma", v)} placeholder="optional" />
        <TextField label="Vorname" value={b.vorname} onChange={v => set("vorname", v)} required error={errors["vorname"]} />
        <TextField label="Nachname" value={b.nachname} onChange={v => set("nachname", v)} required error={errors["nachname"]} />
        <TextField label="Geburtsdatum" value={b.geburtsdatum} onChange={v => set("geburtsdatum", v)} type="date" />
        <div /> {/* spacer */}
        <TextField label="Straße" value={b.strasse} onChange={v => set("strasse", v)} required error={errors["strasse"]} />
        <TextField label="Hausnummer" value={b.hausNr} onChange={v => set("hausNr", v)} required error={errors["hausNr"]} />
        <TextField label="PLZ" value={b.plz} onChange={v => set("plz", v)} required error={errors["plz"]} placeholder="z.B. 77933" />
        <TextField label="Ort" value={b.ort} onChange={v => set("ort", v)} required error={errors["ort"]} />
        <TextField label="E-Mail" value={b.email} onChange={v => set("email", v)} required type="email" error={errors["email"]} />
        <TextField label="Telefon" value={b.telefon} onChange={v => set("telefon", v)} required error={errors["telefon"]} />
      </div>
    </div>
  );
}

function StepStandort({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  const s = data.standort;
  const set = (field: string, value: string | boolean) => setData({ ...data, standort: { ...s, [field]: value } });

  return (
    <div className="form-card">
      <h2>Standort der PV-Anlage</h2>
      <div className="checkbox-group">
        <input type="checkbox" id="standort-gleich" checked={!s.abweichend}
          onChange={e => set("abweichend", !e.target.checked)} />
        <label htmlFor="standort-gleich">Standort entspricht der Betreiberadresse</label>
      </div>
      {s.abweichend && (
        <div className="field-grid" style={{ marginTop: 16 }}>
          <TextField label="Straße" value={s.strasse} onChange={v => set("strasse", v)} required />
          <TextField label="Hausnummer" value={s.hausNr} onChange={v => set("hausNr", v)} required />
          <TextField label="PLZ" value={s.plz} onChange={v => set("plz", v)} required />
          <TextField label="Ort" value={s.ort} onChange={v => set("ort", v)} required />
        </div>
      )}
    </div>
  );
}

function StepPvWr({ data, setData, errors }: { data: FormData; setData: (d: FormData) => void; errors: Record<string, string> }) {
  const pv = data.pvModule;
  const wr = data.wechselrichter;
  const setPv = (field: string, value: string) => setData({ ...data, pvModule: { ...pv, [field]: value } });
  const setWr = (field: string, value: string | boolean) => setData({ ...data, wechselrichter: { ...wr, [field]: value } });

  return (
    <div className="form-card">
      <h2>PV-Module</h2>
      <div className="field-grid">
        <TextField label="Hersteller" value={pv.hersteller} onChange={v => setPv("hersteller", v)} required error={errors["pvHersteller"]} placeholder="z.B. JA Solar" />
        <TextField label="Modell" value={pv.modell} onChange={v => setPv("modell", v)} required error={errors["pvModell"]} placeholder="z.B. JAM54S30-410/MR" />
        <TextField label="Leistung pro Modul (Wp)" value={pv.leistungWp} onChange={v => setPv("leistungWp", v)} required type="number" error={errors["pvLeistung"]} placeholder="z.B. 410" />
        <TextField label="Anzahl Module" value={pv.anzahl} onChange={v => setPv("anzahl", v)} required type="number" error={errors["pvAnzahl"]} placeholder="z.B. 20" />
        <SelectField label="Ausrichtung" value={pv.ausrichtung} onChange={v => setPv("ausrichtung", v)}
          options={[{ value: "Süd", label: "Süd" }, { value: "Süd-West", label: "Süd-West" }, { value: "Süd-Ost", label: "Süd-Ost" }, { value: "West", label: "West" }, { value: "Ost", label: "Ost" }, { value: "Nord", label: "Nord" }]} />
        <TextField label="Neigung (Grad)" value={pv.neigung} onChange={v => setPv("neigung", v)} placeholder="z.B. 30" />
      </div>

      <h3>Wechselrichter</h3>
      <div className="field-grid">
        <TextField label="Hersteller" value={wr.hersteller} onChange={v => setWr("hersteller", v)} required error={errors["wrHersteller"]} placeholder="z.B. Huawei" />
        <TextField label="Modell" value={wr.modell} onChange={v => setWr("modell", v)} required error={errors["wrModell"]} placeholder="z.B. SUN2000-10KTL-M1" />
        <TextField label="Leistung (kVA)" value={wr.leistungKva} onChange={v => setWr("leistungKva", v)} required type="number" error={errors["wrLeistung"]} placeholder="z.B. 10" />
        <TextField label="Anzahl" value={wr.anzahl} onChange={v => setWr("anzahl", v)} required type="number" error={errors["wrAnzahl"]} placeholder="z.B. 1" />
        <div className="checkbox-group full-width">
          <input type="checkbox" id="wr-hybrid" checked={wr.hybrid}
            onChange={e => setWr("hybrid", e.target.checked)} />
          <label htmlFor="wr-hybrid">Hybrid-Wechselrichter</label>
        </div>
      </div>
    </div>
  );
}

function StepSpeicherWallbox({ data, setData }: { data: FormData; setData: (d: FormData) => void }) {
  const sp = data.speicher;
  const wb = data.wallbox;
  const setSp = (field: string, value: string | boolean) => setData({ ...data, speicher: { ...sp, [field]: value } });
  const setWb = (field: string, value: string | boolean) => setData({ ...data, wallbox: { ...wb, [field]: value } });

  return (
    <div className="form-card">
      <h2>Batteriespeicher (optional)</h2>
      <div className="checkbox-group">
        <input type="checkbox" id="sp-vorhanden" checked={sp.vorhanden}
          onChange={e => setSp("vorhanden", e.target.checked)} />
        <label htmlFor="sp-vorhanden">Batteriespeicher vorhanden</label>
      </div>
      {sp.vorhanden && (
        <div className="field-grid" style={{ marginTop: 12 }}>
          <TextField label="Hersteller" value={sp.hersteller} onChange={v => setSp("hersteller", v)} placeholder="z.B. BYD" />
          <TextField label="Modell" value={sp.modell} onChange={v => setSp("modell", v)} placeholder="z.B. HVS 10.2" />
          <TextField label="Kapazität (kWh)" value={sp.kapazitaetKwh} onChange={v => setSp("kapazitaetKwh", v)} type="number" placeholder="z.B. 10.2" />
          <TextField label="Anzahl" value={sp.anzahl} onChange={v => setSp("anzahl", v)} type="number" placeholder="z.B. 1" />
          <SelectField label="Kopplung" value={sp.kopplung} onChange={v => setSp("kopplung", v)}
            options={[{ value: "AC", label: "AC-gekoppelt" }, { value: "DC", label: "DC-gekoppelt" }]} />
        </div>
      )}

      <h3 style={{ marginTop: 28 }}>Wallbox / Ladestation (optional)</h3>
      <div className="checkbox-group">
        <input type="checkbox" id="wb-vorhanden" checked={wb.vorhanden}
          onChange={e => setWb("vorhanden", e.target.checked)} />
        <label htmlFor="wb-vorhanden">Wallbox vorhanden</label>
      </div>
      {wb.vorhanden && (
        <div className="field-grid" style={{ marginTop: 12 }}>
          <TextField label="Hersteller" value={wb.hersteller} onChange={v => setWb("hersteller", v)} />
          <TextField label="Modell" value={wb.modell} onChange={v => setWb("modell", v)} />
          <TextField label="Leistung (kW)" value={wb.leistungKw} onChange={v => setWb("leistungKw", v)} type="number" placeholder="z.B. 11" />
        </div>
      )}
    </div>
  );
}

function StepZaehler({ data, setData, errors }: { data: FormData; setData: (d: FormData) => void; errors: Record<string, string> }) {
  const z = data.zaehler;
  const setZ = (field: string, value: string) => setData({ ...data, zaehler: { ...z, [field]: value } });

  return (
    <div className="form-card">
      <h2>Zähler & Einspeiseart</h2>
      <div className="field-grid">
        <TextField label="Zählernummer" value={z.zaehlernummer} onChange={v => setZ("zaehlernummer", v)} placeholder="Falls bekannt" />
        <TextField label="Zählpunktbezeichnung (MaLo-ID)" value={z.maloId} onChange={v => setZ("maloId", v)} placeholder="DE00..." />
      </div>

      <h3>Einspeiseart</h3>
      <div className="field-grid">
        <SelectField label="Einspeiseart" value={data.einspeiseart} onChange={v => setData({ ...data, einspeiseart: v })} required
          error={errors["einspeiseart"]}
          options={[{ value: "Überschusseinspeisung", label: "Überschusseinspeisung" }, { value: "Volleinspeisung", label: "Volleinspeisung" }]} />
        <TextField label="Geplantes IBN-Datum" value={data.ibnDatum} onChange={v => setData({ ...data, ibnDatum: v })} type="date" />
      </div>
    </div>
  );
}

function StepSummary({ data, errors }: { data: FormData; errors: Record<string, string> }) {
  const b = data.betreiber;
  const pv = data.pvModule;
  const wr = data.wechselrichter;
  const totalKwp = ((parseFloat(pv.leistungWp) || 0) * (parseInt(pv.anzahl) || 0) / 1000).toFixed(2);

  return (
    <div className="form-card">
      <h2>Zusammenfassung</h2>

      <div className="summary-section">
        <h3>Betreiber</h3>
        <div className="summary-row"><span className="label">Name</span><span className="value">{b.anrede} {b.vorname} {b.nachname}</span></div>
        <div className="summary-row"><span className="label">Adresse</span><span className="value">{b.strasse} {b.hausNr}, {b.plz} {b.ort}</span></div>
        <div className="summary-row"><span className="label">E-Mail</span><span className="value">{b.email}</span></div>
        <div className="summary-row"><span className="label">Telefon</span><span className="value">{b.telefon}</span></div>
        {b.firma && <div className="summary-row"><span className="label">Firma</span><span className="value">{b.firma}</span></div>}
      </div>

      {data.standort.abweichend && (
        <div className="summary-section">
          <h3>Abweichender Standort</h3>
          <div className="summary-row"><span className="label">Adresse</span><span className="value">{data.standort.strasse} {data.standort.hausNr}, {data.standort.plz} {data.standort.ort}</span></div>
        </div>
      )}

      <div className="summary-section">
        <h3>PV-Anlage</h3>
        <div className="summary-row"><span className="label">Module</span><span className="value">{pv.anzahl}x {pv.hersteller} {pv.modell} ({pv.leistungWp} Wp)</span></div>
        <div className="summary-row"><span className="label">Gesamtleistung</span><span className="value">{totalKwp} kWp</span></div>
        {pv.ausrichtung && <div className="summary-row"><span className="label">Ausrichtung</span><span className="value">{pv.ausrichtung}</span></div>}
        <div className="summary-row"><span className="label">Wechselrichter</span><span className="value">{wr.anzahl}x {wr.hersteller} {wr.modell} ({wr.leistungKva} kVA)</span></div>
        {wr.hybrid && <div className="summary-row"><span className="label">Typ</span><span className="value">Hybrid</span></div>}
      </div>

      {data.speicher.vorhanden && (
        <div className="summary-section">
          <h3>Speicher</h3>
          <div className="summary-row"><span className="label">Modell</span><span className="value">{data.speicher.anzahl}x {data.speicher.hersteller} {data.speicher.modell}</span></div>
          {data.speicher.kapazitaetKwh && <div className="summary-row"><span className="label">Kapazität</span><span className="value">{data.speicher.kapazitaetKwh} kWh</span></div>}
          {data.speicher.kopplung && <div className="summary-row"><span className="label">Kopplung</span><span className="value">{data.speicher.kopplung}</span></div>}
        </div>
      )}

      {data.wallbox.vorhanden && (
        <div className="summary-section">
          <h3>Wallbox</h3>
          <div className="summary-row"><span className="label">Modell</span><span className="value">{data.wallbox.hersteller} {data.wallbox.modell}</span></div>
          {data.wallbox.leistungKw && <div className="summary-row"><span className="label">Leistung</span><span className="value">{data.wallbox.leistungKw} kW</span></div>}
        </div>
      )}

      <div className="summary-section">
        <h3>Einspeiseart & Zähler</h3>
        <div className="summary-row"><span className="label">Einspeiseart</span><span className="value">{data.einspeiseart}</span></div>
        {data.ibnDatum && <div className="summary-row"><span className="label">IBN-Datum</span><span className="value">{data.ibnDatum}</span></div>}
        {data.zaehler.zaehlernummer && <div className="summary-row"><span className="label">Zählernummer</span><span className="value">{data.zaehler.zaehlernummer}</span></div>}
        {data.zaehler.maloId && <div className="summary-row"><span className="label">MaLo-ID</span><span className="value">{data.zaehler.maloId}</span></div>}
      </div>

      {/* Zustimmungen werden im Parent gehandled */}
      {Object.keys(errors).length > 0 && (
        <div className="error-banner">
          Bitte korrigieren Sie die markierten Felder in den vorherigen Schritten.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PublicFormularPage() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load config
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_BASE}/formulare/public/${slug}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setConfig(res.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Validate current step
  const validateStep = useCallback((stepIndex: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepIndex === 0) {
      const b = data.betreiber;
      if (!b.vorname.trim()) errs["vorname"] = "Pflichtfeld";
      if (!b.nachname.trim()) errs["nachname"] = "Pflichtfeld";
      if (!b.strasse.trim()) errs["strasse"] = "Pflichtfeld";
      if (!b.hausNr.trim()) errs["hausNr"] = "Pflichtfeld";
      if (!b.plz.trim()) errs["plz"] = "Pflichtfeld";
      if (!b.ort.trim()) errs["ort"] = "Pflichtfeld";
      if (!b.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) errs["email"] = "Gültige E-Mail nötig";
      if (!b.telefon.trim()) errs["telefon"] = "Pflichtfeld";
    }

    if (stepIndex === 2) {
      const pv = data.pvModule;
      const wr = data.wechselrichter;
      if (!pv.hersteller.trim()) errs["pvHersteller"] = "Pflichtfeld";
      if (!pv.modell.trim()) errs["pvModell"] = "Pflichtfeld";
      if (!pv.leistungWp || parseFloat(pv.leistungWp) <= 0) errs["pvLeistung"] = "Wert > 0 nötig";
      if (!pv.anzahl || parseInt(pv.anzahl) <= 0) errs["pvAnzahl"] = "Wert > 0 nötig";
      if (!wr.hersteller.trim()) errs["wrHersteller"] = "Pflichtfeld";
      if (!wr.modell.trim()) errs["wrModell"] = "Pflichtfeld";
      if (!wr.leistungKva || parseFloat(wr.leistungKva) <= 0) errs["wrLeistung"] = "Wert > 0 nötig";
      if (!wr.anzahl || parseInt(wr.anzahl) <= 0) errs["wrAnzahl"] = "Wert > 0 nötig";
    }

    if (stepIndex === 4) {
      if (!data.einspeiseart) errs["einspeiseart"] = "Pflichtfeld";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [data]);

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    // Final validation on all steps
    for (let i = 0; i <= 4; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    if (!data.zustimmungen.vollmacht || !data.zustimmungen.datenschutz) {
      setSubmitError("Bitte stimmen Sie der Vollmacht und dem Datenschutz zu.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        betreiber: data.betreiber,
        standort: data.standort,
        pvModule: {
          ...data.pvModule,
          leistungWp: parseFloat(data.pvModule.leistungWp) || 0,
          anzahl: parseInt(data.pvModule.anzahl) || 0,
        },
        wechselrichter: {
          ...data.wechselrichter,
          leistungKva: parseFloat(data.wechselrichter.leistungKva) || 0,
          anzahl: parseInt(data.wechselrichter.anzahl) || 0,
        },
        speicher: data.speicher.vorhanden ? {
          ...data.speicher,
          kapazitaetKwh: parseFloat(data.speicher.kapazitaetKwh) || 0,
          anzahl: parseInt(data.speicher.anzahl) || 0,
        } : { vorhanden: false },
        wallbox: data.wallbox.vorhanden ? {
          ...data.wallbox,
          leistungKw: parseFloat(data.wallbox.leistungKw) || 0,
        } : { vorhanden: false },
        zaehler: data.zaehler,
        einspeiseart: data.einspeiseart,
        ibnDatum: data.ibnDatum || undefined,
        zustimmungen: data.zustimmungen,
        honeypot: data.honeypot,
      };

      const res = await fetch(`${API_BASE}/formulare/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setSubmitError("Zu viele Einreichungen. Bitte versuchen Sie es später erneut.");
        return;
      }

      const result = await res.json();
      if (!result.success) {
        setSubmitError(result.error || "Fehler beim Absenden");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="formular-page">
        <div className="loading-state">
          <div className="spinner" />
          <span style={{ color: "#94a3b8" }}>Formular wird geladen...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="formular-page">
        <div className="formular-container">
          <div className="form-card not-found">
            <h2>Formular nicht gefunden</h2>
            <p style={{ color: "#94a3b8" }}>Dieser Formular-Link ist ungültig oder wurde deaktiviert.</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="formular-page">
        <div className="formular-container">
          <div className="form-card success-card">
            <div className="success-icon">&#10003;</div>
            <h2>Erfolgreich eingereicht!</h2>
            <p>Ihre PV-Anlagen-Daten wurden erfolgreich übermittelt.</p>
            <p style={{ marginTop: 8 }}>Wir werden Ihre Anmeldung schnellstmöglich bearbeiten.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="formular-page">
      <div className="formular-container">
        {/* Header */}
        <div className="formular-header">
          <h1>{config?.title || "PV-Anlagen Anmeldung"}</h1>
          <div className="partner-name">Partner: {config?.kundeName}</div>
          {config?.welcomeText && (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: 8 }}>{config.welcomeText}</p>
          )}
          <a href={`${API_BASE}/formulare/public/${slug}/pdf`} className="pdf-link" target="_blank" rel="noopener noreferrer">
            &#128196; PDF herunterladen
          </a>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`progress-step ${i === step ? "active" : ""} ${i < step ? "completed" : ""}`}
              onClick={() => { if (i < step) { setErrors({}); setStep(i); } }}
              style={{ cursor: i < step ? "pointer" : "default" }}
            >
              <span className="step-num">{i < step ? "\u2713" : s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && <StepBetreiber data={data} setData={setData} errors={errors} />}
        {step === 1 && <StepStandort data={data} setData={setData} />}
        {step === 2 && <StepPvWr data={data} setData={setData} errors={errors} />}
        {step === 3 && <StepSpeicherWallbox data={data} setData={setData} />}
        {step === 4 && <StepZaehler data={data} setData={setData} errors={errors} />}
        {step === 5 && <StepSummary data={data} errors={errors} />}

        {/* Zustimmungen (nur im letzten Step) */}
        {step === 5 && (
          <div className="form-card" style={{ marginTop: 16 }}>
            <h2>Zustimmungen</h2>
            <div className="checkbox-group">
              <input type="checkbox" id="vollmacht" checked={data.zustimmungen.vollmacht}
                onChange={e => setData({ ...data, zustimmungen: { ...data.zustimmungen, vollmacht: e.target.checked } })} />
              <label htmlFor="vollmacht">Ich erteile Vollmacht zur Netzanmeldung meiner PV-Anlage <span className="required">*</span></label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="datenschutz" checked={data.zustimmungen.datenschutz}
                onChange={e => setData({ ...data, zustimmungen: { ...data.zustimmungen, datenschutz: e.target.checked } })} />
              <label htmlFor="datenschutz">Ich stimme der Datenschutzerklärung zu <span className="required">*</span></label>
            </div>
          </div>
        )}

        {/* Honeypot (unsichtbar) */}
        <input
          type="text"
          name="website"
          value={data.honeypot}
          onChange={e => setData({ ...data, honeypot: e.target.value })}
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Error Banner */}
        {submitError && <div className="error-banner" style={{ marginTop: 16 }}>{submitError}</div>}

        {/* Buttons */}
        <div className="form-buttons">
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={handleBack}>Zurück</button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>Weiter</button>
          ) : (
            <button
              className="btn btn-submit"
              onClick={handleSubmit}
              disabled={submitting || !data.zustimmungen.vollmacht || !data.zustimmungen.datenschutz}
            >
              {submitting ? "Wird gesendet..." : "Absenden"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
