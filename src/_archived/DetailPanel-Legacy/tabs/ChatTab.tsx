/**
 * CHAT TAB - Internes Messaging für Ersteller/Endkunde
 * Features:
 * - Channel-Umschaltung: Ersteller oder Endkunde
 * - Chat-Verlauf anzeigen
 * - Nachrichten senden (mit E-Mail-Benachrichtigung)
 * - Automatische Kanal-Erkennung (Endkunde wenn Portal aktiv)
 */

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Send, Loader2, User, Users, Clock,
  Mail, Phone, RefreshCw, Check, Building2, AlertCircle,
} from "lucide-react";
import { apiGet, apiPost } from "../../../../../api/client";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMessage {
  id: number;
  content: string;
  messageType: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: string;
  channelType: string;
  createdAt: string;
  read: boolean;
  delivered: boolean;
}

interface ChannelInfo {
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
}

interface ChatInfoData {
  channels: ChannelInfo[];
  defaultChannel: string;
  portalStatus: {
    activated: boolean;
    activatedAt?: string;
    lastVisit?: string;
  };
}

interface ChatData {
  channelType: string;
  hasPortal: boolean;
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    hasPortal?: boolean;
  };
  messages: ChatMessage[];
}

interface ChatTabProps {
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ChatTab({
  installationId,
  showToast,
  isKunde = false,
}: ChatTabProps) {
  const [info, setInfo] = useState<ChatInfoData | null>(null);
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  // Load channel info
  useEffect(() => {
    loadInfo();
  }, [installationId]);

  // Load messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      loadMessages();
    }
  }, [activeChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ success: boolean; data: ChatInfoData }>(
        `/api/portal/admin/installations/${installationId}/chat/info`
      );
      setInfo(response.data);
      // Set default channel
      if (!activeChannel && response.data.defaultChannel) {
        setActiveChannel(response.data.defaultChannel);
      }
    } catch (e) {
      console.error("Failed to load chat info:", e);
      showToast("Fehler beim Laden der Chat-Info", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeChannel) return;
    try {
      const response = await apiGet<{ success: boolean; data: ChatData }>(
        `/api/portal/admin/installations/${installationId}/chat?channel=${activeChannel}`
      );
      setData(response.data);
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !activeChannel) return;

    setSending(true);
    try {
      await apiPost(`/api/portal/admin/installations/${installationId}/chat`, {
        content: newMessage.trim(),
        channel: activeChannel,
      });
      setNewMessage("");
      showToast("Nachricht gesendet + E-Mail verschickt", "success");
      // Reload messages
      await loadMessages();
    } catch (e: any) {
      console.error("Failed to send message:", e);
      showToast(e.response?.data?.message || "Senden fehlgeschlagen", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMAT HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.direction === "OUTBOUND") {
      return msg.senderType === "MITARBEITER" ? "Mitarbeiter" : "System";
    }
    return msg.channelType === "ENDKUNDE" ? "Endkunde" : "Ersteller";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading && !info) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const activeChannelInfo = info?.channels.find(c => c.type === activeChannel);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "500px" }}>
      {/* Channel Tabs */}
      <div className="flex border-b border-white/10">
        {info?.channels.map((channel) => {
          const isActive = channel.type === activeChannel;
          const Icon = channel.type === "ENDKUNDE" ? User : Building2;

          return (
            <button
              key={channel.type}
              onClick={() => channel.available && setActiveChannel(channel.type)}
              disabled={!channel.available}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? "border-b-2 border-amber-500 text-white bg-white/5"
                  : channel.available
                    ? "text-white/60 hover:text-white hover:bg-white/5"
                    : "text-white/30 cursor-not-allowed"
                }
              `}
              title={channel.reason || undefined}
            >
              <Icon className="w-4 h-4" />
              <span>{channel.label}</span>
              {channel.unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {channel.unreadCount}
                </span>
              )}
              {!channel.available && (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          onClick={() => { loadInfo(); loadMessages(); }}
          className="px-3 py-2 text-white/50 hover:text-white transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Info */}
      {activeChannelInfo && (
        <div className="flex items-center gap-4 px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center">
            {activeChannel === "ENDKUNDE" ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">
              {activeChannelInfo.contact.name || (activeChannel === "ENDKUNDE" ? "Endkunde" : "Ersteller")}
            </div>
            <div className="flex items-center gap-3 text-sm text-white/50">
              {activeChannelInfo.contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {activeChannelInfo.contact.email}
                </span>
              )}
              {activeChannelInfo.contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {activeChannelInfo.contact.phone}
                </span>
              )}
            </div>
          </div>
          {info?.portalStatus.activated && activeChannel === "ENDKUNDE" && (
            <div className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded">
              Portal aktiv
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!data?.messages.length ? (
          <div className="text-center text-white/40 py-10">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Keine Nachrichten vorhanden</p>
            <p className="text-sm mt-2">
              Senden Sie die erste Nachricht an {activeChannel === "ENDKUNDE" ? "den Endkunden" : "den Ersteller"}.
            </p>
          </div>
        ) : (
          data.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.direction === "OUTBOUND"
                    ? "bg-gradient-to-br from-amber-500 to-purple-600 text-white rounded-br-md"
                    : "bg-white/10 text-white rounded-bl-md"
                }`}
              >
                {/* Sender indicator */}
                <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                  <Users className="w-3 h-3" />
                  <span>{getSenderLabel(msg)}</span>
                </div>

                {/* Message content */}
                <div className="whitespace-pre-wrap break-words text-sm">
                  {msg.content}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(msg.createdAt)}</span>
                  {msg.direction === "OUTBOUND" && (
                    <Check className="w-3 h-3 ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isKunde && activeChannel && (
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Nachricht an ${activeChannel === "ENDKUNDE" ? "Endkunden" : "Ersteller"} schreiben... (Enter zum Senden)`}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              rows={2}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Empfänger erhält E-Mail-Benachrichtigung: "Neue Nachricht im Portal"
          </p>
        </div>
      )}
    </div>
  );
}

export default ChatTab;
