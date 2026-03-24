// src/features/nb-portal/NbPortalFrame.tsx
/**
 * NB-Portal Proxy Frame Component
 * ================================
 * Renders NB portal content in an embedded frame with Baunity styling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  startProxySession,
  getCurrentPage,
  navigateTo,
  endSession,
  sendHeartbeat,
  getAvailablePortals,
} from './nbPortalApi';
import type { NbPortal, SessionInfo } from './nbPortalApi';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

interface NbPortalFrameProps {
  nbPortalId: string;
  installationId?: number;
  initialPath?: string;  // Optional path to navigate to after session start
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function NbPortalFrame({
  nbPortalId,
  installationId,
  initialPath,
  onComplete,
  onError,
  onClose
}: NbPortalFrameProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionInfo['status']>('initializing');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start session
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await startProxySession(nbPortalId, installationId);

        if (!mounted) return;

        setSessionId(result.sessionId);
        setStatus('ready');

        // Load initial page or navigate to initialPath
        let pageHtml: string;
        if (initialPath) {
          // Navigating to initial path
          pageHtml = await navigateTo(result.sessionId, initialPath);
        } else {
          pageHtml = await getCurrentPage(result.sessionId);
        }
        if (!mounted) return;

        setHtml(pageHtml);
        setLoading(false);

        // Start heartbeat
        heartbeatRef.current = setInterval(async () => {
          if (result.sessionId) {
            const alive = await sendHeartbeat(result.sessionId);
            if (!alive && mounted) {
              setError('Verbindung zum Portal verloren');
              setStatus('error');
            }
          }
        }, 30000);

      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Session konnte nicht gestartet werden';
        setError(message);
        setLoading(false);
        onError?.(message);
      }
    };

    init();

    return () => {
      mounted = false;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [nbPortalId, installationId, initialPath, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession(sessionId).catch(() => {});
      }
    };
  }, [sessionId]);

  // Handle close
  const handleClose = useCallback(async () => {
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch {
        // Ignore errors on close
      }
    }
    onClose?.();
  }, [sessionId, onClose]);

  // Refresh page
  const handleRefresh = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const pageHtml = await getCurrentPage(sessionId);
      setHtml(pageHtml);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Seite konnte nicht geladen werden';
      setError(message);
      setLoading(false);
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="nb-portal-error">
        <div className="error-content">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>Verbindungsfehler</h3>
          <p>{safeString(error)}</p>
          <div className="error-actions">
            <button onClick={handleRefresh} className="btn-retry">
              Erneut versuchen
            </button>
            <button onClick={handleClose} className="btn-close">
              Schließen
            </button>
          </div>
        </div>

        <style>{`
          .nb-portal-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: #0f0f23;
            border-radius: 12px;
            padding: 32px;
          }
          .error-content {
            text-align: center;
            max-width: 400px;
          }
          .error-icon {
            color: #ef4444;
            margin-bottom: 16px;
          }
          .error-content h3 {
            color: #fff;
            font-size: 20px;
            margin-bottom: 8px;
          }
          .error-content p {
            color: #a0a0a0;
            margin-bottom: 24px;
          }
          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-retry {
            background: linear-gradient(135deg, #D4A843, #EAD068);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          .btn-close {
            background: transparent;
            color: #a0a0a0;
            border: 1px solid rgba(255,255,255,0.1);
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="nb-portal-loading">
        <div className="loading-content">
          <div className="loading-spinner" />
          <h3>Verbinde mit Netzbetreiber-Portal...</h3>
          <p>Bitte warten Sie einen Moment</p>
        </div>

        <style>{`
          .nb-portal-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: #0f0f23;
            border-radius: 12px;
            padding: 32px;
          }
          .loading-content {
            text-align: center;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(212, 168, 67, 0.2);
            border-top-color: #D4A843;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-content h3 {
            color: #fff;
            font-size: 18px;
            margin-bottom: 8px;
          }
          .loading-content p {
            color: #a0a0a0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="nb-portal-frame">
      <div className="frame-toolbar">
        <div className="toolbar-left">
          <div className={`status-indicator ${status}`}>
            <div className="status-dot" />
            {status === 'ready' && 'Verbunden'}
            {status === 'busy' && 'Lädt...'}
            {status === 'error' && 'Fehler'}
            {status === 'initializing' && 'Verbinde...'}
          </div>
        </div>
        <div className="toolbar-right">
          <button onClick={handleRefresh} className="toolbar-btn" title="Aktualisieren">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 22v-6h6M3 12a9 9 0 0 1 14.5-7.1L21 8M21 12a9 9 0 0 1-14.5 7.1L3 16" />
            </svg>
          </button>
          <button onClick={handleClose} className="toolbar-btn" title="Schließen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <iframe
        ref={frameRef}
        className="portal-iframe"
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-same-origin"
        title="NB Portal"
      />

      <style>{`
        .nb-portal-frame {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 600px;
          background: #0f0f23;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .frame-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toolbar-right {
          display: flex;
          gap: 8px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #a0a0a0;
        }
        .status-indicator.ready .status-dot {
          background: #10b981;
        }
        .status-indicator.busy .status-dot {
          background: #f59e0b;
          animation: pulse 1s ease-in-out infinite;
        }
        .status-indicator.error .status-dot {
          background: #ef4444;
        }
        .status-indicator.initializing .status-dot {
          background: #D4A843;
          animation: pulse 1s ease-in-out infinite;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .toolbar-btn {
          background: transparent;
          border: none;
          color: #a0a0a0;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .toolbar-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .portal-iframe {
          flex: 1;
          border: none;
          width: 100%;
          background: #0f0f23;
        }
      `}</style>
    </div>
  );
}

// Portal Selector Component
interface NbPortalSelectorProps {
  onSelect: (portalId: string) => void;
  selectedPortalId?: string;
}

export function NbPortalSelector({ onSelect, selectedPortalId }: NbPortalSelectorProps) {
  const [portals, setPortals] = useState<NbPortal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailablePortals()
      .then(setPortals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted">Lade Portale...</div>;
  }

  return (
    <div className="nb-portal-selector">
      <label>Netzbetreiber-Portal auswählen:</label>
      <div className="portal-grid">
        {portals.map(portal => (
          <button
            key={portal.id}
            className={`portal-card ${portal.id === selectedPortalId ? 'selected' : ''} ${!portal.available ? 'disabled' : ''}`}
            onClick={() => portal.available && onSelect(portal.id)}
            disabled={!portal.available}
          >
            <span className="portal-name">{portal.name}</span>
            {!portal.available && (
              <span className="portal-status">Nicht konfiguriert</span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        .nb-portal-selector label {
          display: block;
          color: #a0a0a0;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .portal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .portal-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .portal-card:hover:not(.disabled) {
          border-color: #D4A843;
          background: rgba(212,168,67,0.1);
        }
        .portal-card.selected {
          border-color: #D4A843;
          background: rgba(212,168,67,0.2);
        }
        .portal-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .portal-name {
          display: block;
          color: #fff;
          font-weight: 500;
        }
        .portal-status {
          display: block;
          color: #f59e0b;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

// Export default
export default NbPortalFrame;
