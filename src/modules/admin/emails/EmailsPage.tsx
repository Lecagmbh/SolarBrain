/**
 * Email Inbox Management - inbox@baunity.de
 *
 * Zentrale Übersicht aller eingehenden Emails:
 * - KI-basierte automatische Zuordnung
 * - Manuelle Zuordnung für nicht erkannte Emails
 * - Status-Übersicht des Email-Services
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mail, Inbox, RefreshCw, Search, CheckCircle2, AlertTriangle,
  Clock, Loader2, Archive, Link2, User, Calendar, ChevronRight,
  Sparkles, FileText, Paperclip, Building2, X, ExternalLink,
  Bot, Target, Zap, Activity, MailOpen, ArrowRight,
} from "lucide-react";
import {
  getEmailInboxStatus,
  getUnassignedEmails,
  triggerEmailPoll,
  assignEmailToInstallation,
  archiveEmail,
  type EmailInboxStatus,
  type UnassignedEmail,
} from "../../../api/emailInbox";
import { apiGet } from "../../../api/client";
import "./EmailsPage.css";

// Installation für Suche
interface InstallationOption {
  id: number;
  publicId: string;
  customerName: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  status: string;
}

// Helpers
function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  if (hours < 24) return `vor ${hours} Std`;
  if (days === 1) return "Gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return formatDate(iso);
}

function getConfidenceColor(confidence: number | undefined): string {
  if (!confidence) return "#64748b";
  if (confidence >= 80) return "#22c55e";
  if (confidence >= 50) return "#f59e0b";
  return "#ef4444";
}

function getAITypeLabel(type: string | undefined): string {
  if (!type) return "Unbekannt";
  const labels: Record<string, string> = {
    NETZBETREIBER_ANTWORT: "Netzbetreiber-Antwort",
    KUNDENANFRAGE: "Kundenanfrage",
    DOKUMENT: "Dokument",
    RUECKFRAGE: "Rückfrage",
    GENEHMIGUNG: "Genehmigung",
    ABLEHNUNG: "Ablehnung",
    SPAM: "Spam/Irrelevant",
    UNKNOWN: "Unbekannt",
  };
  return labels[type] || type;
}

export default function EmailsPage() {
  const [status, setStatus] = useState<EmailInboxStatus | null>(null);
  const [emails, setEmails] = useState<UnassignedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedEmail, setSelectedEmail] = useState<UnassignedEmail | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [installationSearch, setInstallationSearch] = useState("");
  const [installationResults, setInstallationResults] = useState<InstallationOption[]>([]);
  const [searchingInstallations, setSearchingInstallations] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Load Status and Emails
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, emailsData] = await Promise.all([
        getEmailInboxStatus(),
        getUnassignedEmails(),
      ]);
      setStatus(statusData);
      setEmails(emailsData);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manual Poll
  const handlePoll = async () => {
    setPolling(true);
    try {
      const result = await triggerEmailPoll();
      console.log("Poll Result:", result);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPolling(false);
    }
  };

  // Search Installations (debounced)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchInstallations = useCallback((query: string) => {
    clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      setInstallationResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchingInstallations(true);
      try {
        const params = new URLSearchParams({ q: query, limit: "10" });
        const res = await apiGet<{ data: InstallationOption[] }>(`/api/email-inbox/search-installations?${params}`);
        setInstallationResults(res.data || []);
      } catch (err) {
        console.error(err);
        setInstallationResults([]);
      } finally {
        setSearchingInstallations(false);
      }
    }, 350);
  }, []);

  // Assign Email
  const handleAssign = async (installationId: number) => {
    if (!selectedEmail) return;
    setAssigning(true);
    try {
      await assignEmailToInstallation(selectedEmail.id, installationId);
      setAssignModalOpen(false);
      setSelectedEmail(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Archive Email
  const handleArchive = async (email: UnassignedEmail) => {
    try {
      await archiveEmail(email.id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter Emails
  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(q) ||
      email.fromAddress?.toLowerCase().includes(q) ||
      email.fromName?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="email-inbox-page">
        <div className="email-inbox-page__loading">
          <Loader2 size={48} className="email-inbox-page__spinner" />
          <span>Email-Postfach wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="email-inbox-page">
      {/* Background Effects */}
      <div className="email-inbox-page__bg">
        <div className="email-inbox-page__orb email-inbox-page__orb--1" />
        <div className="email-inbox-page__orb email-inbox-page__orb--2" />
      </div>

      {/* Header */}
      <header className="email-inbox-page__header">
        <div className="email-inbox-page__header-left">
          <div className="email-inbox-page__header-icon">
            <Inbox size={28} />
          </div>
          <div>
            <h1 className="email-inbox-page__title">Zentrales Email-Postfach</h1>
            <p className="email-inbox-page__subtitle">inbox@baunity.de</p>
          </div>
        </div>
        <div className="email-inbox-page__header-actions">
          <button
            className="email-inbox-page__btn email-inbox-page__btn--secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "email-inbox-page__spin" : ""} />
          </button>
          <button
            className="email-inbox-page__btn email-inbox-page__btn--primary"
            onClick={handlePoll}
            disabled={polling}
          >
            {polling ? (
              <>
                <Loader2 size={18} className="email-inbox-page__spin" /> Prüfe...
              </>
            ) : (
              <>
                <Mail size={18} /> Jetzt prüfen
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="email-inbox-page__error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Status Cards */}
      {status && (
        <div className="email-inbox-page__status-grid">
          <div className="email-inbox-status-card">
            <div className="email-inbox-status-card__icon email-inbox-status-card__icon--blue">
              <Activity size={20} />
            </div>
            <div className="email-inbox-status-card__content">
              <span className="email-inbox-status-card__label">Service-Status</span>
              <span className={`email-inbox-status-card__value ${status.isRunning ? "email-inbox-status-card__value--success" : "email-inbox-status-card__value--error"}`}>
                {status.isRunning ? "Aktiv" : "Gestoppt"}
              </span>
            </div>
          </div>
          <div className="email-inbox-status-card">
            <div className="email-inbox-status-card__icon email-inbox-status-card__icon--purple">
              <Clock size={20} />
            </div>
            <div className="email-inbox-status-card__content">
              <span className="email-inbox-status-card__label">Letzte Prüfung</span>
              <span className="email-inbox-status-card__value">
                {status.lastChecked ? formatRelativeTime(status.lastChecked) : "Nie"}
              </span>
            </div>
          </div>
          <div className="email-inbox-status-card">
            <div className="email-inbox-status-card__icon email-inbox-status-card__icon--green">
              <CheckCircle2 size={20} />
            </div>
            <div className="email-inbox-status-card__content">
              <span className="email-inbox-status-card__label">Zugeordnet (24h)</span>
              <span className="email-inbox-status-card__value">{status.stats?.last24h?.assigned || 0}</span>
            </div>
          </div>
          <div className="email-inbox-status-card">
            <div className="email-inbox-status-card__icon email-inbox-status-card__icon--amber">
              <AlertTriangle size={20} />
            </div>
            <div className="email-inbox-status-card__content">
              <span className="email-inbox-status-card__label">Manuell nötig</span>
              <span className="email-inbox-status-card__value">{filteredEmails.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Emails Section */}
      <section className="email-inbox-page__section">
        <div className="email-inbox-page__section-header">
          <div className="email-inbox-page__section-title">
            <Target size={20} />
            <h2>Manuelle Zuordnung erforderlich</h2>
            <span className="email-inbox-page__badge">{filteredEmails.length}</span>
          </div>
          <div className="email-inbox-page__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Emails durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredEmails.length === 0 ? (
          <div className="email-inbox-page__empty">
            <CheckCircle2 size={64} />
            <h3>Alles erledigt!</h3>
            <p>Keine Emails erfordern manuelle Zuordnung</p>
          </div>
        ) : (
          <div className="email-inbox-page__email-list">
            {filteredEmails.map((email) => (
              <div key={email.id} className="email-card">
                <div className="email-card__header">
                  <div className="email-card__from">
                    <User size={16} />
                    <span className="email-card__from-name">
                      {email.fromName || email.fromAddress}
                    </span>
                    {email.fromName && (
                      <span className="email-card__from-email">&lt;{email.fromAddress}&gt;</span>
                    )}
                  </div>
                  <div className="email-card__date">
                    <Calendar size={14} />
                    {formatRelativeTime(email.receivedAt)}
                  </div>
                </div>

                <div className="email-card__subject">{email.subject || "(Kein Betreff)"}</div>

                {/* KI-Analyse */}
                {email.aiType && (
                  <div className="email-card__ai">
                    <div className="email-card__ai-badge">
                      <Bot size={14} />
                      <span>{getAITypeLabel(email.aiType)}</span>
                      {email.aiConfidence && (
                        <span
                          className="email-card__ai-confidence"
                          style={{ color: getConfidenceColor(email.aiConfidence) }}
                        >
                          {email.aiConfidence}%
                        </span>
                      )}
                    </div>
                    {email.aiSummary && (
                      <p className="email-card__ai-summary">{email.aiSummary}</p>
                    )}
                  </div>
                )}

                <div className="email-card__actions">
                  <button
                    className="email-card__btn email-card__btn--primary"
                    onClick={() => {
                      setSelectedEmail(email);
                      setAssignModalOpen(true);
                      setInstallationSearch("");
                      setInstallationResults([]);
                    }}
                  >
                    <Link2 size={14} />
                    Zuordnen
                  </button>
                  <button
                    className="email-card__btn email-card__btn--secondary"
                    onClick={() => handleArchive(email)}
                  >
                    <Archive size={14} />
                    Archivieren
                  </button>
                  <button className="email-card__btn email-card__btn--ghost">
                    <ExternalLink size={14} />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assignment Modal */}
      {assignModalOpen && selectedEmail && (
        <div className="email-assign-modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="email-assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-assign-modal__header">
              <div className="email-assign-modal__header-icon">
                <Link2 size={24} />
              </div>
              <div>
                <h3>Email zuordnen</h3>
                <p>Wähle eine Anlage für diese Email</p>
              </div>
              <button className="email-assign-modal__close" onClick={() => setAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="email-assign-modal__email-preview">
              <div className="email-assign-modal__email-subject">{selectedEmail.subject}</div>
              <div className="email-assign-modal__email-from">
                Von: {selectedEmail.fromName || selectedEmail.fromAddress}
              </div>
            </div>

            <div className="email-assign-modal__search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Anlage suchen (ID, Kunde, Adresse)..."
                value={installationSearch}
                onChange={(e) => {
                  setInstallationSearch(e.target.value);
                  searchInstallations(e.target.value);
                }}
                autoFocus
              />
              {searchingInstallations && <Loader2 size={18} className="email-inbox-page__spin" />}
            </div>

            <div className="email-assign-modal__results">
              {installationResults.length === 0 && installationSearch.length >= 2 && !searchingInstallations && (
                <div className="email-assign-modal__no-results">
                  <Search size={32} />
                  <span>Keine Anlagen gefunden</span>
                </div>
              )}
              {installationResults.map((inst) => (
                <button
                  key={inst.id}
                  className="email-assign-modal__result-item"
                  onClick={() => handleAssign(inst.id)}
                  disabled={assigning}
                >
                  <div className="email-assign-modal__result-icon">
                    <Building2 size={20} />
                  </div>
                  <div className="email-assign-modal__result-info">
                    <div className="email-assign-modal__result-id">{inst.publicId}</div>
                    <div className="email-assign-modal__result-customer">{inst.customerName}</div>
                    {(inst.strasse || inst.ort) && (
                      <div className="email-assign-modal__result-address">
                        {[inst.strasse, inst.plz, inst.ort].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="email-assign-modal__result-status">
                    <span className="email-assign-modal__status-badge">{inst.status}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            {assigning && (
              <div className="email-assign-modal__loading">
                <Loader2 size={24} className="email-inbox-page__spin" />
                <span>Wird zugeordnet...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
