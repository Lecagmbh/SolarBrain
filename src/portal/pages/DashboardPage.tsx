/**
 * Portal Dashboard Page
 * =====================
 * Hauptseite des Endkunden-Portals mit Status-Übersicht.
 * Premium Design mit umfassenden Informationen zum Netzanmeldungs-Prozess.
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./dashboard.css";
import { usePortal } from "../PortalContext";
import {
  getPortalInstallation,
  getPortalTimeline,
  getPortalDocuments,
  type PortalInstallationDetail,
  type TimelineEntry,
  type DocumentCompleteness,
} from "../api";
import { StatusTimeline } from "../components/StatusTimeline";
// Deaktiviert – Alert-System wird komplett überarbeitet
// import { AlertBanner } from "../components/AlertBanner";
import { KundenfreigabeBanner } from "../components/KundenfreigabeBanner";
import { GuideDrawer } from "../components/GuideDrawer";
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  Settings,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Send,
  ClipboardCheck,
  Lightbulb,
  Shield,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Upload,
  Sun,
  Battery,
  PlugZap,
} from "lucide-react";

export function PortalDashboardPage() {
  const { installations, selectedInstallation, selectInstallation, loading: listLoading } = usePortal();
  const [searchParams] = useSearchParams();

  const [detail, setDetail] = useState<PortalInstallationDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [docCompleteness, setDocCompleteness] = useState<DocumentCompleteness | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [lastUploadDate, setLastUploadDate] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  // Rechnungen ENTFERNT: Endkunden dürfen keine Rechnungen sehen

  // Deep-Link: ?installation=<id> aus Email-Links selektiert die richtige Anlage
  useEffect(() => {
    const installationParam = searchParams.get("installation");
    if (installationParam && installations.length > 0) {
      const id = parseInt(installationParam, 10);
      if (!isNaN(id) && selectedInstallation?.id !== id) {
        selectInstallation(id);
      }
    }
  }, [searchParams, installations, selectedInstallation?.id, selectInstallation]);

  // Load detail when selection changes
  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedInstallation) return;

      setLoading(true);
      setError(null);

      try {
        const [detailData, timelineData, docsResult] = await Promise.all([
          getPortalInstallation(selectedInstallation.id),
          getPortalTimeline(selectedInstallation.id),
          getPortalDocuments(selectedInstallation.id),
        ]);

        setDetail(detailData);
        setTimeline(timelineData);

        const filteredDocs = docsResult.data.filter((d) => d.kategorie !== "RECHNUNG");
        setDocCompleteness(docsResult.completeness);
        setDocCount(filteredDocs.length);
        if (filteredDocs.length > 0) {
          setLastUploadDate(filteredDocs[0].createdAt);
        } else {
          setLastUploadDate(null);
        }
      } catch (err) {
        console.error("Load detail error:", err);
        setError("Fehler beim Laden der Details");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [selectedInstallation?.id]);

  if (listLoading) {
    return (
      <>
        <div className="pd-loading">
          <div className="pd-loading-spinner">
            <Loader2 size={32} />
          </div>
          <span>Laden...</span>
        </div>
      </>
    );
  }

  if (installations.length === 0) {
    return (
      <>
        <div className="pd-empty">
          <AlertCircle size={48} />
          <h2>Keine Anlagen gefunden</h2>
          <p>Es sind keine Netzanmeldungen mit Ihrem Konto verknüpft.</p>
        </div>
      </>
    );
  }

  const currentStatus = selectedInstallation?.status || "EINGANG";

  return (
    <>
      <div className="pd-dashboard">
        {/* Header */}
        <header className="pd-header">
          <div className="pd-header-title">
            <div className="pd-header-icon">
              <Zap size={24} />
            </div>
            <div>
              <h1>Ihre Netzanmeldung</h1>
              <p>Verfolgen Sie den Status Ihrer Anlage in Echtzeit</p>
            </div>
          </div>
          <button
            onClick={() => setGuideOpen(true)}
            className="pd-help-btn"
            title="Hilfe & Anleitung"
          >
            <HelpCircle size={18} />
            <span>Hilfe</span>
          </button>
        </header>

        {/* Installation Selector (if multiple) */}
        {installations.length > 1 && (
          <div className="pd-selector">
            {installations.map((inst) => (
              <button
                key={inst.id}
                onClick={() => selectInstallation(inst.id)}
                className={`pd-selector-btn ${selectedInstallation?.id === inst.id ? "pd-selector-btn--active" : ""}`}
              >
                <MapPin size={14} />
                {inst.ort || inst.publicId}
              </button>
            ))}
          </div>
        )}

        {/* Main Content - 3 Column Layout */}
        {selectedInstallation && (
          <div className="pd-grid-3col">
            {/* Left Column - Prozess Info */}
            <div className="pd-left">
              {/* Prozess-Schritte */}
              <div className="pd-card pd-process-card">
                <div className="pd-card-header">
                  <h2><ClipboardCheck size={16} /> Der Prozess</h2>
                </div>
                <div className="pd-process-steps">
                  <ProcessStep
                    step={1}
                    title="Eingang"
                    description="Unterlagen werden geprüft"
                    status={getStepStatus("EINGANG", currentStatus)}
                  />
                  <ProcessStep
                    step={2}
                    title="Beim Netzbetreiber"
                    description="Prüfung durch den NB"
                    status={getStepStatus("BEIM_NB", currentStatus)}
                    duration="2-4 Wochen"
                  />
                  <ProcessStep
                    step={3}
                    title="Genehmigung"
                    description="Anlage wurde freigegeben"
                    status={getStepStatus("GENEHMIGT", currentStatus)}
                  />
                  <ProcessStep
                    step={4}
                    title="Inbetriebnahme"
                    description="Zähler wird gesetzt"
                    status={getStepStatus("IBN", currentStatus)}
                  />
                  <ProcessStep
                    step={5}
                    title="Abgeschlossen"
                    description="Anlage ist angemeldet"
                    status={getStepStatus("FERTIG", currentStatus)}
                    isLast
                  />
                </div>
              </div>

              {/* Was passiert als Nächstes */}
              <div className="pd-card pd-next-card">
                <div className="pd-card-header">
                  <h2><Lightbulb size={16} /> Was passiert als Nächstes?</h2>
                </div>
                <div className="pd-next-content">
                  <NextStepInfo status={currentStatus} />
                </div>
              </div>

              {/* Wichtige Hinweise */}
              <div className="pd-card pd-tips-card">
                <div className="pd-card-header">
                  <h2><Info size={16} /> Wichtige Hinweise</h2>
                </div>
                <div className="pd-tips-list">
                  <StatusTips status={currentStatus} />
                </div>
              </div>
            </div>

            {/* Middle Column - Main Content */}
            <div className="pd-main">
              {/* Status Card */}
              <div className="pd-card pd-status-card">
                <div className="pd-card-header">
                  <h2>Aktueller Status</h2>
                  <span className={`pd-status-badge pd-status-badge--${currentStatus.toLowerCase()}`}>
                    {formatStatus(currentStatus)}
                  </span>
                </div>
                <div className="pd-status-content">
                  <StatusIcon status={currentStatus} />
                  <div className="pd-status-info">
                    <div className="pd-status-label">
                      {formatStatus(currentStatus)}
                    </div>
                    {currentStatus === "BEIM_NB" && detail?.nbEingereichtAm && (
                      <div className="pd-status-date">
                        <Calendar size={14} />
                        seit {formatDate(detail.nbEingereichtAm)}
                        <span className="pd-days-badge">
                          {getDaysSince(detail.nbEingereichtAm)} Tage
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pd-status-explanation">
                  {getStatusExplanation(currentStatus)}
                </div>

                {/* Erwartete Dauer */}
                {getExpectedDuration(currentStatus) && (
                  <div className="pd-expected-duration">
                    <Timer size={14} />
                    <span>Erwartete Bearbeitungszeit: <strong>{getExpectedDuration(currentStatus)}</strong></span>
                  </div>
                )}

                <StatusProgressBar status={currentStatus} />
              </div>

              {/* Alert Banner */}
              {/* AlertBanner deaktiviert – wird überarbeitet */}

              {/* Kundenfreigabe Banner */}
              {detail?.kundenfreigabeNoetig && (
                <KundenfreigabeBanner
                  installationId={detail.id}
                  nbName={detail.kundenfreigabeNbName || detail.netzbetreiber?.name || "Netzbetreiber"}
                  portalUrl={detail.kundenfreigabePortalUrl}
                  erledigt={detail.kundenfreigabeErledigt || false}
                  onDone={() => {
                    // Detail neu laden nach Bestätigung
                    if (selectedInstallation) {
                      getPortalInstallation(selectedInstallation.id).then(setDetail);
                    }
                  }}
                />
              )}

              {/* Dokumenten-Status — kompakt als Banner */}
              {docCompleteness && (
                <Link to="/portal/documents" className="pd-docbanner" style={{ textDecoration: "none" }}>
                  <div className="pd-docbanner-left">
                    <div className={`pd-docbanner-icon ${docCompleteness.fulfilled === docCompleteness.total ? "pd-docbanner-icon--ok" : "pd-docbanner-icon--warn"}`}>
                      {docCompleteness.fulfilled === docCompleteness.total
                        ? <CheckCircle size={20} />
                        : <AlertTriangle size={20} />}
                    </div>
                    <div className="pd-docbanner-info">
                      <div className="pd-docbanner-title">
                        {docCompleteness.fulfilled === docCompleteness.total
                          ? "Alle Pflichtdokumente vorhanden"
                          : `${docCompleteness.total - docCompleteness.fulfilled} Pflichtdokument${docCompleteness.total - docCompleteness.fulfilled > 1 ? "e" : ""} fehlt`}
                      </div>
                      <div className="pd-docbanner-sub">
                        {docCompleteness.fulfilled < docCompleteness.total
                          ? docCompleteness.required.filter(i => !i.present).map(i => i.label).join(", ")
                          : `${docCount} Dateien hochgeladen`}
                        {lastUploadDate && docCompleteness.fulfilled === docCompleteness.total
                          ? ` \u00B7 Letzter Upload ${new Date(lastUploadDate).toLocaleDateString("de-DE")}`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <div className="pd-docbanner-right">
                    <div className="pd-docbanner-progress">
                      <span className="pd-docbanner-fraction">{docCompleteness.fulfilled}/{docCompleteness.total}</span>
                      <div className="pd-docbanner-bar">
                        <div
                          className="pd-docbanner-fill"
                          style={{
                            width: `${(docCompleteness.fulfilled / docCompleteness.total) * 100}%`,
                            background: docCompleteness.fulfilled === docCompleteness.total
                              ? "#22c55e" : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                    <ArrowRight size={16} className="pd-docbanner-arrow" />
                  </div>
                </Link>
              )}

              {/* E-Mail Hinweis */}
              {detail?.dedicatedEmail && (
                <div className="pd-email-card">
                  <div className="pd-email-icon">
                    <Mail size={22} />
                  </div>
                  <div className="pd-email-content">
                    <div className="pd-email-label">Ihre Anlagen-E-Mail</div>
                    <div className="pd-email-address">{detail.dedicatedEmail}</div>
                    <div className="pd-email-hint">
                      <strong>Wichtig:</strong> Nutzen Sie diese E-Mail-Adresse für alle Dokumente und Anfragen zu dieser Anlage.
                      So können wir Ihre Nachrichten automatisch zuordnen.
                    </div>
                  </div>
                  <button
                    className="pd-email-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(detail.dedicatedEmail!);
                    }}
                    title="E-Mail kopieren"
                  >
                    Kopieren
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pd-actions">
                <Link to="/portal/messages" className="pd-action-card">
                  <div className="pd-action-icon pd-action-icon--indigo">
                    <MessageSquare size={22} />
                  </div>
                  <div className="pd-action-text">
                    <h3>Nachrichten</h3>
                    <p>Kommunikation einsehen</p>
                  </div>
                  <ArrowRight size={18} className="pd-action-arrow" />
                </Link>

                <Link to="/portal/documents" className="pd-action-card">
                  <div className="pd-action-icon pd-action-icon--emerald">
                    <FileText size={22} />
                  </div>
                  <div className="pd-action-text">
                    <h3>Dokumente</h3>
                    <p>Unterlagen & Uploads</p>
                  </div>
                  <ArrowRight size={18} className="pd-action-arrow" />
                </Link>

                <Link to="/portal/settings" className="pd-action-card">
                  <div className="pd-action-icon pd-action-icon--gray">
                    <Settings size={22} />
                  </div>
                  <div className="pd-action-text">
                    <h3>Einstellungen</h3>
                    <p>Passwort & WhatsApp</p>
                  </div>
                  <ArrowRight size={18} className="pd-action-arrow" />
                </Link>

                {/* Rechnungen-Link ENTFERNT: Endkunden dürfen keine Rechnungen sehen */}
              </div>

              {/* Timeline */}
              <div className="pd-card pd-card--full-width">
                <div className="pd-card-header">
                  <h2>Verlauf</h2>
                </div>
                {loading ? (
                  <div className="pd-card-loading">
                    <Loader2 size={24} className="pd-spin" />
                  </div>
                ) : (
                  <div className="pd-timeline-wrap">
                    <StatusTimeline
                      entries={timeline}
                      currentStatus={currentStatus}
                      installationId={selectedInstallation.id}
                      defaultFilter="status"
                      showFilters={true}
                      maxEntries={timelineExpanded ? undefined : 8}
                      onShowMore={() => setTimelineExpanded(true)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="pd-sidebar">
              {/* Installation Info */}
              <div className="pd-card">
                <div className="pd-card-header">
                  <h2>Ihre Anlage</h2>
                </div>
                <div className="pd-info-list">
                  <div className="pd-info-item">
                    <MapPin size={16} />
                    <div>
                      <span className="pd-info-label">Standort</span>
                      <span className="pd-info-value">
                        {selectedInstallation.strasse} {selectedInstallation.hausNr}
                        <br />
                        {selectedInstallation.plz} {selectedInstallation.ort}
                      </span>
                    </div>
                  </div>
                  {selectedInstallation.nbCaseNumber && (
                    <div className="pd-info-item">
                      <Zap size={16} />
                      <div>
                        <span className="pd-info-label">Vorgangsnummer</span>
                        <span className="pd-info-value pd-info-mono">{selectedInstallation.nbCaseNumber}</span>
                      </div>
                    </div>
                  )}
                  <div className="pd-info-item">
                    <Zap size={16} />
                    <div>
                      <span className="pd-info-label">Interne Nr.</span>
                      <span className="pd-info-value pd-info-mono" style={{ fontSize: 12, opacity: 0.6 }}>{selectedInstallation.publicId}</span>
                    </div>
                  </div>
                  {detail?.caseType && (
                    <div className="pd-info-item">
                      <FileCheck size={16} />
                      <div>
                        <span className="pd-info-label">Anlagentyp</span>
                        <span className="pd-info-value">{formatCaseType(detail.caseType)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Installer Contact */}
              {detail && (
                <div className="pd-card">
                  <div className="pd-card-header">
                    <h2>Ihr Installateur</h2>
                  </div>
                  <div className="pd-info-list">
                    <div className="pd-info-item">
                      <User size={16} />
                      <div>
                        <span className="pd-info-label">Firma</span>
                        <span className="pd-info-value">{detail.installateurName || "Baunity Partner"}</span>
                      </div>
                    </div>
                    {detail.installateurEmail && (
                      <div className="pd-info-item pd-info-item--link">
                        <Mail size={16} />
                        <a href={`mailto:${detail.installateurEmail}`}>{detail.installateurEmail}</a>
                      </div>
                    )}
                    {detail.installateurTelefon && (
                      <div className="pd-info-item pd-info-item--link">
                        <Phone size={16} />
                        <a href={`tel:${detail.installateurTelefon}`}>{detail.installateurTelefon}</a>
                      </div>
                    )}
                  </div>
                  <div className="pd-installer-note">
                    <Info size={14} />
                    <span>Bei technischen Fragen zur Anlage wenden Sie sich bitte an Ihren Installateur.</span>
                  </div>
                </div>
              )}

              {/* Technische Daten */}
              {detail?.technicalData && (
                <div className="pd-card">
                  <div className="pd-card-header">
                    <h2><Zap size={16} /> Ihre Anlage</h2>
                  </div>
                  <div className="pd-info-list">
                    {(detail.technicalData as any)?.totalPvKwPeak && (
                      <div className="pd-info-item">
                        <Sun size={16} />
                        <div>
                          <span className="pd-info-label">PV-Leistung</span>
                          <span className="pd-info-value">{(detail.technicalData as any).totalPvKwPeak} kWp</span>
                        </div>
                      </div>
                    )}
                    {(detail.technicalData as any)?.moduleType && (
                      <div className="pd-info-item">
                        <Sun size={16} />
                        <div>
                          <span className="pd-info-label">Module</span>
                          <span className="pd-info-value">
                            {(detail.technicalData as any).moduleType}
                            {(detail.technicalData as any)?.moduleCount && ` (${(detail.technicalData as any).moduleCount}×)`}
                          </span>
                        </div>
                      </div>
                    )}
                    {(detail.technicalData as any)?.inverterType && (
                      <div className="pd-info-item">
                        <Zap size={16} />
                        <div>
                          <span className="pd-info-label">Wechselrichter</span>
                          <span className="pd-info-value">{(detail.technicalData as any).inverterType}</span>
                        </div>
                      </div>
                    )}
                    {(detail.technicalData as any)?.batteryType && (
                      <div className="pd-info-item">
                        <Battery size={16} />
                        <div>
                          <span className="pd-info-label">Speicher</span>
                          <span className="pd-info-value">
                            {(detail.technicalData as any).batteryType}
                            {(detail.technicalData as any)?.batteryCapacityKwh && ` (${(detail.technicalData as any).batteryCapacityKwh} kWh)`}
                          </span>
                        </div>
                      </div>
                    )}
                    {(detail.technicalData as any)?.wallboxType && (
                      <div className="pd-info-item">
                        <PlugZap size={16} />
                        <div>
                          <span className="pd-info-label">Wallbox</span>
                          <span className="pd-info-value">{(detail.technicalData as any).wallboxType}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Netzbetreiber Info */}
              {detail?.netzbetreiber && (
                <div className="pd-card">
                  <div className="pd-card-header">
                    <h2>Netzbetreiber</h2>
                  </div>
                  <div className="pd-info-list">
                    <div className="pd-info-item">
                      <Building2 size={16} />
                      <div>
                        <span className="pd-info-value">{detail.netzbetreiber.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pd-nb-note">
                    Der Netzbetreiber ist für die Genehmigung und den Netzanschluss zuständig.
                  </div>
                </div>
              )}

              {/* FAQ Section */}
              <div className="pd-card pd-faq-card">
                <div className="pd-card-header">
                  <h2><HelpCircle size={16} /> Häufige Fragen</h2>
                </div>
                <div className="pd-faq-list">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="pd-faq-item">
                      <button
                        className="pd-faq-question"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      >
                        <span>{faq.question}</span>
                        {expandedFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {expandedFaq === index && (
                        <div className="pd-faq-answer">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guide Drawer */}
      <GuideDrawer isOpen={guideOpen} onClose={() => setGuideOpen(false)} status={currentStatus} />
    </>
  );
}

// FAQ Items
const faqItems = [
  {
    question: "Wie lange dauert die Netzanmeldung?",
    answer: "Die Bearbeitungszeit beim Netzbetreiber beträgt in der Regel 2-4 Wochen. Bei komplexeren Anlagen oder hoher Auslastung kann es auch länger dauern."
  },
  {
    question: "Was bedeutet 'Rückfrage'?",
    answer: "Der Netzbetreiber benötigt zusätzliche Informationen oder Dokumente. Bitte antworten Sie zeitnah, um Verzögerungen zu vermeiden. Sie werden per E-Mail und ggf. WhatsApp benachrichtigt."
  },
  {
    question: "Kann ich Dokumente hochladen?",
    answer: "Ja! Nutzen Sie den Bereich 'Dokumente' um Unterlagen hochzuladen. Alternativ können Sie Dokumente auch an Ihre persönliche Anlagen-E-Mail senden."
  },
  {
    question: "Wer ist mein Ansprechpartner?",
    answer: "Bei technischen Fragen zur Anlage wenden Sie sich an Ihren Installateur. Für Fragen zum Anmeldeprozess können Sie die Nachrichtenfunktion nutzen."
  },
  {
    question: "Was passiert nach der Genehmigung?",
    answer: "Nach der Genehmigung koordiniert Ihr Installateur die Inbetriebnahme. Der Netzbetreiber setzt den Zähler und Ihre Anlage wird offiziell angemeldet."
  },
];

// Process Step Component
function ProcessStep({
  step,
  title,
  description,
  status,
  duration,
  isLast
}: {
  step: number;
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  duration?: string;
  isLast?: boolean;
}) {
  return (
    <div className={`pd-process-step pd-process-step--${status}`}>
      <div className="pd-process-indicator">
        <div className="pd-process-dot">
          {status === "completed" ? <CheckCircle2 size={14} /> : step}
        </div>
        {!isLast && <div className="pd-process-line" />}
      </div>
      <div className="pd-process-content">
        <div className="pd-process-title">{title}</div>
        <div className="pd-process-desc">{description}</div>
        {duration && status !== "completed" && (
          <div className="pd-process-duration">
            <Timer size={12} /> {duration}
          </div>
        )}
      </div>
    </div>
  );
}

// Next Step Info Component
function NextStepInfo({ status }: { status: string }) {
  const nextSteps: Record<string, { icon: React.ReactNode; title: string; items: string[] }> = {
    EINGANG: {
      icon: <FileCheck size={20} />,
      title: "Ihre Unterlagen werden geprüft",
      items: [
        "Vollständigkeitsprüfung der Dokumente",
        "Technische Daten werden validiert",
        "Einreichung beim Netzbetreiber wird vorbereitet"
      ]
    },
    BEIM_NB: {
      icon: <Clock size={20} />,
      title: "Warten auf den Netzbetreiber",
      items: [
        "Der Netzbetreiber prüft Ihre Anmeldung",
        "Bei Rückfragen werden Sie sofort informiert",
        "Bearbeitungszeit: ca. 2-4 Wochen"
      ]
    },
    RUECKFRAGE: {
      icon: <AlertTriangle size={20} />,
      title: "Ihre Aktion ist erforderlich!",
      items: [
        "Bitte beantworten Sie die Rückfrage zeitnah",
        "Fehlende Dokumente können Sie hochladen",
        "Je schneller Sie antworten, desto schneller geht es weiter"
      ]
    },
    GENEHMIGT: {
      icon: <CheckCircle size={20} />,
      title: "Inbetriebnahme wird vorbereitet",
      items: [
        "Ihr Installateur koordiniert den Termin",
        "Der Netzbetreiber setzt den Zähler",
        "Bald ist Ihre Anlage offiziell angemeldet"
      ]
    },
    IBN: {
      icon: <Zap size={20} />,
      title: "Inbetriebnahme läuft",
      items: [
        "Der Zähler wird gesetzt oder wurde gesetzt",
        "Letzte Formalitäten werden erledigt",
        "Fast geschafft!"
      ]
    },
    FERTIG: {
      icon: <CheckCircle size={20} />,
      title: "Alles erledigt!",
      items: [
        "Ihre Anlage ist offiziell angemeldet",
        "Sie können Strom einspeisen",
        "Ihre Unterlagen sind hier archiviert"
      ]
    },
    STORNIERT: {
      icon: <AlertCircle size={20} />,
      title: "Vorgang wurde storniert",
      items: [
        "Diese Anmeldung wurde abgebrochen",
        "Bei Fragen wenden Sie sich an Ihren Installateur"
      ]
    }
  };

  const info = nextSteps[status] || nextSteps.EINGANG;

  return (
    <div className="pd-next-info">
      <div className="pd-next-icon">{info.icon}</div>
      <div className="pd-next-title">{info.title}</div>
      <ul className="pd-next-list">
        {info.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Status Tips Component
function StatusTips({ status }: { status: string }) {
  const tips: Record<string, string[]> = {
    EINGANG: [
      "Stellen Sie sicher, dass Ihre Kontaktdaten aktuell sind",
      "Halten Sie relevante Dokumente bereit",
      "Prüfen Sie regelmäßig Ihren E-Mail-Posteingang"
    ],
    BEIM_NB: [
      "Die Bearbeitungszeit variiert je nach Netzbetreiber",
      "Sie werden automatisch über Änderungen informiert",
      "Bei Rückfragen reagieren Sie bitte schnell"
    ],
    RUECKFRAGE: [
      "Antworten Sie so schnell wie möglich",
      "Laden Sie angeforderte Dokumente im Portal hoch",
      "Bei Unklarheiten kontaktieren Sie Ihren Installateur"
    ],
    GENEHMIGT: [
      "Ihr Installateur wird sich wegen der IBN melden",
      "Halten Sie den Zugang zum Zählerplatz frei",
      "Die IBN dauert meist nur wenige Tage"
    ],
    IBN: [
      "Stellen Sie sicher, dass der Zählerplatz zugänglich ist",
      "Nach der IBN können Sie Strom einspeisen",
      "Bewahren Sie alle Unterlagen gut auf"
    ],
    FERTIG: [
      "Alle Dokumente sind hier für Sie archiviert",
      "Bei Änderungen an der Anlage ist eine Ummeldung nötig",
      "Kontaktieren Sie uns bei Fragen jederzeit"
    ],
    STORNIERT: [
      "Bei Fragen wenden Sie sich an Ihren Installateur",
      "Eine neue Anmeldung ist jederzeit möglich"
    ]
  };

  const statusTips = tips[status] || tips.EINGANG;

  return (
    <>
      {statusTips.map((tip, i) => (
        <div key={i} className="pd-tip-item">
          <Shield size={14} />
          <span>{tip}</span>
        </div>
      ))}
    </>
  );
}

// Helper Functions
function getStepStatus(step: string, currentStatus: string): "completed" | "current" | "pending" {
  const order = ["EINGANG", "BEIM_NB", "GENEHMIGT", "IBN", "FERTIG"];
  const stepIndex = order.indexOf(step);
  const currentIndex = order.indexOf(currentStatus);

  // Special handling for RUECKFRAGE - it's during BEIM_NB
  if (currentStatus === "RUECKFRAGE") {
    if (step === "EINGANG") return "completed";
    if (step === "BEIM_NB") return "current";
    return "pending";
  }

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

function getExpectedDuration(status: string): string | null {
  const durations: Record<string, string> = {
    EINGANG: "1-3 Werktage",
    BEIM_NB: "2-4 Wochen",
    RUECKFRAGE: "Abhängig von Ihrer Antwort",
    GENEHMIGT: "1-2 Wochen bis IBN",
    IBN: "Wenige Tage",
  };
  return durations[status] || null;
}

function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "FERTIG":
    case "GENEHMIGT":
      return (
        <div className="pd-status-icon pd-status-icon--green">
          <CheckCircle size={24} />
        </div>
      );
    case "RUECKFRAGE":
      return (
        <div className="pd-status-icon pd-status-icon--red">
          <AlertCircle size={24} />
        </div>
      );
    default:
      return (
        <div className="pd-status-icon pd-status-icon--indigo">
          <Clock size={24} />
        </div>
      );
  }
}

function StatusProgressBar({ status }: { status: string }) {
  const steps = ["EINGANG", "BEIM_NB", "GENEHMIGT", "IBN", "FERTIG"];
  const currentIndex = steps.indexOf(status);
  const progress = status === "RUECKFRAGE" ? 40 : ((currentIndex + 1) / steps.length) * 100;

  const getColor = () => {
    if (status === "RUECKFRAGE") return "#ef4444";
    if (status === "FERTIG") return "#10b981";
    return "#D4A843";
  };

  return (
    <div className="pd-progress">
      <div className="pd-progress-bar">
        <div
          className="pd-progress-fill"
          style={{ width: `${progress}%`, background: getColor() }}
        />
      </div>
      <div className="pd-progress-labels">
        <span>Eingang</span>
        <span>Fertig</span>
      </div>
    </div>
  );
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    EINGANG: "Eingegangen",
    BEIM_NB: "Beim Netzbetreiber",
    RUECKFRAGE: "Rückfrage offen",
    GENEHMIGT: "Genehmigt",
    IBN: "Inbetriebnahme",
    FERTIG: "Abgeschlossen",
    STORNIERT: "Storniert",
  };
  return labels[status] || status;
}

function formatCaseType(caseType: string): string {
  const types: Record<string, string> = {
    PV: "PV-Anlage",
    PV_SPEICHER: "PV-Anlage mit Speicher",
    SPEICHER: "Speicher",
    WALLBOX: "Wallbox",
    PV_WALLBOX: "PV-Anlage mit Wallbox",
    PV_SPEICHER_WALLBOX: "PV + Speicher + Wallbox",
    WAERMEPUMPE: "Wärmepumpe",
    BALKONKRAFTWERK: "Balkonkraftwerk",
  };
  return types[caseType] || caseType;
}

function getStatusExplanation(status: string): string {
  const explanations: Record<string, string> = {
    EINGANG: "Ihre Netzanmeldung wurde erfasst und wird nun für die Einreichung beim Netzbetreiber vorbereitet. Wir prüfen die Vollständigkeit Ihrer Unterlagen.",
    BEIM_NB: "Ihre Unterlagen wurden an den Netzbetreiber übermittelt. Der Netzbetreiber prüft nun Ihre Anmeldung. Die Bearbeitungszeit beträgt in der Regel 2-4 Wochen.",
    RUECKFRAGE: "Der Netzbetreiber hat eine Rückfrage zu Ihrer Anlage. Bitte beantworten Sie diese zeitnah, um Verzögerungen zu vermeiden. Je schneller Sie reagieren, desto schneller geht es weiter!",
    GENEHMIGT: "Großartig! Ihre Netzanmeldung wurde genehmigt! Ihr Installateur kann nun die Inbetriebnahme vorbereiten und einen Termin mit dem Netzbetreiber koordinieren.",
    IBN: "Die Inbetriebnahme Ihrer Anlage wird vorbereitet oder durchgeführt. Der Netzbetreiber setzt den Zähler und Ihre Anlage wird offiziell ans Netz angeschlossen.",
    FERTIG: "Herzlichen Glückwunsch! Ihre Netzanmeldung ist vollständig abgeschlossen. Ihre Anlage ist offiziell angemeldet und Sie können Strom einspeisen.",
    STORNIERT: "Diese Netzanmeldung wurde storniert. Bei Fragen wenden Sie sich bitte an Ihren Installateur.",
  };
  return explanations[status] || "";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

