// src/features/nb-portal/NbPortalPage.tsx
/**
 * NB-Portal Proxy Page
 * ====================
 * Full-page component for the NB portal proxy experience
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, X, Info, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { NbPortalFrame } from './NbPortalFrame';
import { getAvailablePortals } from './nbPortalApi';
import type { NbPortal } from './nbPortalApi';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// Router State Interface
interface LocationState {
  produktPath?: string;
  produktTitle?: string;
}

export function NbPortalPage() {
  const { portalId, typeId } = useParams<{ portalId: string; typeId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [portal, setPortal] = useState<NbPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Get initial path from router state
  const [initialPath] = useState(() => locationState?.produktPath);
  const [produktTitle] = useState(() => locationState?.produktTitle || typeId);

  useEffect(() => {
    if (!portalId) {
      setError('Kein Portal ausgewählt');
      setLoading(false);
      return;
    }

    getAvailablePortals()
      .then(portals => {
        const found = portals.find(p => p.id === portalId);
        if (found) {
          if (found.available) {
            setPortal(found);
          } else {
            setError(`${found.name} ist derzeit nicht verfügbar`);
          }
        } else {
          setError('Portal nicht gefunden');
        }
      })
      .catch(err => {
        setError('Fehler beim Laden des Portals');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [portalId]);

  const handleClose = () => {
    // Go back to product selection
    navigate(`/nb-portal/${portalId}`);
  };

  const handleComplete = (data: any) => {
    // Application data is persisted via NbPortalSubmission model
    navigate('/netzanmeldungen');
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="nb-portal-page nb-portal-page--loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <h2>Portal wird geladen...</h2>
          <p>Bitte warten Sie einen Moment</p>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  if (error && !portal) {
    return (
      <div className="nb-portal-page nb-portal-page--error">
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Fehler</h2>
          <p>{safeString(error)}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Zurück zum Dashboard
          </button>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  return (
    <div className="nb-portal-page">
      {/* Top Bar */}
      <header className="nb-portal-topbar">
        <div className="topbar-left">
          <button className="topbar-btn" onClick={handleClose} title="Zurück">
            <ArrowLeft size={20} />
          </button>
          <div className="topbar-title">
            <span className="topbar-label">{portal?.name} · NB-Portal</span>
            <span className="topbar-portal">{produktTitle || 'Formular'}</span>
          </div>
        </div>

        <div className="topbar-center">
          <div className="topbar-info-badge" onClick={() => setShowInfo(!showInfo)}>
            <Info size={16} />
            <span>Baunity Proxy-Modus</span>
          </div>
        </div>

        <div className="topbar-right">
          <button className="topbar-btn topbar-btn--close" onClick={handleClose} title="Schließen">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Info Banner */}
      {showInfo && (
        <motion.div
          className="info-banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Info size={18} />
          <div>
            <strong>Sie befinden sich im Proxy-Modus.</strong>
            <p>
              Das angezeigte Formular stammt direkt vom Netzbetreiber-Portal.
              Alle Eingaben werden sicher übertragen. Nach Abschluss wird die Anlage
              automatisch in Baunity gespeichert.
            </p>
          </div>
          <button onClick={() => setShowInfo(false)}>
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Portal Frame */}
      <main className="nb-portal-main">
        {portal && (
          <NbPortalFrame
            nbPortalId={portal.id}
            initialPath={initialPath}
            onComplete={handleComplete}
            onError={handleError}
            onClose={handleClose}
          />
        )}
      </main>

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .nb-portal-page {
    min-height: 100vh;
    background: #0a0a1a;
    display: flex;
    flex-direction: column;
  }

  .nb-portal-page--loading,
  .nb-portal-page--error {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-container,
  .error-container {
    text-align: center;
    color: #fff;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(212, 168, 67, 0.2);
    border-top-color: #D4A843;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  .error-container svg {
    color: #ef4444;
    margin-bottom: 16px;
  }

  .error-container h2 {
    margin-bottom: 8px;
  }

  .error-container p {
    color: #a0a0a0;
    margin-bottom: 24px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Top Bar */
  .nb-portal-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .topbar-left,
  .topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .topbar-btn {
    background: transparent;
    border: none;
    color: #a0a0a0;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .topbar-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .topbar-btn--close:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .topbar-title {
    display: flex;
    flex-direction: column;
  }

  .topbar-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .topbar-portal {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .topbar-center {
    display: flex;
    align-items: center;
  }

  .topbar-info-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(212, 168, 67, 0.1);
    border: 1px solid rgba(212, 168, 67, 0.2);
    border-radius: 20px;
    color: #EAD068;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .topbar-info-badge:hover {
    background: rgba(212, 168, 67, 0.2);
  }

  /* Info Banner */
  .info-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    background: rgba(212, 168, 67, 0.1);
    border-bottom: 1px solid rgba(212, 168, 67, 0.2);
    color: #c7d2fe;
  }

  .info-banner svg:first-child {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-banner strong {
    display: block;
    color: #fff;
    margin-bottom: 4px;
  }

  .info-banner p {
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    color: #a5b4fc;
  }

  .info-banner button {
    background: transparent;
    border: none;
    color: #EAD068;
    cursor: pointer;
    padding: 4px;
    flex-shrink: 0;
  }

  /* Main Content */
  .nb-portal-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
  }

  .nb-portal-main > div {
    flex: 1;
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #D4A843, #EAD068);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(212, 168, 67, 0.4);
  }
`;

export default NbPortalPage;
