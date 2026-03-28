import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "../pages/AuthContext";
import { clearAccessToken } from "../modules/auth/tokenStorage";
import { AUTH_TOKEN_KEY } from "../config/storage";

const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 Stunden
const WARNING_BEFORE = 5 * 60 * 1000;           // Warnung 5 Min vorher
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

  const pct = Math.max(0, (secondsRemaining / (5 * 60)) * 100);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,11,24,0.85)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 99999,
      animation: "swFadeIn 0.3s ease",
    }}>
      <style>{`
        @keyframes swFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes swPulse { 0%,100% { box-shadow: 0 0 30px rgba(212,168,67,0.1) } 50% { box-shadow: 0 0 60px rgba(212,168,67,0.25) } }
        @keyframes swRing { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      `}</style>
      <div style={{
        background: "linear-gradient(135deg, #0a1128 0%, #0e1630 100%)",
        border: "1px solid rgba(212,168,67,0.15)", borderRadius: 24,
        padding: "36px 32px", maxWidth: 380, width: "90%", textAlign: "center",
        animation: "swPulse 3s ease infinite",
      }}>
        {/* Timer Circle */}
        <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 24px" }}>
          <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="45" cy="45" r="38" fill="none" stroke="#D4A843" strokeWidth="5"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#D4A843", letterSpacing: -1, lineHeight: 1 }}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
            <span style={{ fontSize: 9, color: "#506080", fontWeight: 600, marginTop: 2 }}>VERBLEIBEND</span>
          </div>
        </div>

        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
          Noch aktiv?
        </h2>
        <p style={{ color: "#506080", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          Deine Session wird aus Sicherheitsgründen beendet.
        </p>

        <button onClick={onExtend} style={{
          width: "100%", padding: "14px 20px",
          background: "linear-gradient(135deg, #D4A843 0%, #f59e0b 100%)",
          border: "none", borderRadius: 12, color: "#060b18",
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(212,168,67,0.3)",
          marginBottom: 10,
        }}>
          Weiter arbeiten
        </button>
        <button onClick={onLogout} style={{
          width: "100%", padding: "10px 20px", background: "none",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
          color: "#506080", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}
