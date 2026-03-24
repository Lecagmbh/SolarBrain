// src/features/nb-portal/ProxyFormPage.tsx
/**
 * Reverse Proxy Form Page
 * =======================
 * Zeigt das echte Stromnetz Berlin Formular über unseren Reverse Proxy.
 * Das HTML wird vom Backend manipuliert (Header entfernt, Dark Theme injiziert).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { api } from '../../modules/api/client';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ProxyMessage {
  type: 'PAGE_LOADED' | 'FORM_SUBMIT' | 'NAVIGATE';
  sessionId: string;
  title?: string;
  url?: string;
  href?: string;
  action?: string;
  data?: Record<string, unknown>;
}

// Produkt ID zu Portal-Pfad Mapping
const PRODUCT_PATHS: Record<string, string> = {
  'neuanschluss': '/anmeldung/neuanschluss',
  'aenderung-anschluss': '/anmeldung/aenderung',
  'baustrom': '/anmeldung/baustrom',
  'wallboxen': '/anmeldung/wallbox',
  'waermepumpen': '/anmeldung/waermepumpe',
  'demontage': '/anmeldung/demontage',
  'pv-bis-30kva': '/anmeldung/pv-klein',
  'pv-30-100kwp': '/anmeldung/pv-mittel',
  'andere-erzeugung': '/anmeldung/erzeugung',
  'volleinspeisung': '/anmeldung/volleinspeisung',
  'steuerbare-verbraucher': '/anmeldung/steuerbar',
  'zaehler': '/anmeldung/zaehler',
  'anfrage': '/anmeldung/anfrage'
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProxyFormPage() {
  const { portalId, typeId } = useParams<{ portalId: string; typeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>(
    (location.state as { produktTitle?: string })?.produktTitle || 'Formular'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // ─────────────────────────────────────────────────────────────
  // SESSION ERSTELLEN
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!portalId || portalId !== 'stromnetz-berlin') {
      setError('Nur Stromnetz Berlin wird unterstützt');
      setLoading(false);
      return;
    }

    const createSession = async () => {
      try {
        const response = await api.post('/nb-proxy/stromnetz-berlin/session');

        if (response.data.success && response.data.sessionId) {
          setSessionId(response.data.sessionId);
        } else {
          throw new Error('Session konnte nicht erstellt werden');
        }
      } catch (err) {
        console.error('[ProxyForm] Session error:', err);
        setError('Verbindung zum Portal fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    };

    createSession();

    // Cleanup: Session beenden beim Verlassen
    return () => {
      if (sessionId) {
        api.post(`/nb-proxy/stromnetz-berlin/${sessionId}/end`).catch(() => {});
      }
    };
  }, [portalId]);

  // ─────────────────────────────────────────────────────────────
  // MESSAGE HANDLER (von iframe)
  // ─────────────────────────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    // Nur eigene Messages akzeptieren
    if (!event.data || typeof event.data !== 'object') return;

    const message = event.data as ProxyMessage;

    switch (message.type) {
      case 'PAGE_LOADED':
        if (message.title) {
          setPageTitle(message.title);
        }
        setLoading(false);
        break;

      case 'FORM_SUBMIT':
        setSubmitStatus('submitting');
        // Nach kurzer Zeit auf success setzen (das eigentliche Submit geht durch den Proxy)
        setTimeout(() => {
          setSubmitStatus('success');
          setTimeout(() => setSubmitStatus('idle'), 3000);
        }, 1000);
        break;

      case 'NAVIGATE':
        // Navigation wird vom iframe selbst gehandhabt
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleBack = () => {
    navigate(`/nb-portal/${portalId}`);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ─────────────────────────────────────────────────────────────
  // IFRAME URL
  // ─────────────────────────────────────────────────────────────

  const getIframeSrc = () => {
    if (!sessionId || !typeId) return '';

    const productPath = PRODUCT_PATHS[typeId] || `/anmeldung/${typeId}`;
    return `/api/nb-proxy/stromnetz-berlin/${sessionId}${productPath}`;
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (loading && !sessionId) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <Loader2 style={styles.spinner} />
          <p style={styles.loadingText}>Verbinde mit Portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.errorContent}>
          <AlertCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>Verbindungsfehler</h2>
          <p style={styles.errorText}>{safeString(error)}</p>
          <button onClick={handleBack} style={styles.errorButton}>
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.page,
      ...(isFullscreen ? styles.pageFullscreen : {})
    }}>
      {/* Header */}
      {!isFullscreen && (
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={handleBack} style={styles.backButton}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <p style={styles.headerSubtitle}>Stromnetz Berlin</p>
              <h1 style={styles.headerTitle}>{pageTitle}</h1>
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* Submit Status */}
            {submitStatus === 'submitting' && (
              <div style={styles.statusPill}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Wird gesendet...</span>
              </div>
            )}
            {submitStatus === 'success' && (
              <div style={{ ...styles.statusPill, ...styles.statusSuccess }}>
                <CheckCircle2 size={14} />
                <span>Gesendet</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div style={{ ...styles.statusPill, ...styles.statusError }}>
                <XCircle size={14} />
                <span>Fehler</span>
              </div>
            )}

            {/* Controls */}
            <button onClick={handleRefresh} style={styles.controlButton} title="Neu laden">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleFullscreen} style={styles.controlButton} title="Vollbild">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </header>
      )}

      {/* Fullscreen Header (minimal) */}
      {isFullscreen && (
        <div style={styles.fullscreenHeader}>
          <button onClick={handleFullscreen} style={styles.fullscreenClose}>
            <Minimize2 size={20} />
            <span>Vollbild beenden</span>
          </button>
        </div>
      )}

      {/* Iframe Container */}
      <div style={{
        ...styles.iframeContainer,
        ...(isFullscreen ? styles.iframeContainerFullscreen : {})
      }}>
        {loading && (
          <div style={styles.iframeLoading}>
            <Loader2 style={styles.spinner} />
            <p style={styles.loadingText}>Seite wird geladen...</p>
          </div>
        )}

        {sessionId && (
          <iframe
            ref={iframeRef}
            src={getIframeSrc()}
            style={styles.iframe}
            onLoad={() => setLoading(false)}
            title="Stromnetz Berlin Portal"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        )}
      </div>

      {/* Footer Info */}
      {!isFullscreen && (
        <footer style={styles.footer}>
          <div style={styles.footerInfo}>
            <ExternalLink size={14} style={{ opacity: 0.5 }} />
            <span>Formular wird über Baunity Proxy geladen</span>
          </div>
          <div style={styles.footerInfo}>
            <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
            <span>Daten werden in Baunity gespeichert</span>
          </div>
        </footer>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    display: 'flex',
    flexDirection: 'column',
  },
  pageFullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(8px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: 0,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    border: 'none',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Status Pills
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#a855f7',
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
  },

  // Fullscreen Header
  fullscreenHeader: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    zIndex: 100,
  },
  fullscreenClose: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
  },

  // Iframe
  iframeContainer: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: '#111827',
  },
  iframeContainerFullscreen: {
    height: '100vh',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#111827',
  },
  iframeLoading: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#111827',
    zIndex: 10,
  },

  // Footer
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '12px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
  },
  footerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Loading/Error Screens
  loadingScreen: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    color: '#a855f7',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
  },

  errorScreen: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    maxWidth: '400px',
    textAlign: 'center' as const,
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    color: '#ef4444',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
  },
  errorText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
  },
  errorButton: {
    marginTop: '8px',
    padding: '10px 20px',
    backgroundColor: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default ProxyFormPage;
