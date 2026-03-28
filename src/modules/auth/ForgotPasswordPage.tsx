import { useState } from "react";
import { Link } from "react-router-dom";

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Ein Fehler ist aufgetreten.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .gn-login {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #060b18; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased; position: relative; overflow: hidden;
        }
        .gn-login::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%);
        }
        .gn-login::after {
          content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .gn-card {
          position: relative; z-index: 1; width: 100%; max-width: 400px; margin: 20px;
          animation: gn-fade-in 0.5s ease-out;
        }
        @keyframes gn-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gn-shake { 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
        @keyframes gn-check { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }

        .gn-logo { text-align: center; margin-bottom: 32px; }
        .gn-logo-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; background: linear-gradient(135deg, #D4A843, #EAD068);
          border-radius: 12px; margin-bottom: 16px;
        }
        .gn-logo-mark svg { width: 24px; height: 24px; }
        .gn-logo-title { font-size: 22px; font-weight: 700; color: #fafafa; }
        .gn-logo-sub { font-size: 14px; color: #71717a; margin-top: 6px; line-height: 1.5; max-width: 300px; margin-left: auto; margin-right: auto; }

        .gn-error {
          display: flex; align-items: center; gap: 8px; padding: 12px 14px; margin-bottom: 24px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px; color: #fca5a5; font-size: 13px; animation: gn-shake 0.4s ease;
        }
        .gn-error svg { flex-shrink: 0; }

        .gn-field { margin-bottom: 24px; }
        .gn-label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 6px; }
        .gn-input {
          width: 100%; height: 44px; padding: 0 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; color: #fafafa; font-size: 15px; font-family: inherit; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .gn-input::placeholder { color: #52525b; }
        .gn-input:focus { border-color: rgba(212,168,67,0.5); box-shadow: 0 0 0 3px rgba(212,168,67,0.1); }

        .gn-btn {
          width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #D4A843; border: none; border-radius: 10px; color: white;
          font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .gn-btn:hover:not(:disabled) { background: #c49a3a; }
        .gn-btn:active:not(:disabled) { transform: scale(0.99); }
        .gn-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .gn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.25); border-top-color: white;
          border-radius: 50%; animation: gn-spin 0.6s linear infinite;
        }
        @keyframes gn-spin { to { transform: rotate(360deg); } }

        .gn-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 24px; font-size: 13px; color: #71717a; text-decoration: none;
          transition: color 0.15s;
        }
        .gn-back:hover { color: #D4A843; }

        /* Success State */
        .gn-success { text-align: center; padding: 12px 0; }
        .gn-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(34,197,94,0.08); border: 1.5px solid rgba(34,197,94,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .gn-success-icon svg { stroke: #22c55e; stroke-dasharray: 60; animation: gn-check 0.5s ease-out forwards; }
        .gn-success-title { font-size: 18px; font-weight: 700; color: #fafafa; margin-bottom: 8px; }
        .gn-success-text { font-size: 14px; color: #71717a; line-height: 1.6; }

        @media (max-width: 480px) { .gn-card { margin: 16px; } }
      `}</style>

      <div className="gn-login">
        <div className="gn-card">
          <div className="gn-logo">
            <div className="gn-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="gn-logo-title">Passwort zurücksetzen</div>
            <div className="gn-logo-sub">Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen.</div>
          </div>

          {error && (
            <div className="gn-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {safeString(error)}
            </div>
          )}

          {success ? (
            <div className="gn-success">
              <div className="gn-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="gn-success-title">E-Mail gesendet</div>
              <div className="gn-success-text">
                Falls ein Konto mit dieser Adresse existiert, haben wir einen Link zum Zurücksetzen gesendet. Prüfen Sie auch den Spam-Ordner.
              </div>
              <Link to="/login" className="gn-back" style={{ marginTop: 28 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="gn-field">
                <label className="gn-label">E-Mail</label>
                <input
                  type="email"
                  className="gn-input"
                  placeholder="name@firma.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button type="submit" className="gn-btn" disabled={loading}>
                {loading ? <><div className="gn-spinner" /> Wird gesendet...</> : <>Link senden</>}
              </button>

              <Link to="/login" className="gn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Zurück zum Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
