/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI CHAT WIDGET
 * Floating Chat-Widget für den Buchhaltungs-KI-Assistenten
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { sendChatMessage } from "../../api/accounting";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  // Floating Button
  floatingButton: {
    position: "fixed" as const,
    bottom: "24px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1000,
  },
  floatingButtonHover: {
    transform: "scale(1.1)",
    boxShadow: "0 6px 28px rgba(16, 185, 129, 0.5)",
  },

  // Chat Panel
  chatPanel: {
    position: "fixed" as const,
    bottom: "96px",
    right: "24px",
    width: "400px",
    maxWidth: "calc(100vw - 48px)",
    height: "560px",
    maxHeight: "calc(100vh - 120px)",
    background: "rgba(15, 15, 20, 0.98)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    zIndex: 1000,
  },
  chatPanelHidden: {
    opacity: 0,
    transform: "translateY(20px) scale(0.95)",
    pointerEvents: "none" as const,
  },
  chatPanelVisible: {
    opacity: 1,
    transform: "translateY(0) scale(1)",
    pointerEvents: "auto" as const,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "rgba(16, 185, 129, 0.1)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#fafafa",
    fontSize: "0.95rem",
    fontWeight: 600,
    margin: 0,
  },
  headerSubtext: {
    color: "#71717a",
    fontSize: "0.75rem",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },

  // Messages Container
  messagesContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },

  // Message Bubble
  messageBubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    wordBreak: "break-word" as const,
  },
  userMessage: {
    alignSelf: "flex-end" as const,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
  },
  assistantMessage: {
    alignSelf: "flex-start" as const,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#e4e4e7",
    borderBottomLeftRadius: "4px",
  },

  // Message Header (icon + label)
  messageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
    fontSize: "0.7rem",
    color: "#71717a",
  },

  // Input Area
  inputArea: {
    padding: "16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(10, 10, 15, 0.5)",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#fafafa",
    fontSize: "0.875rem",
    resize: "none" as const,
    fontFamily: "inherit",
    minHeight: "44px",
    maxHeight: "120px",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  textInputFocus: {
    borderColor: "#10b981",
  },
  sendButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  // Welcome Message
  welcomeContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "32px",
    textAlign: "center" as const,
  },
  welcomeIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  welcomeTitle: {
    color: "#fafafa",
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: "0 0 8px 0",
  },
  welcomeText: {
    color: "#71717a",
    fontSize: "0.85rem",
    margin: 0,
    lineHeight: 1.6,
  },
  suggestionsContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginTop: "20px",
    justifyContent: "center",
  },
  suggestionButton: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "8px 14px",
    color: "#a1a1aa",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Loading indicator
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    alignSelf: "flex-start" as const,
    maxWidth: "85%",
  },
  loadingText: {
    color: "#71717a",
    fontSize: "0.85rem",
  },

  // Scrollbar styling (webkit)
  scrollbarStyle: `
    .ai-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    .ai-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .ai-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    .ai-chat-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SUGGESTED QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const SUGGESTED_QUESTIONS = [
  "Wie sind die Einnahmen diesen Monat?",
  "Zeige die Top 5 Ausgabenkategorien",
  "Was ist der aktuelle Kontostand?",
  "Gibt es offene Rechnungen?",
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Inject scrollbar styles
  useEffect(() => {
    const styleId = "ai-chat-widget-styles";
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.textContent = styles.scrollbarStyle;
      document.head.appendChild(styleTag);
    }
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send to API
      const response = await sendChatMessage(text, history);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        style={{
          ...styles.floatingButton,
          ...(isButtonHovered ? styles.floatingButtonHover : {}),
          ...(isOpen ? { transform: "scale(0)", opacity: 0 } : {}),
        }}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        aria-label="KI-Assistent öffnen"
      >
        <MessageCircle size={24} color="white" />
      </button>

      {/* Chat Panel */}
      <div
        style={{
          ...styles.chatPanel,
          ...(isOpen ? styles.chatPanelVisible : styles.chatPanelHidden),
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.headerIcon}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h3 style={styles.headerText}>Buchhaltungs-Assistent</h3>
              <p style={styles.headerSubtext}>KI-gestützte Analyse & Hilfe</p>
            </div>
          </div>
          <button
            style={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Chat schließen"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#fafafa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div
          className="ai-chat-messages"
          style={styles.messagesContainer}
        >
          {messages.length === 0 ? (
            // Welcome State
            <div style={styles.welcomeContainer}>
              <div style={styles.welcomeIcon}>
                <Bot size={32} color="white" />
              </div>
              <h4 style={styles.welcomeTitle}>Hallo! Ich bin Ihr Buchhaltungs-Assistent</h4>
              <p style={styles.welcomeText}>
                Ich kann Ihnen bei Fragen zu Finanzen, Ausgaben, Berichten und mehr helfen.
                Stellen Sie mir eine Frage oder wählen Sie einen Vorschlag unten.
              </p>
              <div style={styles.suggestionsContainer}>
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    style={styles.suggestionButton}
                    onClick={() => handleSuggestionClick(question)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                      e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                      e.currentTarget.style.color = "#10b981";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.color = "#a1a1aa";
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageBubble,
                    ...(message.role === "user" ? styles.userMessage : styles.assistantMessage),
                  }}
                >
                  {message.role === "assistant" && (
                    <div style={styles.messageHeader}>
                      <Bot size={12} />
                      <span>Assistent</span>
                    </div>
                  )}
                  {message.role === "user" && (
                    <div style={{ ...styles.messageHeader, justifyContent: "flex-end" }}>
                      <span>Sie</span>
                      <User size={12} />
                    </div>
                  )}
                  <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div style={styles.loadingContainer}>
                  <Loader2 size={16} color="#10b981" style={{ animation: "spin 1s linear infinite" }} />
                  <span style={styles.loadingText}>Denke nach...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <div style={styles.inputContainer}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Stellen Sie eine Frage..."
              rows={1}
              style={{
                ...styles.textInput,
                ...(isInputFocused ? styles.textInputFocus : {}),
              }}
              disabled={isLoading}
            />
            <button
              style={{
                ...styles.sendButton,
                ...(isLoading || !inputValue.trim() ? styles.sendButtonDisabled : {}),
              }}
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Nachricht senden"
              onMouseEnter={(e) => {
                if (!isLoading && inputValue.trim()) {
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isLoading ? (
                <Loader2 size={20} color="white" style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={20} color="white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default AIChatWidget;
