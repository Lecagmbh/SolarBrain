/**
 * EMAIL DETAIL PANEL — Schritt 2 Redesign
 *
 * Layout von oben nach unten:
 *   A) Header: Betreff + Badges + Absender mit Avatar + Zeit
 *   B) Verknüpfte Anlage Bar (wenn Installation vorhanden)
 *   C) E-Mail Body (scrollbar)
 *   D) KI-Analyse Panel
 *   E) Action Bar (unten fixiert)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Mail,
  Loader2,
  Paperclip,
  Download,
  FileText,
  Reply,
  Link2,
  ExternalLink,
  Bot,
  Send,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { EmailDetail, EmailAttachment, AutoReplyDraft } from "./types";
import {
  parseToAddresses,
  parseAttachments,
  formatFileSize,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Badge configs
// ═══════════════════════════════════════════════════════════════════════════════

interface BadgeCfg { label: string; bg: string; color: string }

const STATUS_BADGES: Record<string, BadgeCfg> = {
  RUECKFRAGE:           { label: "⚡ Aktion nötig",  bg: "#451a03", color: "#f59e0b" },
  FEHLENDE_DATEN:       { label: "⚡ Aktion nötig",  bg: "#451a03", color: "#f59e0b" },
  FRISTABLAUF:          { label: "🔴 Dringend",      bg: "#450a0a", color: "#fca5a5" },
  GENEHMIGUNG:          { label: "✅ Genehmigt",     bg: "#022c22", color: "#10b981" },
  ABLEHNUNG:            { label: "❌ Abgelehnt",     bg: "#450a0a", color: "#fca5a5" },
  EINGANGSBESTAETIGUNG: { label: "📋 Bestätigt",     bg: "#1e1b4b", color: "#f0d878" },
  BESTAETIGUNG:         { label: "📋 Bestätigt",     bg: "#1e1b4b", color: "#f0d878" },
  KUNDE_RUECKFRAGE:     { label: "👤 Kunde",         bg: "#1e293b", color: "#94a3b8" },
  KUNDE_UNTERLAGEN:     { label: "👤 Unterlagen",    bg: "#1e293b", color: "#94a3b8" },
  ZAEHLERANTRAG:        { label: "📄 Zähler",        bg: "#083344", color: "#06b6d4" },
  INBETRIEBSETZUNG:     { label: "⚡ IBN",           bg: "#083344", color: "#06b6d4" },
};

const ACTION_SUGGESTIONS: Record<string, string> = {
  RUECKFRAGE:           "Fehlende Informationen/Unterlagen zusammenstellen und an den Netzbetreiber senden.",
  FEHLENDE_DATEN:       "Fehlende Daten beim Kunden oder intern beschaffen und nachreichen.",
  FRISTABLAUF:          "DRINGEND: Frist droht abzulaufen. Sofortige Bearbeitung erforderlich!",
  GENEHMIGUNG:          "Anlage ist genehmigt. Status auf GENEHMIGT setzen und Kunden informieren.",
  ABLEHNUNG:            "Ablehnungsgrund prüfen, ggf. Unterlagen korrigieren und erneut einreichen.",
  EINGANGSBESTAETIGUNG: "Eingangsbestätigung erhalten. Auf Bearbeitungsrückmeldung des NB warten.",
  ZAEHLERANTRAG:        "Zählerantrag bearbeiten und Installateur-Termin koordinieren.",
  INBETRIEBSETZUNG:     "Inbetriebsetzung vorbereiten: Anmeldung beim NB + Zählersetztung.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════════

interface EmailDetailPanelProps {
  email: EmailDetail | null;
  loading: boolean;
  onReply: () => void;
  onAssign: () => void;
  onArchive: (emailId: number) => void;
  onDelete: (emailId: number) => void;
  autoReplyDraft: AutoReplyDraft | null;
  autoReplyLoading: boolean;
  onApproveAutoReply: (emailId: number, body?: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export function EmailDetailPanel({
  email,
  loading,
  onReply,
  onAssign,
  onArchive,
  onDelete,
  autoReplyDraft,
  autoReplyLoading,
  onApproveAutoReply,
}: EmailDetailPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [autoReplyExpanded, setAutoReplyExpanded] = useState(true);
  const [editedAutoReply, setEditedAutoReply] = useState<string | null>(null);

  useEffect(() => {
    if (autoReplyDraft) setEditedAutoReply(autoReplyDraft.body);
    else setEditedAutoReply(null);
  }, [autoReplyDraft]);

  // Render HTML in sandboxed iframe
  useEffect(() => {
    if (!email?.bodyHtml || !iframeRef.current) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#94a3b8;margin:0;padding:18px;background:#0a0a0f;font-size:11px;line-height:1.8}
img{max-width:100%;height:auto}a{color:#60a5fa}table{max-width:100%}pre,code{white-space:pre-wrap;word-break:break-word}
</style></head><body>${email.bodyHtml}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [email?.bodyHtml]);

  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current) return;
    try {
      const body = iframeRef.current.contentDocument?.body;
      if (body) iframeRef.current.style.height = `${Math.max(body.scrollHeight + 20, 200)}px`;
    } catch {
      iframeRef.current.style.height = "400px";
    }
  }, []);

  // ─── Placeholder ───
  if (!email && !loading) {
    return (
      <div style={CSS.placeholder}>
        <Mail size={40} style={{ opacity: 0.2 }} />
        <div style={{ fontSize: "13px", color: "#475569" }}>Email auswählen</div>
        <div style={{ fontSize: "11px", color: "#334155" }}>Klicke auf eine Email in der Liste</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={CSS.placeholder}>
        <Loader2 size={24} style={{ animation: "comm-spin 1s linear infinite", color: "#475569" }} />
      </div>
    );
  }

  if (!email) return null;

  const toAddrs = parseToAddresses(email.toAddresses);
  const ccAddrs = email.ccAddresses ? parseToAddresses(email.ccAddresses) : [];
  const attachments = parseAttachments(email.attachments);
  const badge = email.aiType ? STATUS_BADGES[email.aiType] || null : null;
  const actionSuggestion = email.aiType ? ACTION_SUGGESTIONS[email.aiType] || null : null;

  // Avatar
  const senderInitial = (email.fromName || email.fromAddress)[0]?.toUpperCase() || "?";
  const dateStr = new Date(email.receivedAt);
  const timeStr = dateStr.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const fullDateStr = dateStr.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, height: "100%" }}>

      {/* ═══ A) HEADER ═══ */}
      <div style={CSS.header}>
        {/* Row 1: Betreff + Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <h2 style={CSS.subject}>{email.subject || "(Kein Betreff)"}</h2>
          {badge && (
            <span style={{ ...CSS.badge, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Row 2: Avatar + Absender + Zeit */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={CSS.avatar}>{senderInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 500 }}>
              {email.fromName || email.fromAddress.split("@")[0]}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              {email.fromAddress}
              {toAddrs.length > 0 && <span> → {toAddrs.join(", ")}</span>}
              {ccAddrs.length > 0 && <span style={{ color: "#475569" }}> CC: {ccAddrs.join(", ")}</span>}
            </div>
          </div>
          <span style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
            {timeStr} · {fullDateStr}
          </span>
        </div>
      </div>

      {/* ═══ B) VERKNÜPFTE ANLAGE BAR ═══ */}
      {email.installation && (
        <div style={CSS.anlageBar}>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>
            VERKNÜPFT:
          </span>
          <a
            href={`/netzanmeldungen?id=${email.installationId}`}
            style={CSS.anlageLink}
            onClick={e => e.stopPropagation()}
          >
            🔗 {email.installation.publicId}
          </a>
          {email.installation.customerName && (
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
              {email.installation.customerName}
            </span>
          )}
          {email.netzbetreiberName && (
            <span style={{ fontSize: "10px", color: "#64748b" }}>
              · {email.netzbetreiberName}
            </span>
          )}
          {email.factroProjectTitle && (
            <span style={{ fontSize: "10px", color: "#06b6d4", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              · <ExternalLink size={9} /> {email.factroProjectTitle}
            </span>
          )}
        </div>
      )}

      {/* ═══ C) SCROLLABLE BODY ═══ */}
      <div style={CSS.body}>

        {/* E-Mail Content */}
        {email.bodyHtml ? (
          <div style={CSS.iframeWrap}>
            <iframe
              ref={iframeRef}
              style={CSS.iframe}
              sandbox="allow-same-origin"
              title="Email-Inhalt"
              onLoad={handleIframeLoad}
            />
          </div>
        ) : (
          <div style={CSS.plaintext}>
            {email.bodyText || "(Kein Inhalt)"}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={CSS.attachSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "10px", fontWeight: 600 }}>
              <Paperclip size={12} />
              {attachments.length} Anhang{attachments.length > 1 ? "e" : ""}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginTop: "6px" }}>
              {attachments.map((att: EmailAttachment, idx: number) => (
                <a key={idx} href={att.url || "#"} target="_blank" rel="noopener noreferrer" style={CSS.attachItem} download={att.filename}>
                  <FileText size={12} style={{ color: "#60a5fa", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{att.filename}</span>
                  {att.size != null && att.size > 0 && (
                    <span style={{ color: "#475569", fontSize: "9px", flexShrink: 0 }}>{formatFileSize(att.size)}</span>
                  )}
                  <Download size={10} style={{ color: "#475569", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ═══ D) KI-ANALYSE PANEL ═══ */}
        {(email.aiSummary || email.aiType || email.aiAnalysis) && (
          <div style={CSS.aiPanel}>
            <div style={CSS.aiHeader} onClick={() => setAiExpanded(p => !p)}>
              <span style={{ fontSize: "14px" }}>🤖</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#e2e8f0" }}>KI-Analyse</span>
              <span style={CSS.aiModelBadge}>Claude Sonnet</span>
              {email.aiConfidence != null && (
                <span style={{ fontSize: "9px", color: "#64748b" }}>{email.aiConfidence}%</span>
              )}
              <span style={{ marginLeft: "auto" }}>
                {aiExpanded ? <ChevronDown size={12} style={{ color: "#475569" }} /> : <ChevronRight size={12} style={{ color: "#475569" }} />}
              </span>
            </div>

            {aiExpanded && (
              <div style={CSS.aiBody}>
                {/* Zusammenfassung */}
                {email.aiSummary && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong style={{ color: "#f0d878", fontSize: "10px" }}>Zusammenfassung:</strong>
                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.6, marginTop: "4px" }}>
                      {email.aiSummary}
                    </div>
                  </div>
                )}

                {/* Empfohlene Aktion */}
                {actionSuggestion && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong style={{ color: "#f59e0b", fontSize: "10px" }}>Empfohlene Aktion:</strong>
                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.6, marginTop: "4px" }}>
                      {actionSuggestion}
                    </div>
                  </div>
                )}

                {/* AI Analysis details */}
                {email.aiAnalysis && typeof email.aiAnalysis === "object" && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px", marginBottom: "10px" }}>
                    {Object.entries(email.aiAnalysis).map(([key, value]) => {
                      if (key === "summary" || key === "type" || key === "confidence") return null;
                      return (
                        <div key={key} style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
                          <span style={{ color: "#475569", minWidth: "100px", flexShrink: 0 }}>
                            {key.replace(/_/g, " ").replace(/^./, c => c.toUpperCase())}:
                          </span>
                          <span style={{ color: "#94a3b8" }}>
                            {typeof value === "string" ? value : JSON.stringify(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <button className="comm-action-btn" style={CSS.aiBtnPrimary} onClick={onReply}>
                    🤖 Antwort generieren
                  </button>
                  <button className="comm-action-btn" style={CSS.aiBtnSecondary}>
                    📋 → Factro Kommentar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═── Auto-Reply Draft ═── */}
        {(autoReplyDraft || autoReplyLoading) && (
          <div style={CSS.autoReplyPanel}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "10px 14px", background: "#0a1628", borderRadius: "8px 8px 0 0" }}
              onClick={() => setAutoReplyExpanded(p => !p)}
            >
              <Zap size={14} style={{ color: "#06b6d4" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#06b6d4" }}>Auto-Reply Entwurf</span>
              {autoReplyLoading && <Loader2 size={12} style={{ animation: "comm-spin 1s linear infinite", color: "#06b6d4" }} />}
              <span style={{ marginLeft: "auto" }}>
                {autoReplyExpanded ? <ChevronDown size={12} style={{ color: "#475569" }} /> : <ChevronRight size={12} style={{ color: "#475569" }} />}
              </span>
            </div>
            {autoReplyExpanded && autoReplyDraft && (
              <div style={{ padding: "14px" }}>
                {(autoReplyDraft.foundDocs.length > 0 || autoReplyDraft.missingDocs.length > 0) && (
                  <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap" as const, fontSize: "10px" }}>
                    {autoReplyDraft.foundDocs.length > 0 && (
                      <div><span style={{ color: "#10b981" }}>Gefunden:</span> <span style={{ color: "#94a3b8" }}>{autoReplyDraft.foundDocs.join(", ")}</span></div>
                    )}
                    {autoReplyDraft.missingDocs.length > 0 && (
                      <div><span style={{ color: "#f59e0b" }}>Fehlt:</span> <span style={{ color: "#94a3b8" }}>{autoReplyDraft.missingDocs.join(", ")}</span></div>
                    )}
                  </div>
                )}
                <textarea
                  style={CSS.autoReplyTextarea}
                  value={editedAutoReply || ""}
                  onChange={e => setEditedAutoReply(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "9px", color: "#475569", alignSelf: "center", marginRight: "auto" }}>
                    Konfidenz: {autoReplyDraft.confidence}%
                  </span>
                  <button
                    className="comm-action-btn"
                    style={CSS.aiBtnPrimary}
                    onClick={() => onApproveAutoReply(email.id, editedAutoReply || undefined)}
                  >
                    <Send size={11} /> Genehmigen & Senden
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ E) ACTION BAR (fixiert unten) ═══ */}
      <div style={CSS.actionBar}>
        <button className="comm-action-btn" style={CSS.actionBtn} onClick={onReply}>
          <Reply size={13} /> Antworten
        </button>
        {!email.assigned && (
          <button className="comm-action-btn" style={CSS.actionBtn} onClick={onAssign}>
            <Link2 size={13} /> Verknüpfen
          </button>
        )}
        <button className="comm-action-btn" style={CSS.actionBtn} onClick={() => onArchive(email.id)}>
          📋 Archiv
        </button>
        <button className="comm-action-btn" style={CSS.actionBtnAi} onClick={onReply}>
          🤖 KI-Antwort
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Inline CSS
// ═══════════════════════════════════════════════════════════════════════════════

const CSS = {
  placeholder: {
    flex: 1,
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "8px",
    color: "#334155",
    padding: "48px",
  },

  // A) Header
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #1e293b",
    background: "rgba(0,0,0,0.3)",
    flexShrink: 0,
  },
  subject: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#e2e8f0",
    flex: 1,
    minWidth: 0,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  },
  badge: {
    fontSize: "8px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: "3px",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#1e293b",
    color: "#EAD068",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
  },

  // B) Anlage Bar
  anlageBar: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
    padding: "8px 18px",
    background: "#0c1222",
    borderBottom: "1px solid #1e293b",
    flexShrink: 0,
    flexWrap: "wrap" as const,
  },
  anlageLink: {
    fontSize: "10px",
    color: "#60a5fa",
    background: "#0f1d32",
    border: "1px solid #1e3a5f",
    borderRadius: "3px",
    padding: "2px 6px",
    textDecoration: "none" as const,
    fontWeight: 600,
  },

  // C) Body
  body: {
    flex: 1,
    overflow: "auto" as const,
    padding: "0",
  },
  iframeWrap: {
    margin: "0",
    overflow: "hidden" as const,
  },
  iframe: {
    width: "100%",
    border: "none" as const,
    minHeight: "200px",
    background: "#0a0a0f",
  },
  plaintext: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: 1.8,
    padding: "18px",
    whiteSpace: "pre-wrap" as const,
    fontFamily: "inherit",
  },

  // Attachments
  attachSection: {
    margin: "0 18px 14px",
    padding: "12px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "8px",
    border: "1px solid #1e293b",
  },
  attachItem: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "5px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "10px",
    color: "#94a3b8",
    cursor: "pointer" as const,
    textDecoration: "none" as const,
    maxWidth: "200px",
  },

  // D) KI-Analyse
  aiPanel: {
    background: "#0f1420",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    margin: "14px 18px",
    overflow: "hidden" as const,
  },
  aiHeader: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
    padding: "8px 14px",
    background: "#111827",
    cursor: "pointer" as const,
  },
  aiModelBadge: {
    fontSize: "8px",
    fontWeight: 700,
    background: "#1e1b4b",
    color: "#c4b5fd",
    padding: "2px 6px",
    borderRadius: "3px",
  },
  aiBody: {
    padding: "14px",
  },
  aiBtnPrimary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "5px",
    background: "linear-gradient(135deg, #D4A843, #EAD068)",
    border: "none" as const,
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer" as const,
  },
  aiBtnSecondary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "5px",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 500,
    cursor: "pointer" as const,
  },

  // Auto-Reply
  autoReplyPanel: {
    background: "#0a1628",
    border: "1px solid #164e63",
    borderRadius: "8px",
    margin: "0 18px 14px",
    overflow: "hidden" as const,
  },
  autoReplyTextarea: {
    width: "100%",
    minHeight: "120px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "10px",
    color: "#e2e8f0",
    fontSize: "11px",
    lineHeight: 1.6,
    resize: "vertical" as const,
    fontFamily: "inherit",
    outline: "none" as const,
  },

  // E) Action Bar
  actionBar: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "6px",
    padding: "10px 18px",
    borderTop: "1px solid #1e293b",
    background: "rgba(0,0,0,0.3)",
    flexShrink: 0,
  },
  actionBtn: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "5px",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 500,
    cursor: "pointer" as const,
  },
  actionBtnAi: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "5px",
    background: "#0f1d32",
    border: "1px solid #1e3a5f",
    color: "#60a5fa",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer" as const,
    marginLeft: "auto" as const,
  },
} as const;
