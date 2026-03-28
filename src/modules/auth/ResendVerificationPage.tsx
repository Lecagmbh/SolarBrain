import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/AuthContext";
import { api } from "../api/client";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

export default function ResendVerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/send-verification-email");
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || "E-Mail konnte nicht gesendet werden.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Wenn User bereits verifiziert ist, zum Dashboard weiterleiten
  if (user?.emailVerified) {
    return (
      <div className="rv-container">
        <style>{styles}</style>
        <div className="rv-card">
          <div className="rv-success">
            <div className="rv-success-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="rv-success-title">Bereits verifiziert</h2>
            <p className="rv-success-text">
              Ihre E-Mail-Adresse ist bereits bestätigt.
            </p>
            <Link to="/dashboard" className="rv-button">
              Zum Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="rv-container">
        <div className="rv-orbs">
          <div className="rv-orb rv-orb-1" />
          <div className="rv-orb rv-orb-2" />
        </div>

        <div className="rv-card">
          <div className="rv-logo-container">
            <div className="rv-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 className="rv-title">E-Mail bestätigen</h1>
            <p className="rv-subtitle">
              Verifizierungs-E-Mail erneut senden
            </p>
          </div>

          {error && (
            <div className="rv-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {safeString(error)}
            </div>
          )}

          {success ? (
            <div className="rv-success-box">
              <div className="rv-success-icon-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3>E-Mail gesendet!</h3>
              <p>
                Wir haben eine neue Verifizierungs-E-Mail an<br />
                <strong>{user?.email}</strong><br />
                gesendet.
              </p>
              <p className="rv-hint">
                Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>
              <Link to="/dashboard" className="rv-button rv-button-secondary">
                Zurück zum Dashboard
              </Link>
            </div>
          ) : (
            <div className="rv-content">
              <div className="rv-info-box">
                <div className="rv-info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <p><strong>Keine E-Mail erhalten?</strong></p>
                  <p>
                    Klicken Sie auf den Button unten, um eine neue
                    Verifizierungs-E-Mail zu erhalten.
                  </p>
                </div>
              </div>

              {user?.email && (
                <div className="rv-email-box">
                  <span className="rv-email-label">E-Mail-Adresse:</span>
                  <span className="rv-email-value">{user.email}</span>
                </div>
              )}

              <button
                onClick={handleResend}
                className="rv-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="rv-spinner" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                    Verifizierungs-E-Mail senden
                  </>
                )}
              </button>

              <div className="rv-note">
                <strong>Hinweis:</strong> Der Link in der E-Mail ist 24 Stunden gültig.
                Sie können maximal 5 E-Mails pro Stunde anfordern.
              </div>
            </div>
          )}

          <Link to="/dashboard" className="rv-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(212, 168, 67, 0.3); }
    50% { box-shadow: 0 0 40px rgba(212, 168, 67, 0.6); }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-10px); }
    40%, 80% { transform: translateX(10px); }
  }

  .rv-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #060b18 0%, #0a1128 50%, #0a0f1a 100%);
    position: relative;
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 20px;
  }

  .rv-orbs {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .rv-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.5;
    animation: float 8s ease-in-out infinite;
  }

  .rv-orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #D4A843 0%, transparent 70%);
    top: -100px;
    left: -100px;
  }

  .rv-orb-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #22c55e 0%, transparent 70%);
    bottom: -50px;
    right: -50px;
    animation-delay: -2s;
  }

  .rv-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 480px;
    padding: 48px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    animation: fade-in-up 0.8s ease-out;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  }

  .rv-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  .rv-logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
  }

  .rv-logo-icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    animation: pulse-glow 3s ease-in-out infinite;
    box-shadow: 0 10px 40px rgba(212, 168, 67, 0.4);
  }

  .rv-logo-icon svg {
    width: 40px;
    height: 40px;
  }

  .rv-title {
    font-size: 24px;
    font-weight: 800;
    color: white;
    margin-bottom: 8px;
    text-align: center;
  }

  .rv-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  .rv-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 24px;
    color: #fca5a5;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: shake 0.5s ease-in-out;
  }

  .rv-content {
    text-align: center;
  }

  .rv-info-box {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: rgba(212, 168, 67, 0.1);
    border: 1px solid rgba(212, 168, 67, 0.2);
    border-radius: 16px;
    margin-bottom: 24px;
    text-align: left;
  }

  .rv-info-icon {
    color: #D4A843;
    flex-shrink: 0;
  }

  .rv-info-box p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.6;
  }

  .rv-info-box strong {
    color: white;
  }

  .rv-email-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .rv-email-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rv-email-value {
    font-size: 16px;
    font-weight: 600;
    color: white;
  }

  .rv-button {
    width: 100%;
    padding: 16px 24px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-decoration: none;
  }

  .rv-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
  }

  .rv-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .rv-button-secondary {
    background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
    box-shadow: 0 4px 20px rgba(212, 168, 67, 0.4);
    margin-top: 16px;
  }

  .rv-button-secondary:hover {
    box-shadow: 0 8px 30px rgba(212, 168, 67, 0.5);
  }

  .rv-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .rv-note {
    margin-top: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.6;
  }

  .rv-note strong {
    color: rgba(255, 255, 255, 0.7);
  }

  .rv-success-box {
    text-align: center;
    padding: 20px 0;
  }

  .rv-success-box h3 {
    font-size: 20px;
    font-weight: 700;
    color: #22c55e;
    margin: 16px 0 12px;
  }

  .rv-success-box p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin: 0;
  }

  .rv-success-box strong {
    color: white;
  }

  .rv-success-icon-small {
    width: 60px;
    height: 60px;
    background: rgba(34, 197, 94, 0.1);
    border: 2px solid rgba(34, 197, 94, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .rv-success-icon-small svg {
    width: 30px;
    height: 30px;
  }

  .rv-hint {
    margin-top: 16px !important;
    font-size: 13px !important;
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .rv-success {
    text-align: center;
    padding: 40px 0;
  }

  .rv-success-icon {
    width: 80px;
    height: 80px;
    background: rgba(34, 197, 94, 0.1);
    border: 2px solid rgba(34, 197, 94, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  .rv-success-icon svg {
    width: 40px;
    height: 40px;
    stroke: #22c55e;
  }

  .rv-success-title {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
  }

  .rv-success-text {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .rv-back-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    transition: color 0.2s;
  }

  .rv-back-link:hover {
    color: #D4A843;
  }

  @media (max-width: 480px) {
    .rv-card {
      padding: 32px 24px;
    }
  }
`;
