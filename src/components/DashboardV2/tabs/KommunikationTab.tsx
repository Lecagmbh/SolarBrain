import React, { useState, useCallback } from "react";
import { C, FONT, MONO, formatDateTime } from "../constants";
import type { DashboardEmail, DashboardInstallation } from "../constants";
import { Box } from "../components/Box";

interface KommunikationTabProps {
  data: DashboardInstallation;
  emails: DashboardEmail[];
  selectedEmailId: number | null;
  onSelectEmail: (id: number) => void;
  onSendReply?: (emailId: number, text: string) => Promise<void>;
  onGenerateAI?: (emailId: number, prompt: string) => Promise<string>;
  showToast: (msg: string, type: "success" | "error") => void;
}

type EmailFilter = "alle" | "nb" | "kunde";

function sanitizeHtml(html: string): string {
  let clean = html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Strip inline color styles (dark colors meant for white backgrounds)
    .replace(/\bcolor\s*:\s*(?:#[0-9a-f]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)\s*;?/gi, "")
    // Strip background/background-color styles
    .replace(/\bbackground(?:-color)?\s*:\s*(?:#[0-9a-f]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)\s*;?/gi, "")
    // Remove on* event handlers
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return clean;
}

// CSS for email body — injected once to override remaining inline styles
const EMAIL_BODY_STYLE_ID = "baunity-email-body-css";
const EMAIL_BODY_CSS = `
.gn-email-body { color: ${C.t2} !important; font-size: 13px; line-height: 1.6; }
.gn-email-body * { color: inherit !important; }
.gn-email-body a { color: #60A5FA !important; text-decoration: underline !important; }
.gn-email-body strong, .gn-email-body b { color: ${C.t} !important; }
.gn-email-body h1, .gn-email-body h2, .gn-email-body h3, .gn-email-body h4 { color: ${C.t} !important; }
.gn-email-body table { border-color: ${C.bd} !important; }
.gn-email-body td, .gn-email-body th { border-color: ${C.bd} !important; padding: 4px 8px; }
.gn-email-body img { max-width: 100%; height: auto; border-radius: 4px; }
.gn-email-body blockquote { border-left: 3px solid ${C.bd}; padding-left: 12px; margin-left: 0; color: ${C.t3} !important; }
`;

function ensureEmailBodyStyles() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(EMAIL_BODY_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = EMAIL_BODY_STYLE_ID;
    style.textContent = EMAIL_BODY_CSS;
    document.head.appendChild(style);
  }
}

export function KommunikationTab({
  data,
  emails,
  selectedEmailId,
  onSelectEmail,
  onSendReply,
  onGenerateAI,
  showToast,
}: KommunikationTabProps) {
  const [filter, setFilter] = useState<EmailFilter>("alle");
  const [replyText, setReplyText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Inject email body CSS overrides once
  React.useEffect(() => { ensureEmailBodyStyles(); }, []);

  const emailAddress = `${data.publicId?.toLowerCase() || "unknown"}@baunity.de`;
  const nbEmail = data.nbEmail;

  const filteredEmails = emails.filter((e) => {
    if (filter === "alle") return true;
    if (filter === "nb") return e.fromAddress?.includes(nbEmail || "NB_IMPOSSIBLE_MATCH");
    if (filter === "kunde") return !e.fromAddress?.includes(nbEmail || "");
    return true;
  });

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSend = useCallback(async () => {
    if (!replyText.trim() || !selectedEmail || !onSendReply) return;
    setIsSending(true);
    try {
      await onSendReply(selectedEmail.id, replyText);
      setReplyText("");
      showToast("E-Mail gesendet", "success");
    } catch {
      showToast("Fehler beim Senden", "error");
    } finally {
      setIsSending(false);
    }
  }, [replyText, selectedEmail, onSendReply, showToast]);

  const handleGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !selectedEmail || !onGenerateAI) return;
    setIsGenerating(true);
    try {
      const text = await onGenerateAI(selectedEmail.id, aiPrompt.trim());
      setReplyText(text);
      showToast("KI-Antwort generiert", "success");
    } catch {
      showToast("Generierung fehlgeschlagen", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, selectedEmail, onGenerateAI, showToast]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr 300px",
        gap: 0,
        height: "100%",
        fontFamily: FONT,
      }}
    >
      {/* === LEFT: Email List === */}
      <div
        style={{
          borderRight: `1px solid ${C.bd}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: `1px solid ${C.bd}`,
            padding: "0 8px",
            flexShrink: 0,
          }}
        >
          {(["alle", "nb", "kunde"] as EmailFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 12px",
                border: "none",
                borderBottom: filter === f ? `2px solid ${C.ac}` : "2px solid transparent",
                background: "transparent",
                color: filter === f ? C.t : C.t3,
                fontSize: 11,
                fontWeight: filter === f ? 600 : 400,
                cursor: "pointer",
                fontFamily: FONT,
                textTransform: "capitalize",
              }}
            >
              {f === "alle" ? `Alle (${emails.length})` : f === "nb" ? "NB" : "Kunde"}
            </button>
          ))}
        </div>

        {/* Email Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {filteredEmails.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.t3, fontSize: 12 }}>
              Keine E-Mails
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = email.id === selectedEmailId;
              const isIncoming = email.direction === "incoming" || !email.direction;
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email.id)}
                  style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid ${C.bd}`,
                    background: isSelected ? C.acG : "transparent",
                    borderLeft: isSelected ? `3px solid ${C.ac}` : "3px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.s3;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: isIncoming ? C.bl : C.ok, fontWeight: 700 }}>
                      {isIncoming ? "←" : "→"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: email.isRead ? 400 : 700,
                        color: email.isRead ? C.t2 : C.t,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {email.fromName || email.fromAddress}
                    </span>
                    <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>
                      {new Date(email.receivedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.t3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingLeft: 16,
                    }}
                  >
                    {email.subject}
                  </div>
                  {email.aiType && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 3,
                        marginLeft: 16,
                        fontSize: 9,
                        padding: "1px 6px",
                        borderRadius: 8,
                        background: email.aiType === "rueckfrage" ? C.erB : email.aiType === "genehmigung" ? C.okB : C.blB,
                        color: email.aiType === "rueckfrage" ? C.er : email.aiType === "genehmigung" ? C.ok : C.bl,
                        fontWeight: 600,
                      }}
                    >
                      {email.aiType}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* NB-Weiterleitungs-Email */}
        <div
          style={{
            borderTop: `1px solid ${C.bd}`,
            padding: "10px 12px",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 10, color: C.t3, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            NB-Weiterleitungs-Email
          </div>
          <div
            onClick={() => {
              navigator.clipboard.writeText(emailAddress);
              showToast("Email kopiert", "success");
            }}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: C.bl,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 4,
              background: C.blB,
              display: "inline-block",
            }}
          >
            {emailAddress}
          </div>
        </div>
      </div>

      {/* === CENTER: Email Preview === */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 16,
          gap: 12,
          borderRight: `1px solid ${C.bd}`,
        }}
      >
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div style={{ padding: "8px 0" }}>
              {/* Subject */}
              <div style={{ fontSize: 14, fontWeight: 600, color: C.t, marginBottom: 6, lineHeight: 1.4 }}>
                {selectedEmail.subject || "Kein Betreff"}
              </div>
              {/* From + Date Row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {(selectedEmail.fromName || selectedEmail.fromAddress) && (
                  <span style={{ fontSize: 12, color: C.t2 }}>
                    {selectedEmail.fromName || selectedEmail.fromAddress}
                  </span>
                )}
                {selectedEmail.receivedAt && (
                  <span style={{ fontSize: 11, color: C.t3 }}>
                    {formatDateTime(selectedEmail.receivedAt)}
                  </span>
                )}
                {selectedEmail.direction && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 6,
                      background: selectedEmail.direction === "incoming" ? C.blB : C.okB,
                      color: selectedEmail.direction === "incoming" ? C.bl : C.ok,
                      fontWeight: 600,
                    }}
                  >
                    {selectedEmail.direction === "incoming" ? "Eingang" : "Ausgang"}
                  </span>
                )}
              </div>

              {/* AI Analysis */}
              {selectedEmail.aiAnalysis && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: C.acG,
                    border: `1px solid ${C.ac}30`,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.ac, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    KI-Analyse
                  </div>
                  {selectedEmail.aiAnalysis.type && (
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 2 }}>
                      <span style={{ color: C.t3 }}>Typ: </span>{selectedEmail.aiAnalysis.type}
                    </div>
                  )}
                  {selectedEmail.aiAnalysis.requiredAction && (
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 2 }}>
                      <span style={{ color: C.t3 }}>Aktion: </span>{selectedEmail.aiAnalysis.requiredAction}
                    </div>
                  )}
                  {selectedEmail.aiAnalysis.deadline && (
                    <div style={{ fontSize: 11, color: C.wr }}>
                      <span style={{ color: C.t3 }}>Frist: </span>{new Date(selectedEmail.aiAnalysis.deadline).toLocaleDateString("de-DE")}
                    </div>
                  )}
                  {selectedEmail.aiAnalysis.extractedData?.aktenzeichen && (
                    <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>
                      <span style={{ color: C.t3 }}>Aktenzeichen: </span>
                      <span style={{ fontFamily: MONO }}>{selectedEmail.aiAnalysis.extractedData.aktenzeichen}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Body */}
            <div
              style={{
                background: C.s2,
                borderRadius: 10,
                border: `1px solid ${C.bd}`,
                padding: "16px",
                flex: 1,
                overflowY: "auto",
                minHeight: 200,
              }}
            >
              {selectedEmail.bodyHtml ? (
                <div
                  className="gn-email-body"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.bodyHtml) }}
                  style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, fontFamily: FONT }}
                />
              ) : (
                <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: FONT }}>
                  {selectedEmail.bodyText || "Kein Inhalt"}
                </div>
              )}
            </div>

            {/* Attachments */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedEmail.attachments.map((att, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: C.s3,
                      border: `1px solid ${C.bd}`,
                      fontSize: 11,
                      color: C.t2,
                      cursor: att.url ? "pointer" : "default",
                    }}
                    onClick={() => att.url && window.open(att.url, "_blank")}
                  >
                    <span>{"📎"}</span>
                    <span>{att.filename}</span>
                    <span style={{ color: C.t3, fontSize: 10 }}>{Math.round(att.size / 1024)}KB</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: C.t3,
              fontSize: 13,
            }}
          >
            Wählen Sie eine E-Mail aus der Liste
          </div>
        )}
      </div>

      {/* === RIGHT: Reply + Notizen === */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 12,
          gap: 12,
        }}
      >
        {/* Reply Section */}
        {onSendReply && selectedEmail && (
          <Box title="Antworten">
            <div style={{ padding: "8px 6px" }}>
              {/* AI Prompt */}
              {onGenerateAI && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.t3, marginBottom: 4 }}>
                    KI-Anweisung
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      placeholder="z.B. Lageplan wird nachgereicht"
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: `1px solid ${C.bd}`,
                        background: C.s3,
                        color: C.t,
                        fontSize: 11,
                        fontFamily: FONT,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: C.ac,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: isGenerating ? "wait" : "pointer",
                        opacity: isGenerating || !aiPrompt.trim() ? 0.5 : 1,
                        fontFamily: FONT,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isGenerating ? "..." : "KI"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reply Text */}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Ihre Antwort..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${C.bd}`,
                  background: C.s3,
                  color: C.t,
                  fontSize: 12,
                  fontFamily: FONT,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  onClick={handleSend}
                  disabled={isSending || !replyText.trim()}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: C.ac,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isSending ? "wait" : "pointer",
                    opacity: isSending || !replyText.trim() ? 0.5 : 1,
                    fontFamily: FONT,
                  }}
                >
                  {isSending ? "Senden..." : "Senden"}
                </button>
              </div>
            </div>
          </Box>
        )}

        {/* Notizen */}
        <Box title="Notizen">
          <div style={{ padding: "8px 6px" }}>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Interne Notizen..."
              rows={5}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${C.bd}`,
                background: C.s3,
                color: C.t,
                fontSize: 12,
                fontFamily: FONT,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={() => {
                  setNotesSaved(true);
                  showToast("Notiz gespeichert", "success");
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 5,
                  border: `1px solid ${C.bd}`,
                  background: notesSaved ? C.okB : "transparent",
                  color: notesSaved ? C.ok : C.t2,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {notesSaved ? "✓ Gespeichert" : "Speichern"}
              </button>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}
