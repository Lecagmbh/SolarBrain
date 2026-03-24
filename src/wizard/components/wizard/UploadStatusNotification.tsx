/**
 * Upload Status Notification
 * ==========================
 * Zeigt Status der Hintergrund-Uploads nach Wizard-Submit
 * - Fortschritt für einzelne Dokumente
 * - Fehlerdetails
 * - Retry-Button bei Fehlern
 */

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../../stores/uploadStore';

// Inject styles
const injectStyles = () => {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('upload-notification-styles');
  if (existing) return;

  const style = document.createElement('style');
  style.id = 'upload-notification-styles';
  style.textContent = `
    .upload-notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 380px;
      background: rgba(15, 20, 35, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 9999;
      overflow: hidden;
    }

    .upload-notification.minimized {
      max-width: 200px;
    }

    .upload-notification-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .upload-notification-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: white;
    }

    .upload-notification-actions {
      display: flex;
      gap: 8px;
    }

    .upload-notification-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .upload-notification-btn:hover {
      background: rgba(255,255,255,0.15);
      color: white;
    }

    .upload-notification-content {
      padding: 16px;
    }

    .upload-notification-summary {
      margin-bottom: 12px;
      font-size: 13px;
      color: rgba(255,255,255,0.7);
    }

    .upload-doc-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .upload-doc-list::-webkit-scrollbar { width: 4px; }
    .upload-doc-list::-webkit-scrollbar-track { background: transparent; }
    .upload-doc-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 100px; }

    .upload-doc-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .upload-doc-item:last-child {
      border-bottom: none;
    }

    .upload-doc-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }

    .upload-doc-icon.pending {
      background: rgba(148, 163, 184, 0.2);
      color: #94a3b8;
    }

    .upload-doc-icon.uploading {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      animation: pulse 1s infinite;
    }

    .upload-doc-icon.success {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .upload-doc-icon.error {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .upload-doc-name {
      flex: 1;
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .upload-doc-error {
      font-size: 11px;
      color: #f87171;
      margin-top: 2px;
    }

    .upload-notification-error {
      margin-top: 12px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
    }

    .upload-notification-error-title {
      font-weight: 600;
      color: #fca5a5;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .upload-notification-error-text {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
    }

    .upload-notification-retry {
      margin-top: 12px;
      padding: 10px 16px;
      width: 100%;
      background: linear-gradient(135deg, #EAD068, #7c3aed);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .upload-notification-retry:hover {
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
      transform: translateY(-1px);
    }

    .upload-notification-retry:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .upload-notification-success {
      text-align: center;
      padding: 8px 0;
    }

    .upload-notification-success-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .upload-notification-success-text {
      font-weight: 600;
      color: #22c55e;
    }

    /* Status Badge for Minimized */
    .upload-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
    }

    .upload-status-badge.uploading {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .upload-status-badge.success {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }

    .upload-status-badge.error, .upload-status-badge.partial {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
  `;
  document.head.appendChild(style);
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending': return <span>⏳</span>;
    case 'uploading': return <span>↑</span>;
    case 'success': return <span>✓</span>;
    case 'error': return <span>✗</span>;
    default: return <span>?</span>;
  }
};

export const UploadStatusNotification: React.FC = () => {
  const {
    status,
    documents,
    totalCount,
    successCount,
    errorCount,
    errorMessage,
    isVisible,
    isMinimized,
    canRetry,
    dismiss,
    minimize,
    maximize,
    retryFailed,
  } = useUploadStore();

  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryFailed();
    } finally {
      setRetrying(false);
    }
  };

  if (!isVisible || status === 'idle') return null;

  const getHeaderTitle = () => {
    switch (status) {
      case 'uploading': return 'Dokumente werden hochgeladen...';
      case 'success': return 'Upload abgeschlossen';
      case 'partial': return 'Upload teilweise fehlgeschlagen';
      case 'error': return 'Upload fehlgeschlagen';
      default: return 'Upload Status';
    }
  };

  const getHeaderIcon = () => {
    switch (status) {
      case 'uploading': return '📤';
      case 'success': return '✅';
      case 'partial': return '⚠️';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`upload-notification ${isMinimized ? 'minimized' : ''}`}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        style={{ border: status === 'error' || status === 'partial' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="upload-notification-header">
          <div className="upload-notification-title">
            <span>{getHeaderIcon()}</span>
            <span>{isMinimized ? `${successCount}/${totalCount}` : getHeaderTitle()}</span>
          </div>
          <div className="upload-notification-actions">
            <button className="upload-notification-btn" onClick={isMinimized ? maximize : minimize} title={isMinimized ? 'Erweitern' : 'Minimieren'}>
              {isMinimized ? '↑' : '−'}
            </button>
            {(status === 'success' || status === 'partial') && (
              <button className="upload-notification-btn" onClick={dismiss} title="Schließen">✗</button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <div className="upload-notification-content">
            {status === 'success' && errorCount === 0 ? (
              <div className="upload-notification-success">
                <div className="upload-notification-success-icon">✅</div>
                <div className="upload-notification-success-text">
                  Alle {totalCount} Dokumente erfolgreich hochgeladen!
                </div>
              </div>
            ) : (
              <>
                <div className="upload-notification-summary">
                  {status === 'uploading' && `${successCount} von ${totalCount} Dokumenten hochgeladen...`}
                  {status === 'partial' && `${successCount} von ${totalCount} erfolgreich, ${errorCount} fehlgeschlagen`}
                  {status === 'error' && `Upload fehlgeschlagen`}
                </div>

                <div className="upload-doc-list">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="upload-doc-item">
                      <div className={`upload-doc-icon ${doc.status}`}>
                        <StatusIcon status={doc.status} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="upload-doc-name">{doc.name}</div>
                        {doc.error && <div className="upload-doc-error">{safeString(doc.error)}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {errorMessage && (
                  <div className="upload-notification-error">
                    <div className="upload-notification-error-title">
                      <span>⚠️</span>
                      <span>Fehler</span>
                    </div>
                    <div className="upload-notification-error-text">{errorMessage}</div>
                  </div>
                )}

                {canRetry && (
                  <button
                    className="upload-notification-retry"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <>
                        <span className="upload-doc-icon uploading" style={{ width: 16, height: 16, fontSize: 10 }}>↑</span>
                        <span>Wird erneut versucht...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Fehlgeschlagene erneut versuchen</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadStatusNotification;
