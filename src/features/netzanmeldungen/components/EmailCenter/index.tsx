/**
 * EMAIL CENTER - Complete Email Composer & Templates
 * Includes: Template Editor, Email Composer, Variable Preview
 */

import { useState, useEffect, useCallback } from "react";
import {
  X, Mail, Send, Save, Loader2, FileText, Plus, Trash2, Eye, Edit3,
  Paperclip, ChevronDown, Check, AlertCircle, Copy,
} from "lucide-react";
import { api } from "../../services/api";
import type { EmailTemplate, InstallationDetail } from "../../types";

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VARIABLES
// ═══════════════════════════════════════════════════════════════════════════

export const EMAIL_VARIABLES = [
  { key: "{{kunde_name}}", label: "Kundenname", example: "Max Mustermann" },
  { key: "{{kunde_anrede}}", label: "Anrede", example: "Herr" },
  { key: "{{kunde_email}}", label: "Kunden-E-Mail", example: "max@example.com" },
  { key: "{{anlage_id}}", label: "Anlagen-ID", example: "NA-2024-001234" },
  { key: "{{anlage_adresse}}", label: "Anlagenstandort", example: "Musterstr. 1, 12345 Musterstadt" },
  { key: "{{anlage_kwp}}", label: "Anlagenleistung", example: "10.5 kWp" },
  { key: "{{netzbetreiber}}", label: "Netzbetreiber", example: "Stadtwerke Musterstadt" },
  { key: "{{status}}", label: "Aktueller Status", example: "In Prüfung" },
  { key: "{{firma_name}}", label: "Firmenname", example: "Solar GmbH" },
  { key: "{{firma_email}}", label: "Firmen-E-Mail", example: "info@solar.de" },
  { key: "{{firma_telefon}}", label: "Firmen-Telefon", example: "0123 456789" },
  { key: "{{datum_heute}}", label: "Heutiges Datum", example: "23.12.2024" },
  { key: "{{bearbeiter_name}}", label: "Bearbeiter", example: "Anna Schmidt" },
];

export function replaceEmailVariables(text: string, detail: InstallationDetail): string {
  const customer = detail.customer || {};
  const replacements: Record<string, string> = {
    "{{kunde_name}}": detail.customerName || `${customer.vorname || ""} ${customer.nachname || ""}`.trim() || "—",
    "{{kunde_anrede}}": customer.anrede || "—",
    "{{kunde_email}}": customer.email || detail.contactEmail || "—",
    "{{anlage_id}}": detail.publicId || "—",
    "{{anlage_adresse}}": `${detail.strasse || ""} ${detail.hausNr || ""}, ${detail.plz || ""} ${detail.ort || ""}`.trim() || "—",
    "{{anlage_kwp}}": detail.totalKwp ? `${Number(detail.totalKwp).toFixed(2)} kWp` : "—",
    "{{netzbetreiber}}": detail.gridOperator || "—",
    "{{status}}": detail.status || "—",
    "{{firma_name}}": "LeCa GmbH & Co. KG",
    "{{firma_email}}": "info@baunity.de",
    "{{firma_telefon}}": "0800 123 4567",
    "{{datum_heute}}": new Date().toLocaleDateString("de-DE"),
    "{{bearbeiter_name}}": detail.assignedToName || "—",
  };

  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL COMPOSER MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface EmailComposerProps {
  installationId: number;
  detail: InstallationDetail;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function EmailComposer({ installationId, detail, onClose, onSuccess, showToast }: EmailComposerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [form, setForm] = useState({
    to: detail.contactEmail || detail.customer?.email || "",
    cc: "",
    subject: "",
    body: "",
  });

  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const documents = detail.documents || [];

  // Load templates
  useEffect(() => {
    setLoadingTemplates(true);
    api.email.getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const applyTemplate = (template: EmailTemplate) => {
    setForm({
      ...form,
      subject: replaceEmailVariables(template.subject, detail),
      body: replaceEmailVariables(template.body, detail),
    });
    setSelectedTemplate(template);
    setShowTemplateDropdown(false);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = form.body.slice(0, start) + variable + form.body.slice(end);
      setForm({ ...form, body: newBody });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setForm({ ...form, body: form.body + variable });
    }
  };

  const handleSend = async () => {
    if (!form.to.trim()) {
      showToast("Bitte Empfänger angeben", "error");
      return;
    }
    if (!form.subject.trim()) {
      showToast("Bitte Betreff angeben", "error");
      return;
    }

    setSending(true);
    try {
      await api.email.send(installationId, {
        templateId: selectedTemplate?.id,
        to: form.to,
        cc: form.cc || undefined,
        subject: form.subject,
        body: form.body,
        attachDocumentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
      });
      showToast("E-Mail gesendet", "success");
      onSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Senden", "error");
    } finally {
      setSending(false);
    }
  };

  const previewBody = replaceEmailVariables(form.body, detail);
  const previewSubject = replaceEmailVariables(form.subject, detail);

  return (
    <div className="ec-modal-overlay" onClick={onClose}>
      <div className="ec-modal ec-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="ec-modal__header">
          <div className="ec-modal__title">
            <Mail size={20} />
            <span>E-Mail senden</span>
            {selectedTemplate && (
              <span className="ec-template-badge">{selectedTemplate.name}</span>
            )}
          </div>
          <button className="ec-btn ec-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ec-modal__toolbar">
          {/* Template Selector */}
          <div className="ec-dropdown">
            <button className="ec-btn ec-btn--sm" onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}>
              <FileText size={14} />
              Vorlage wählen
              <ChevronDown size={14} />
            </button>
            {showTemplateDropdown && (
              <>
                <div className="ec-dropdown__backdrop" onClick={() => setShowTemplateDropdown(false)} />
                <div className="ec-dropdown__menu">
                  {loadingTemplates ? (
                    <div className="ec-dropdown__loading"><Loader2 size={16} className="spin" /></div>
                  ) : templates.length === 0 ? (
                    <div className="ec-dropdown__empty">Keine Vorlagen</div>
                  ) : (
                    templates.map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t)}>
                        <FileText size={14} />
                        {t.name}
                        {selectedTemplate?.id === t.id && <Check size={14} />}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <button className="ec-btn ec-btn--sm" onClick={() => setShowVariables(!showVariables)}>
            <Copy size={14} />
            Variablen
          </button>

          <button className="ec-btn ec-btn--sm" onClick={() => setShowAttachments(!showAttachments)}>
            <Paperclip size={14} />
            Anhänge ({selectedDocs.length})
          </button>

          <button className="ec-btn ec-btn--sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={14} />
            {showPreview ? "Editor" : "Vorschau"}
          </button>
        </div>

        {/* Variables Panel */}
        {showVariables && (
          <div className="ec-variables">
            <div className="ec-variables__header">
              <span>Verfügbare Variablen</span>
              <button onClick={() => setShowVariables(false)}><X size={14} /></button>
            </div>
            <div className="ec-variables__list">
              {EMAIL_VARIABLES.map(v => (
                <button key={v.key} className="ec-variable" onClick={() => insertVariable(v.key)}>
                  <code>{v.key}</code>
                  <span>{v.label}</span>
                  <span className="ec-variable__example">{v.example}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Panel */}
        {showAttachments && (
          <div className="ec-attachments">
            <div className="ec-attachments__header">
              <span>Dokumente anhängen</span>
              <button onClick={() => setShowAttachments(false)}><X size={14} /></button>
            </div>
            {documents.length === 0 ? (
              <div className="ec-attachments__empty">Keine Dokumente verfügbar</div>
            ) : (
              <div className="ec-attachments__list">
                {documents.map(doc => (
                  <label key={doc.id} className="ec-attachment">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedDocs([...selectedDocs, doc.id]);
                        } else {
                          setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                        }
                      }}
                    />
                    <FileText size={14} />
                    <span>{doc.originalName || doc.dateiname}</span>
                    <span className="ec-attachment__category">{doc.kategorie}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ec-modal__body">
          {showPreview ? (
            <div className="ec-preview">
              <div className="ec-preview__header">
                <span className="ec-preview__label">An:</span>
                <span>{form.to}</span>
              </div>
              {form.cc && (
                <div className="ec-preview__header">
                  <span className="ec-preview__label">CC:</span>
                  <span>{form.cc}</span>
                </div>
              )}
              <div className="ec-preview__header">
                <span className="ec-preview__label">Betreff:</span>
                <span>{previewSubject}</span>
              </div>
              <div className="ec-preview__body">
                {previewBody.split("\n").map((line, i) => (
                  <p key={i}>{line || <br />}</p>
                ))}
              </div>
              {selectedDocs.length > 0 && (
                <div className="ec-preview__attachments">
                  <Paperclip size={14} />
                  <span>{selectedDocs.length} Anhang/Anhänge</span>
                </div>
              )}
            </div>
          ) : (
            <div className="ec-form">
              <div className="ec-form__row">
                <div className="ec-field">
                  <label>An *</label>
                  <input
                    type="email"
                    value={form.to}
                    onChange={e => setForm({ ...form, to: e.target.value })}
                    placeholder="empfaenger@example.com"
                  />
                </div>
                <div className="ec-field">
                  <label>CC</label>
                  <input
                    type="email"
                    value={form.cc}
                    onChange={e => setForm({ ...form, cc: e.target.value })}
                    placeholder="kopie@example.com"
                  />
                </div>
              </div>

              <div className="ec-field">
                <label>Betreff *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Betreff der E-Mail"
                />
              </div>

              <div className="ec-field ec-field--grow">
                <label>Nachricht *</label>
                <textarea
                  id="email-body"
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder="Ihre Nachricht..."
                  rows={12}
                />
              </div>
            </div>
          )}
        </div>

        <div className="ec-modal__footer">
          <button className="ec-btn" onClick={onClose}>Abbrechen</button>
          <button className="ec-btn ec-btn--primary" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE EDITOR MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface TemplateEditorProps {
  template?: EmailTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function TemplateEditor({ template, onClose, onSuccess, showToast }: TemplateEditorProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    body: template?.body || "",
    triggerStatus: template?.triggerStatus || "" as string,
    recipientType: (template?.recipientType || "customer") as "customer" | "gridoperator" | "internal" | "custom",
    isActive: template?.isActive ?? true,
  });

  const statusOptions = [
    { value: "", label: "Kein Auto-Versand" },
    { value: "eingereicht", label: "Bei Einreichung" },
    { value: "in_pruefung", label: "Bei Start Prüfung" },
    { value: "warten_auf_nb", label: "Bei Weiterleitung an NB" },
    { value: "nachbesserung", label: "Bei Rückfrage" },
    { value: "nb_genehmigt", label: "Bei Genehmigung" },
    { value: "abgeschlossen", label: "Bei Abschluss" },
  ];

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      showToast("Name und Betreff sind Pflichtfelder", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        subject: form.subject,
        body: form.body,
        triggerStatus: form.triggerStatus || undefined,
        recipientType: form.recipientType,
        isActive: form.isActive,
      };
      
      if (template?.id) {
        await api.email.updateTemplate(template.id, payload as any);
        showToast("Vorlage aktualisiert", "success");
      } else {
        await api.email.createTemplate(payload as any);
        showToast("Vorlage erstellt", "success");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Speichern", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ec-modal-overlay" onClick={onClose}>
      <div className="ec-modal ec-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="ec-modal__header">
          <div className="ec-modal__title">
            <FileText size={20} />
            <span>{template ? "Vorlage bearbeiten" : "Neue Vorlage"}</span>
          </div>
          <button className="ec-btn ec-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ec-modal__body">
          <div className="ec-form">
            <div className="ec-form__row">
              <div className="ec-field">
                <label>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Bestätigung Eingang"
                />
              </div>
              <div className="ec-field">
                <label>Empfänger</label>
                <select value={form.recipientType} onChange={e => setForm({ ...form, recipientType: e.target.value as "customer" | "gridoperator" | "internal" | "custom" })}>
                  <option value="customer">Kunde</option>
                  <option value="gridoperator">Netzbetreiber</option>
                  <option value="internal">Intern</option>
                </select>
              </div>
            </div>

            <div className="ec-form__row">
              <div className="ec-field">
                <label>Auto-Versand bei Status</label>
                <select value={form.triggerStatus} onChange={e => setForm({ ...form, triggerStatus: e.target.value })}>
                  {statusOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="ec-field ec-field--checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Vorlage aktiv
                </label>
              </div>
            </div>

            <div className="ec-field">
              <label>Betreff *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Ihre Netzanmeldung {{anlage_id}}"
              />
            </div>

            <div className="ec-field ec-field--grow">
              <label>Nachricht</label>
              <textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="Sehr geehrte/r {{kunde_anrede}} {{kunde_name}},&#10;&#10;..."
                rows={12}
              />
            </div>

            <div className="ec-hint">
              <AlertCircle size={14} />
              Verfügbare Variablen: {EMAIL_VARIABLES.map(v => v.key).join(", ")}
            </div>
          </div>
        </div>

        <div className="ec-modal__footer">
          <button className="ec-btn" onClick={onClose}>Abbrechen</button>
          <button className="ec-btn ec-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE LIST (Admin)
// ═══════════════════════════════════════════════════════════════════════════

interface TemplateListProps {
  onClose: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function TemplateList({ onClose, showToast }: TemplateListProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null | "new">(null);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    api.email.getTemplates()
      .then(setTemplates)
      .catch(() => showToast("Fehler beim Laden", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: number) => {
    if (!confirm("Vorlage wirklich löschen?")) return;
    try {
      await api.email.deleteTemplate(id);
      showToast("Vorlage gelöscht", "success");
      loadTemplates();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Löschen", "error");
    }
  };

  return (
    <div className="ec-modal-overlay" onClick={onClose}>
      <div className="ec-modal ec-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="ec-modal__header">
          <div className="ec-modal__title">
            <FileText size={20} />
            <span>E-Mail Vorlagen</span>
          </div>
          <div className="ec-modal__actions">
            <button className="ec-btn ec-btn--primary ec-btn--sm" onClick={() => setEditingTemplate("new")}>
              <Plus size={14} /> Neue Vorlage
            </button>
            <button className="ec-btn ec-btn--icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="ec-modal__body">
          {loading ? (
            <div className="ec-loading"><Loader2 size={32} className="spin" /></div>
          ) : templates.length === 0 ? (
            <div className="ec-empty">
              <FileText size={48} />
              <p>Noch keine Vorlagen erstellt</p>
              <button className="ec-btn ec-btn--primary" onClick={() => setEditingTemplate("new")}>
                <Plus size={16} /> Erste Vorlage erstellen
              </button>
            </div>
          ) : (
            <div className="ec-template-list">
              {templates.map(t => (
                <div key={t.id} className={`ec-template-item ${!t.isActive ? "ec-template-item--inactive" : ""}`}>
                  <div className="ec-template-item__icon"><FileText size={20} /></div>
                  <div className="ec-template-item__content">
                    <span className="ec-template-item__name">{t.name}</span>
                    <span className="ec-template-item__subject">{t.subject}</span>
                    <div className="ec-template-item__meta">
                      {t.triggerStatus && <span className="ec-tag">Auto: {t.triggerStatus}</span>}
                      <span className="ec-tag">{t.recipientType}</span>
                      {!t.isActive && <span className="ec-tag ec-tag--inactive">Inaktiv</span>}
                    </div>
                  </div>
                  <div className="ec-template-item__actions">
                    <button onClick={() => setEditingTemplate(t)} title="Bearbeiten"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} title="Löschen"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editingTemplate && (
          <TemplateEditor
            template={editingTemplate === "new" ? null : editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSuccess={() => { setEditingTemplate(null); loadTemplates(); }}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const EmailCenterStyles = `
.ec-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}

.ec-modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ec-modal--lg { max-width: 800px; }

.ec-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ec-modal__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.ec-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ec-template-badge {
  font-size: 0.6875rem;
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 4px;
}

.ec-modal__toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.ec-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.ec-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Buttons */
.ec-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ec-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
.ec-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ec-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: transparent;
  color: #fff;
}
.ec-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.ec-btn--sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.ec-btn--icon { width: 36px; height: 36px; padding: 0; }

/* Dropdown */
.ec-dropdown { position: relative; }
.ec-dropdown__backdrop { position: fixed; inset: 0; z-index: 100; }
.ec-dropdown__menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  min-width: 200px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.5rem;
  z-index: 101;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
.ec-dropdown__menu button {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: none;
  border: none;
  color: #e2e8f0;
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}
.ec-dropdown__menu button:hover { background: rgba(255, 255, 255, 0.05); }
.ec-dropdown__loading, .ec-dropdown__empty {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.8125rem;
}

/* Variables Panel */
.ec-variables {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}
.ec-variables__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}
.ec-variables__header button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
}
.ec-variables__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  padding: 0 1.25rem 1rem;
}
.ec-variable {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.ec-variable:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}
.ec-variable code {
  font-family: monospace;
  font-size: 0.6875rem;
  color: #60a5fa;
}
.ec-variable span { font-size: 0.75rem; color: #e2e8f0; }
.ec-variable__example { font-size: 0.6875rem; color: #64748b; }

/* Attachments Panel */
.ec-attachments {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}
.ec-attachments__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}
.ec-attachments__header button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
}
.ec-attachments__list {
  padding: 0 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.ec-attachments__empty {
  padding: 1rem 1.25rem;
  text-align: center;
  color: #64748b;
  font-size: 0.8125rem;
}
.ec-attachment {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #e2e8f0;
}
.ec-attachment input { width: 16px; height: 16px; cursor: pointer; }
.ec-attachment__category {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #64748b;
}

/* Form */
.ec-form { display: flex; flex-direction: column; gap: 1rem; }
.ec-form__row { display: flex; gap: 1rem; }
.ec-form__row .ec-field { flex: 1; }
.ec-field { display: flex; flex-direction: column; gap: 0.375rem; }
.ec-field--grow { flex: 1; }
.ec-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.ec-field--checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.ec-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
}
.ec-field input,
.ec-field select,
.ec-field textarea {
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
}
.ec-field input:focus,
.ec-field select:focus,
.ec-field textarea:focus {
  outline: none;
  border-color: #3b82f6;
}
.ec-field textarea { resize: vertical; min-height: 200px; }
.ec-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

/* Preview */
.ec-preview { padding: 1rem; background: #fff; border-radius: 8px; color: #1e293b; }
.ec-preview__header {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
}
.ec-preview__label { font-weight: 600; min-width: 60px; }
.ec-preview__body {
  padding: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
}
.ec-preview__body p { margin: 0 0 0.5rem; }
.ec-preview__attachments {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.8125rem;
  color: #64748b;
}

/* Template List */
.ec-template-list { display: flex; flex-direction: column; gap: 0.5rem; }
.ec-template-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}
.ec-template-item--inactive { opacity: 0.5; }
.ec-template-item__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 10px;
}
.ec-template-item__content { flex: 1; }
.ec-template-item__name { display: block; font-weight: 600; color: #fff; }
.ec-template-item__subject { display: block; font-size: 0.8125rem; color: #94a3b8; }
.ec-template-item__meta { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.ec-tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #94a3b8;
}
.ec-tag--inactive { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.ec-template-item__actions { display: flex; gap: 0.25rem; }
.ec-template-item__actions button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
}
.ec-template-item__actions button:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

/* Loading & Empty */
.ec-loading, .ec-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #64748b;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
