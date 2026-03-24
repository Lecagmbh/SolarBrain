import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const styles = `
.imp-page { min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0d0d14 50%, #0a0f1a 100%); display: flex; align-items: center; justify-content: center; padding: 20px; }
.imp-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; max-width: 380px; width: 100%; text-align: center; }

/* Loading */
.imp-spinner { width: 40px; height: 40px; border: 3px solid rgba(212,168,67,0.2); border-top-color: #D4A843; border-radius: 50%; animation: imp-spin 0.7s linear infinite; margin: 0 auto 20px; }
@keyframes imp-spin { to { transform: rotate(360deg); } }
.imp-title { font-size: 18px; font-weight: 700; color: white; margin: 0 0 6px; }
.imp-text { font-size: 14px; color: rgba(255,255,255,0.45); margin: 0; }

/* Error */
.imp-error-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.imp-error-icon svg { width: 26px; height: 26px; color: #f87171; }
.imp-error-msg { color: #f87171; font-size: 14px; margin: 0 0 20px; }
.imp-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.25); border-radius: 12px; color: #EAD068; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.imp-link:hover { background: rgba(212,168,67,0.2); border-color: rgba(212,168,67,0.4); }
`;

export default function ImpersonatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect") || "/portal";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const exchangedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setError("Kein Token angegeben");
      setLoading(false);
      return;
    }

    // React StrictMode feuert useEffect zweimal – Token ist single-use!
    if (exchangedRef.current) {
      console.log("[Impersonate] Skipping duplicate execution");
      return;
    }
    exchangedRef.current = true;

    const exchangeToken = async () => {
      try {
        console.log("[Impersonate] Exchanging token:", token);
        const res = await fetch("/api/impersonate/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        console.log("[Impersonate] Response status:", res.status);
        const data = await res.json();
        console.log("[Impersonate] Response data:", JSON.stringify(data).substring(0, 200));

        if (!res.ok) {
          throw new Error(data.error || data.message || "Token ungültig oder abgelaufen");
        }

        if (data.accessToken) {
          // Admin-Tokens sichern in localStorage (überlebt Tab-Wechsel)
          const currentToken = localStorage.getItem("baunity_token");
          const currentRefresh = localStorage.getItem("baunity_refresh_token");
          if (currentToken) {
            localStorage.setItem("baunity_admin_token_backup", currentToken);
          }
          if (currentRefresh) {
            localStorage.setItem("baunity_admin_refresh_backup", currentRefresh);
          }

          // Kunden-Token setzen
          localStorage.setItem("baunity_token", data.accessToken);
          localStorage.setItem("accessToken", data.accessToken);
        }

        if (data.refreshToken) {
          localStorage.setItem("baunity_refresh_token", data.refreshToken);
        }

        // Impersonation-Info + User-Daten direkt speichern
        // (weil /auth/v2/me das Cookie nutzt und den Admin zurückgibt)
        localStorage.setItem("baunity_impersonation", JSON.stringify({
          active: true,
          adminName: data.impersonatedBy?.name || "Admin",
          adminId: data.impersonatedBy?.id,
          targetUser: data.user?.name || data.user?.email || "Unbekannt",
          targetRole: data.user?.role,
        }));

        // User-Daten direkt speichern damit AuthContext nicht /me aufrufen muss
        localStorage.setItem("baunity_impersonate_user", JSON.stringify(data.user));

        // Session-Cookie löschen damit /me den Bearer-Token nutzt
        document.cookie = "baunity_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "baunity_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.baunity.de;";

        // Voller Browser-Reload
        window.location.replace(window.location.origin + redirect);
      } catch (err: any) {
        setError(err.message || "Fehler bei der Authentifizierung");
        setLoading(false);
      }
    };

    exchangeToken();
  }, [token]);

  return (
    <>
      <style>{styles}</style>
      <div className="imp-page">
        <div className="imp-card">
          {loading && !error ? (
            <>
              <div className="imp-spinner" />
              <h2 className="imp-title">Kundenportal wird geladen...</h2>
              <p className="imp-text">Sie werden gleich weitergeleitet</p>
            </>
          ) : (
            <>
              <div className="imp-error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="imp-title">Zugang fehlgeschlagen</h2>
              <p className="imp-error-msg">{error}</p>
              <a href="/portal/login" className="imp-link">
                Zum Portal-Login
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
