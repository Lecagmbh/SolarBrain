/**
 * KOMMUNIKATION TAB - NB-Kommunikation mit Korrespondenzverlauf
 * Features:
 * - NB-Info Card
 * - Action Buttons (Erstanmeldung, Nachfrage, Freie Email)
 * - Korrespondenz-Verlauf
 * - Antwort erfassen Modal
 */

import { useState, useEffect } from "react";
import {
  Building2, Mail, Globe, Clock, Send, MessageSquare,
  Plus, Check, X, AlertCircle, FileText, Upload,
  ChevronDown, ChevronRight, Reply, Eye, Loader2,
  ExternalLink, MessageCircle, CheckCircle, XCircle,
  HelpCircle, Calendar, User, Paperclip,
} from "lucide-react";
import { api } from "../../../services/api";
import type { InstallationDetail, GridOperator } from "../../../types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Correspondence {
  id: number;
  type: "erstanmeldung" | "nachfrage" | "antwort" | "email" | "portal";
  direction: "outgoing" | "incoming";
  subject: string;
  message?: string;
  sentAt: string;
  responseType?: "genehmigt" | "rueckfrage" | "abgelehnt" | null;
  documents?: { id: number; name: string }[];
  sentBy?: string;
  notes?: string;
}

interface NBStats {
  avgResponseDays: number | null;
  totalCorrespondence: number;
  pendingResponse: boolean;
  lastContactAt: string | null;
}

interface KommunikationTabProps {
  detail: InstallationDetail;
  gridOperator: GridOperator | null;
  installationId: number;
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORRESPONDENCE TYPE LABELS
// ═══════════════════════════════════════════════════════════════════════════

const CORRESPONDENCE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  erstanmeldung: { label: "Erstanmeldung", icon: Send, color: "#3b82f6" },
  nachfrage: { label: "Nachfrage", icon: MessageSquare, color: "#f59e0b" },
  antwort: { label: "NB-Antwort", icon: Reply, color: "#10b981" },
  email: { label: "E-Mail", icon: Mail, color: "#EAD068" },
  portal: { label: "Portal-Einreichung", icon: Globe, color: "#06b6d4" },
};

const RESPONSE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Check; color: string }> = {
  genehmigt: { label: "Genehmigt", icon: CheckCircle, color: "#10b981" },
  rueckfrage: { label: "Rückfrage", icon: HelpCircle, color: "#f59e0b" },
  abgelehnt: { label: "Abgelehnt", icon: XCircle, color: "#ef4444" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function KommunikationTab({
  detail,
  gridOperator,
  installationId,
  onRefresh,
  showToast,
  isKunde = false,
}: KommunikationTabProps) {
  // State
  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);
  const [nbStats, setNbStats] = useState<NBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendType, setSendType] = useState<"erstanmeldung" | "nachfrage" | "email">("email");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<Correspondence | null>(null);

  // Send form state
  const [sendSubject, setSendSubject] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Response form state
  const [responseType, setResponseType] = useState<"genehmigt" | "rueckfrage" | "abgelehnt">("genehmigt");
  const [responseNotes, setResponseNotes] = useState("");
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [savingResponse, setSavingResponse] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadCorrespondence();
  }, [installationId]);

  // Map backend NbCorrespondence to frontend Correspondence format
  const mapCorrespondence = (raw: any): Correspondence => {
    const typeMap: Record<string, Correspondence["type"]> = {
      ERSTANMELDUNG: "erstanmeldung",
      NACHFRAGE_1: "nachfrage",
      NACHFRAGE_2: "nachfrage",
      NACHFRAGE_3: "nachfrage",
      RUECKFRAGE_ANTWORT: "email",
      DOKUMENT_NACHREICHUNG: "email",
      STORNIERUNG: "email",
      ADMIN_ALERT: "email",
    };
    const responseMap: Record<string, Correspondence["responseType"]> = {
      GENEHMIGT: "genehmigt",
      RUECKFRAGE: "rueckfrage",
      ABGELEHNT: "abgelehnt",
    };
    return {
      id: raw.id,
      type: typeMap[raw.type] || "email",
      direction: raw.isAutomatic ? "outgoing" : "outgoing",
      subject: raw.subject || `${raw.type} an ${raw.sentTo}`,
      message: raw.bodyPreview || undefined,
      sentAt: raw.sentAt,
      responseType: raw.responseType ? (responseMap[raw.responseType] || null) : null,
      sentBy: raw.sentBy === "AUTO" ? "Automatisch" : raw.sentBy || undefined,
      notes: raw.responseNote || undefined,
    };
  };

  const loadCorrespondence = async () => {
    setLoading(true);
    try {
      // Load correspondence history
      const [corrData, statsData] = await Promise.all([
        api.installations.getCorrespondence?.(installationId).catch(() => []),
        api.installations.getNBStats?.(installationId).catch(() => null),
      ]);

      const mapped = (corrData || []).map(mapCorrespondence);
      setCorrespondence(mapped);
      setNbStats(statsData || {
        avgResponseDays: null,
        totalCorrespondence: mapped.length,
        pendingResponse: detail.status === "beim_nb",
        lastContactAt: mapped[0]?.sentAt || null,
      });
    } catch (e) {
      console.error("Failed to load correspondence:", e);
      setCorrespondence([]);
      setNbStats({
        avgResponseDays: null,
        totalCorrespondence: 0,
        pendingResponse: detail.status === "beim_nb",
        lastContactAt: null,
      });
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleOpenSendModal = (type: "erstanmeldung" | "nachfrage" | "email") => {
    setSendType(type);

    // Pre-fill based on type
    if (type === "erstanmeldung") {
      setSendSubject(`Netzanmeldung - ${detail.strasse} ${detail.hausNr}, ${detail.plz} ${detail.ort}`);
      setSendMessage(`Sehr geehrte Damen und Herren,

im Auftrag unseres Kunden reichen wir hiermit die Unterlagen zur Netzanmeldung ein:

Standort: ${detail.strasse} ${detail.hausNr}, ${detail.plz} ${detail.ort}
Anlagenleistung: ${Number(detail.totalKwp || 0).toFixed(2)} kWp

Im Anhang finden Sie alle erforderlichen Dokumente.

Mit freundlichen Grüßen
LeCa GmbH & Co. KG`);
    } else if (type === "nachfrage") {
      const vorgangsnummer = detail.nbCaseNumber || detail.publicId || String(detail.id);
      const address = `${detail.strasse || ""} ${detail.hausNr || ""}, ${detail.plz || ""} ${detail.ort || ""}`.trim();
      const referenceDate = detail.nbEingereichtAm || detail.createdAt;
      const daysSince = referenceDate
        ? Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const reminderNum = (detail.reminderCount ?? 0) + 1;
      setSendSubject(`${vorgangsnummer} – ${reminderNum}. Nachfrage zum Bearbeitungsstand`);
      setSendMessage(`Sehr geehrte Damen und Herren,

zu dem Vorgang ${vorgangsnummer} (${detail.customerName || "–"}, ${address}) warten wir seit ${daysSince} Tagen auf eine Rückmeldung.

Wir bitten Sie, uns den aktuellen Bearbeitungsstand mitzuteilen.

Mit freundlichen Grüßen

Hartmut Bischoff
LeCa GmbH & Co. KG
netzanmeldung@lecagmbh.de
Tel: 0721-98618238`);
    } else {
      setSendSubject("");
      setSendMessage("");
    }

    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!sendSubject || !sendMessage) {
      showToast("Bitte alle Felder ausfüllen", "error");
      return;
    }

    setSending(true);
    try {
      await api.email.sendToNB?.(installationId, {
        type: sendType,
        subject: sendSubject,
        message: sendMessage,
        to: gridOperator?.email || "",
      });

      showToast(sendType === "erstanmeldung" ? "Erstanmeldung gesendet" : "E-Mail gesendet", "success");
      setShowSendModal(false);
      resetSendForm();
      loadCorrespondence();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Senden", "error");
    } finally {
      setSending(false);
    }
  };

  const resetSendForm = () => {
    setSendSubject("");
    setSendMessage("");
  };

  const handleSaveResponse = async () => {
    setSavingResponse(true);
    try {
      const formData = new FormData();
      formData.append("responseType", responseType);
      formData.append("notes", responseNotes);
      if (responseFile) {
        formData.append("document", responseFile);
      }

      await api.installations.recordNBResponse?.(installationId, {
        responseType,
        notes: responseNotes,
        hasDocument: !!responseFile,
      });

      showToast("Antwort erfasst", "success");
      setShowResponseModal(false);
      resetResponseForm();
      loadCorrespondence();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Speichern", "error");
    } finally {
      setSavingResponse(false);
    }
  };

  const resetResponseForm = () => {
    setResponseType("genehmigt");
    setResponseNotes("");
    setResponseFile(null);
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="dp-loading">
        <Loader2 className="dp-spin" size={32} />
        <span>Lade Kommunikation...</span>
      </div>
    );
  }

  return (
    <div className="dp-kommunikation">
      {/* NB-Info Card */}
      <div className="dp-nb-info-card">
        <div className="dp-nb-info-card__header">
          <Building2 size={20} />
          <h3>Netzbetreiber</h3>
        </div>

        <div className="dp-nb-info-card__content">
          <div className="dp-nb-info-card__name">
            {gridOperator?.name || detail.gridOperator || "Nicht zugewiesen"}
          </div>

          <div className="dp-nb-info-card__details">
            <div className="dp-nb-info-card__item">
              <Mail size={14} />
              <span>{gridOperator?.email || "Keine E-Mail hinterlegt"}</span>
              {gridOperator?.email && (
                <a href={`mailto:${gridOperator.email}`} className="dp-nb-info-card__link">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="dp-nb-info-card__item">
              <Globe size={14} />
              <span>{gridOperator?.portalUrl ? "Portal verfügbar" : "Kein Portal"}</span>
              {gridOperator?.portalUrl && (
                <a href={gridOperator.portalUrl} target="_blank" className="dp-nb-info-card__link">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="dp-nb-info-card__item">
              <Clock size={14} />
              <span>
                Ø Antwortzeit: {nbStats?.avgResponseDays
                  ? `${nbStats.avgResponseDays} Tage`
                  : "Keine Daten"}
              </span>
            </div>
          </div>

          {nbStats?.pendingResponse && (
            <div className="dp-nb-info-card__status dp-nb-info-card__status--pending">
              <AlertCircle size={14} />
              <span>Warte auf Antwort vom NB</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isKunde && (
        <div className="dp-nb-actions">
          <button
            className="dp-nb-action-btn dp-nb-action-btn--primary"
            onClick={() => handleOpenSendModal("erstanmeldung")}
          >
            <Send size={16} />
            <span>Erstanmeldung senden</span>
          </button>

          <button
            className="dp-nb-action-btn dp-nb-action-btn--secondary"
            onClick={() => handleOpenSendModal("nachfrage")}
          >
            <MessageSquare size={16} />
            <span>Nachfrage senden</span>
          </button>

          <button
            className="dp-nb-action-btn"
            onClick={() => handleOpenSendModal("email")}
          >
            <Mail size={16} />
            <span>Freie E-Mail</span>
          </button>

          <button
            className="dp-nb-action-btn dp-nb-action-btn--success"
            onClick={() => setShowResponseModal(true)}
          >
            <Plus size={16} />
            <span>Antwort erfassen</span>
          </button>
        </div>
      )}

      {/* Korrespondenz-Verlauf */}
      <div className="dp-correspondence">
        <div className="dp-correspondence__header">
          <MessageCircle size={18} />
          <h3>Korrespondenz-Verlauf</h3>
          <span className="dp-correspondence__count">{correspondence.length}</span>
        </div>

        {correspondence.length === 0 ? (
          <div className="dp-correspondence__empty">
            <MessageCircle size={48} />
            <p>Noch keine Korrespondenz</p>
            {!isKunde && (
              <button
                className="dp-btn dp-btn--primary"
                onClick={() => handleOpenSendModal("erstanmeldung")}
              >
                <Send size={14} />
                Erstanmeldung senden
              </button>
            )}
          </div>
        ) : (
          <div className="dp-correspondence__list">
            {correspondence.map((item) => {
              const typeConfig = CORRESPONDENCE_TYPE_CONFIG[item.type] || CORRESPONDENCE_TYPE_CONFIG.email;
              const TypeIcon = typeConfig.icon;
              const isExpanded = expandedItems.has(item.id);
              const responseConfig = item.responseType ? RESPONSE_TYPE_CONFIG[item.responseType] : null;

              return (
                <div
                  key={item.id}
                  className={`dp-correspondence-item ${item.direction === "incoming" ? "dp-correspondence-item--incoming" : ""}`}
                >
                  <div
                    className="dp-correspondence-item__header"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="dp-correspondence-item__icon" style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}>
                      <TypeIcon size={16} />
                    </div>

                    <div className="dp-correspondence-item__main">
                      <div className="dp-correspondence-item__top">
                        <span className="dp-correspondence-item__type" style={{ color: typeConfig.color }}>
                          {typeConfig.label}
                        </span>
                        <span className="dp-correspondence-item__date">
                          <Calendar size={12} />
                          {new Date(item.sentAt).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="dp-correspondence-item__subject">{item.subject}</div>
                      {item.sentBy && (
                        <div className="dp-correspondence-item__sender">
                          <User size={12} />
                          {item.sentBy}
                        </div>
                      )}
                    </div>

                    <div className="dp-correspondence-item__meta">
                      {responseConfig && (
                        <span
                          className="dp-correspondence-item__response"
                          style={{ backgroundColor: `${responseConfig.color}20`, color: responseConfig.color }}
                        >
                          <responseConfig.icon size={12} />
                          {responseConfig.label}
                        </span>
                      )}
                      {item.documents && item.documents.length > 0 && (
                        <span className="dp-correspondence-item__docs">
                          <Paperclip size={12} />
                          {item.documents.length}
                        </span>
                      )}
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="dp-correspondence-item__content">
                      {item.message && (
                        <div className="dp-correspondence-item__message">
                          {item.message}
                        </div>
                      )}
                      {item.notes && (
                        <div className="dp-correspondence-item__notes">
                          <strong>Notizen:</strong> {item.notes}
                        </div>
                      )}
                      {item.documents && item.documents.length > 0 && (
                        <div className="dp-correspondence-item__documents">
                          <strong>Dokumente:</strong>
                          <div className="dp-correspondence-item__doc-list">
                            {item.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={`/api/documents/${doc.id}/download`}
                                target="_blank"
                                className="dp-correspondence-item__doc"
                              >
                                <FileText size={12} />
                                {doc.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="dp-modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="dp-modal dp-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal__header">
              <h3>
                {sendType === "erstanmeldung" && "Erstanmeldung senden"}
                {sendType === "nachfrage" && "Nachfrage senden"}
                {sendType === "email" && "E-Mail an Netzbetreiber"}
              </h3>
              <button className="dp-btn dp-btn--icon" onClick={() => { setShowSendModal(false); resetSendForm(); }}>
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              <div className="dp-send-form">
                <div className="dp-send-form__recipient">
                  <label>An</label>
                  <div className="dp-send-form__recipient-value">
                    <Building2 size={14} />
                    <span>{gridOperator?.name || "Netzbetreiber"}</span>
                    <span className="dp-send-form__recipient-email">
                      ({gridOperator?.email || "Keine E-Mail"})
                    </span>
                  </div>
                </div>

                <div className="dp-send-form__field">
                  <label>Betreff</label>
                  <input
                    type="text"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                    placeholder="Betreff eingeben..."
                  />
                </div>

                <div className="dp-send-form__field">
                  <label>Nachricht</label>
                  <textarea
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    rows={12}
                  />
                </div>

                <div className="dp-send-form__info">
                  <AlertCircle size={14} />
                  <span>Die zugehörigen Dokumente werden automatisch angehängt.</span>
                </div>
              </div>
            </div>

            <div className="dp-modal__footer">
              <button className="dp-btn" onClick={() => { setShowSendModal(false); resetSendForm(); }}>
                Abbrechen
              </button>
              <button
                className="dp-btn dp-btn--primary"
                onClick={handleSend}
                disabled={sending || !sendSubject || !sendMessage}
              >
                {sending ? <Loader2 size={14} className="dp-spin" /> : <Send size={14} />}
                {sendType === "erstanmeldung" ? "Erstanmeldung absenden" : "Senden"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="dp-modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="dp-modal dp-modal--md" onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal__header">
              <h3>NB-Antwort erfassen</h3>
              <button className="dp-btn dp-btn--icon" onClick={() => { setShowResponseModal(false); resetResponseForm(); }}>
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              <div className="dp-response-form">
                <div className="dp-response-form__field">
                  <label>Antworttyp</label>
                  <div className="dp-response-form__options">
                    {(Object.entries(RESPONSE_TYPE_CONFIG) as [string, typeof RESPONSE_TYPE_CONFIG[string]][]).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          className={`dp-response-option ${responseType === key ? "dp-response-option--active" : ""}`}
                          style={{
                            borderColor: responseType === key ? config.color : undefined,
                            backgroundColor: responseType === key ? `${config.color}10` : undefined,
                          }}
                          onClick={() => setResponseType(key as typeof responseType)}
                        >
                          <Icon size={18} style={{ color: config.color }} />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="dp-response-form__field">
                  <label>Notizen / Details</label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen zur Antwort..."
                    rows={4}
                  />
                </div>

                <div className="dp-response-form__field">
                  <label>Dokument hochladen (optional)</label>
                  <div className="dp-response-form__upload">
                    <input
                      type="file"
                      id="response-file"
                      onChange={(e) => setResponseFile(e.target.files?.[0] || null)}
                      className="dp-response-form__upload-input"
                    />
                    <label htmlFor="response-file" className="dp-response-form__upload-label">
                      <Upload size={18} />
                      <span>{responseFile ? responseFile.name : "Datei auswählen"}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="dp-modal__footer">
              <button className="dp-btn" onClick={() => { setShowResponseModal(false); resetResponseForm(); }}>
                Abbrechen
              </button>
              <button
                className="dp-btn dp-btn--primary"
                onClick={handleSaveResponse}
                disabled={savingResponse}
              >
                {savingResponse ? <Loader2 size={14} className="dp-spin" /> : <Check size={14} />}
                Antwort speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KommunikationTab;
