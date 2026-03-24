/**
 * WHATSAPP TAB - Chat-UI für WhatsApp-Konversation einer Installation
 * Features:
 * - Chat-Verlauf anzeigen
 * - Nachrichten senden
 * - System-/Manuelle Nachrichten unterscheiden
 */

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Send, Loader2, User, Bot, Clock,
  CheckCircle, AlertCircle, Phone, RefreshCw,
} from "lucide-react";
import { api } from "../../../services/api";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface WhatsAppMessage {
  id: number;
  messageId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  isSystem?: boolean;
}

interface WhatsAppConversationData {
  hasConversation: boolean;
  conversationId?: number;
  phoneNumber?: string;
  profileName?: string;
  state?: string;
  createdAt?: string;
  messages: WhatsAppMessage[];
}

interface WhatsAppTabProps {
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const STATE_CONFIG: Record<string, { label: string; color: string }> = {
  STARTED: { label: "Gestartet", color: "#6b7280" },
  COLLECTING: { label: "Daten werden erfasst", color: "#3b82f6" },
  AWAITING_INFO: { label: "Wartet auf Info", color: "#f59e0b" },
  CONFIRMING: { label: "Bestätigung ausstehend", color: "#EAD068" },
  COMPLETED: { label: "Abgeschlossen", color: "#10b981" },
  CANCELLED: { label: "Abgebrochen", color: "#ef4444" },
  EXPIRED: { label: "Abgelaufen", color: "#6b7280" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function WhatsAppTab({
  installationId,
  showToast,
  isKunde = false,
}: WhatsAppTabProps) {
  const [data, setData] = useState<WhatsAppConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadMessages();
  }, [installationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/whatsapp/installation/${installationId}/messages`) as { data: WhatsAppConversationData };
      setData(response.data);
    } catch (e) {
      console.error("Failed to load WhatsApp messages:", e);
      setData({ hasConversation: false, messages: [] });
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !data?.hasConversation) return;

    setSending(true);
    try {
      await api.post(`/whatsapp/installation/${installationId}/message`, {
        message: newMessage.trim(),
      });
      setNewMessage("");
      showToast("Nachricht gesendet", "success");
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

  const formatPhone = (phone?: string) => {
    if (!phone) return "";
    // Format: +49 155 67095659
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("49") && cleaned.length >= 10) {
      return `+49 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    }
    return `+${cleaned}`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!data?.hasConversation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-lg font-semibold text-white/80 mb-2">
          Keine WhatsApp-Konversation
        </h3>
        <p className="text-white/50 text-sm max-w-md">
          Diese Installation wurde nicht über WhatsApp erstellt oder es gibt keine
          verknüpfte Konversation.
        </p>
      </div>
    );
  }

  const stateConfig = STATE_CONFIG[data.state || ""] || STATE_CONFIG.STARTED;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {data.profileName || "WhatsApp Chat"}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${stateConfig.color}20`,
                  color: stateConfig.color,
                }}
              >
                {stateConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Phone className="w-3 h-3" />
              <span>{formatPhone(data.phoneNumber)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={loadMessages}
          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data.messages.length === 0 ? (
          <div className="text-center text-white/40 py-10">
            Keine Nachrichten vorhanden
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
                  {msg.direction === "OUTBOUND" ? (
                    <>
                      {msg.isSystem ? (
                        <>
                          <Bot className="w-3 h-3" />
                          <span>System</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" />
                          <span>Mitarbeiter</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      <span>{data.profileName || "Kunde"}</span>
                    </>
                  )}
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
                    <CheckCircle className="w-3 h-3 ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isKunde && data.state !== "COMPLETED" && data.state !== "CANCELLED" && data.state !== "EXPIRED" && (
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht eingeben... (Enter zum Senden)"
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
          <p className="mt-2 text-xs text-white/40">
            Nachrichten werden über WhatsApp an {formatPhone(data.phoneNumber)} gesendet
          </p>
        </div>
      )}

      {/* Closed conversation notice */}
      {(data.state === "COMPLETED" || data.state === "CANCELLED" || data.state === "EXPIRED") && (
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-white/60">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Diese Konversation ist {data.state === "COMPLETED" ? "abgeschlossen" : data.state === "CANCELLED" ? "abgebrochen" : "abgelaufen"}.
              Neue Nachrichten können nicht gesendet werden.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatsAppTab;
