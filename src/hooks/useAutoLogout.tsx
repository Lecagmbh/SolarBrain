import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "../pages/AuthContext";
import { clearAccessToken } from "../modules/auth/tokenStorage";
import { AUTH_TOKEN_KEY } from "../config/storage";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 Minuten
const WARNING_BEFORE = 5 * 60 * 1000;      // Warnung 5 Min vorher
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export function useAutoLogout() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    // Executing logout due to inactivity
    clearAllTimers();
    setShowWarning(false);
    
    // 🔥 Token direkt löschen
    clearAccessToken();
    
    // 🔥 Versuche auch AuthContext logout aufzurufen (falls verfügbar)
    if (typeof logout === "function") {
      try {
        logout();
      } catch (e) {
        console.warn("[AutoLogout] AuthContext logout failed:", e);
      }
    }
    
    // 🔥 Store-Reset importieren und ausführen (dynamisch um circular deps zu vermeiden)
    try {
      import("../features/netzanmeldungen/stores").then(({ resetStoreOnLogout }) => {
        if (typeof resetStoreOnLogout === "function") {
          resetStoreOnLogout();
        }
      }).catch(() => {});
    } catch (e) {}
    
    // 🔥 Force Redirect zur Login-Seite
    // Redirecting to login page
    setTimeout(() => {
      window.location.href = "/app/login?expired=1";
    }, 100);
  }, [clearAllTimers, logout]);

  const showWarningModal = useCallback(() => {
    // Showing warning modal
    setShowWarning(true);
    setSecondsRemaining(WARNING_BEFORE / 1000);
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Countdown finished, logging out
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetTimer = useCallback(() => {
    if (showWarning) return;
    clearAllTimers();
    if (user) {
      warningTimeoutRef.current = setTimeout(showWarningModal, INACTIVITY_TIMEOUT - WARNING_BEFORE);
      logoutTimeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }
  }, [user, showWarning, clearAllTimers, showWarningModal, handleLogout]);

  const extendSession = useCallback(() => {
    // Session extended by user
    setShowWarning(false);
    clearAllTimers();
    resetTimer();
  }, [clearAllTimers, resetTimer]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }
    
    // Timer started for user
    resetTimer();
    
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });
    
    // Auf Token-Änderungen in anderen Tabs reagieren
    // NUR redirecten wenn wir auf einer geschützten Seite sind UND eingeloggt waren
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY && !e.newValue && e.oldValue) {
        // Token wurde entfernt (hatte vorher einen Wert)
        // Nur redirecten wenn nicht bereits auf Login-Seite
        if (!window.location.pathname.includes('/login')) {
          // Token removed in another tab, redirecting
          window.location.href = "/app/login";
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, resetTimer, clearAllTimers]);

  return { showWarning, secondsRemaining, extendSession, logoutNow: handleLogout };
}

export function SessionWarningModal({ show, secondsRemaining, onExtend, onLogout }: {
  show: boolean; secondsRemaining: number; onExtend: () => void; onLogout: () => void;
}) {
  if (!show) return null;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 99999,
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px",
        padding: "32px", maxWidth: "400px", textAlign: "center",
      }}>
        <div style={{
          width: "64px", height: "64px", background: "rgba(251,191,36,0.1)",
          borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style={{ color: "white", fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>
          Session läuft ab
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "24px" }}>
          Aufgrund von Inaktivität werden Sie in <strong style={{ color: "#fbbf24" }}>
          {minutes}:{seconds.toString().padStart(2, "0")}</strong> automatisch ausgeloggt.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onLogout} style={{
            flex: 1, padding: "12px 20px", background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
            color: "rgba(255,255,255,0.8)", fontSize: "14px", cursor: "pointer",
          }}>Abmelden</button>
          <button onClick={onExtend} style={{
            flex: 1, padding: "12px 20px",
            background: "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)",
            border: "none", borderRadius: "8px", color: "white",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>Angemeldet bleiben</button>
        </div>
      </div>
    </div>
  );
}
