/**
 * EMAILS TAB - Gruppiert nach Empfänger mit Schnellvorlagen
 * Mit Premium EmailComposer inkl. Signatur & Stempel
 */

import { useState, useMemo } from "react";
import {
  Mail, Send, Loader2, Eye, Reply, ChevronDown, ChevronRight,
  X, User, Building2, Paperclip, Plus, Pen, Stamp,
  Check, AlertCircle,
} from "lucide-react";
import { api } from "../../../services/api";
import { EmailComposer, type EmailSendData } from "../../EmailComposer";
import type { InstallationDetail, GridOperator, Document } from "../../../types";

interface Email {
  id: number;
  subject: string;
  body?: string;
  recipient: string;
  recipientType?: "kunde" | "netzbetreiber" | "intern";
  sentAt: string;
  status?: "sent" | "delivered" | "failed" | "pending";
  direction?: "outgoing" | "incoming";
  attachments?: { name: string; url: string }[];
  threadId?: string;
}

interface EmailsTabProps {
  emails: Email[];
  installationId: number;
  detail: InstallationDetail;
  documents?: Document[];
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

// Schnellvorlagen
const EMAIL_TEMPLATES = [
  {
    id: "dok_anfordern",
    label: "Dokumente anfordern",
    subject: "Fehlende Unterlagen für Ihre Netzanmeldung",
    recipientType: "kunde" as const,
    body: `Sehr geehrte/r {kunde},

für die Bearbeitung Ihrer Netzanmeldung benötigen wir noch folgende Unterlagen:

- Lageplan
- Schaltplan

Bitte laden Sie diese Dokumente in Ihrem Kundenportal hoch oder senden Sie sie uns per E-Mail zu.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`,
  },
  {
    id: "status_update",
    label: "Status-Update",
    subject: "Status Ihrer Netzanmeldung - {anlagenId}",
    recipientType: "kunde" as const,
    body: `Sehr geehrte/r {kunde},

wir möchten Sie über den aktuellen Stand Ihrer Netzanmeldung informieren:

Status: {status}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`,
  },
  {
    id: "nb_einreichung",
    label: "Einreichung an NB",
    subject: "Netzanmeldung - {adresse}",
    recipientType: "netzbetreiber" as const,
    body: `Sehr geehrte Damen und Herren,

im Auftrag unseres Kunden {kunde} reichen wir hiermit die Unterlagen zur Netzanmeldung ein:

Standort: {adresse}
Anlagenleistung: {leistung} kWp

Im Anhang finden Sie alle erforderlichen Dokumente.

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`,
  },
  {
    id: "nb_nachfrage",
    label: "Nachfrage NB",
    subject: "Rückfrage zu Netzanmeldung - {anlagenId}",
    recipientType: "netzbetreiber" as const,
    body: `Sehr geehrte Damen und Herren,

wir möchten uns nach dem Stand unserer Netzanmeldung erkundigen:

Anlagen-ID: {anlagenId}
Standort: {adresse}

Könnten Sie uns bitte den aktuellen Bearbeitungsstand mitteilen?

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`,
  },
  {
    id: "abschluss",
    label: "Abschluss-Info",
    subject: "Ihre Netzanmeldung wurde genehmigt!",
    recipientType: "kunde" as const,
    body: `Sehr geehrte/r {kunde},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Netzanmeldung erfolgreich abgeschlossen wurde!

Der Netzbetreiber hat die Genehmigung erteilt.

Nächste Schritte:
- Inbetriebnahme der Anlage
- Anmeldung beim Marktstammdatenregister

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`,
  },
];

export function EmailsTab({ emails, installationId, detail, documents = [], onRefresh, showToast, isKunde }: EmailsTabProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [showPremiumComposer, setShowPremiumComposer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof EMAIL_TEMPLATES[0] | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["kunde", "netzbetreiber"]));
  const [previewEmail, setPreviewEmail] = useState<Email | null>(null);
  const [sending, setSending] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Build address and customer name from available data
  const strasse = detail.strasse || detail.customer?.strasse || "";
  const hausNr = detail.hausNr || detail.customer?.hausNr || "";
  const plz = detail.plz || detail.zipCode || "";
  const ort = detail.ort || detail.customer?.ort || "";
  const address = `${strasse} ${hausNr}, ${plz} ${ort}`.trim();
  const customerName = detail.customerName || `${detail.customer?.vorname || ""} ${detail.customer?.nachname || ""}`.trim() || "Kunde";
  const customerEmail = detail.contactEmail || detail.customer?.email || "";

  // Group emails
  const groupedEmails = useMemo(() => {
    const groups: Record<string, Email[]> = {
      kunde: [],
      netzbetreiber: [],
      intern: [],
    };

    emails.forEach(email => {
      const type = email.recipientType || "intern";
      if (groups[type]) groups[type].push(email);
    });

    // Sort by date (newest first)
    Object.values(groups).forEach(g => g.sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    ));

    return groups;
  }, [emails]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  // Template placeholders
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{kunde}/g, customerName)
      .replace(/{adresse}/g, address)
      .replace(/{anlagenId}/g, detail.publicId || String(detail.id))
      .replace(/{status}/g, detail.status || "")
      .replace(/{leistung}/g, String(detail.totalKwp || ""));
  };

  const handleSelectTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setComposeSubject(replacePlaceholders(template.subject));
    setComposeBody(replacePlaceholders(template.body));
    
    if (template.recipientType === "kunde") {
      setComposeTo(customerEmail);
    } else {
      setComposeTo(""); // No direct NB email access
    }
    
    setShowComposer(true);
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      showToast("Bitte alle Felder ausfüllen", "error");
      return;
    }

    setSending(true);
    try {
      await api.email.send(installationId, {
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });
      showToast("E-Mail gesendet", "success");
      setShowComposer(false);
      resetComposer();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Senden", "error");
    } finally {
      setSending(false);
    }
  };

  const resetComposer = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setSelectedTemplate(null);
  };

  const getGroupLabel = (group: string) => {
    switch (group) {
      case "kunde": return "An Kunde";
      case "netzbetreiber": return "An Netzbetreiber";
      case "intern": return "Intern";
      default: return group;
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case "kunde": return User;
      case "netzbetreiber": return Building2;
      default: return Mail;
    }
  };

  return (
    <div className="dp-emails">
      {/* Header with Quick Templates */}
      {!isKunde && (
        <div className="dp-emails-header">
          <div className="dp-emails-templates">
            <span className="dp-emails-templates__label">Schnellvorlagen:</span>
            <div className="dp-emails-templates__list">
              {EMAIL_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  className="dp-emails-template-btn"
                  onClick={() => handleSelectTemplate(template)}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
          <button 
            className="dp-btn dp-btn--primary dp-btn--sm"
            onClick={() => setShowPremiumComposer(true)}
          >
            <Pen size={14} /> Mit Signatur senden
          </button>
          <button 
            className="dp-btn dp-btn--sm"
            onClick={() => setShowComposer(true)}
          >
            <Plus size={14} /> Schnell-E-Mail
          </button>
        </div>
      )}

      {/* Email Groups */}
      <div className="dp-emails-groups">
        {Object.entries(groupedEmails).map(([group, groupEmails]) => {
          if (groupEmails.length === 0) return null;
          const isExpanded = expandedGroups.has(group);
          const GroupIcon = getGroupIcon(group);

          return (
            <div key={group} className="dp-emails-group">
              <button 
                className="dp-emails-group__header"
                onClick={() => toggleGroup(group)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <GroupIcon size={16} />
                <span>{getGroupLabel(group)}</span>
                <span className="dp-emails-group__count">{groupEmails.length}</span>
              </button>

              {isExpanded && (
                <div className="dp-emails-group__list">
                  {groupEmails.map(email => (
                    <div 
                      key={email.id} 
                      className={`dp-email-item ${email.direction === "incoming" ? "dp-email-item--incoming" : ""}`}
                      onClick={() => setPreviewEmail(email)}
                    >
                      <div className="dp-email-item__icon">
                        {email.direction === "incoming" ? (
                          <Reply size={14} />
                        ) : (
                          <Send size={14} />
                        )}
                      </div>
                      <div className="dp-email-item__content">
                        <div className="dp-email-item__header">
                          <span className="dp-email-item__date">
                            {new Date(email.sentAt).toLocaleDateString("de-DE", {
                              day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                          {email.status === "failed" && (
                            <span className="dp-email-item__status dp-email-item__status--failed">
                              <AlertCircle size={12} /> Fehler
                            </span>
                          )}
                          {email.status === "delivered" && (
                            <span className="dp-email-item__status dp-email-item__status--delivered">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <span className="dp-email-item__subject">{email.subject}</span>
                        {email.attachments && email.attachments.length > 0 && (
                          <span className="dp-email-item__attachments">
                            <Paperclip size={12} /> {email.attachments.length}
                          </span>
                        )}
                      </div>
                      <button className="dp-email-item__action">
                        <Eye size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {emails.length === 0 && (
          <div className="dp-emails-empty">
            <Mail size={48} />
            <p>Noch keine E-Mails</p>
            {!isKunde && (
              <button className="dp-btn dp-btn--primary" onClick={() => setShowComposer(true)}>
                <Plus size={14} /> Erste E-Mail senden
              </button>
            )}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="dp-modal-overlay" onClick={() => setShowComposer(false)}>
          <div className="dp-modal dp-modal--lg" onClick={e => e.stopPropagation()}>
            <div className="dp-modal__header">
              <h3>
                {selectedTemplate ? `E-Mail: ${selectedTemplate.label}` : "Neue E-Mail"}
              </h3>
              <button className="dp-btn dp-btn--icon" onClick={() => { setShowComposer(false); resetComposer(); }}>
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              <div className="dp-email-composer">
                <div className="dp-email-composer__field">
                  <label>An</label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    placeholder="email@beispiel.de"
                  />
                </div>

                <div className="dp-email-composer__field">
                  <label>Betreff</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder="Betreff eingeben..."
                  />
                </div>

                <div className="dp-email-composer__field">
                  <label>Nachricht</label>
                  <textarea
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    rows={12}
                  />
                </div>
              </div>
            </div>

            <div className="dp-modal__footer">
              <button className="dp-btn" onClick={() => { setShowComposer(false); resetComposer(); }}>
                Abbrechen
              </button>
              <button 
                className="dp-btn dp-btn--primary"
                onClick={handleSend}
                disabled={sending || !composeTo || !composeSubject || !composeBody}
              >
                {sending ? <Loader2 size={14} className="dp-spin" /> : <Send size={14} />}
                Senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewEmail && (
        <div className="dp-modal-overlay" onClick={() => setPreviewEmail(null)}>
          <div className="dp-modal dp-modal--md" onClick={e => e.stopPropagation()}>
            <div className="dp-modal__header">
              <h3>{previewEmail.subject}</h3>
              <button className="dp-btn dp-btn--icon" onClick={() => setPreviewEmail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              <div className="dp-email-preview">
                <div className="dp-email-preview__meta">
                  <div>
                    <strong>{previewEmail.direction === "incoming" ? "Von:" : "An:"}</strong> {previewEmail.recipient}
                  </div>
                  <div>
                    <strong>Datum:</strong> {new Date(previewEmail.sentAt).toLocaleString("de-DE")}
                  </div>
                </div>

                <div className="dp-email-preview__body">
                  {previewEmail.body || "Kein Inhalt verfügbar"}
                </div>

                {previewEmail.attachments && previewEmail.attachments.length > 0 && (
                  <div className="dp-email-preview__attachments">
                    <strong>Anhänge:</strong>
                    {previewEmail.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" className="dp-email-preview__attachment">
                        <Paperclip size={12} /> {att.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dp-modal__footer">
              <button className="dp-btn" onClick={() => setPreviewEmail(null)}>
                Schließen
              </button>
              {!isKunde && previewEmail.direction === "incoming" && (
                <button 
                  className="dp-btn dp-btn--primary"
                  onClick={() => {
                    setPreviewEmail(null);
                    setComposeSubject(`RE: ${previewEmail.subject}`);
                    setComposeTo(previewEmail.recipient);
                    setShowComposer(true);
                  }}
                >
                  <Reply size={14} /> Antworten
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium EmailComposer mit Signatur */}
      {showPremiumComposer && (
        <EmailComposer
          installation={detail}
          documents={documents}
          defaultRecipient={detail.gridOperatorEmail}
          onSend={async (data: EmailSendData) => {
            try {
              await api.email.send(installationId, {
                to: data.to.join(", "),
                subject: data.subject,
                body: data.body,
              });
              onRefresh();
              return { success: true };
            } catch (e: any) {
              return { success: false, error: e.message };
            }
          }}
          onClose={() => setShowPremiumComposer(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default EmailsTab;
