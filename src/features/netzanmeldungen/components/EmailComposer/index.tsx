/**
 * EMAIL COMPOSER WITH SIGNATURE
 * =============================
 * Premium Email-Versand mit:
 * - Digitale Signatur
 * - Firmenstempel
 * - PDF-Anhänge
 * - Template-System
 * - Vorschau
 */

import { useState, useRef, useEffect } from "react";
import {
  X, Mail, Send, Paperclip, Eye, Pen, Stamp, FileText,
  Loader2, Check, ChevronDown, Plus, Trash2, Download,
  AlertCircle, Users, Building2, User,
} from "lucide-react";
import { SignaturePad } from "../SignaturePad";
import type { InstallationDetail, Document } from "../../types";
import { COMPANY } from "../../../../config/company";
import "./EmailComposer.css";

interface EmailComposerProps {
  installation: InstallationDetail;
  documents?: Document[];
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultBody?: string;
  onSend: (data: EmailSendData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export interface EmailSendData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments: { filename: string; content: string }[];
  signature?: string;
  useStempel: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "anmeldung",
    name: "Netzanmeldung einreichen",
    category: "Netzbetreiber",
    subject: "Netzanmeldung für PV-Anlage - {{kundenname}}, {{adresse}}",
    body: `Sehr geehrte Damen und Herren,

hiermit reichen wir die Netzanmeldung für die nachfolgende Anlage ein:

Anlagenbetreiber: {{kundenname}}
Anschrift: {{adresse}}
Anlagentyp: {{anlagentyp}}
Leistung: {{leistung}} kWp

Im Anhang finden Sie alle erforderlichen Unterlagen:
- E.1 Antragstellung
- E.2 Datenblatt Erzeugungsanlagen
{{#speicher}}- E.3 Datenblatt Speicher{{/speicher}}
- E.8 Inbetriebsetzungsprotokoll

Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`
  },
  {
    id: "rueckfrage",
    name: "Rückfrage Netzbetreiber",
    category: "Netzbetreiber",
    subject: "Rückfrage zu Netzanmeldung - {{kundenname}}",
    body: `Sehr geehrte Damen und Herren,

bezüglich der Netzanmeldung für {{kundenname}} an der Adresse {{adresse}} haben wir folgende Rückfrage:

[Ihre Frage hier einfügen]

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen`
  },
  {
    id: "kunde_status",
    name: "Status-Update an Kunden",
    category: "Kunde",
    subject: "Status Ihrer Netzanmeldung - Update",
    body: `Sehr geehrte(r) {{kundenname}},

wir möchten Sie über den aktuellen Stand Ihrer Netzanmeldung informieren:

Status: {{status}}
Nächste Schritte: [Details hier]

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen`
  },
  {
    id: "kunde_fertig",
    name: "Abschluss an Kunden",
    category: "Kunde",
    subject: "Ihre Netzanmeldung wurde erfolgreich abgeschlossen!",
    body: `Sehr geehrte(r) {{kundenname}},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Netzanmeldung erfolgreich abgeschlossen wurde!

Ihre PV-Anlage wurde vom Netzbetreiber freigegeben und kann nun in Betrieb genommen werden.

Im Anhang finden Sie alle relevanten Dokumente für Ihre Unterlagen.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit sonnigen Grüßen`
  },
];

const FIRMA = {
  name: COMPANY.name,
  strasse: `${COMPANY.strasse} ${COMPANY.hausnummer}`,
  plz: COMPANY.plz,
  ort: COMPANY.ort,
  telefon: COMPANY.telefon,
  email: COMPANY.email,
  web: COMPANY.website,
};

function replacePlaceholders(text: string, data: InstallationDetail): string {
  const replacements: Record<string, string> = {
    "{{kundenname}}": data.customerName || "Unbekannt",
    "{{adresse}}": `${data.strasse || ""} ${data.hausNr || ""}, ${data.plz || ""} ${data.ort || ""}`.trim(),
    "{{plz}}": data.plz || "",
    "{{ort}}": data.ort || "",
    "{{anlagentyp}}": data.caseType || "PV-Anlage",
    "{{leistung}}": String(data.totalKwp || "–"),
    "{{status}}": data.status || "–",
    "{{netzbetreiber}}": data.gridOperator || "–",
  };
  
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, "g"), value);
  }
  
  // Handle conditional blocks
  const hasSpeicher = data.caseType?.includes("SPEICHER") || data.caseType?.includes("STORAGE");
  result = result.replace(/\{\{#speicher\}\}([\s\S]*?)\{\{\/speicher\}\}/g, hasSpeicher ? "$1" : "");
  
  return result;
}

export function EmailComposer({
  installation,
  documents = [],
  defaultRecipient,
  defaultSubject,
  defaultBody,
  onSend,
  onClose,
  showToast,
}: EmailComposerProps) {
  const [recipients, setRecipients] = useState<string[]>(defaultRecipient ? [defaultRecipient] : []);
  const [newRecipient, setNewRecipient] = useState("");
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState(defaultSubject || "");
  const [body, setBody] = useState(defaultBody || "");
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [useStempel, setUseStempel] = useState(true);
  const [sending, setSending] = useState(false);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  // Auto-select grid operator email if available
  useEffect(() => {
    if (!defaultRecipient && installation.gridOperatorEmail) {
      setRecipients([installation.gridOperatorEmail]);
    }
  }, [installation.gridOperatorEmail, defaultRecipient]);

  const handleAddRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (email && email.includes("@") && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSubject(replacePlaceholders(template.subject, installation));
    setBody(replacePlaceholders(template.body, installation));
    setShowTemplates(false);
  };

  const handleToggleDoc = (docId: number) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocs(newSet);
  };

  const handleSignatureSave = (sig: string) => {
    setSignature(sig);
    setShowSignaturePad(false);
    showToast("Unterschrift gespeichert", "success");
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      showToast("Bitte mindestens einen Empfänger angeben", "error");
      return;
    }
    if (!subject.trim()) {
      showToast("Bitte Betreff eingeben", "error");
      return;
    }

    setSending(true);

    try {
      // Build attachments from selected documents
      const attachments = documents
        .filter(doc => selectedDocs.has(doc.id))
        .map(doc => ({
          filename: doc.dateiname || doc.originalName,
          content: "", // Content will be fetched by backend
        }));

      const result = await onSend({
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        subject,
        body: buildFinalBody(),
        attachments,
        signature: signature || undefined,
        useStempel,
      });

      if (result.success) {
        showToast("E-Mail erfolgreich gesendet!", "success");
        onClose();
      } else {
        showToast(result.error || "Fehler beim Senden", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Fehler beim Senden", "error");
    } finally {
      setSending(false);
    }
  };

  const buildFinalBody = (): string => {
    let finalBody = body;
    
    // Add company signature block
    finalBody += `\n\n--\n${FIRMA.name}\n${FIRMA.strasse}\n${FIRMA.plz} ${FIRMA.ort}\nTel: ${FIRMA.telefon}\nE-Mail: ${FIRMA.email}\nWeb: ${FIRMA.web}`;
    
    return finalBody;
  };

  const groupedTemplates = EMAIL_TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="email-composer-overlay" onClick={onClose}>
      <div className="email-composer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="email-composer__header">
          <div className="email-composer__title">
            <Mail size={20} />
            <span>E-Mail verfassen</span>
          </div>
          <div className="email-composer__header-actions">
            <button 
              className={`ec-btn ec-btn--sm ${showPreview ? "ec-btn--active" : ""}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye size={14} />
              Vorschau
            </button>
            <button className="ec-btn ec-btn--icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="email-composer__body">
          {/* Left: Compose Form */}
          <div className="email-composer__form">
            {/* Recipients */}
            <div className="ec-field">
              <label>
                <Users size={14} />
                An
              </label>
              <div className="ec-recipients">
                {recipients.map(email => (
                  <span key={email} className="ec-recipient-tag">
                    {email}
                    <button onClick={() => handleRemoveRecipient(email)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  ref={recipientInputRef}
                  type="email"
                  value={newRecipient}
                  onChange={e => setNewRecipient(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddRecipient()}
                  placeholder="E-Mail hinzufügen..."
                />
              </div>
            </div>

            {/* Quick recipients */}
            <div className="ec-quick-recipients">
              {installation.gridOperatorEmail && !recipients.includes(installation.gridOperatorEmail) && (
                <button 
                  className="ec-quick-recipient"
                  onClick={() => setRecipients([...recipients, installation.gridOperatorEmail!])}
                >
                  <Building2 size={12} />
                  {installation.gridOperator || "Netzbetreiber"}
                </button>
              )}
              {installation.contactEmail && !recipients.includes(installation.contactEmail) && (
                <button 
                  className="ec-quick-recipient"
                  onClick={() => setRecipients([...recipients, installation.contactEmail!])}
                >
                  <User size={12} />
                  {installation.customerName || "Kunde"}
                </button>
              )}
            </div>

            {/* Subject */}
            <div className="ec-field">
              <label>Betreff</label>
              <div className="ec-subject-row">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Betreff eingeben..."
                />
                <button 
                  className={`ec-btn ec-btn--sm ${showTemplates ? "ec-btn--active" : ""}`}
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText size={14} />
                  Vorlagen
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Templates Dropdown */}
            {showTemplates && (
              <div className="ec-templates">
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category} className="ec-template-group">
                    <div className="ec-template-group__title">{category}</div>
                    {templates.map(t => (
                      <button 
                        key={t.id} 
                        className="ec-template-item"
                        onClick={() => handleSelectTemplate(t)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="ec-field ec-field--grow">
              <label>Nachricht</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Ihre Nachricht..."
              />
            </div>

            {/* Signature Section */}
            <div className="ec-signature-section">
              <div className="ec-signature-header">
                <Pen size={14} />
                <span>Signatur & Stempel</span>
              </div>
              
              <div className="ec-signature-options">
                {signature ? (
                  <div className="ec-signature-preview">
                    <img src={signature} alt="Unterschrift" />
                    <button className="ec-btn ec-btn--sm" onClick={() => setShowSignaturePad(true)}>
                      <Pen size={12} />
                      Ändern
                    </button>
                  </div>
                ) : (
                  <button 
                    className="ec-btn ec-btn--secondary"
                    onClick={() => setShowSignaturePad(true)}
                  >
                    <Pen size={14} />
                    Unterschrift hinzufügen
                  </button>
                )}
                
                <label className="ec-checkbox">
                  <input 
                    type="checkbox" 
                    checked={useStempel} 
                    onChange={e => setUseStempel(e.target.checked)} 
                  />
                  <Stamp size={14} />
                  <span>Firmenstempel hinzufügen</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Attachments & Preview */}
          <div className="email-composer__sidebar">
            {showPreview ? (
              <div className="ec-preview">
                <h4>E-Mail Vorschau</h4>
                <div className="ec-preview__content">
                  <div className="ec-preview__field">
                    <strong>An:</strong> {recipients.join(", ")}
                  </div>
                  <div className="ec-preview__field">
                    <strong>Betreff:</strong> {subject}
                  </div>
                  <div className="ec-preview__body">
                    {buildFinalBody().split("\n").map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                  {selectedDocs.size > 0 && (
                    <div className="ec-preview__attachments">
                      <strong>Anhänge ({selectedDocs.size}):</strong>
                      {documents.filter(d => selectedDocs.has(d.id)).map(d => (
                        <span key={d.id}>{d.dateiname || d.originalName}</span>
                      ))}
                    </div>
                  )}
                  {signature && (
                    <div className="ec-preview__signature">
                      <img src={signature} alt="Unterschrift" />
                    </div>
                  )}
                  {useStempel && (
                    <div className="ec-preview__stempel">
                      <svg width="60" height="60" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="3"/>
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="1.5"/>
                        <text x="50" y="45" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">Baunity</text>
                        <text x="50" y="58" textAnchor="middle" fill="#10b981" fontSize="8">GmbH</text>
                        <text x="50" y="70" textAnchor="middle" fill="#10b981" fontSize="6">ZERTIFIZIERT</text>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ec-attachments">
                <h4>
                  <Paperclip size={14} />
                  Anhänge auswählen
                </h4>
                
                {documents.length === 0 ? (
                  <div className="ec-attachments__empty">
                    <FileText size={24} />
                    <span>Keine Dokumente verfügbar</span>
                  </div>
                ) : (
                  <div className="ec-attachments__list">
                    {documents.map(doc => (
                      <label key={doc.id} className={`ec-attachment ${selectedDocs.has(doc.id) ? "ec-attachment--selected" : ""}`}>
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => handleToggleDoc(doc.id)}
                        />
                        <FileText size={16} />
                        <div className="ec-attachment__info">
                          <span className="ec-attachment__name">{doc.dateiname || doc.originalName}</span>
                          <span className="ec-attachment__type">{doc.dokumentTyp || doc.kategorie}</span>
                        </div>
                        <Check size={14} className="ec-attachment__check" />
                      </label>
                    ))}
                  </div>
                )}

                <div className="ec-attachments__summary">
                  {selectedDocs.size} Dokument{selectedDocs.size !== 1 ? "e" : ""} ausgewählt
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="email-composer__footer">
          <button className="ec-btn" onClick={onClose}>
            Abbrechen
          </button>
          <button 
            className="ec-btn ec-btn--primary"
            onClick={handleSend}
            disabled={sending || recipients.length === 0 || !subject.trim()}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="ec-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send size={16} />
                E-Mail senden
              </>
            )}
          </button>
        </div>

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <div className="ec-signature-modal">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
              width={380}
              height={180}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailComposer;
