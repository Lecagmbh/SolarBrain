/**
 * Portal Messages Page
 * ====================
 * Nachrichten und Kommunikation mit dem Installateur.
 * Premium Design mit Echtzeit-Polling, Datum-Trennlinien und Datei-Upload.
 */

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { usePortal } from "../PortalContext";
import {
  getPortalMessages,
  sendPortalMessage,
  type PortalMessage,
} from "../api";
import { apiPost } from "../../api/client";
import {
  Loader2,
  AlertCircle,
  Send,
  User,
  Building,
  Bot,
  Check,
  CheckCheck,
  MessageSquare,
  Paperclip,
  ArrowDown,
  X,
} from "lucide-react";
import { InlineHelp } from "../components/GuideDrawer";
import { RUECKFRAGE_HELP } from "../data/guideData";

const POLL_INTERVAL = 15_000; // 15 seconds

export function PortalMessagesPage() {
  const { selectedInstallation } = usePortal();

  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages
  const loadMessages = useCallback(async (isPolling = false) => {
    if (!selectedInstallation) return;

    if (!isPolling) setLoading(true);
    setError(null);

    try {
      const data = await getPortalMessages(selectedInstallation.id);
      setMessages((prev) => {
        if (isPolling && data.length > prev.length) {
          if (!isAtBottom) setHasNewMessages(true);
        }
        return data;
      });
    } catch (err) {
      if (!isPolling) {
        console.error("Load messages error:", err);
        setError("Fehler beim Laden der Nachrichten");
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [selectedInstallation?.id, isAtBottom]);

  // Initial load
  useEffect(() => {
    loadMessages(false);
  }, [selectedInstallation?.id]);

  // Polling
  useEffect(() => {
    if (!selectedInstallation) return;
    const interval = setInterval(() => loadMessages(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedInstallation?.id, loadMessages]);

  // Scroll to bottom on initial load and new own messages
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messagesListRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewMessages(false);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedInstallation || (!newMessage.trim() && !selectedFile)) return;

    setSending(true);
    setError(null);

    try {
      // File upload first if present
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("kategorie", "SONSTIGE");
        await apiPost(`/portal/installation/${selectedInstallation.id}/documents`, formData);
      }

      // Send text message
      if (newMessage.trim()) {
        const message = await sendPortalMessage(selectedInstallation.id, newMessage.trim());
        setMessages((prev) => [...prev, message]);
      } else if (selectedFile) {
        // If only file, send a note
        const message = await sendPortalMessage(
          selectedInstallation.id,
          `📎 Datei hochgeladen: ${selectedFile.name}`
        );
        setMessages((prev) => [...prev, message]);
      }

      setNewMessage("");
      setSelectedFile(null);
      setIsAtBottom(true);
    } catch (err) {
      console.error("Send message error:", err);
      setError("Fehler beim Senden der Nachricht");
    } finally {
      setSending(false);
    }
  };

  if (!selectedInstallation) {
    return (
      <>
        <div className="pmsg-empty">
          <AlertCircle size={48} />
          <p>Keine Installation ausgewählt.</p>
        </div>
        <style>{messageStyles}</style>
      </>
    );
  }

  return (
    <>
      <div className="pmsg-page">
        {/* Header */}
        <header className="pmsg-header">
          <div className="pmsg-header-title">
            <div className="pmsg-header-icon">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1>Nachrichten</h1>
              <p>Kommunikation zu Ihrer Anlage</p>
            </div>
          </div>
        </header>

        {/* Rückfrage Banner */}
        {selectedInstallation.status === "RUECKFRAGE" &&
          !selectedInstallation.nbRueckfrageBeantwortet && (
            <>
              <div className="pmsg-alert">
                <div className="pmsg-alert-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="pmsg-alert-content">
                  <h3>Offene Rückfrage</h3>
                  <p>
                    {selectedInstallation.nbRueckfrageText ||
                      "Es liegt eine Rückfrage vom Netzbetreiber vor."}
                  </p>
                </div>
              </div>
              <InlineHelp
                title={RUECKFRAGE_HELP.title}
                steps={RUECKFRAGE_HELP.steps}
                defaultOpen={true}
              />
            </>
          )}

        {/* Messages Container */}
        <div className="pmsg-container">
          {/* Messages List */}
          <div className="pmsg-list" ref={messagesListRef} onScroll={handleScroll}>
            {loading ? (
              <div className="pmsg-loading">
                <Loader2 size={28} className="pmsg-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="pmsg-empty-messages">
                <Building size={36} />
                <p>Noch keine Nachrichten</p>
                <span>Hier können Sie Rückfragen beantworten.</span>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const showDateSeparator = shouldShowDateSeparator(messages, idx);
                  return (
                    <div key={msg.id}>
                      {showDateSeparator && (
                        <div className="pmsg-date-separator">
                          <span>{formatDateSeparator(msg.createdAt)}</span>
                        </div>
                      )}
                      <MessageBubble message={msg} />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* New Messages Indicator */}
          {hasNewMessages && (
            <button className="pmsg-new-indicator" onClick={scrollToBottom}>
              <ArrowDown size={16} />
              Neue Nachrichten
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="pmsg-error">
              <p>{error}</p>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="pmsg-file-preview">
              <Paperclip size={14} />
              <span>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="pmsg-file-remove">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="pmsg-form">
            <input
              ref={fileInputRef}
              type="file"
              className="pmsg-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="pmsg-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Datei anhängen"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ihre Nachricht..."
              disabled={sending}
              className="pmsg-input"
            />
            <button
              type="submit"
              disabled={sending || (!newMessage.trim() && !selectedFile)}
              className="pmsg-send-btn"
            >
              {sending ? (
                <Loader2 size={18} className="pmsg-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{messageStyles}</style>
    </>
  );
}

function shouldShowDateSeparator(messages: PortalMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  const curr = new Date(messages[index].createdAt).toDateString();
  return prev !== curr;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Heute";
  if (date.toDateString() === yesterday.toDateString()) return "Gestern";

  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function MessageBubble({ message }: { message: PortalMessage }) {
  const isFromBetreiber = message.senderType === "BETREIBER";

  return (
    <div className={`pmsg-bubble-wrap ${isFromBetreiber ? "pmsg-bubble-wrap--right" : ""}`}>
      <div className="pmsg-bubble-container">
        {/* Sender */}
        <div className={`pmsg-bubble-sender ${isFromBetreiber ? "pmsg-bubble-sender--right" : ""}`}>
          {!isFromBetreiber && (
            <div className="pmsg-sender-avatar pmsg-sender-avatar--other">
              {message.senderType === "SYSTEM" ? (
                <Bot size={12} />
              ) : (
                <Building size={12} />
              )}
            </div>
          )}
          <span>
            {message.senderType === "BETREIBER"
              ? "Sie"
              : message.senderType === "SYSTEM"
              ? "System"
              : "Installateur"}
          </span>
          {isFromBetreiber && (
            <div className="pmsg-sender-avatar pmsg-sender-avatar--me">
              <User size={12} />
            </div>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`pmsg-bubble ${
            isFromBetreiber ? "pmsg-bubble--me" : "pmsg-bubble--other"
          }`}
        >
          <p>{message.content}</p>
        </div>

        {/* Time + Status */}
        <div className={`pmsg-bubble-time ${isFromBetreiber ? "pmsg-bubble-time--right" : ""}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isFromBetreiber && (
            <span className="pmsg-read-status">
              {message.read ? (
                <CheckCheck size={14} className="pmsg-read-icon" />
              ) : (
                <Check size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const messageStyles = `
  .pmsg-page {
    max-width: 800px;
    animation: pmsgFadeIn 0.4s ease-out;
  }

  @keyframes pmsgFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Header */
  .pmsg-header {
    margin-bottom: 24px;
  }

  .pmsg-header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pmsg-header-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border: 1px solid rgba(212, 168, 67, 0.3);
    border-radius: 14px;
    color: #EAD068;
    box-shadow: 0 0 30px rgba(212, 168, 67, 0.2);
  }

  .pmsg-header-title h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .pmsg-header-title p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Alert */
  .pmsg-alert {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 14px;
  }

  .pmsg-alert-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.15);
    border-radius: 10px;
    color: #f87171;
    flex-shrink: 0;
  }

  .pmsg-alert-content h3 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 600;
    color: #fca5a5;
  }

  .pmsg-alert-content p {
    margin: 0;
    font-size: 14px;
    color: rgba(252, 165, 165, 0.8);
    line-height: 1.5;
  }

  /* Empty State */
  .pmsg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
  }

  .pmsg-empty svg {
    margin-bottom: 12px;
  }

  /* Container */
  .pmsg-container {
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* Messages List */
  .pmsg-list {
    height: calc(100vh - 340px);
    min-height: 300px;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pmsg-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #D4A843;
  }

  .pmsg-spin {
    animation: pmsgSpin 1s linear infinite;
  }

  @keyframes pmsgSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .pmsg-empty-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
  }

  .pmsg-empty-messages svg {
    margin-bottom: 12px;
  }

  .pmsg-empty-messages p {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
  }

  .pmsg-empty-messages span {
    margin-top: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
  }

  /* Date Separator */
  .pmsg-date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0;
  }

  .pmsg-date-separator span {
    padding: 4px 14px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
  }

  /* New Messages Indicator */
  .pmsg-new-indicator {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #D4A843;
    border: none;
    border-radius: 100px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 4px 16px rgba(212, 168, 67, 0.4);
    animation: pmsgBounce 0.3s ease;
  }

  @keyframes pmsgBounce {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Error */
  .pmsg-error {
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.1);
    border-top: 1px solid rgba(239, 68, 68, 0.25);
  }

  .pmsg-error p {
    margin: 0;
    font-size: 13px;
    color: #fca5a5;
  }

  /* File Preview */
  .pmsg-file-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: rgba(212, 168, 67, 0.08);
    border-top: 1px solid rgba(212, 168, 67, 0.15);
    font-size: 13px;
    color: #EAD068;
  }

  .pmsg-file-preview span {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pmsg-file-remove {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pmsg-file-remove:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
  }

  .pmsg-file-input {
    display: none;
  }

  /* Form */
  .pmsg-form {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    align-items: center;
  }

  .pmsg-attach-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .pmsg-attach-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .pmsg-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 14px;
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    outline: none;
    transition: all 0.2s;
  }

  .pmsg-input::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  .pmsg-input:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(212, 168, 67, 0.5);
    box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.15);
  }

  .pmsg-input:disabled {
    opacity: 0.5;
  }

  .pmsg-send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    color: #fff;
    background: #D4A843;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .pmsg-send-btn:hover:not(:disabled) {
    background: #b8942e;
    transform: translateY(-1px);
  }

  .pmsg-send-btn:disabled {
    background: rgba(212, 168, 67, 0.4);
    cursor: not-allowed;
  }

  /* Message Bubbles */
  .pmsg-bubble-wrap {
    display: flex;
    justify-content: flex-start;
  }

  .pmsg-bubble-wrap--right {
    justify-content: flex-end;
  }

  .pmsg-bubble-container {
    max-width: 75%;
  }

  /* Sender */
  .pmsg-bubble-sender {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
  }

  .pmsg-bubble-sender--right {
    justify-content: flex-end;
  }

  .pmsg-sender-avatar {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .pmsg-sender-avatar--other {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
  }

  .pmsg-sender-avatar--me {
    background: rgba(212, 168, 67, 0.2);
    color: #EAD068;
  }

  /* Bubble */
  .pmsg-bubble {
    padding: 12px 16px;
    border-radius: 16px;
  }

  .pmsg-bubble--me {
    background: #D4A843;
    border-bottom-right-radius: 4px;
  }

  .pmsg-bubble--other {
    background: rgba(255, 255, 255, 0.08);
    border-bottom-left-radius: 4px;
  }

  .pmsg-bubble p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #fff;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Time */
  .pmsg-bubble-time {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
  }

  .pmsg-bubble-time--right {
    justify-content: flex-end;
  }

  .pmsg-read-status {
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.35);
  }

  .pmsg-read-icon {
    color: #EAD068;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .pmsg-header-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .pmsg-list {
      height: calc(100vh - 300px);
      min-height: 250px;
      padding: 16px;
    }

    .pmsg-bubble-container {
      max-width: 85%;
    }

    .pmsg-form {
      padding: 12px;
      gap: 6px;
    }
  }
`;
