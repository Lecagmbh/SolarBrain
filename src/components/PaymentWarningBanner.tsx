/**
 * Zahlungs-Warn-Banner
 * Zeigt einen prominenten, nicht-blockierenden Hinweis bei offenen Rechnungen.
 * Wird als Overlay-Popup angezeigt, das der User schließen kann (kommt nach 24h wieder).
 */
import { useState, useEffect } from "react";
import { useAuth } from "../pages/AuthContext";
import { AlertTriangle, X, CreditCard } from "lucide-react";
import "./payment-warning.css";

const DISMISS_KEY = "payment_warning_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Stunden

export default function PaymentWarningBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  const warnung = user?.gesperrtWarnung;

  useEffect(() => {
    if (!warnung || warnung.offeneRechnungen === 0) {
      setDismissed(true);
      return;
    }

    // Prüfe ob User den Banner kürzlich geschlossen hat
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < DISMISS_DURATION_MS) {
        setDismissed(true);
        return;
      }
    }

    setDismissed(false);
  }, [warnung]);

  if (dismissed || !warnung || warnung.offeneRechnungen === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const isStaff = user?.role === "ADMIN" || user?.role === "MITARBEITER";
  if (isStaff) return null; // Staff sieht keine Zahlungswarnungen

  return (
    <div className="payment-warning-overlay">
      <div className="payment-warning-popup">
        <button className="payment-warning-close" onClick={handleDismiss} title="Schließen">
          <X size={20} />
        </button>

        <div className="payment-warning-icon">
          <AlertTriangle size={40} />
        </div>

        <h2 className="payment-warning-title">
          Offene Rechnungen
        </h2>

        <p className="payment-warning-text">
          Sie haben <strong>{warnung.offeneRechnungen} offene Rechnung{warnung.offeneRechnungen > 1 ? "en" : ""}</strong>.
          Bitte begleichen Sie diese zeitnah, um Einschränkungen zu vermeiden.
        </p>

        {warnung.gesperrt && (
          <p className="payment-warning-urgent">
            Ihr Account wurde wegen ausstehender Zahlungen als überfällig markiert.
          </p>
        )}

        <div className="payment-warning-actions">
          <a
            href="/control-center?tab=finanzen"
            className="payment-warning-btn payment-warning-btn--primary"
          >
            <CreditCard size={16} />
            Rechnungen anzeigen
          </a>
          <button
            className="payment-warning-btn payment-warning-btn--secondary"
            onClick={handleDismiss}
          >
            Später erinnern
          </button>
        </div>
      </div>
    </div>
  );
}
