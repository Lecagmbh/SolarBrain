/**
 * VDE-AR-N 4110 Formular-Generator
 *
 * Automatische PDF-Generierung für Mittelspannungs-Formulare:
 * - E.1  Antragstellung
 * - E.8  Datenblatt EZA/Speicher (5 Seiten)
 * - E.10 IBN-Protokoll (2 Seiten)
 *
 * Flow: Installation suchen → Daten prüfen → Unterschreiben → Generieren → Versenden
 */

import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { vde4110Api } from "../features/netzanmeldungen/services/api";
import { SignaturePad } from "../features/netzanmeldungen/components/SignaturePad";
import {
  Search,
  FileText,
  Check,
  CheckCircle2,
  Pen,
  Send,
  Download,
  Eye,
  Mail,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Edit3,
  X,
  FileCheck,
  Shield,
  Zap,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Step = "search" | "review" | "sign" | "generate" | "send";

interface VdeMeta {
  installationId: number;
  publicId: string;
  kundenName: string;
  nbEmail: string;
  nbName: string;
  hatSpeicher: boolean;
  vollmachtDoc: { id: number; name: string; url: string } | null;
  source?: string;
}

interface GeneratedDoc {
  type: string;
  filename: string;
  base64: string;
  documentId?: number;
}

const STEPS: { key: Step; label: string; icon: any }[] = [
  { key: "search", label: "Installation", icon: Search },
  { key: "review", label: "Daten prüfen", icon: FileText },
  { key: "sign", label: "Unterschrift", icon: Pen },
  { key: "generate", label: "Generieren", icon: FileCheck },
  { key: "send", label: "Versenden", icon: Send },
];

const FORMULAR_OPTIONS = [
  { key: "E1", label: "E.1 Antragstellung", required: true },
  { key: "E8", label: "E.8 Datenblatt EZA/Speicher (5 S.)", required: true },
  { key: "E10", label: "E.10 IBN-Protokoll (2 S.)", required: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE FIELD
// ═══════════════════════════════════════════════════════════════════════════

function EditableField({
  label, value, field, onEdit,
}: {
  label: string; value: string; field: string;
  onEdit: (field: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editing) {
    return (
      <div style={styles.fieldEditing}>
        <label style={styles.fieldLabel}>{label}</label>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onEdit(field, editValue); setEditing(false); }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            style={styles.input}
          />
          <button onClick={() => { onEdit(field, editValue); setEditing(false); }} style={styles.iconBtn}><Check size={12} /></button>
          <button onClick={() => setEditing(false)} style={styles.iconBtn}><X size={12} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.field} onClick={() => setEditing(true)}>
      <label style={styles.fieldLabel}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: value ? "#F1F5F9" : "#64748B", fontSize: "0.85rem" }}>
          {value || "nicht gesetzt"}
        </span>
        <Edit3 size={12} style={{ color: "#64748B", flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function VDE4110FormularePage() {
  const [step, setStep] = useState<Step>("search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [installationId, setInstallationId] = useState<number | null>(null);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [meta, setMeta] = useState<VdeMeta | null>(null);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [selectedFormulare, setSelectedFormulare] = useState<string[]>(["E1", "E8"]);

  const [signatur, setSignatur] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const [setId, setSetId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [attachVollmacht, setAttachVollmacht] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  const loadInstallation = useCallback(async (id: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vde4110Api.getData(id);
      if (!result.success) throw new Error("Daten konnten nicht geladen werden");

      setInstallationId(result.meta.installationId);
      setData(result.data);
      setMeta(result.meta);
      setEdits({});

      setSelectedFormulare(["E1", "E8"]);

      setEmailTo(result.meta.nbEmail || "");
      setEmailSubject(
        `Netzanmeldung MS ${result.meta.publicId} - ${result.meta.kundenName} - ${result.data.anlagenPlzOrt || ""}`
      );
      setEmailBody(
        `Sehr geehrte Damen und Herren,\n\nhiermit reichen wir die Unterlagen zur Netzanmeldung (Mittelspannung) ein:\n\n` +
        `Anlagenbetreiber: ${result.meta.kundenName}\n` +
        `Anschrift: ${result.data.anlagenStrasse || ""}, ${result.data.anlagenPlzOrt || ""}\n` +
        `Vorgangsnummer: ${result.meta.publicId}\n\n` +
        `Anbei die ausgefüllten VDE-AR-N 4110 Formulare sowie die Vollmacht des Anlagenbetreibers.\n\n` +
        `Mit freundlichen Grüßen\nBaunity\nSüdstraße 31\n47475 Kamp-Lintfort`
      );

      setStep("review");
    } catch (err: any) {
      setError(err.message || "Installation nicht gefunden");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) { setError("Bitte eine Installations-ID eingeben"); return; }
    const numId = parseInt(query);
    loadInstallation(numId > 0 ? numId : query);
  };

  const handleEdit = (field: string, value: string) => {
    setEdits((prev) => ({ ...prev, [field]: value }));
  };

  const getFieldValue = (field: string): string => {
    if (field in edits) return edits[field];
    return data?.[field] || "";
  };

  const toggleFormular = (key: string) => {
    setSelectedFormulare((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleSignatureSave = (base64: string) => {
    setSignatur(base64);
    setShowSignaturePad(false);
  };

  const handleGenerate = async () => {
    if (!installationId || !signatur) return;
    setLoading(true);
    setError(null);
    try {
      // Für Partner-Projekte: publicId als Query senden (nicht numerische ID)
      const createId = meta?.source === "partner_project" ? meta.publicId : installationId;
      const createResult = await vde4110Api.createSet(createId, [...selectedFormulare, "4110"], edits, meta?.source);
      if (!createResult.success) throw new Error("FormularSet konnte nicht erstellt werden");
      const newSetId = createResult.set.id;
      setSetId(newSetId);

      const signResult = await vde4110Api.sign(newSetId, signatur, meta?.vollmachtDoc?.id);
      if (!signResult.success) throw new Error("Signatur konnte nicht gespeichert werden");

      const genResult = await vde4110Api.generate(newSetId);
      if (!genResult.success) throw new Error("PDF-Generierung fehlgeschlagen");

      setDocuments(genResult.documents);
      setStep("generate");
    } catch (err: any) {
      setError(err.message || "Fehler bei der Generierung");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: GeneratedDoc) => {
    const blob = new Blob(
      [Uint8Array.from(atob(doc.base64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!setId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await vde4110Api.send(setId, { to: emailTo, subject: emailSubject, body: emailBody, attachVollmacht });
      if (!result.success) throw new Error("E-Mail-Versand fehlgeschlagen");
      setEmailSent(true);
      setStep("send");
    } catch (err: any) {
      setError(err.message || "E-Mail konnte nicht gesendet werden");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <>
      <style>{`
        :root {
          --vp-primary: #22C55E;
          --vp-primary-light: #4ADE80;
          --vp-secondary: #38BDF8;
          --vp-bg: #030014;
          --vp-surface: #0A0A1A;
          --vp-surface2: #111128;
          --vp-text: #F1F5F9;
          --vp-text-soft: #94A3B8;
          --vp-border: rgba(34, 197, 94, 0.15);
        }
        .vp-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .vp-page {
          font-family: 'Inter', sans-serif;
          background: var(--vp-bg);
          color: var(--vp-text);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .vp-page a { color: var(--vp-secondary); text-decoration: none; }
        .vp-bg-gradient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.10), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.06), transparent);
        }
        .vp-nav { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; width: calc(100% - 40px); max-width: 1100px; }
        .vp-nav-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          padding: 0.75rem 1.5rem; background: rgba(10, 10, 26, 0.92); backdrop-filter: blur(20px);
          border: 1px solid var(--vp-border); border-radius: 100px;
        }
        .vp-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        .vp-nav-logo-mark {
          width: 36px; height: 36px; background: linear-gradient(135deg, var(--vp-primary), var(--vp-secondary));
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; color: #fff;
        }
        .vp-nav-logo-name { font-weight: 600; font-size: 1rem; }
        .vp-nav-links { display: flex; align-items: center; gap: 2rem; }
        .vp-nav-link { font-size: 0.85rem; color: var(--vp-text-soft); }
        .vp-nav-btn {
          padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.85rem; font-weight: 600;
          background: linear-gradient(135deg, var(--vp-primary), #16A34A); color: #fff; border: none; cursor: pointer;
        }
        .vp-container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; position: relative; z-index: 1; }
        .vp-footer {
          padding: 3rem 1.5rem; margin-top: 4rem; text-align: center;
          border-top: 1px solid var(--vp-border); font-size: 0.8rem; color: var(--vp-text-soft);
        }
        .vp-footer a { color: var(--vp-primary-light); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .vp-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .vp-nav-links { display: none; }
        }
      `}</style>

      <div className="vp-page">
        <div className="vp-bg-gradient" />

        {/* Navigation */}
        <nav className="vp-nav">
          <div className="vp-nav-inner">
            <Link to="/" className="vp-nav-logo">
              <div className="vp-nav-logo-mark">GN</div>
              <span className="vp-nav-logo-name">Baunity</span>
            </Link>
            <div className="vp-nav-links">
              <Link to="/vde-formulare" className="vp-nav-link">VDE 4105</Link>
              <Link to="/login" className="vp-nav-btn">Portal</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: "130px 1.5rem 30px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "0.5rem 1rem",
            background: "rgba(34,197,94,0.1)", border: "1px solid var(--vp-border)",
            borderRadius: 100, fontSize: "0.8rem", color: "var(--vp-primary-light)", marginBottom: "1rem",
          }}>
            <Zap size={14} />
            VDE-AR-N 4110:2018-11 · TAR Mittelspannung
          </div>
          <h1 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "0.5rem",
            background: "linear-gradient(135deg, var(--vp-text), var(--vp-primary-light))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            VDE 4110 Formular-Generator
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--vp-text-soft)", maxWidth: 600, margin: "0 auto" }}>
            Automatische PDF-Generierung für Mittelspannungs-Netzanmeldungen.
            Installation eingeben, Daten prüfen, unterschreiben, versenden.
          </p>
        </section>

        {/* Wizard Container */}
        <section className="vp-container" style={{ paddingBottom: "2rem" }}>
          <div style={styles.wizard}>
            {/* Stepper */}
            <div style={styles.stepper}>
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = s.key === step;
                const isDone = i < stepIndex || (step === "send" && emailSent);
                return (
                  <div key={s.key} style={{
                    ...styles.stepItem,
                    ...(isActive ? styles.stepActive : {}),
                    ...(isDone ? styles.stepDone : {}),
                    cursor: isDone ? "pointer" : "default",
                  }} onClick={() => isDone && setStep(s.key)}>
                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    <span style={{ fontSize: "0.8rem" }}>{s.label}</span>
                    {i < STEPS.length - 1 && <ChevronRight size={14} style={{ color: "#475569" }} />}
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div style={styles.error}>
                <AlertCircle size={16} />
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError(null)} style={styles.iconBtn}><X size={14} /></button>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: "1.5rem" }}>

              {/* STEP 1: SEARCH */}
              {step === "search" && (
                <div>
                  <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Installation suchen</h2>
                  <p style={{ color: "var(--vp-text-soft)", marginBottom: 16, fontSize: "0.85rem" }}>
                    Geben Sie die Installations-ID ein, um die VDE-AR-N 4110 Formulare automatisch auszufüllen.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="z.B. 375 oder INST-IAS2T02M6"
                      autoFocus
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <button onClick={handleSearch} disabled={loading || !searchQuery.trim()} style={styles.btnPrimary}>
                      {loading ? <Loader2 size={16} className="vp-spin" /> : <Search size={16} />}
                      <span>Laden</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW */}
              {step === "review" && data && meta && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16 }}>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Anlagenanschrift</h3>
                      <EditableField label="Name" value={getFieldValue("anlagenName")} field="anlagenName" onEdit={handleEdit} />
                      <EditableField label="Straße" value={getFieldValue("anlagenStrasse")} field="anlagenStrasse" onEdit={handleEdit} />
                      <EditableField label="PLZ/Ort" value={getFieldValue("anlagenPlzOrt")} field="anlagenPlzOrt" onEdit={handleEdit} />
                      <EditableField label="Tel/Email" value={`${getFieldValue("anlagenTelefon")} / ${getFieldValue("anlagenEmail")}`} field="anlagenTelefon" onEdit={handleEdit} />
                    </div>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Anschlussnehmer</h3>
                      <EditableField label="Name" value={getFieldValue("eigentName")} field="eigentName" onEdit={handleEdit} />
                      <EditableField label="Straße" value={getFieldValue("eigentStrasse")} field="eigentStrasse" onEdit={handleEdit} />
                      <EditableField label="PLZ/Ort" value={getFieldValue("eigentPlzOrt")} field="eigentPlzOrt" onEdit={handleEdit} />
                    </div>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Anlagenerrichter</h3>
                      <EditableField label="Firma" value={getFieldValue("errichterFirma")} field="errichterFirma" onEdit={handleEdit} />
                      <EditableField label="Straße" value={getFieldValue("errichterStrasse")} field="errichterStrasse" onEdit={handleEdit} />
                      <EditableField label="PLZ/Ort" value={getFieldValue("errichterPlzOrt")} field="errichterPlzOrt" onEdit={handleEdit} />
                    </div>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Technische Daten</h3>
                      <EditableField label="P Amax (kW)" value={String(getFieldValue("pAmax") || 0)} field="pAmax" onEdit={handleEdit} />
                      <EditableField label="S Amax (kVA)" value={String(getFieldValue("sAmax") || 0)} field="sAmax" onEdit={handleEdit} />
                      <EditableField label="P Agen / kWp" value={String(getFieldValue("pAgen") || 0)} field="pAgen" onEdit={handleEdit} />
                      <EditableField label="WR Hersteller" value={getFieldValue("wrHersteller")} field="wrHersteller" onEdit={handleEdit} />
                      <EditableField label="WR Typ" value={getFieldValue("wrTyp")} field="wrTyp" onEdit={handleEdit} />
                      {meta.hatSpeicher && (
                        <>
                          <EditableField label="Speicher" value={`${getFieldValue("speicherHersteller")} ${getFieldValue("speicherTyp")}`} field="speicherHersteller" onEdit={handleEdit} />
                          <EditableField label="Kapazität kWh" value={String(getFieldValue("speicherKapazitaetKwh") || 0)} field="speicherKapazitaetKwh" onEdit={handleEdit} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Vollmacht */}
                  <div style={{
                    ...styles.vollmacht,
                    borderColor: meta.vollmachtDoc ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                    background: meta.vollmachtDoc ? "rgba(34,197,94,0.05)" : "rgba(245,158,11,0.05)",
                  }}>
                    <Shield size={16} />
                    {meta.vollmachtDoc ? (
                      <span>Vollmacht vorhanden: <strong>{meta.vollmachtDoc.name}</strong></span>
                    ) : (
                      <span><strong>Keine Vollmacht gefunden.</strong> Bitte hochladen.</span>
                    )}
                  </div>

                  {/* Formular-Auswahl */}
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>Formulare generieren</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {FORMULAR_OPTIONS.map((opt) => {
                        const selected = selectedFormulare.includes(opt.key);
                        return (
                          <label key={opt.key} style={{
                            ...styles.formOption,
                            borderColor: selected ? "var(--vp-primary)" : "var(--vp-border)",
                            background: selected ? "rgba(34,197,94,0.08)" : "transparent",
                          }}>
                            <input type="checkbox" checked={selected} onChange={() => toggleFormular(opt.key)} style={{ display: "none" }} />
                            {selected && <Check size={14} style={{ color: "var(--vp-primary)" }} />}
                            <span style={{ fontSize: "0.85rem" }}>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SIGN */}
              {step === "sign" && (
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                    <Shield size={20} style={{ color: "var(--vp-primary)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>Elektronische Unterschrift</h3>
                      <p style={{ color: "var(--vp-text-soft)", fontSize: "0.85rem" }}>
                        Die Unterschrift erfolgt für den Anschlussnehmer <strong>{meta?.kundenName}</strong> auf Basis der vorliegenden Vollmacht.
                      </p>
                    </div>
                  </div>

                  {signatur && !showSignaturePad ? (
                    <div style={{ textAlign: "center" }}>
                      <img src={signatur} alt="Signatur" style={{ maxWidth: 400, border: "1px solid var(--vp-border)", borderRadius: 8, padding: 8 }} />
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
                        <span style={{ color: "var(--vp-text-soft)", fontSize: "0.8rem" }}>
                          Kamp-Lintfort, {new Date().toLocaleDateString("de-DE")}
                        </span>
                        <button onClick={() => { setSignatur(null); setShowSignaturePad(true); }} style={styles.btnSecondary}>
                          Neu unterschreiben
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SignaturePad onSave={handleSignatureSave} onCancel={() => setShowSignaturePad(false)} width={500} height={180} />
                  )}
                </div>
              )}

              {/* STEP 4: GENERATE */}
              {step === "generate" && (
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                    <CheckCircle2 size={24} style={{ color: "var(--vp-primary)", flexShrink: 0 }} />
                    <div>
                      <h3 style={{ fontSize: "1rem" }}>{documents.length} PDF{documents.length !== 1 ? "s" : ""} generiert</h3>
                      <p style={{ color: "var(--vp-text-soft)", fontSize: "0.85rem" }}>
                        Die VDE-AR-N 4110 Formulare wurden erfolgreich erstellt.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {documents.map((doc) => (
                      <div key={doc.type} style={styles.docCard}>
                        <FileText size={20} style={{ color: "var(--vp-primary)" }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "0.85rem" }}>{doc.filename}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--vp-text-soft)" }}>{doc.type}</span>
                        </div>
                        <button onClick={() => {
                          const w = window.open();
                          if (w) w.document.write(`<iframe src="data:application/pdf;base64,${doc.base64}" width="100%" height="100%" style="border:none"></iframe>`);
                        }} style={styles.btnSecondary}><Eye size={14} /> Ansehen</button>
                        <button onClick={() => handleDownload(doc)} style={styles.btnSecondary}><Download size={14} /> Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: SEND */}
              {step === "send" && !emailSent && (
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Mail size={18} /> E-Mail an Netzbetreiber
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={styles.formLabel}>
                      <span>Empfänger</span>
                      <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} style={styles.input} />
                    </label>
                    <label style={styles.formLabel}>
                      <span>Betreff</span>
                      <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} style={styles.input} />
                    </label>
                    <label style={styles.formLabel}>
                      <span>Nachricht</span>
                      <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} style={{ ...styles.input, resize: "vertical" }} />
                    </label>
                    {meta?.vollmachtDoc && (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
                        <input type="checkbox" checked={attachVollmacht} onChange={(e) => setAttachVollmacht(e.target.checked)} />
                        Vollmacht beifügen ({meta.vollmachtDoc.name})
                      </label>
                    )}
                    <div style={{ fontSize: "0.8rem", color: "var(--vp-text-soft)" }}>
                      <strong>Anlagen:</strong> {documents.map(d => d.filename).join(", ")}
                      {attachVollmacht && meta?.vollmachtDoc && `, ${meta.vollmachtDoc.name}`}
                    </div>
                  </div>
                </div>
              )}

              {step === "send" && emailSent && (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <CheckCircle2 size={48} style={{ color: "var(--vp-primary)", marginBottom: 12 }} />
                  <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>Erfolgreich versendet!</h2>
                  <p style={{ color: "var(--vp-text-soft)" }}>
                    Die VDE-AR-N 4110 Formulare wurden an <strong>{emailTo}</strong> gesendet.
                  </p>
                  <p style={{ color: "var(--vp-text-soft)", fontSize: "0.85rem", marginTop: 8 }}>
                    {meta?.publicId} — {meta?.kundenName}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={styles.wizardFooter}>
              {step !== "search" && !(step === "send" && emailSent) && (
                <button style={styles.btnSecondary} onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].key)} disabled={loading}>
                  <ChevronLeft size={16} /> Zurück
                </button>
              )}
              <div style={{ flex: 1 }} />

              {step === "review" && (
                <button style={styles.btnPrimary} onClick={() => setStep("sign")} disabled={selectedFormulare.length === 0}>
                  Weiter zur Unterschrift <ChevronRight size={16} />
                </button>
              )}
              {step === "sign" && (
                <button style={styles.btnPrimary} onClick={handleGenerate} disabled={!signatur || loading}>
                  {loading ? <Loader2 size={16} className="vp-spin" /> : <FileCheck size={16} />}
                  PDFs generieren
                </button>
              )}
              {step === "generate" && (
                <button style={styles.btnPrimary} onClick={() => setStep("send")}>
                  <Mail size={16} /> Weiter zum Versand
                </button>
              )}
              {step === "send" && !emailSent && (
                <button style={styles.btnPrimary} onClick={handleSendEmail} disabled={!emailTo || loading}>
                  {loading ? <Loader2 size={16} className="vp-spin" /> : <Send size={16} />}
                  E-Mail senden
                </button>
              )}
              {step === "send" && emailSent && (
                <button style={styles.btnPrimary} onClick={() => {
                  setStep("search"); setData(null); setMeta(null); setSignatur(null);
                  setDocuments([]); setSetId(null); setEmailSent(false); setSearchQuery(""); setEdits({});
                }}>
                  Nächste Installation
                </button>
              )}
            </div>
          </div>

          {/* Download-Link */}
          <div style={{
            padding: "1.5rem", marginTop: "1.5rem",
            background: "var(--vp-surface)", border: "1px solid var(--vp-border)", borderRadius: 16,
          }}>
            <h3 style={{ fontSize: "1rem", color: "var(--vp-primary-light)", marginBottom: 8 }}>PDF-Vorlage herunterladen</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--vp-text-soft)", marginBottom: 8 }}>
              Das vollständige VDE-AR-N 4110 Formular-Set (alle 17 Formulare, 38 Seiten) als leeres PDF zum manuellen Ausfüllen.
            </p>
            <a href="/vde-ar-n-4110-formulare.pdf" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--vp-secondary)", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Download size={14} /> Alle Formulare als PDF (1,9 MB)
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="vp-footer">
          <div className="vp-container">
            <p>
              Baunity · Südstraße 31 · 47475 Kamp-Lintfort · <a href="mailto:info@baunity.de">info@baunity.de</a>
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              <Link to="/impressum">Impressum</Link> · <Link to="/datenschutz">Datenschutz</Link> · <Link to="/agb">AGB</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  wizard: {
    background: "var(--vp-surface)",
    border: "1px solid var(--vp-border)",
    borderRadius: 16,
    overflow: "hidden",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "12px 16px",
    background: "var(--vp-surface2)",
    borderBottom: "1px solid var(--vp-border)",
    overflowX: "auto",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 8,
    color: "var(--vp-text-soft)",
    whiteSpace: "nowrap",
    fontSize: "0.8rem",
    transition: "all 0.2s",
  },
  stepActive: {
    background: "rgba(34,197,94,0.12)",
    color: "var(--vp-primary-light)",
  },
  stepDone: {
    color: "var(--vp-primary)",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    margin: "12px 16px 0",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    color: "#FCA5A5",
    fontSize: "0.85rem",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--vp-border)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "var(--vp-text)",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    background: "linear-gradient(135deg, var(--vp-primary), #16A34A)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    background: "rgba(255,255,255,0.05)",
    color: "var(--vp-text)",
    border: "1px solid var(--vp-border)",
    borderRadius: 8,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--vp-border)",
    borderRadius: 6,
    color: "var(--vp-text)",
    cursor: "pointer",
  },
  section: {
    padding: 14,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--vp-border)",
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: 8,
    color: "var(--vp-primary-light)",
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer",
  },
  fieldEditing: {
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  fieldLabel: {
    fontSize: "0.75rem",
    color: "var(--vp-text-soft)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 2,
  },
  vollmacht: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid",
    fontSize: "0.85rem",
  },
  formOption: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  docCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--vp-border)",
    borderRadius: 10,
  },
  formLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    fontSize: "0.85rem",
  },
  wizardFooter: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderTop: "1px solid var(--vp-border)",
    background: "var(--vp-surface2)",
  },
};
