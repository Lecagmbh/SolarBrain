import { Link } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";

/**
 * EMAIL VERIFICATION BANNER
 * =========================
 * Zeigt einen Banner für unverifizierte User
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();

  // Nicht anzeigen wenn:
  // - Kein User eingeloggt
  // - Email bereits verifiziert
  // - emailVerified ist undefined (alte User ohne Feld)
  if (!user || user.emailVerified !== false) {
    return null;
  }

  return (
    <>
      <style>{`
        .evb {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-bottom: 1px solid #f59e0b;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .evb-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(245, 158, 11, 0.2);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .evb-icon svg {
          width: 18px;
          height: 18px;
          color: #d97706;
        }

        .evb-text {
          font-size: 14px;
          color: #92400e;
          line-height: 1.4;
        }

        .evb-text strong {
          color: #78350f;
        }

        .evb-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f59e0b;
          color: white;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .evb-action:hover {
          background: #d97706;
          transform: translateY(-1px);
        }

        .evb-action svg {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 640px) {
          .evb {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .evb-icon {
            display: none;
          }
        }
      `}</style>

      <div className="evb">
        <div className="evb-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <span className="evb-text">
          <strong>E-Mail nicht verifiziert:</strong> Bitte bestätigen Sie Ihre E-Mail-Adresse, um alle Funktionen nutzen zu können.
        </span>

        <Link to="/resend-verification" className="evb-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Verifizierung anfordern
        </Link>
      </div>
    </>
  );
}

export default EmailVerificationBanner;
