/**
 * Portal Status Card Component
 * ============================
 * Zeigt den Portal-Status einer Installation im Admin-Bereich.
 * Ermöglicht Aktivierung, Willkommens-E-Mail erneut senden, etc.
 *
 * WICHTIG: Verwendet spezifische CSS-Klassen für Integration in PremiumOverviewTab
 */

import { useState, useEffect } from "react";
import {
  getAdminPortalStatus,
  activatePortal,
  resendWelcomeEmail,
  sendDokumentAnforderung,
  type PortalStatus,
} from "../api";
import {
  Globe,
  Mail,
  MessageCircle,
  User,
  Clock,
  CheckCircle,
  Send,
  RefreshCw,
  Loader2,
  AlertCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const QUICK_REQUESTS = [
  {
    group: "Fotos",
    icon: "\u{1F4F8}",
    items: [
      { id: "foto_zaehler", label: "Z\u00e4hler" },
      { id: "foto_zaehlerschrank", label: "Z\u00e4hlerschrank" },
      { id: "foto_hak", label: "Hausanschluss" },
      { id: "foto_anlage", label: "Anlage" },
    ],
  },
  {
    group: "Dokumente",
    icon: "\u{1F4C4}",
    items: [
      { id: "stromrechnung", label: "Stromrechnung" },
      { id: "lageplan", label: "Lageplan" },
      { id: "datenblatt", label: "Datenblatt" },
      { id: "personalausweis", label: "Personalausweis" },
      { id: "vollmacht", label: "Vollmacht" },
      { id: "grundbuchauszug", label: "Grundbuchauszug" },
    ],
  },
  {
    group: "Technische Unterlagen",
    icon: "\u{1F4DD}",
    items: [
      { id: "schaltplan", label: "Schaltplan" },
      { id: "na_schutz_zertifikat", label: "NA-Schutz" },
      { id: "datenblatt_module", label: "Modul-Datenblatt" },
      { id: "datenblatt_wechselrichter", label: "WR-Datenblatt" },
      { id: "datenblatt_speicher", label: "Speicher-Datenblatt" },
    ],
  },
] satisfies { group: string; icon: string; items: { id: string; label: string }[] }[];

interface PortalStatusCardProps {
  installationId: number;
  contactEmail?: string | null;
  customerName?: string | null;
  isAdmin?: boolean;
  onStatusChange?: () => void;
}

export function PortalStatusCard({
  installationId,
  contactEmail,
  customerName,
  isAdmin = false,
  onStatusChange,
}: PortalStatusCardProps) {
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRequestPanel, setShowRequestPanel] = useState(false);

  // Load status
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminPortalStatus(installationId);
        setStatus(data);
      } catch (err) {
        console.error("Load portal status error:", err);
        // Not an error if portal not activated yet
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [installationId]);

  const handleActivate = async () => {
    if (!contactEmail) {
      setError("Keine E-Mail-Adresse vorhanden");
      return;
    }

    setActivating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await activatePortal(installationId);
      setSuccessMessage(
        result.isNewUser
          ? `Portal aktiviert! Zugangsdaten wurden an ${result.email} gesendet.`
          : `Installation mit bestehendem User ${result.email} verknüpft.`
      );

      // Reload status
      const newStatus = await getAdminPortalStatus(installationId);
      setStatus(newStatus);

      onStatusChange?.();
    } catch (err) {
      console.error("Activate portal error:", err);
      setError("Fehler beim Aktivieren des Portals");
    } finally {
      setActivating(false);
    }
  };

  const handleResendWelcome = async () => {
    setResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resendWelcomeEmail(installationId);
      setSuccessMessage("Willkommens-E-Mail mit neuem Passwort gesendet!");
    } catch (err) {
      console.error("Resend welcome error:", err);
      setError("Fehler beim Senden der E-Mail");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-status-card">
        <div className="portal-status-loading">
          <Loader2 size={18} className="portal-status-spinner" />
          <span>Lade Portal-Status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-status-card">
      {/* Header */}
      <div className="portal-status-header">
        <div className="portal-status-icon">
          <Globe size={16} />
        </div>
        <div className="portal-status-title-wrap">
          <h3 className="portal-status-title">Kundenportal</h3>
          <p className="portal-status-subtitle">Direkter Zugang für Endkunden</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="portal-status-alert portal-status-alert-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="portal-status-alert portal-status-alert-success">
          <CheckCircle size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Not Activated */}
      {!status?.isActivated && (
        <div className="portal-status-content">
          <div className="portal-status-indicator">
            <div className="portal-status-dot portal-status-dot-inactive" />
            <span>Nicht aktiviert</span>
          </div>

          {contactEmail ? (
            <>
              <div className="portal-status-email">
                <Mail size={14} />
                <span>{contactEmail}</span>
              </div>

              <button
                onClick={handleActivate}
                disabled={activating}
                className="portal-status-btn portal-status-btn-primary"
              >
                {activating ? (
                  <>
                    <Loader2 size={14} className="portal-status-spinner" />
                    Aktiviere...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kundenportal aktivieren
                  </>
                )}
              </button>

              <p className="portal-status-hint">
                Der Endkunde erhält eine E-Mail mit Zugangsdaten.
              </p>
            </>
          ) : (
            <p className="portal-status-hint">
              Keine E-Mail-Adresse vorhanden. Bitte zuerst eine Kontakt-E-Mail eintragen.
            </p>
          )}
        </div>
      )}

      {/* Activated */}
      {status?.isActivated && (
        <div className="portal-status-content">
          {/* Status */}
          <div className="portal-status-indicator">
            <div className="portal-status-dot portal-status-dot-active" />
            <span className="portal-status-active-text">Aktiv</span>
            {status.activatedAt && (
              <span className="portal-status-date">
                seit {formatDate(status.activatedAt)}
              </span>
            )}
          </div>

          {/* User Info */}
          {status.user && (
            <div className="portal-status-user-info">
              <div className="portal-status-email">
                <User size={14} />
                <span>{status.user.email}</span>
              </div>

              {status.user.lastLogin && (
                <div className="portal-status-last-login">
                  <Clock size={14} />
                  <span>Letzter Login: {formatDateTime(status.user.lastLogin)}</span>
                </div>
              )}
            </div>
          )}

          {/* Consent Status */}
          {status.consent && (
            <div className="portal-status-badges">
              <ConsentBadge
                label="E-Mail"
                icon={Mail}
                active={status.consent.emailConsent}
              />
              <ConsentBadge
                label="WhatsApp"
                icon={MessageCircle}
                active={status.consent.whatsappConsent}
                verified={status.consent.whatsappVerified}
              />
            </div>
          )}

          {/* Onboarding Status */}
          {status.consent && !status.consent.onboardingCompleted && (
            <div className="portal-status-alert portal-status-alert-warning">
              <AlertCircle size={14} />
              <span>Onboarding noch nicht abgeschlossen</span>
            </div>
          )}

          {/* Actions */}
          {isAdmin ? (
            <>
              <div className="portal-qr-actions">
                <button
                  onClick={handleResendWelcome}
                  disabled={resending}
                  className="portal-status-btn portal-status-btn-secondary"
                >
                  {resending ? (
                    <Loader2 size={14} className="portal-status-spinner" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Neues Passwort
                </button>
                <button
                  onClick={() => setShowRequestPanel((v) => !v)}
                  className={`portal-status-btn ${showRequestPanel ? "portal-status-btn-primary" : "portal-status-btn-secondary"}`}
                >
                  <ClipboardList size={14} />
                  Daten anfordern
                  {showRequestPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showRequestPanel && (
                <QuickRequestPanel
                  installationId={installationId}
                  onSuccess={(msg) => {
                    setSuccessMessage(msg);
                    setShowRequestPanel(false);
                  }}
                  onError={(msg) => setError(msg)}
                />
              )}
            </>
          ) : (
            <button
              onClick={handleResendWelcome}
              disabled={resending}
              className="portal-status-btn portal-status-btn-secondary"
            >
              {resending ? (
                <Loader2 size={14} className="portal-status-spinner" />
              ) : (
                <RefreshCw size={14} />
              )}
              Neues Passwort senden
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuickRequestPanel({
  installationId,
  onSuccess,
  onError,
}: {
  installationId: number;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customMsg, setCustomMsg] = useState("");
  const [sending, setSending] = useState(false);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const labels = QUICK_REQUESTS.flatMap((g) => g.items)
      .filter((item) => selected.has(item.id))
      .map((item) => item.label);

    if (labels.length === 0 && !customMsg.trim()) {
      onError("Bitte mindestens ein Dokument auswählen oder eine Nachricht eingeben.");
      return;
    }

    // If only custom message, send it as single document entry
    const dokumente = labels.length > 0 ? labels : [customMsg.trim()];
    const message = labels.length > 0 ? customMsg.trim() || undefined : undefined;

    setSending(true);
    try {
      const result = await sendDokumentAnforderung(installationId, dokumente, message);
      const channels: string[] = [];
      if (result.whatsappSent) channels.push("WhatsApp");
      if (result.emailSent) channels.push("E-Mail");

      const channelText = channels.length > 0 ? channels.join(" + ") : "Portal";
      onSuccess(
        `${dokumente.length} ${dokumente.length === 1 ? "Dokument" : "Dokumente"} angefordert per ${channelText}`
      );
    } catch {
      onError("Fehler beim Senden der Anforderung");
    } finally {
      setSending(false);
    }
  };

  const selectedLabels = QUICK_REQUESTS.flatMap((g) => g.items)
    .filter((item) => selected.has(item.id))
    .map((item) => item.label);

  return (
    <div className="portal-qr-panel">
      {QUICK_REQUESTS.map((group) => (
        <div key={group.group}>
          <div className="portal-qr-group">
            <span>{group.icon}</span>
            <span>{group.group}</span>
          </div>
          <div className="portal-qr-chips">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`portal-qr-chip${selected.has(item.id) ? " portal-qr-chip--selected" : ""}`}
                onClick={() => toggleItem(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="portal-qr-divider">oder Freitext</div>
      <textarea
        className="portal-qr-textarea"
        placeholder="Individuelle Nachricht an den Kunden..."
        value={customMsg}
        onChange={(e) => setCustomMsg(e.target.value)}
        rows={2}
      />

      <div className="portal-qr-footer">
        {selectedLabels.length > 0 && (
          <div className="portal-qr-selected">
            Ausgewählt: {selectedLabels.join(", ")}
          </div>
        )}
        <button
          type="button"
          className="portal-qr-submit"
          disabled={sending || (selected.size === 0 && !customMsg.trim())}
          onClick={handleSubmit}
        >
          {sending ? (
            <Loader2 size={14} className="portal-status-spinner" />
          ) : (
            <Send size={14} />
          )}
          {sending ? "Wird gesendet..." : "Anfordern (WhatsApp + E-Mail)"}
        </button>
      </div>
    </div>
  );
}

function ConsentBadge({
  label,
  icon: Icon,
  active,
  verified,
}: {
  label: string;
  icon: typeof Mail;
  active: boolean;
  verified?: boolean;
}) {
  const className = active
    ? verified !== false
      ? "portal-consent-badge portal-consent-badge-active"
      : "portal-consent-badge portal-consent-badge-pending"
    : "portal-consent-badge portal-consent-badge-inactive";

  return (
    <div className={className}>
      <Icon size={12} />
      <span>{label}</span>
      {active && (
        verified !== false ? (
          <CheckCircle size={12} />
        ) : (
          <Clock size={12} />
        )
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
