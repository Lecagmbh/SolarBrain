import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDetail } from "../context/DetailContext";
import { apiGet, apiPost } from "../../../api/client";
import { sanitizeHtml } from "../../../../utils/sanitizeHtml";

// ============================================
// TYPES
// ============================================

type MessageDirection = "INBOUND" | "OUTBOUND";
type SenderType = "BETREIBER" | "MITARBEITER" | "SYSTEM" | "ENDKUNDE";

type WhatsAppMessage = {
  id: number;
  content: string;
  messageType: string;
  direction: MessageDirection;
  senderType: SenderType;
  mediaUrl?: string;
  mediaType?: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
};

type ChatMessage = {
  id: number;
  content: string;
  messageType: string;
  direction: MessageDirection;
  senderType: SenderType;
  channelType: string;
  createdAt: string;
  read: boolean;
  delivered: boolean;
};

type ChannelInfo = {
  type: string;
  label: string;
  available: boolean;
  reason?: string | null;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
  };
  unreadCount: number;
};

type ChatInfoData = {
  channels: ChannelInfo[];
  defaultChannel: string;
  portalStatus: {
    activated: boolean;
    activatedAt?: string;
    lastVisit?: string;
  };
};

type MessageTemplate = {
  id: number;
  key: string;
  name: string;
  description?: string;
  template: string;
  triggerType?: string;
};

type EmailRow = {
  id: string;
  subject?: string | null;
  from?: string | null;
  fromName?: string | null;
  date?: string | null;
  direction?: "INBOUND" | "OUTBOUND" | string;
  assigned?: boolean;
  installationId?: number | null;
  isRead?: boolean;
  hasAttachments?: boolean;
  bodyText?: string | null;
  bodyHtml?: string | null;
};

// ============================================
// HELPERS
// ============================================

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(phone: string | undefined) {
  if (!phone) return "-";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("49") && cleaned.length > 10) {
    return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.startsWith("0") && cleaned.length > 4) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return phone;
}

// ============================================
// STYLES
// ============================================

const styles = `
.comm-root{display:flex;flex-direction:column;gap:16px;height:calc(100vh - 240px)}
.comm-section{background:rgba(30,41,59,0.5);border:1px solid rgba(71,85,105,0.3);border-radius:16px;overflow:hidden}
.comm-section--whatsapp{flex:1;min-height:300px;display:flex;flex-direction:column}
.comm-section--email{flex:0 0 auto;max-height:350px;display:flex;flex-direction:column}
.comm-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(0,0,0,0.15);border-bottom:1px solid rgba(255,255,255,0.05)}
.comm-header-left{display:flex;align-items:center;gap:12px}
.comm-header-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
.comm-header-icon--wa{background:rgba(37,211,102,0.15);color:#25d366}
.comm-header-icon--email{background:rgba(59,130,246,0.15);color:#3b82f6}
.comm-header-title{font-size:15px;font-weight:700;color:rgba(255,255,255,0.92)}
.comm-header-subtitle{font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px}
.comm-header-subtitle a{color:#38bdf8;text-decoration:none}
.comm-header-subtitle a:hover{text-decoration:underline}
.comm-header-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600}
.comm-header-badge--green{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
.comm-header-badge--orange{background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3)}
.comm-body{flex:1;overflow-y:auto;padding:16px}
.comm-empty{text-align:center;padding:32px 16px;color:rgba(255,255,255,0.5)}
.comm-empty-icon{font-size:32px;margin-bottom:8px;opacity:0.5}
.comm-messages{display:flex;flex-direction:column;gap:10px}
.comm-msg{padding:10px 14px;border-radius:12px;max-width:80%}
.comm-msg--out{align-self:flex-end;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.25)}
.comm-msg--in{align-self:flex-start;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)}
.comm-msg--system{align-self:flex-end;background:rgba(100,116,139,0.15);border:1px solid rgba(100,116,139,0.25)}
.comm-msg-meta{display:flex;justify-content:space-between;gap:12px;font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:4px}
.comm-msg-content{font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word;color:rgba(255,255,255,0.9)}
.comm-msg-status{font-size:10px;color:rgba(255,255,255,0.4);text-align:right;margin-top:4px}
.comm-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1)}
.comm-action{padding:8px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.7);cursor:pointer;transition:0.15s;display:flex;align-items:center;gap:6px}
.comm-action:hover:not(:disabled){background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);color:#38bdf8}
.comm-action:disabled{opacity:0.4;cursor:not-allowed}
.comm-input{display:flex;gap:10px;padding:12px 16px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1)}
.comm-input textarea{flex:1;resize:none;padding:10px 14px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:rgba(255,255,255,0.9);font-size:13px;line-height:1.4}
.comm-input textarea:focus{outline:none;border-color:rgba(56,189,248,0.4)}
.comm-input textarea::placeholder{color:rgba(255,255,255,0.4)}
.comm-send{padding:10px 18px;background:#38bdf8;border:none;border-radius:10px;color:#000;font-size:13px;font-weight:600;cursor:pointer;transition:0.15s;align-self:flex-end}
.comm-send:hover:not(:disabled){filter:brightness(1.1)}
.comm-send:disabled{opacity:0.4;cursor:not-allowed}
.comm-no-phone{padding:12px 16px;text-align:center;color:rgba(255,255,255,0.5);font-size:13px;border-top:1px solid rgba(255,255,255,0.05)}
.comm-email-list{display:flex;flex-direction:column}
.comm-email-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:0.15s}
.comm-email-item:hover{background:rgba(255,255,255,0.03)}
.comm-email-item--selected{background:rgba(56,189,248,0.08)}
.comm-email-icon{font-size:14px;opacity:0.6}
.comm-email-main{flex:1;min-width:0}
.comm-email-subject{font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.comm-email-from{font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.comm-email-date{font-size:11px;color:rgba(255,255,255,0.4);white-space:nowrap}
.comm-email-detail{padding:16px;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1);max-height:200px;overflow-y:auto}
.comm-email-detail-header{margin-bottom:12px}
.comm-email-detail-subject{font-size:14px;font-weight:700;color:rgba(255,255,255,0.9)}
.comm-email-detail-meta{font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px}
.comm-email-detail-body{font-size:13px;line-height:1.5;color:rgba(255,255,255,0.8);white-space:pre-wrap;word-break:break-word}
.comm-refresh{padding:6px 12px;background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:rgba(255,255,255,0.6);font-size:12px;cursor:pointer;transition:0.15s}
.comm-refresh:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8)}
.comm-section--chat{flex:1;min-height:300px;display:flex;flex-direction:column}
.comm-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.15)}
.comm-tab{padding:10px 16px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.5);cursor:pointer;transition:0.15s;border-bottom:2px solid transparent;display:flex;align-items:center;gap:8px}
.comm-tab:hover{color:rgba(255,255,255,0.8)}
.comm-tab--active{color:#38bdf8;border-bottom-color:#38bdf8}
.comm-tab--disabled{opacity:0.4;cursor:not-allowed}
.comm-tab-badge{padding:2px 6px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(239,68,68,0.2);color:#f87171}
.comm-tab-icon{font-size:16px}
.comm-contact-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(0,0,0,0.1);border-bottom:1px solid rgba(255,255,255,0.05)}
.comm-contact-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#D4A843,#EAD068);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff}
.comm-contact-info{flex:1}
.comm-contact-name{font-size:14px;font-weight:600;color:rgba(255,255,255,0.9)}
.comm-contact-meta{font-size:11px;color:rgba(255,255,255,0.5);display:flex;gap:12px;margin-top:2px}
.comm-portal-badge{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.25)}
.comm-email-hint{display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(59,130,246,0.08);border-top:1px solid rgba(59,130,246,0.15);font-size:11px;color:rgba(59,130,246,0.9)}
`;

// ============================================
// MAIN COMPONENT
// ============================================

export default function CommunicationTab() {
  const { detail } = useDetail();
  const installationId = detail?.id;
  const dedicatedEmail = (detail as any)?.dedicatedEmail;

  // WhatsApp State
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [contactPhone, setContactPhone] = useState<string | undefined>();
  const [hasPhone, setHasPhone] = useState(false);
  const [waLoading, setWaLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Chat State (Endkunde/Ersteller)
  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // Email State
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [emailLoading, setEmailLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRow | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // WHATSAPP FUNCTIONS
  // ============================================

  const loadWhatsApp = useCallback(async () => {
    if (!installationId) return;
    setWaLoading(true);
    try {
      const [msgRes, tmplRes] = await Promise.all([
        apiGet(`/whatsapp/betreiber/${installationId}/messages`),
        apiGet("/whatsapp/betreiber/templates?triggerType=MANUAL"),
      ]);
      if (msgRes?.success && msgRes.data) {
        setWaMessages(msgRes.data.messages || []);
        setHasPhone(msgRes.data.hasPhone || false);
        setContactPhone(msgRes.data.contactPhone);
      }
      if (tmplRes?.success && tmplRes.data) {
        setTemplates(tmplRes.data);
      }
    } catch (err) {
      console.error("[CommunicationTab] loadWhatsApp failed", err);
    } finally {
      setWaLoading(false);
    }
  }, [installationId]);

  const sendMessage = async () => {
    if (!installationId || !newMessage.trim() || sending || !hasPhone) return;
    setSending(true);
    try {
      const res = await apiPost(`/whatsapp/betreiber/${installationId}/messages`, {
        message: newMessage.trim(),
      });
      if (res?.success) {
        setNewMessage("");
        await loadWhatsApp();
      }
    } catch (err) {
      console.error("[CommunicationTab] sendMessage failed", err);
    } finally {
      setSending(false);
    }
  };

  const sendTemplate = async (templateKey: string) => {
    if (!installationId || sending || !hasPhone) return;
    setSending(true);
    try {
      const res = await apiPost(`/whatsapp/betreiber/${installationId}/messages/template`, {
        templateKey,
      });
      if (res?.success) {
        await loadWhatsApp();
      }
    } catch (err) {
      console.error("[CommunicationTab] sendTemplate failed", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================
  // CHAT FUNCTIONS (Endkunde/Ersteller)
  // ============================================

  const loadChatInfo = useCallback(async () => {
    if (!installationId) return;
    setChatLoading(true);
    try {
      const res = await apiGet(`/portal/admin/installations/${installationId}/chat/info`);
      if (res?.success && res.data) {
        setChatInfo(res.data);
        // Set default channel if not set
        if (!activeChannel && res.data.defaultChannel) {
          setActiveChannel(res.data.defaultChannel);
        }
      }
    } catch (err) {
      console.error("[CommunicationTab] loadChatInfo failed", err);
    } finally {
      setChatLoading(false);
    }
  }, [installationId, activeChannel]);

  const loadChatMessages = useCallback(async () => {
    if (!installationId || !activeChannel) return;
    try {
      const res = await apiGet(`/portal/admin/installations/${installationId}/chat?channel=${activeChannel}`);
      if (res?.success && res.data) {
        setChatMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("[CommunicationTab] loadChatMessages failed", err);
    }
  }, [installationId, activeChannel]);

  const sendChatMessage = async () => {
    if (!installationId || !chatMessage.trim() || chatSending || !activeChannel) return;
    setChatSending(true);
    try {
      const res = await apiPost(`/portal/admin/installations/${installationId}/chat`, {
        content: chatMessage.trim(),
        channel: activeChannel,
      });
      if (res?.success) {
        setChatMessage("");
        await loadChatMessages();
        await loadChatInfo(); // Refresh unread counts
      }
    } catch (err) {
      console.error("[CommunicationTab] sendChatMessage failed", err);
    } finally {
      setChatSending(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // ============================================
  // EMAIL FUNCTIONS
  // ============================================

  const loadEmails = useCallback(async () => {
    if (!installationId) return;
    setEmailLoading(true);
    try {
      const res = await apiGet(`/emails/for-installation/${installationId}?folder=all&limit=50`);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setEmails(rows);
    } catch (err) {
      console.error("[CommunicationTab] loadEmails failed", err);
      setEmails([]);
    } finally {
      setEmailLoading(false);
    }
  }, [installationId]);

  const loadEmailDetail = async (emailId: string) => {
    try {
      const res = await apiGet(`/emails/${emailId}`);
      if (res) {
        setSelectedEmail(res as EmailRow);
      }
    } catch (err) {
      console.error("[CommunicationTab] loadEmailDetail failed", err);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadWhatsApp();
    loadEmails();
    loadChatInfo();
  }, [loadWhatsApp, loadEmails, loadChatInfo]);

  useEffect(() => {
    if (activeChannel) {
      loadChatMessages();
    }
  }, [activeChannel, loadChatMessages]);

  useEffect(() => {
    if (!waLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [waMessages, waLoading]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // ============================================
  // HELPERS
  // ============================================

  const getSenderLabel = (msg: WhatsAppMessage) => {
    if (msg.direction === "INBOUND") return "Betreiber";
    if (msg.senderType === "SYSTEM") return "System";
    return "Mitarbeiter";
  };

  const getChatSenderLabel = (msg: ChatMessage) => {
    if (msg.direction === "OUTBOUND") {
      return msg.senderType === "MITARBEITER" ? "Mitarbeiter" : "System";
    }
    return msg.channelType === "ENDKUNDE" ? "Endkunde" : "Ersteller";
  };

  const activeChannelInfo = chatInfo?.channels.find(c => c.type === activeChannel);

  const quickActions = useMemo(() => {
    return [
      { key: "REQUEST_LAGEPLAN", label: "Lageplan", icon: "📍" },
      { key: "REQUEST_ZAEHLER", label: "Zählerfoto", icon: "📷" },
      { key: "REQUEST_DATENBLATT", label: "Datenblatt", icon: "📄" },
      { key: "GENERAL_STATUS", label: "Status-Update", icon: "ℹ️" },
    ].filter(a => templates.some(t => t.key === a.key));
  }, [templates]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="comm-root">
      <style>{styles}</style>

      {/* ========== CHAT SECTION (Endkunde/Ersteller) ========== */}
      <div className="comm-section comm-section--chat">
        <div className="comm-header">
          <div className="comm-header-left">
            <div className="comm-header-icon" style={{ background: "rgba(212,168,67,0.15)", color: "#D4A843" }}>💬</div>
            <div>
              <div className="comm-header-title">Chat</div>
              <div className="comm-header-subtitle">
                Mit Endkunde oder Ersteller kommunizieren
              </div>
            </div>
          </div>
          <button className="comm-refresh" onClick={() => { loadChatInfo(); loadChatMessages(); }} disabled={chatLoading}>
            {chatLoading ? "..." : "↻"}
          </button>
        </div>

        {/* Channel Tabs */}
        <div className="comm-tabs">
          {chatInfo?.channels.map((channel) => (
            <div
              key={channel.type}
              className={`comm-tab ${activeChannel === channel.type ? "comm-tab--active" : ""} ${!channel.available ? "comm-tab--disabled" : ""}`}
              onClick={() => channel.available && setActiveChannel(channel.type)}
              title={channel.reason || undefined}
            >
              <span className="comm-tab-icon">{channel.type === "ENDKUNDE" ? "👤" : "🏢"}</span>
              <span>{channel.label}</span>
              {channel.unreadCount > 0 && (
                <span className="comm-tab-badge">{channel.unreadCount}</span>
              )}
              {!channel.available && <span style={{ fontSize: 10, color: "#f59e0b" }}>⚠️</span>}
            </div>
          ))}
        </div>

        {/* Contact Info Bar */}
        {activeChannelInfo && (
          <div className="comm-contact-bar">
            <div className="comm-contact-avatar">
              {activeChannel === "ENDKUNDE" ? "👤" : "🏢"}
            </div>
            <div className="comm-contact-info">
              <div className="comm-contact-name">
                {activeChannelInfo.contact.name || (activeChannel === "ENDKUNDE" ? "Endkunde" : "Ersteller")}
              </div>
              <div className="comm-contact-meta">
                {activeChannelInfo.contact.email && <span>✉️ {activeChannelInfo.contact.email}</span>}
                {activeChannelInfo.contact.phone && <span>📞 {activeChannelInfo.contact.phone}</span>}
              </div>
            </div>
            {chatInfo?.portalStatus.activated && activeChannel === "ENDKUNDE" && (
              <span className="comm-portal-badge">Portal aktiv</span>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div className="comm-body">
          {chatLoading && chatMessages.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">💬</div>
              <div>Lade Nachrichten...</div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">💬</div>
              <div>Noch keine Nachrichten</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                Senden Sie die erste Nachricht. Der Empfänger wird per E-Mail benachrichtigt.
              </div>
            </div>
          ) : (
            <div className="comm-messages">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`comm-msg ${
                    msg.direction === "INBOUND"
                      ? "comm-msg--in"
                      : msg.senderType === "SYSTEM"
                        ? "comm-msg--system"
                        : "comm-msg--out"
                  }`}
                >
                  <div className="comm-msg-meta">
                    <span>{getChatSenderLabel(msg)}</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="comm-msg-content">{msg.content}</div>
                  {msg.direction === "OUTBOUND" && (
                    <div className="comm-msg-status">
                      {msg.delivered ? (msg.read ? "✓✓ Gelesen" : "✓ Zugestellt") : "○ Gesendet"}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatMessagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        {activeChannel && (
          <>
            <div className="comm-input">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={`Nachricht an ${activeChannel === "ENDKUNDE" ? "Endkunden" : "Ersteller"} schreiben...`}
                rows={2}
                disabled={chatSending}
              />
              <button
                className="comm-send"
                onClick={sendChatMessage}
                disabled={!chatMessage.trim() || chatSending}
              >
                {chatSending ? "..." : "Senden"}
              </button>
            </div>
            <div className="comm-email-hint">
              <span>✉️</span>
              <span>Empfänger erhält E-Mail: "Neue Nachricht im Portal verfügbar"</span>
            </div>
          </>
        )}
      </div>

      {/* ========== WHATSAPP SECTION ========== */}
      <div className="comm-section comm-section--whatsapp">
        <div className="comm-header">
          <div className="comm-header-left">
            <div className="comm-header-icon comm-header-icon--wa">💬</div>
            <div>
              <div className="comm-header-title">WhatsApp-Kommunikation</div>
              <div className="comm-header-subtitle">
                {hasPhone ? (
                  <>Betreiber: {formatPhone(contactPhone)}</>
                ) : (
                  <span style={{ color: "#f59e0b" }}>Keine Telefonnummer hinterlegt</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {hasPhone && (
              <span className="comm-header-badge comm-header-badge--green">Verbunden</span>
            )}
            <button className="comm-refresh" onClick={loadWhatsApp} disabled={waLoading}>
              {waLoading ? "..." : "↻"}
            </button>
          </div>
        </div>

        <div className="comm-body">
          {waLoading && waMessages.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">💬</div>
              <div>Lade Nachrichten...</div>
            </div>
          ) : waMessages.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">💬</div>
              <div>Noch keine WhatsApp-Nachrichten</div>
              {hasPhone && (
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Nutzen Sie die Schnellaktionen oder senden Sie eine Nachricht.
                </div>
              )}
            </div>
          ) : (
            <div className="comm-messages">
              {waMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`comm-msg ${
                    msg.direction === "INBOUND"
                      ? "comm-msg--in"
                      : msg.senderType === "SYSTEM"
                        ? "comm-msg--system"
                        : "comm-msg--out"
                  }`}
                >
                  <div className="comm-msg-meta">
                    <span>{getSenderLabel(msg)}</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                  {msg.mediaUrl && msg.messageType === "image" && (
                    <img
                      src={msg.mediaUrl}
                      alt="Anhang"
                      style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}
                      onClick={() => window.open(msg.mediaUrl, "_blank")}
                    />
                  )}
                  <div className="comm-msg-content">{msg.content}</div>
                  {msg.direction === "OUTBOUND" && (
                    <div className="comm-msg-status">
                      {msg.delivered ? (msg.read ? "✓✓ Gelesen" : "✓ Zugestellt") : "○ Gesendet"}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {hasPhone && quickActions.length > 0 && (
          <div className="comm-actions">
            {quickActions.map((action) => (
              <button
                key={action.key}
                className="comm-action"
                onClick={() => sendTemplate(action.key)}
                disabled={sending}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {hasPhone ? (
          <div className="comm-input">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht eingeben... (Enter zum Senden)"
              rows={2}
              disabled={sending}
            />
            <button
              className="comm-send"
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? "..." : "Senden"}
            </button>
          </div>
        ) : (
          <div className="comm-no-phone">
            Um WhatsApp-Nachrichten zu senden, muss eine Telefonnummer in den Anlagendaten hinterlegt sein.
          </div>
        )}
      </div>

      {/* ========== EMAIL SECTION ========== */}
      <div className="comm-section comm-section--email">
        <div className="comm-header">
          <div className="comm-header-left">
            <div className="comm-header-icon comm-header-icon--email">✉️</div>
            <div>
              <div className="comm-header-title">E-Mail-Kommunikation</div>
              <div className="comm-header-subtitle">
                {dedicatedEmail ? (
                  <>Eingehend an: <a href={`mailto:${dedicatedEmail}`}>{dedicatedEmail}</a></>
                ) : (
                  "Keine dedizierte E-Mail-Adresse"
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="comm-header-badge comm-header-badge--orange">{emails.length} E-Mails</span>
            <button className="comm-refresh" onClick={loadEmails} disabled={emailLoading}>
              {emailLoading ? "..." : "↻"}
            </button>
          </div>
        </div>

        <div className="comm-body" style={{ padding: 0 }}>
          {emailLoading && emails.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">✉️</div>
              <div>Lade E-Mails...</div>
            </div>
          ) : emails.length === 0 ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">✉️</div>
              <div>Keine E-Mails zugeordnet</div>
              {dedicatedEmail && (
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  E-Mails an {dedicatedEmail} werden automatisch zugeordnet.
                </div>
              )}
            </div>
          ) : (
            <div className="comm-email-list">
              {emails.slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  className={`comm-email-item ${selectedEmail?.id === email.id ? "comm-email-item--selected" : ""}`}
                  onClick={() => {
                    if (selectedEmail?.id === email.id) {
                      setSelectedEmail(null);
                    } else {
                      loadEmailDetail(email.id);
                    }
                  }}
                >
                  <span className="comm-email-icon">
                    {email.direction === "OUTBOUND" ? "📤" : "📥"}
                  </span>
                  <div className="comm-email-main">
                    <div className="comm-email-subject">{email.subject || "(ohne Betreff)"}</div>
                    <div className="comm-email-from">
                      {email.fromName ? `${email.fromName} <${email.from}>` : email.from}
                    </div>
                  </div>
                  <div className="comm-email-date">{formatTime(email.date || "")}</div>
                  {email.hasAttachments && <span title="Hat Anhänge">📎</span>}
                </div>
              ))}
              {emails.length > 5 && (
                <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  + {emails.length - 5} weitere E-Mails (siehe E-Mail-Tab)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Detail */}
        {selectedEmail && (
          <div className="comm-email-detail">
            <div className="comm-email-detail-header">
              <div className="comm-email-detail-subject">{selectedEmail.subject || "(ohne Betreff)"}</div>
              <div className="comm-email-detail-meta">
                Von: {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}
                {" • "}
                {formatTime(selectedEmail.date || "")}
              </div>
            </div>
            <div className="comm-email-detail-body">
              {selectedEmail.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.bodyHtml) }} />
              ) : (
                selectedEmail.bodyText || "(Kein Inhalt)"
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
