/**
 * Kundenfreigabe Banner Component
 * ================================
 * Zeigt einen prominenten roten Banner wenn der Endkunde
 * sich im NB-Portal registrieren und den Vorgang freigeben muss.
 *
 * Nicht dismissbar — zu wichtig um wegzuklicken.
 * Wird gelb/amber nach Bestätigung (Selbstauskunft, nicht verifiziert).
 */

import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Shield,
  UserCheck,
  LogIn,
  MousePointerClick,
} from "lucide-react";
import { markKundenfreigabeDone } from "../api";

interface KundenfreigabeBannerProps {
  installationId: number;
  nbName: string;
  portalUrl?: string | null;
  erledigt: boolean;
  onDone?: () => void;
}

export function KundenfreigabeBanner({
  installationId,
  nbName,
  portalUrl,
  erledigt,
  onDone,
}: KundenfreigabeBannerProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(erledigt);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!window.confirm(
      "Haben Sie sich wirklich im Portal des Netzbetreibers registriert und den Vorgang freigegeben?\n\nBitte bestätigen Sie nur, wenn Sie die Freigabe tatsächlich erteilt haben."
    )) {
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      await markKundenfreigabeDone(installationId);
      setConfirmed(true);
      onDone?.();
    } catch {
      setError("Fehler beim Speichern. Bitte versuchen Sie es erneut.");
    } finally {
      setConfirming(false);
    }
  };

  // Erledigt-State: Amber Banner
  if (confirmed) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        border: "2px solid #F59E0B",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CheckCircle2 size={28} color="#D97706" />
          <div>
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#92400E",
            }}>
              Freigabe bestätigt — Vielen Dank!
            </div>
            <div style={{
              fontSize: "14px",
              color: "#92400E",
              opacity: 0.8,
              marginTop: "4px",
            }}>
              Wir prüfen den Status beim Netzbetreiber. Sie werden benachrichtigt, sobald alles bestätigt ist.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Aktiv-State: Roter Banner mit Anleitung
  return (
    <div style={{
      background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
      border: "2px solid #EF4444",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{
          background: "#EF4444",
          borderRadius: "50%",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <AlertTriangle size={24} color="white" />
        </div>
        <div>
          <div style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#991B1B",
          }}>
            Wichtig: Ihre Mitwirkung ist erforderlich!
          </div>
          <div style={{
            fontSize: "14px",
            color: "#991B1B",
            opacity: 0.85,
            marginTop: "2px",
          }}>
            Der Netzbetreiber <strong>{nbName}</strong> hat Sie aufgefordert, sich in deren Portal zu registrieren und den Vorgang freizugeben.
          </div>
        </div>
      </div>

      {/* Warnung */}
      <div style={{
        background: "rgba(239, 68, 68, 0.15)",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <Shield size={18} color="#DC2626" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#991B1B" }}>
          Ohne Ihre Freigabe kann die Netzanmeldung storniert werden!
        </span>
      </div>

      {/* Schritte */}
      <div style={{
        display: "grid",
        gap: "12px",
        marginBottom: "20px",
      }}>
        {/* Schritt 1 */}
        <div style={stepStyle}>
          <div style={stepNumberStyle}>1</div>
          <ExternalLink size={18} color="#4B5563" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={stepTitleStyle}>Öffnen Sie das Portal des Netzbetreibers</div>
            {portalUrl ? (
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "6px",
                  padding: "6px 14px",
                  background: "#2563EB",
                  color: "white",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Portal öffnen <ExternalLink size={14} />
              </a>
            ) : (
              <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                Prüfen Sie Ihre E-Mails für den Link zum Portal
              </div>
            )}
          </div>
        </div>

        {/* Schritt 2 */}
        <div style={stepStyle}>
          <div style={stepNumberStyle}>2</div>
          <UserCheck size={18} color="#4B5563" style={{ flexShrink: 0 }} />
          <div style={stepTitleStyle}>Registrieren Sie sich mit Ihrer E-Mail-Adresse</div>
        </div>

        {/* Schritt 3 */}
        <div style={stepStyle}>
          <div style={stepNumberStyle}>3</div>
          <LogIn size={18} color="#4B5563" style={{ flexShrink: 0 }} />
          <div style={stepTitleStyle}>Melden Sie sich an und gehen zu "Meine Vorgänge"</div>
        </div>

        {/* Schritt 4 */}
        <div style={stepStyle}>
          <div style={stepNumberStyle}>4</div>
          <MousePointerClick size={18} color="#4B5563" style={{ flexShrink: 0 }} />
          <div style={stepTitleStyle}>Geben Sie den Vorgang frei</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "6px",
          padding: "10px 14px",
          marginBottom: "12px",
          fontSize: "13px",
          color: "#DC2626",
        }}>
          {error}
        </div>
      )}

      {/* Bestätigungs-Button */}
      <button
        onClick={handleConfirm}
        disabled={confirming}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          padding: "12px 20px",
          background: confirming ? "#9CA3AF" : "#059669",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: confirming ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!confirming) (e.target as HTMLButtonElement).style.background = "#047857";
        }}
        onMouseLeave={(e) => {
          if (!confirming) (e.target as HTMLButtonElement).style.background = "#059669";
        }}
      >
        <CheckCircle2 size={20} />
        {confirming ? "Wird gespeichert..." : "Ich habe die Freigabe erteilt"}
      </button>
    </div>
  );
}

// Inline-Styles für Schritte
const stepStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(255, 255, 255, 0.6)",
  borderRadius: "8px",
  padding: "12px 16px",
};

const stepNumberStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  background: "#DC2626",
  color: "white",
  fontSize: "13px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};
