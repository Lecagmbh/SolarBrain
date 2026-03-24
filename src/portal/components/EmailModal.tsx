/**
 * Email Modal Component
 * =====================
 * Zeigt E-Mail-Details im Popup an.
 * Verwendet React Portal für echtes Overlay über allem.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, MailOpen, Clock, Paperclip, Loader2 } from "lucide-react";
import { getPortalEmailDetail, type PortalEmailDetail } from "../api";

interface EmailModalProps {
  installationId: number;
  emailId: number;
  onClose: () => void;
}

export function EmailModal({ installationId, emailId, onClose }: EmailModalProps) {
  const [email, setEmail] = useState<PortalEmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPortalEmailDetail(installationId, emailId);
        setEmail(data);
      } catch (err) {
        console.error("Load email error:", err);
        setError("E-Mail konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, [installationId, emailId]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render via Portal direkt im body - echtes Overlay
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="em-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="em-modal">
        {/* Header */}
        <div className="em-header">
          <div className="em-header-icon">
            {email?.direction === "INBOUND" ? (
              <MailOpen size={20} />
            ) : (
              <Mail size={20} />
            )}
          </div>
          <div className="em-header-title">
            <h2>E-Mail</h2>
            {email && (
              <span className={`em-direction em-direction--${email.direction.toLowerCase()}`}>
                {email.direction === "INBOUND" ? "Eingehend" : "Ausgehend"}
              </span>
            )}
          </div>
          <button className="em-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="em-content">
          {loading ? (
            <div className="em-loading">
              <Loader2 size={32} className="em-spin" />
              <span>Laden...</span>
            </div>
          ) : error ? (
            <div className="em-error">
              <span>{error}</span>
            </div>
          ) : email ? (
            <>
              {/* Meta */}
              <div className="em-meta">
                <div className="em-meta-row">
                  <span className="em-meta-label">Von:</span>
                  <span className="em-meta-value">{email.from}</span>
                </div>
                <div className="em-meta-row">
                  <span className="em-meta-label">An:</span>
                  <span className="em-meta-value">{email.to}</span>
                </div>
                <div className="em-meta-row">
                  <span className="em-meta-label">Datum:</span>
                  <span className="em-meta-value em-meta-date">
                    <Clock size={14} />
                    {formatDate(email.receivedAt)}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div className="em-subject">
                <h3>{email.subject || "(Kein Betreff)"}</h3>
              </div>

              {/* Body */}
              <div className="em-body">
                {email.bodyHtml ? (
                  <div
                    className="em-body-html"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.bodyHtml) }}
                  />
                ) : email.bodyText ? (
                  <pre className="em-body-text">{email.bodyText}</pre>
                ) : (
                  <p className="em-body-empty">Kein Inhalt</p>
                )}
              </div>

              {/* Attachments */}
              {email.attachments && email.attachments.length > 0 && (
                <div className="em-attachments">
                  <div className="em-attachments-header">
                    <Paperclip size={14} />
                    <span>{email.attachments.length} Anhang/Anhänge</span>
                  </div>
                  <div className="em-attachments-list">
                    {email.attachments.map((att, idx) => (
                      <div key={idx} className="em-attachment">
                        <span className="em-attachment-name">{att.filename}</span>
                        <span className="em-attachment-size">{formatFileSize(att.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{emailModalStyles}</style>
    </>,
    document.body
  );
}

// Simple HTML sanitizer (removes script tags and event handlers)
// Use centralized DOMPurify sanitizer
import { sanitizeHtml } from "../../utils/sanitizeHtml";

const emailModalStyles = `
  .em-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    animation: emFadeIn 0.2s ease-out;
  }

  @keyframes emFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .em-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 700px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
    z-index: 1001;
    animation: emSlideIn 0.3s ease-out;
    overflow: hidden;
  }

  @keyframes emSlideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .em-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }

  .em-header-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.15);
    border-radius: 10px;
    color: #60a5fa;
  }

  .em-header-title {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .em-header-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }

  .em-direction {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .em-direction--inbound {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .em-direction--outbound {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  .em-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s;
  }

  .em-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .em-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .em-loading,
  .em-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 200px;
    color: rgba(255, 255, 255, 0.5);
  }

  .em-spin {
    animation: emSpin 1s linear infinite;
    color: #D4A843;
  }

  @keyframes emSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .em-error {
    color: #f87171;
  }

  .em-meta {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .em-meta-row {
    display: flex;
    gap: 12px;
    font-size: 14px;
  }

  .em-meta-label {
    width: 60px;
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.4);
  }

  .em-meta-value {
    color: #fff;
    word-break: break-word;
  }

  .em-meta-date {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.6);
  }

  .em-subject {
    margin-bottom: 20px;
  }

  .em-subject h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
    line-height: 1.4;
  }

  .em-body {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 20px;
    min-height: 150px;
  }

  .em-body-html {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
  }

  .em-body-html a {
    color: #60a5fa;
  }

  .em-body-html img {
    max-width: 100%;
    height: auto;
  }

  .em-body-text {
    margin: 0;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .em-body-empty {
    margin: 0;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
  }

  .em-attachments {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .em-attachments-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 12px;
  }

  .em-attachments-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .em-attachment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .em-attachment-name {
    font-size: 13px;
    color: #fff;
    word-break: break-word;
  }

  .em-attachment-size {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
    margin-left: 12px;
  }

  /* Scrollbar */
  .em-content::-webkit-scrollbar {
    width: 8px;
  }

  .em-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .em-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .em-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 640px) {
    .em-modal {
      width: 95%;
      max-height: 90vh;
    }

    .em-header {
      padding: 16px 18px;
    }

    .em-content {
      padding: 18px;
    }

    .em-meta-row {
      flex-direction: column;
      gap: 4px;
    }

    .em-meta-label {
      width: auto;
      font-size: 12px;
    }
  }
`;
