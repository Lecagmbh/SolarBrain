import { useNavigate, useSearchParams, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../pages/AuthContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { hasOfflineAuth } from "../../services/offlineAuth";

const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

const getRedirectPath = (role?: string): string => {
  switch (role?.toUpperCase()) {
    case 'HANDELSVERTRETER': return '/hv-center';
    case 'ENDKUNDE_PORTAL': return '/portal';
    default: return '/dashboard';
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isOnline } = useNetworkStatus();
  const offlineAvailable = hasOfflineAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (window.baunityDesktop?.credentials) {
      window.baunityDesktop.credentials.load().then((result: any) => {
        if (result) { setEmail(result.email); setPassword(result.password); setRememberMe(true); }
      });
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('expired') === '1') setError("Sitzung abgelaufen. Bitte erneut anmelden.");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        if (window.baunityDesktop?.credentials) {
          rememberMe ? window.baunityDesktop.credentials.save(email, password) : window.baunityDesktop.credentials.delete();
        }
        navigate(getRedirectPath(result.user?.role), { replace: true });
      } else {
        setError(result.error || "Anmeldung fehlgeschlagen");
        setLoading(false);
      }
    } catch {
      setError("Anmeldung fehlgeschlagen");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gn-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060B18;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid pattern */
        .gn-login::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%);
        }

        /* Gradient glow */
        .gn-login::after {
          content: '';
          position: absolute;
          top: -40%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .gn-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          margin: 20px;
          animation: gn-fade-in 0.5s ease-out;
        }

        @keyframes gn-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .gn-logo {
          text-align: center;
          margin-bottom: 40px;
        }

        .gn-logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #D4A843, #EAD068);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .gn-logo-mark svg { width: 24px; height: 24px; }

        .gn-logo-name {
          font-size: 24px;
          font-weight: 700;
          color: #fafafa;
          letter-spacing: -0.5px;
        }

        .gn-logo-sub {
          font-size: 14px;
          color: #71717a;
          margin-top: 4px;
        }

        /* Error */
        .gn-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          margin-bottom: 24px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 13px;
          animation: gn-shake 0.4s ease;
        }

        @keyframes gn-shake {
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }

        .gn-error svg { flex-shrink: 0; }

        /* Form */
        .gn-field {
          margin-bottom: 20px;
        }

        .gn-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #a1a1aa;
          margin-bottom: 6px;
        }

        .gn-input-wrap {
          position: relative;
        }

        .gn-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #fafafa;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .gn-input::placeholder { color: #52525b; }

        .gn-input:focus {
          border-color: rgba(212,168,67,0.5);
          box-shadow: 0 0 0 3px rgba(212,168,67,0.1);
        }

        .gn-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #52525b;
          cursor: pointer;
          padding: 2px;
          display: flex;
          transition: color 0.15s;
        }

        .gn-pw-toggle:hover { color: #a1a1aa; }

        /* Row: Remember + Forgot */
        .gn-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .gn-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .gn-remember input {
          width: 16px;
          height: 16px;
          accent-color: #D4A843;
          cursor: pointer;
        }

        .gn-remember span {
          font-size: 13px;
          color: #a1a1aa;
          user-select: none;
        }

        .gn-forgot {
          font-size: 13px;
          color: #71717a;
          text-decoration: none;
          transition: color 0.15s;
        }

        .gn-forgot:hover { color: #D4A843; }

        /* Button */
        .gn-btn {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #D4A843;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .gn-btn:hover:not(:disabled) { background: #c49a3a; }
        .gn-btn:active:not(:disabled) { transform: scale(0.99); }
        .gn-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .gn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: gn-spin 0.6s linear infinite;
        }

        @keyframes gn-spin { to { transform: rotate(360deg); } }

        /* Divider */
        .gn-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0;
          color: #3f3f46;
          font-size: 12px;
        }

        .gn-divider::before, .gn-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        /* Footer */
        .gn-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 12px;
          color: #3f3f46;
        }

        .gn-footer a {
          color: #52525b;
          text-decoration: none;
          transition: color 0.15s;
        }

        .gn-footer a:hover { color: #D4A843; }

        /* Responsive */
        @media (max-width: 480px) {
          .gn-card { margin: 16px; }
          .gn-logo-name { font-size: 20px; }
        }
      `}</style>

      <div className="gn-login">
        <div className="gn-card">
          {/* Logo */}
          <div className="gn-logo">
            <img src={`${import.meta.env.BASE_URL}logo-baunity.png`} alt="Baunity" style={{width: 56, height: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(212,168,67,0.25))'}} />
            <div className="gn-logo-name">Baunity</div>
            <div className="gn-logo-sub">D2D Solar-Plattform</div>
          </div>

          {/* Offline-Hinweis */}
          {!isOnline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', marginBottom: 16,
              background: offlineAvailable ? 'rgba(212,168,67,0.08)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${offlineAvailable ? 'rgba(212,168,67,0.2)' : 'rgba(239,68,68,0.15)'}`,
              borderRadius: 10, color: offlineAvailable ? '#EAD068' : '#fca5a5', fontSize: 13,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
              {offlineAvailable ? 'Offline-Modus — Login mit gespeicherten Daten' : 'Kein Internet — Bitte zuerst online einloggen'}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="gn-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {safeString(error)}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="gn-field">
              <label className="gn-label">E-Mail</label>
              <div className="gn-input-wrap">
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
            </div>

            <div className="gn-field">
              <label className="gn-label">Passwort</label>
              <div className="gn-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="gn-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" className="gn-pw-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="gn-row">
              <label className="gn-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Angemeldet bleiben</span>
              </label>
              <Link to="/forgot-password" className="gn-forgot">Passwort vergessen?</Link>
            </div>

            <button type="submit" className="gn-btn" disabled={loading}>
              {loading ? <><div className="gn-spinner" /> Anmelden...</> : <>Anmelden</>}
            </button>
          </form>

          <div className="gn-footer">
            <a href="https://baunity.de" target="_blank" rel="noopener noreferrer">baunity.de</a>
          </div>
        </div>
      </div>
    </>
  );
}
