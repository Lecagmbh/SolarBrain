/**
 * VDE GENERATOR MODAL - PREMIUM VERSION
 * =====================================
 * AI-powered extraction + Premium PDF Generation
 * Features:
 * - AI Datenextraktion aus Datenblättern
 * - Premium VDE Formulare (E.1, E.2, E.3, E.8)
 * - Digitale Signatur
 * - Firmenstempel
 * - E-Mail Versand
 */

import { useState, useRef } from "react";
import {
  X, Upload, FileText, Loader2, Check, ChevronRight, ChevronLeft,
  Mail, Download, Zap, Battery, Edit3, Send, Pen,
  Stamp, Eye,
} from "lucide-react";
import { vdeGeneratorApi } from "../../services/api";
import { SignaturePad } from "../SignaturePad";
import type { InstallationDetail } from "../../types";
import "./styles.css";

interface VDEGeneratorModalProps {
  installation: InstallationDetail;
  onClose: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

interface StorageData {
  hersteller: string;
  modell: string;
  kapazitaetKwh: number;
  maxEntladeleistungKw: number;
  maxLadeleistungKw: number;
  scheinleistungKva: number;
  batterietechnologie: string;
  batteriespannungV: number;
  kopplung: "AC" | "DC";
  notstromfaehig: boolean;
  schwarzstartfaehig: boolean;
  wirkungsgradProzent: number;
  zertifikate: string[];
  confidence: number;
  extractionNotes: string[];
}

interface GeneratedDoc {
  name: string;
  type: string;
  base64: string;
  filename: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

type Step = "upload" | "review" | "signature" | "generate" | "email" | "done";

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: "upload", label: "Datenblatt", icon: Upload },
  { id: "review", label: "Prüfen", icon: Edit3 },
  { id: "signature", label: "Signatur", icon: Pen },
  { id: "generate", label: "Generieren", icon: FileText },
  { id: "email", label: "Versenden", icon: Mail },
  { id: "done", label: "Fertig", icon: Check },
];

function getEmptyStorageData(): StorageData {
  return {
    hersteller: "",
    modell: "",
    kapazitaetKwh: 10,
    maxEntladeleistungKw: 5,
    maxLadeleistungKw: 5,
    scheinleistungKva: 5,
    batterietechnologie: "Lithium-Eisenphosphat (LiFePO4)",
    batteriespannungV: 48,
    kopplung: "DC",
    notstromfaehig: false,
    schwarzstartfaehig: false,
    wirkungsgradProzent: 94,
    zertifikate: ["VDE-AR-N 4105"],
    confidence: 1,
    extractionNotes: ["Manuelle Eingabe"],
  };
}

export function VDEGeneratorModal({ installation, onClose, showToast }: VDEGeneratorModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [documents, setDocuments] = useState<GeneratedDoc[]>([]);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [signature, setSignature] = useState<string | null>(null);
  const [useStempel, setUseStempel] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDoc | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  // Handle file upload and extraction
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);

    try {
      const result = await vdeGeneratorApi.extract(selectedFile);
      if (result.success && result.data) {
        setStorageData(result.data);
        setProvider(result.provider || "");
        setStep("review");
        showToast(`Daten extrahiert mit ${result.provider?.toUpperCase() || "AI"}`, "success");
      } else {
        showToast("KI-Extraktion nicht verfügbar. Bitte manuell eingeben.", "error");
        setStorageData(getEmptyStorageData());
        setStep("review");
      }
    } catch (err: any) {
      showToast("KI-Extraktion fehlgeschlagen. Bitte manuell eingeben.", "error");
      setStorageData(getEmptyStorageData());
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  // Skip to manual input
  const handleManualInput = () => {
    setStorageData(getEmptyStorageData());
    setStep("review");
  };

  // Handle signature save
  const handleSignatureSave = (signatureBase64: string) => {
    setSignature(signatureBase64);
    setShowSignaturePad(false);
    showToast("Unterschrift gespeichert", "success");
  };

  // Generate VDE documents
  const handleGenerate = async () => {
    if (!storageData) return;
    setLoading(true);
    setStep("generate");

    try {
      const result = await vdeGeneratorApi.generate(installation.id, {
        file: file || undefined,
        manualData: {
          ...storageData,
          signature: signature,
          useStempel: useStempel,
        },
      });

      if (result.success && result.documents) {
        setDocuments(result.documents as GeneratedDoc[]);
        setEmailData(result.email || null);
        setStep("email");
        showToast("VDE-Formulare generiert!", "success");
      } else {
        showToast(result.error || "Fehler bei der Generierung", "error");
        setStep("signature");
      }
    } catch (err: any) {
      showToast(err.message || "Generierung fehlgeschlagen", "error");
      setStep("signature");
    } finally {
      setLoading(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!emailData) return;
    setLoading(true);

    try {
      const result = await vdeGeneratorApi.sendEmail(installation.id, {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        attachments: documents.map((d) => ({ filename: d.filename, content: d.base64 })),
      });

      if (result.success) {
        setStep("done");
        showToast("E-Mail gesendet!", "success");
      } else {
        showToast(result.error || "E-Mail konnte nicht gesendet werden", "error");
      }
    } catch (err: any) {
      showToast(err.message || "E-Mail-Versand fehlgeschlagen", "error");
    } finally {
      setLoading(false);
    }
  };

  // Download single document
  const handleDownload = async (doc: GeneratedDoc) => {
    const { downloadBase64File } = await import("@/utils/desktopDownload");
    await downloadBase64File(doc.filename, doc.base64, 'pdf');
  };

  // Download all
  const handleDownloadAll = async () => {
    for (const doc of documents) { await handleDownload(doc); }
    showToast("Alle Dokumente heruntergeladen", "success");
  };

  return (
    <div className="vde-modal-overlay" onClick={onClose}>
      <div className="vde-modal vde-modal--large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vde-modal__header">
          <div className="vde-modal__title">
            <Battery size={20} />
            <span>VDE Generator</span>
            <span className="vde-modal__badge">Premium</span>
            <span className="vde-modal__subtitle">– {installation.customerName}</span>
          </div>
          <button className="vde-btn vde-btn--icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="vde-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`vde-step ${i <= currentStepIndex ? "vde-step--active" : ""} ${i < currentStepIndex ? "vde-step--done" : ""}`}>
              <div className="vde-step__icon">
                {i < currentStepIndex ? <Check size={14} /> : <s.icon size={14} />}
              </div>
              <span className="vde-step__label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="vde-step__line" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="vde-modal__content">
          {/* UPLOAD STEP */}
          {step === "upload" && (
            <div className="vde-upload">
              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} hidden />
              
              <div className="vde-upload__dropzone" onClick={() => fileInputRef.current?.click()}>
                {loading ? (
                  <>
                    <Loader2 size={48} className="vde-spin" />
                    <p>Analysiere Datenblatt mit KI...</p>
                    <span>GPT-4o Vision / Claude Sonnet</span>
                  </>
                ) : (
                  <>
                    <Upload size={48} />
                    <p>Speicher-Datenblatt hochladen</p>
                    <span>PDF oder Bild (PNG, JPG)</span>
                  </>
                )}
              </div>

              <div className="vde-divider"><span>oder</span></div>

              <button className="vde-btn vde-btn--secondary vde-btn--full" onClick={handleManualInput}>
                <Edit3 size={16} />
                Manuell eingeben
              </button>

              <div className="vde-info">
                <Zap size={16} />
                <div>
                  <strong>KI-Extraktion</strong>
                  <span>Extrahiert automatisch alle technischen Daten aus dem Datenblatt.</span>
                </div>
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === "review" && storageData && (
            <div className="vde-review">
              {storageData.confidence < 1 && (
                <div className="vde-confidence" style={{ "--conf": storageData.confidence } as any}>
                  <Zap size={16} />
                  <span>KI-Konfidenz: {(storageData.confidence * 100).toFixed(0)}%</span>
                  {provider && <span className="vde-provider">via {provider.toUpperCase()}</span>}
                </div>
              )}

              <div className="vde-form">
                <h4 className="vde-form__section">Speichersystem</h4>
                <div className="vde-form__row">
                  <div className="vde-field">
                    <label>Hersteller</label>
                    <input value={storageData.hersteller} onChange={(e) => setStorageData({ ...storageData, hersteller: e.target.value })} placeholder="z.B. BYD, Huawei, SENEC" />
                  </div>
                  <div className="vde-field">
                    <label>Modell</label>
                    <input value={storageData.modell} onChange={(e) => setStorageData({ ...storageData, modell: e.target.value })} placeholder="z.B. HVS 10.2" />
                  </div>
                </div>

                <h4 className="vde-form__section">Technische Daten</h4>
                <div className="vde-form__row">
                  <div className="vde-field">
                    <label>Kapazität (kWh)</label>
                    <input type="number" step="0.1" value={storageData.kapazitaetKwh} onChange={(e) => setStorageData({ ...storageData, kapazitaetKwh: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="vde-field">
                    <label>Max. Entladeleistung (kW)</label>
                    <input type="number" step="0.01" value={storageData.maxEntladeleistungKw} onChange={(e) => setStorageData({ ...storageData, maxEntladeleistungKw: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="vde-form__row">
                  <div className="vde-field">
                    <label>Kopplung</label>
                    <select value={storageData.kopplung} onChange={(e) => setStorageData({ ...storageData, kopplung: e.target.value as "AC" | "DC" })}>
                      <option value="DC">DC-gekoppelt</option>
                      <option value="AC">AC-gekoppelt</option>
                    </select>
                  </div>
                  <div className="vde-field">
                    <label>Batterietechnologie</label>
                    <select value={storageData.batterietechnologie} onChange={(e) => setStorageData({ ...storageData, batterietechnologie: e.target.value })}>
                      <option value="Lithium-Eisenphosphat (LiFePO4)">Lithium-Eisenphosphat (LiFePO4)</option>
                      <option value="Lithium-Ionen (NMC)">Lithium-Ionen (NMC)</option>
                      <option value="Lithium-Ionen (NCA)">Lithium-Ionen (NCA)</option>
                    </select>
                  </div>
                </div>

                <h4 className="vde-form__section">Funktionen</h4>
                <div className="vde-form__row">
                  <div className="vde-field vde-field--checkbox">
                    <label>
                      <input type="checkbox" checked={storageData.notstromfaehig} onChange={(e) => setStorageData({ ...storageData, notstromfaehig: e.target.checked })} />
                      Notstromfähig (Ersatzstrom)
                    </label>
                  </div>
                  <div className="vde-field vde-field--checkbox">
                    <label>
                      <input type="checkbox" checked={storageData.schwarzstartfaehig} onChange={(e) => setStorageData({ ...storageData, schwarzstartfaehig: e.target.checked })} />
                      Schwarzstartfähig
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIGNATURE STEP */}
          {step === "signature" && (
            <div className="vde-signature">
              <div className="vde-signature__intro">
                <Pen size={24} />
                <div>
                  <h4>Digitale Signatur & Stempel</h4>
                  <p>Unterschreiben Sie die VDE-Formulare digital für eine rechtssichere Dokumentation.</p>
                </div>
              </div>

              {showSignaturePad ? (
                <SignaturePad
                  onSave={handleSignatureSave}
                  onCancel={() => setShowSignaturePad(false)}
                  width={380}
                  height={180}
                />
              ) : signature ? (
                <div className="vde-signature__preview">
                  <div className="vde-signature__label">Ihre Unterschrift:</div>
                  <div className="vde-signature__image">
                    <img src={signature} alt="Unterschrift" />
                  </div>
                  <button className="vde-btn vde-btn--secondary" onClick={() => setShowSignaturePad(true)}>
                    <Pen size={14} />
                    Neu unterschreiben
                  </button>
                </div>
              ) : (
                <button className="vde-btn vde-btn--secondary vde-btn--full vde-btn--large" onClick={() => setShowSignaturePad(true)}>
                  <Pen size={20} />
                  Jetzt unterschreiben
                </button>
              )}

              <div className="vde-signature__options">
                <label className="vde-checkbox-option">
                  <input type="checkbox" checked={useStempel} onChange={(e) => setUseStempel(e.target.checked)} />
                  <Stamp size={16} />
                  <span>Baunity Firmenstempel hinzufügen</span>
                </label>
              </div>

              {/* Stempel Preview */}
              {useStempel && (
                <div className="vde-stempel-preview">
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="3"/>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="1.5"/>
                    <text x="50" y="45" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">Baunity</text>
                    <text x="50" y="58" textAnchor="middle" fill="#10b981" fontSize="7">GmbH & Co. KG</text>
                    <text x="50" y="70" textAnchor="middle" fill="#10b981" fontSize="6">ZERTIFIZIERT</text>
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* GENERATE STEP (Loading) */}
          {step === "generate" && (
            <div className="vde-generating">
              <Loader2 size={48} className="vde-spin" />
              <h4>Generiere Premium VDE-Formulare...</h4>
              <p>E.1 Antragstellung • E.2 Datenblatt • E.3 Speicher • E.8 IBN-Protokoll</p>
            </div>
          )}

          {/* EMAIL STEP */}
          {step === "email" && (
            <div className="vde-email">
              <div className="vde-docs-list">
                <h4><FileText size={16} /> Generierte Dokumente</h4>
                {documents.map((doc, i) => (
                  <div key={i} className="vde-doc-item">
                    <FileText size={20} />
                    <div className="vde-doc-item__info">
                      <span className="vde-doc-item__name">{doc.name}</span>
                      <span className="vde-doc-item__type">{doc.type}</span>
                    </div>
                    <button className="vde-btn vde-btn--sm vde-btn--icon" onClick={() => setPreviewDoc(doc)} title="Vorschau">
                      <Eye size={14} />
                    </button>
                    <button className="vde-btn vde-btn--sm vde-btn--icon" onClick={() => handleDownload(doc)} title="Herunterladen">
                      <Download size={14} />
                    </button>
                  </div>
                ))}
                <button className="vde-btn vde-btn--secondary vde-btn--full" onClick={handleDownloadAll}>
                  <Download size={16} />
                  Alle herunterladen
                </button>
              </div>

              {emailData && (
                <div className="vde-email-form">
                  <h4><Mail size={16} /> E-Mail an Netzbetreiber</h4>
                  <div className="vde-field">
                    <label>An</label>
                    <input value={emailData.to} onChange={(e) => setEmailData({ ...emailData, to: e.target.value })} />
                  </div>
                  <div className="vde-field">
                    <label>Betreff</label>
                    <input value={emailData.subject} onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })} />
                  </div>
                  <div className="vde-field">
                    <label>Nachricht</label>
                    <textarea rows={6} value={emailData.body} onChange={(e) => setEmailData({ ...emailData, body: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DONE STEP */}
          {step === "done" && (
            <div className="vde-done">
              <div className="vde-done__icon">
                <Check size={48} />
              </div>
              <h3>Erfolgreich abgeschlossen! 🎉</h3>
              <p>Die VDE-Formulare wurden generiert und an den Netzbetreiber gesendet.</p>
              
              <div className="vde-done__summary">
                <div className="vde-done__summary-item">
                  <FileText size={16} />
                  <span>{documents.length} Dokumente generiert</span>
                </div>
                {signature && (
                  <div className="vde-done__summary-item">
                    <Pen size={16} />
                    <span>Digital signiert</span>
                  </div>
                )}
                {useStempel && (
                  <div className="vde-done__summary-item">
                    <Stamp size={16} />
                    <span>Mit Firmenstempel</span>
                  </div>
                )}
                <div className="vde-done__summary-item">
                  <Mail size={16} />
                  <span>E-Mail versendet</span>
                </div>
              </div>

              <div className="vde-done__actions">
                <button className="vde-btn vde-btn--secondary" onClick={handleDownloadAll}>
                  <Download size={16} />
                  Dokumente herunterladen
                </button>
                <button className="vde-btn vde-btn--primary" onClick={onClose}>
                  Schließen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "done" && step !== "generate" && (
          <div className="vde-modal__footer">
            {step !== "upload" && (
              <button className="vde-btn" onClick={() => {
                const prev = STEPS[currentStepIndex - 1];
                if (prev) setStep(prev.id);
              }} disabled={loading}>
                <ChevronLeft size={16} />
                Zurück
              </button>
            )}
            <div className="vde-modal__footer-spacer" />
            
            {step === "review" && (
              <button className="vde-btn vde-btn--primary" onClick={() => setStep("signature")} disabled={loading || !storageData?.hersteller || !storageData?.modell}>
                Weiter zur Signatur
                <ChevronRight size={16} />
              </button>
            )}
            
            {step === "signature" && (
              <>
                <button className="vde-btn" onClick={handleGenerate}>
                  Ohne Signatur fortfahren
                </button>
                <button className="vde-btn vde-btn--primary" onClick={handleGenerate} disabled={loading}>
                  {loading ? <Loader2 size={16} className="vde-spin" /> : <FileText size={16} />}
                  Formulare generieren
                </button>
              </>
            )}
            
            {step === "email" && (
              <>
                <button className="vde-btn" onClick={() => setStep("done")}>
                  Überspringen
                </button>
                <button className="vde-btn vde-btn--primary" onClick={handleSendEmail} disabled={loading || !emailData?.to}>
                  {loading ? <Loader2 size={16} className="vde-spin" /> : <Send size={16} />}
                  E-Mail senden
                </button>
              </>
            )}
          </div>
        )}

        {/* PDF Preview Modal */}
        {previewDoc && (
          <div className="vde-preview-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="vde-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="vde-preview-header">
                <span>{previewDoc.name}</span>
                <button className="vde-btn vde-btn--icon" onClick={() => setPreviewDoc(null)}>
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={`data:application/pdf;base64,${previewDoc.base64}`}
                className="vde-preview-iframe"
                title={previewDoc.name}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VDEGeneratorModal;
