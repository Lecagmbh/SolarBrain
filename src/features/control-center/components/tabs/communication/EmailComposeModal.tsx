/**
 * EMAIL COMPOSE MODAL
 * Neue Email oder Antwort schreiben
 *
 * Sende-Logik:
 *   - Reply MIT Installation:  POST /api/installation/:id/reply-email
 *   - Neue Email MIT Installation: POST /api/installation/:id/send-email
 *   - Ohne Installation: POST /api/email-center/send
 */

import { useState } from "react";
import { Mail, X, Send, Loader2 } from "lucide-react";
import { api } from "../../../../../modules/api/client";
import { s } from "./styles";
import type { ComposeState } from "./types";
import { EmailTemplateSelector } from "./EmailTemplateSelector";

interface EmailComposeModalProps {
  compose: ComposeState;
  onClose: () => void;
  onSent: () => void;
}

export function EmailComposeModal({ compose, onClose, onSent }: EmailComposeModalProps) {
  const [to, setTo] = useState(compose.to);
  const [cc, setCc] = useState(compose.cc);
  const [subject, setSubject] = useState(compose.subject);
  const [body, setBody] = useState(compose.body);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReply = compose.mode === "reply";
  const hasInstallation = compose.installationId != null;

  const canSend = to.trim().length > 0 && subject.trim().length > 0 && body.trim().length > 0;

  const handleTemplateApply = (tplSubject: string, tplBody: string) => {
    if (tplSubject && !isReply) setSubject(tplSubject);
    if (tplBody) setBody(tplBody);
  };

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError(null);

    try {
      if (isReply && hasInstallation && compose.originalEmailId) {
        // Reply WITH Installation
        await api.post(`/installation/${compose.installationId}/reply-email`, {
          originalEmailId: compose.originalEmailId,
          body: body,
        });
      } else if (hasInstallation) {
        // New Email WITH Installation
        await api.post(`/installation/${compose.installationId}/send-email`, {
          to: to,
          subject: subject,
          body: body,
        });
      } else {
        // Without Installation (via Queue)
        await api.post("/email-center/send", {
          to: to,
          subject: subject,
          body: body,
        });
      }

      onSent();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setError(
        axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          "Fehler beim Senden"
      );
    } finally {
      setSending(false);
    }
  };

  // Template variables for auto-fill
  const templateVars: Record<string, string> = {};
  if (compose.installationPublicId) {
    templateVars.publicId = compose.installationPublicId;
    templateVars.anlagenNummer = compose.installationPublicId;
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.composeModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.composeHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0" }}>
            <Mail size={18} />
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>
              {isReply ? "Antwort" : "Neue Email"}
            </span>
          </div>
          <button style={s.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={s.composeBody}>
          {/* Template Selector */}
          <EmailTemplateSelector onApply={handleTemplateApply} variables={templateVars} />

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />

          {/* From (readonly) */}
          {hasInstallation && compose.installationPublicId && (
            <div style={s.composeField}>
              <span style={s.composeLabel}>Von:</span>
              <div style={s.composeInputReadonly}>
                inst-{compose.installationPublicId.toLowerCase().replace("na-", "")}@baunity.de
              </div>
            </div>
          )}

          {/* To */}
          <div style={s.composeField}>
            <span style={s.composeLabel}>An:</span>
            <input
              style={s.composeInput}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="empfaenger@example.de"
              readOnly={isReply}
            />
          </div>

          {/* CC */}
          <div style={s.composeField}>
            <span style={s.composeLabel}>CC:</span>
            <input
              style={s.composeInput}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="optional"
            />
          </div>

          {/* Subject */}
          <div style={s.composeField}>
            <span style={s.composeLabel}>Betreff:</span>
            <input
              style={s.composeInput}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff eingeben..."
              readOnly={isReply}
            />
          </div>

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />

          {/* Body */}
          <textarea
            style={s.composeTextarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Nachricht verfassen..."
            autoFocus
          />

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "0.8rem",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.composeFooter}>
          <button style={s.btnCancel} onClick={onClose}>
            Abbrechen
          </button>
          <button
            style={canSend && !sending ? s.btnSend : s.btnSendDisabled}
            onClick={handleSend}
            disabled={!canSend || sending}
          >
            {sending ? (
              <Loader2 size={14} style={{ animation: "comm-spin 1s linear infinite" }} />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Wird gesendet..." : "Senden"}
          </button>
        </div>
      </div>
    </div>
  );
}
