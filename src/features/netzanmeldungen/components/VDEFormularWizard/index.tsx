/**
 * VDE FORMULAR WIZARD
 * ===================
 * Eigenständige Seite für NB-konforme VDE-Formulare.
 *
 * Flow:
 * 1. Installations-ID eingeben → Daten automatisch laden
 * 2. Daten prüfen & ggf. editieren
 * 3. Installateur unterschreibt (mit Verweis auf Vollmacht)
 * 4. PDFs generieren & Vorschau
 * 5. E-Mail an NB zusammenstellen & senden
 */

import { useState, useCallback, useEffect } from "react";
import { vdeFormularApi } from "../../services/api";
import { SignaturePad } from "../SignaturePad";
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
} from "lucide-react";
import "./styles.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Step = "search" | "review" | "sign" | "generate" | "send";

interface VdeData {
  [key: string]: any;
}

interface VdeMeta {
  installationId: number;
  publicId: string;
  kundenName: string;
  nbEmail: string;
  nbName: string;
  hatSpeicher: boolean;
  vollmachtDoc: { id: number; name: string; url: string } | null;
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
  { key: "E2", label: "E.2 Datenblatt Erzeugungsanlagen", required: true },
  { key: "E3", label: "E.3 Datenblatt Speicher", requiresSpeicher: true },
  { key: "E8", label: "E.8 Inbetriebsetzungsprotokoll", required: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// EDITABLE FIELD
// ═══════════════════════════════════════════════════════════════════════════

function EditableField({
  label,
  value,
  field,
  onEdit,
}: {
  label: string;
  value: string;
  field: string;
  onEdit: (field: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editing) {
    return (
      <div className="vde-field vde-field--editing">
        <label>{label}</label>
        <div className="vde-field__edit">
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit(field, editValue);
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
          <button onClick={() => { onEdit(field, editValue); setEditing(false); }}>
            <Check size={12} />
          </button>
          <button onClick={() => setEditing(false)}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vde-field" onClick={() => setEditing(true)}>
      <label>{label}</label>
      <span>{value || <em className="vde-field__empty">nicht gesetzt</em>}</span>
      <Edit3 size={12} className="vde-field__edit-icon" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface VDEFormularWizardProps {
  initialInstallationId?: number;
  onClose?: () => void;
  isModal?: boolean;
}

export function VDEFormularWizard({ initialInstallationId, onClose, isModal }: VDEFormularWizardProps) {
  const [step, setStep] = useState<Step>(initialInstallationId ? "review" : "search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState(initialInstallationId?.toString() || "");

  // Data
  const [installationId, setInstallationId] = useState<number | null>(initialInstallationId || null);
  const [data, setData] = useState<VdeData | null>(null);
  const [meta, setMeta] = useState<VdeMeta | null>(null);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [selectedFormulare, setSelectedFormulare] = useState<string[]>(["E1", "E2", "E8"]);

  // Signature
  const [signatur, setSignatur] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Generated
  const [setId, setSetId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [attachVollmacht, setAttachVollmacht] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  // Auto-load wenn initialInstallationId gegeben
  useEffect(() => {
    if (initialInstallationId) {
      loadInstallation(initialInstallationId);
    }
  }, [initialInstallationId]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const loadInstallation = useCallback(async (id: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vdeFormularApi.getData(id);
      if (!result.success) throw new Error("Daten konnten nicht geladen werden");

      setInstallationId(result.meta.installationId);
      setData(result.data);
      setMeta(result.meta);
      setEdits({});

      // E3 nur wenn Speicher vorhanden
      if (result.meta.hatSpeicher) {
        setSelectedFormulare(["E1", "E2", "E3", "E8"]);
      } else {
        setSelectedFormulare(["E1", "E2", "E8"]);
      }

      // E-Mail-Defaults setzen
      setEmailTo(result.meta.nbEmail || "");
      setEmailSubject(
        `Netzanmeldung ${result.meta.publicId} - ${result.meta.kundenName} - ${result.data.anlagenPlzOrt || ""}`
      );
      setEmailBody(
        `Sehr geehrte Damen und Herren,\n\nhiermit reichen wir die Unterlagen zur Netzanmeldung ein:\n\n` +
        `Anlagenbetreiber: ${result.meta.kundenName}\n` +
        `Anschrift: ${result.data.anlagenStrasse || ""}, ${result.data.anlagenPlzOrt || ""}\n` +
        `Vorgangsnummer: ${result.meta.publicId}\n\n` +
        `Anbei die ausgefüllten VDE-AR-N 4105 Formulare sowie die Vollmacht des Anlagenbetreibers.\n\n` +
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
    if (!query) {
      setError("Bitte eine Installations-ID eingeben");
      return;
    }
    // Numerische ID oder Public-ID (z.B. "INST-0QY4JLYKG") - beides direkt ans Backend
    const numId = parseInt(query);
    if (numId > 0) {
      loadInstallation(numId);
    } else {
      loadInstallation(query);
    }
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
      // 1. FormularSet erstellen
      const createResult = await vdeFormularApi.createSet(installationId, selectedFormulare, edits);
      if (!createResult.success) throw new Error("FormularSet konnte nicht erstellt werden");
      const newSetId = createResult.set.id;
      setSetId(newSetId);

      // 2. Signatur speichern
      const signResult = await vdeFormularApi.sign(
        newSetId,
        signatur,
        meta?.vollmachtDoc?.id
      );
      if (!signResult.success) throw new Error("Signatur konnte nicht gespeichert werden");

      // 3. PDFs generieren
      const genResult = await vdeFormularApi.generate(newSetId);
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
    const { downloadBase64File } = await import("@/utils/desktopDownload");
    await downloadBase64File(doc.filename, doc.base64, 'pdf');
  };

  const handleDownloadAll = async () => {
    for (const doc of documents) { await handleDownload(doc); }
  };

  const handleSendEmail = async () => {
    if (!setId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await vdeFormularApi.send(setId, {
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        attachVollmacht,
      });
      if (!result.success) throw new Error("E-Mail-Versand fehlgeschlagen");
      setEmailSent(true);
      setStep("send");
    } catch (err: any) {
      setError(err.message || "E-Mail konnte nicht gesendet werden");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // STEP NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canGoNext = (): boolean => {
    switch (step) {
      case "search": return !!data;
      case "review": return !!data && selectedFormulare.length > 0;
      case "sign": return !!signatur;
      case "generate": return documents.length > 0;
      default: return false;
    }
  };

  const goNext = () => {
    if (step === "review" && !signatur) {
      setStep("sign");
    } else if (step === "sign" && signatur) {
      handleGenerate();
    } else if (step === "generate") {
      setStep("send");
    }
  };

  const goPrev = () => {
    const idx = stepIndex;
    if (idx > 0) {
      setStep(STEPS[idx - 1].key);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={`vde-wizard ${isModal ? "vde-wizard--modal" : ""}`}>
      {/* HEADER */}
      <div className="vde-wizard__header">
        <div className="vde-wizard__title">
          <FileText size={20} />
          <span>VDE-AR-N 4105 Formulare</span>
          {meta && <span className="vde-wizard__badge">{meta.publicId}</span>}
        </div>
        {onClose && (
          <button className="vde-wizard__close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* STEPPER */}
      <div className="vde-stepper">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.key === step;
          const isDone = i < stepIndex || (step === "send" && emailSent);
          return (
            <div
              key={s.key}
              className={`vde-step ${isActive ? "vde-step--active" : ""} ${isDone ? "vde-step--done" : ""}`}
              onClick={() => isDone && setStep(s.key)}
            >
              <div className="vde-step__icon">
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className="vde-step__label">{s.label}</span>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="vde-step__arrow" />}
            </div>
          );
        })}
      </div>

      {/* ERROR */}
      {error && (
        <div className="vde-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* CONTENT */}
      <div className="vde-content">
        {/* ────────────── STEP 1: SEARCH ────────────── */}
        {step === "search" && (
          <div className="vde-search">
            <h2>Installation suchen</h2>
            <p>Geben Sie die Installations-ID oder Public-ID ein, um die VDE-Formulare automatisch auszufüllen.</p>
            <div className="vde-search__input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="z.B. 375 oder INST-IAS2T02M6"
                autoFocus
              />
              <button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                {loading ? <Loader2 size={16} className="vde-spin" /> : <Search size={16} />}
                Laden
              </button>
            </div>
          </div>
        )}

        {/* ────────────── STEP 2: REVIEW ────────────── */}
        {step === "review" && data && meta && (
          <div className="vde-review">
            <div className="vde-review__grid">
              {/* Anlage */}
              <div className="vde-section">
                <h3>Anlagenanschrift</h3>
                <EditableField label="Name" value={getFieldValue("anlagenName")} field="anlagenName" onEdit={handleEdit} />
                <EditableField label="Straße" value={getFieldValue("anlagenStrasse")} field="anlagenStrasse" onEdit={handleEdit} />
                <EditableField label="PLZ/Ort" value={getFieldValue("anlagenPlzOrt")} field="anlagenPlzOrt" onEdit={handleEdit} />
                <EditableField label="Tel/Email" value={`${getFieldValue("anlagenTelefon")} / ${getFieldValue("anlagenEmail")}`} field="anlagenTelefon" onEdit={handleEdit} />
              </div>

              {/* Eigentümer */}
              <div className="vde-section">
                <h3>Anschlussnehmer / Eigentümer</h3>
                <EditableField label="Name" value={getFieldValue("eigentName")} field="eigentName" onEdit={handleEdit} />
                <EditableField label="Straße" value={getFieldValue("eigentStrasse")} field="eigentStrasse" onEdit={handleEdit} />
                <EditableField label="PLZ/Ort" value={getFieldValue("eigentPlzOrt")} field="eigentPlzOrt" onEdit={handleEdit} />
              </div>

              {/* Errichter */}
              <div className="vde-section">
                <h3>Anlagenerrichter (LeCa)</h3>
                <EditableField label="Firma" value={getFieldValue("errichterFirma")} field="errichterFirma" onEdit={handleEdit} />
                <EditableField label="Straße" value={getFieldValue("errichterStrasse")} field="errichterStrasse" onEdit={handleEdit} />
                <EditableField label="PLZ/Ort" value={getFieldValue("errichterPlzOrt")} field="errichterPlzOrt" onEdit={handleEdit} />
                <EditableField label="Eintragung" value={getFieldValue("errichterEintragungsnr")} field="errichterEintragungsnr" onEdit={handleEdit} />
              </div>

              {/* Technik */}
              <div className="vde-section">
                <h3>Technische Daten</h3>
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

            {/* Vollmacht-Status */}
            <div className={`vde-vollmacht ${meta.vollmachtDoc ? "vde-vollmacht--found" : "vde-vollmacht--missing"}`}>
              <Shield size={16} />
              {meta.vollmachtDoc ? (
                <span>
                  Vollmacht vorhanden: <strong>{meta.vollmachtDoc.name}</strong> — Unterschrift erfolgt auf Basis der Vollmacht
                </span>
              ) : (
                <span>
                  <strong>Keine Vollmacht gefunden.</strong> Bitte laden Sie die Vollmacht des Kunden hoch, bevor Sie die Formulare einreichen.
                </span>
              )}
            </div>

            {/* Formular-Auswahl */}
            <div className="vde-formulare-select">
              <h3>Formulare generieren</h3>
              <div className="vde-formulare-options">
                {FORMULAR_OPTIONS.map((opt) => {
                  if (opt.requiresSpeicher && !meta.hatSpeicher) return null;
                  const selected = selectedFormulare.includes(opt.key);
                  return (
                    <label key={opt.key} className={`vde-formular-option ${selected ? "vde-formular-option--selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleFormular(opt.key)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ────────────── STEP 3: SIGN ────────────── */}
        {step === "sign" && (
          <div className="vde-sign">
            <div className="vde-sign__info">
              <Shield size={20} />
              <div>
                <h3>Elektronische Unterschrift</h3>
                <p>
                  Ich bestätige als Anlagenerrichter (LeCa GmbH & Co KG) die Richtigkeit der Angaben.
                  Die Unterschrift erfolgt für den Anschlussnehmer <strong>{meta?.kundenName}</strong> auf
                  Basis der vorliegenden Vollmacht.
                </p>
              </div>
            </div>

            {signatur && !showSignaturePad ? (
              <div className="vde-sign__preview">
                <img src={signatur} alt="Signatur" />
                <div className="vde-sign__preview-actions">
                  <span className="vde-sign__datum">
                    Lahr, {new Date().toLocaleDateString("de-DE")}
                  </span>
                  <button onClick={() => { setSignatur(null); setShowSignaturePad(true); }}>
                    Neu unterschreiben
                  </button>
                </div>
              </div>
            ) : (
              <SignaturePad
                onSave={handleSignatureSave}
                onCancel={() => setShowSignaturePad(false)}
                width={500}
                height={180}
              />
            )}
          </div>
        )}

        {/* ────────────── STEP 4: GENERATE ────────────── */}
        {step === "generate" && (
          <div className="vde-generate">
            <div className="vde-generate__header">
              <CheckCircle2 size={24} className="vde-generate__success-icon" />
              <div>
                <h3>{documents.length} PDF{documents.length !== 1 ? "s" : ""} generiert</h3>
                <p>Die VDE-Formulare wurden erfolgreich erstellt und in der Installation gespeichert.</p>
              </div>
            </div>

            <div className="vde-documents">
              {documents.map((doc) => (
                <div key={doc.type} className="vde-doc">
                  <FileText size={20} />
                  <div className="vde-doc__info">
                    <strong>{doc.filename}</strong>
                    <span>{doc.type}</span>
                  </div>
                  <div className="vde-doc__actions">
                    <button onClick={() => {
                      const w = window.open();
                      if (w) {
                        w.document.write(`<iframe src="data:application/pdf;base64,${doc.base64}" width="100%" height="100%" style="border:none"></iframe>`);
                      }
                    }}>
                      <Eye size={14} /> Ansehen
                    </button>
                    <button onClick={() => handleDownload(doc)}>
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="vde-btn vde-btn--secondary" onClick={handleDownloadAll}>
              <Download size={16} /> Alle herunterladen
            </button>
          </div>
        )}

        {/* ────────────── STEP 5: SEND ────────────── */}
        {step === "send" && !emailSent && (
          <div className="vde-send">
            <h3>
              <Mail size={18} /> E-Mail an Netzbetreiber
            </h3>
            <p>
              Senden Sie die VDE-Formulare direkt an <strong>{meta?.nbName || "den Netzbetreiber"}</strong>.
            </p>

            <div className="vde-send__form">
              <label>
                <span>Empfänger</span>
                <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="nb@example.de" />
              </label>
              <label>
                <span>Betreff</span>
                <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </label>
              <label>
                <span>Nachricht</span>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                />
              </label>

              {meta?.vollmachtDoc && (
                <label className="vde-send__checkbox">
                  <input type="checkbox" checked={attachVollmacht} onChange={(e) => setAttachVollmacht(e.target.checked)} />
                  <span>Vollmacht als Anlage beifügen ({meta.vollmachtDoc.name})</span>
                </label>
              )}

              <div className="vde-send__attachments">
                <strong>Anlagen:</strong>
                <ul>
                  {documents.map((d) => (
                    <li key={d.type}>{d.filename}</li>
                  ))}
                  {attachVollmacht && meta?.vollmachtDoc && (
                    <li>{meta.vollmachtDoc.name}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === "send" && emailSent && (
          <div className="vde-done">
            <CheckCircle2 size={48} className="vde-done__icon" />
            <h2>Erfolgreich versendet!</h2>
            <p>
              Die VDE-Formulare wurden an <strong>{emailTo}</strong> gesendet.
            </p>
            <p className="vde-done__sub">
              Installation: {meta?.publicId} — {meta?.kundenName}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="vde-wizard__footer">
        {step !== "search" && !(step === "send" && emailSent) && (
          <button className="vde-btn" onClick={goPrev} disabled={loading}>
            <ChevronLeft size={16} /> Zurück
          </button>
        )}
        <div style={{ flex: 1 }} />

        {step === "review" && (
          <button className="vde-btn vde-btn--primary" onClick={() => setStep("sign")} disabled={selectedFormulare.length === 0}>
            Weiter zur Unterschrift <ChevronRight size={16} />
          </button>
        )}

        {step === "sign" && (
          <button className="vde-btn vde-btn--primary" onClick={handleGenerate} disabled={!signatur || loading}>
            {loading ? <Loader2 size={16} className="vde-spin" /> : <FileCheck size={16} />}
            PDFs generieren
          </button>
        )}

        {step === "generate" && (
          <button className="vde-btn vde-btn--primary" onClick={() => setStep("send")}>
            <Mail size={16} /> Weiter zum Versand
          </button>
        )}

        {step === "send" && !emailSent && (
          <button className="vde-btn vde-btn--primary" onClick={handleSendEmail} disabled={!emailTo || loading}>
            {loading ? <Loader2 size={16} className="vde-spin" /> : <Send size={16} />}
            E-Mail senden
          </button>
        )}

        {step === "send" && emailSent && (
          <button className="vde-btn vde-btn--primary" onClick={() => {
            // Reset für nächste Installation
            setStep("search");
            setData(null);
            setMeta(null);
            setSignatur(null);
            setDocuments([]);
            setSetId(null);
            setEmailSent(false);
            setSearchQuery("");
            setEdits({});
          }}>
            Nächste Installation
          </button>
        )}
      </div>
    </div>
  );
}

export default VDEFormularWizard;
