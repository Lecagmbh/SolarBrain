/**
 * AI ASSISTANT LOCAL v2.0
 * Local AI assistant for quick actions
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  X,
  Send,
  Zap,
  FileText,
  Mail,
  Search,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button, Badge } from "../../components/ui/UIComponents";
import "./ai-assistant-local.css";

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useAIAssistantLocal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

interface AIAssistantLocalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; name: string; email: string; role: string };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AIAssistantLocal: React.FC<AIAssistantLocalProps> = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickActions: QuickAction[] = [
    { id: "status", label: "Status-Übersicht", icon: <Zap size={16} />, prompt: "Gib mir eine Übersicht über den aktuellen Status aller Netzanmeldungen." },
    { id: "overdue", label: "Überfällige Anmeldungen", icon: <FileText size={16} />, prompt: "Welche Netzanmeldungen sind überfällig und benötigen Aufmerksamkeit?" },
    { id: "email", label: "E-Mail-Vorschlag", icon: <Mail size={16} />, prompt: "Schreibe eine professionelle E-Mail an den Netzbetreiber bezüglich einer ausstehenden Genehmigung." },
    { id: "help", label: "Hilfe zum System", icon: <Search size={16} />, prompt: "Erkläre mir die wichtigsten Funktionen des Baunity-Systems." },
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle send
  const handleSend = async (content: string = input) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response (in production, this would call an API)
    setTimeout(() => {
      const responses: Record<string, string> = {
        "status": `📊 **Status-Übersicht:**\n\n• **Offen:** 47 Anmeldungen\n• **Beim Netzbetreiber:** 23\n• **Genehmigt:** 12\n• **Diese Woche neu:** 8\n\nEs gibt 3 Anmeldungen mit Handlungsbedarf, die deine Aufmerksamkeit erfordern.`,
        "overdue": `⚠️ **Überfällige Anmeldungen:**\n\n1. **NA25-ABC123** - Müller Solar GmbH\n   • 18 Tage beim NB, keine Rückmeldung\n\n2. **NA25-DEF456** - Schmidt Elektro\n   • 14 Tage, Nachbesserung ausstehend\n\nEmpfehlung: Bei beiden Fällen sollte der Netzbetreiber kontaktiert werden.`,
        "email": `📧 **E-Mail-Vorlage:**\n\n---\n\nSehr geehrte Damen und Herren,\n\nbezüglich unserer Netzanmeldung [PUBLICID] vom [DATUM] möchten wir uns nach dem aktuellen Bearbeitungsstand erkundigen.\n\nDie Anlage mit einer Leistung von [KWP] kWp ist installationsbereit und wartet auf Ihre Genehmigung.\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n[NAME]`,
        "help": `🤖 **Baunity-System Übersicht:**\n\n**Hauptfunktionen:**\n• Dashboard - Übersicht über alle KPIs\n• Netzanmeldungen - Verwaltung aller Anträge\n• E-Mails - Automatische Kommunikation\n• Dokumente - Zentrale Ablage\n\n**Tipps:**\n• ⌘K öffnet die Schnellsuche\n• Klicke auf eine Anmeldung für Details\n• Nutze Filter für bessere Übersicht`,
      };

      // Find matching response
      let responseContent = "Ich verstehe deine Anfrage. Wie kann ich dir konkret weiterhelfen?";
      
      for (const [key, response] of Object.entries(responses)) {
        if (content.toLowerCase().includes(key) || 
            (key === "status" && content.toLowerCase().includes("übersicht")) ||
            (key === "overdue" && content.toLowerCase().includes("überfällig")) ||
            (key === "email" && content.toLowerCase().includes("mail")) ||
            (key === "help" && (content.toLowerCase().includes("hilfe") || content.toLowerCase().includes("funktionen")))) {
          responseContent = response;
          break;
        }
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  // Copy to clipboard
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ai-backdrop" onClick={onClose} />
      <div className="ai-panel">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header__left">
            <div className="ai-header__icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="ai-title">Baunity Assistant</h2>
              <span className="ai-subtitle">KI-Unterstützung</span>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome__icon">
                <Bot size={48} />
              </div>
              <h3>Hallo {user.name.split(" ")[0]}! 👋</h3>
              <p>Wie kann ich dir heute helfen?</p>
              
              {/* Quick Actions */}
              <div className="ai-quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    className="ai-quick-action"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-message ai-message--${msg.role}`}>
                  <div className="ai-message__avatar">
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="ai-message__content">
                    <div className="ai-message__text">
                      {msg.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line.startsWith('**') ? (
                            <strong>{line.replace(/\*\*/g, '')}</strong>
                          ) : line.startsWith('•') ? (
                            <span className="ai-message__bullet">{line}</span>
                          ) : (
                            line
                          )}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    {msg.role === "assistant" && (
                      <button 
                        className="ai-message__copy"
                        onClick={() => handleCopy(msg.content, msg.id)}
                      >
                        {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-message ai-message--assistant">
                  <div className="ai-message__avatar">
                    <Bot size={16} />
                  </div>
                  <div className="ai-message__content">
                    <div className="ai-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="ai-input-wrap">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Nachricht eingeben..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          />
        </div>

        {/* Disclaimer */}
        <div className="ai-disclaimer">
          KI kann Fehler machen. Bitte überprüfe wichtige Informationen.
        </div>
      </div>
    </>
  );
};

export default AIAssistantLocal;
