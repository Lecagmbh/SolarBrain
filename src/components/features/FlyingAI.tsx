/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Baunity AI ASSISTANT - ULTIMATE EDITION
 * High-End Flying AI Widget mit vollem Feature-Set
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useAuth } from "../../modules/auth/AuthContext";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  X, Send, Sparkles, Loader2, Minimize2, Maximize2, 
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, Zap,
  AlertTriangle, Clock, FileText, TrendingUp, Search,
  ChevronDown, Bot, User, Trash2
} from "lucide-react";
import "./flying-ai.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  functionCalls?: number;
  liked?: boolean | null;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Markdown-ähnliches Rendering
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const processLine = (line: string, key: number) => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Code inline
    line = line.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links (basic)
    line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    return <span key={key} dangerouslySetInnerHTML={{ __html: line }} />;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    
    // Liste
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmed.replace(/^[-•]\s|^\d+\.\s/, ""));
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="flying-ai-list">
            {listItems.map((item, j) => (
              <li key={j}>{processLine(item, j)}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      
      if (trimmed === "") {
        elements.push(<br key={i} />);
      } else if (trimmed.startsWith("###")) {
        elements.push(<h4 key={i} className="flying-ai-h4">{trimmed.replace(/^###\s*/, "")}</h4>);
      } else if (trimmed.startsWith("##")) {
        elements.push(<h3 key={i} className="flying-ai-h3">{trimmed.replace(/^##\s*/, "")}</h3>);
      } else if (trimmed.startsWith("#")) {
        elements.push(<h2 key={i} className="flying-ai-h2">{trimmed.replace(/^#\s*/, "")}</h2>);
      } else if (trimmed.startsWith("⚠️") || trimmed.startsWith("🚨")) {
        elements.push(<div key={i} className="flying-ai-alert flying-ai-alert--warning">{processLine(trimmed, i)}</div>);
      } else if (trimmed.startsWith("✅") || trimmed.startsWith("🎉")) {
        elements.push(<div key={i} className="flying-ai-alert flying-ai-alert--success">{processLine(trimmed, i)}</div>);
      } else if (trimmed.startsWith("📊") || trimmed.startsWith("📈")) {
        elements.push(<div key={i} className="flying-ai-alert flying-ai-alert--info">{processLine(trimmed, i)}</div>);
      } else {
        elements.push(<p key={i}>{processLine(trimmed, i)}</p>);
      }
    }
  });

  // Restliche Liste
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="list-end" className="flying-ai-list">
        {listItems.map((item, j) => (
          <li key={j}>{processLine(item, j)}</li>
        ))}
      </ul>
    );
  }

  return elements;
}

export default function FlyingAI() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Nur für Admins sichtbar
  if (!isAdmin) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus & Auto-resize
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Load quick stats
  useEffect(() => {
    if (isOpen && quickStats.length === 0) {
      loadQuickStats();
    }
  }, [isOpen]);

  const loadQuickStats = async () => {
    try {
      const token = localStorage.getItem("baunity_token");
      const [statsRes, overdueRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/ai/quick/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/ai/quick/overdue`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/ai/quick/pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const stats = await statsRes.json();
      const overdue = await overdueRes.json();
      const pending = await pendingRes.json();

      setQuickStats([
        { label: "Gesamt", value: stats.gesamt || 0, icon: <FileText size={14} />, color: "#EAD068" },
        { label: "Überfällig", value: overdue.length || 0, icon: <AlertTriangle size={14} />, color: overdue.length > 0 ? "#ef4444" : "#22c55e" },
        { label: "Nachbesserung", value: pending.nachbesserungErforderlich?.length || 0, icon: <Clock size={14} />, color: "#f59e0b" },
        { label: "Diese Woche", value: `+${stats.dieseWocheNeu || 0}`, icon: <TrendingUp size={14} />, color: "#3b82f6" },
      ]);
    } catch (e) {
      console.error("Quick stats error:", e);
    }
  };

  // Send message
  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowQuickActions(false);

    try {
      const token = localStorage.getItem("baunity_token");
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "API Fehler");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        functionCalls: data.functionCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Refresh stats after AI response
      loadQuickStats();
      
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Fehler:** ${error.message || "Verbindungsproblem"}.\n\nBitte versuche es erneut oder prüfe deine Internetverbindung.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // Copy message
  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Rate message
  const rateMessage = (id: string, liked: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked } : m))
    );
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // Key handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick prompts
  const quickPrompts = useMemo(() => [
    { icon: <Zap size={14} />, text: "Was muss ich heute erledigen?", color: "#f59e0b" },
    { icon: <AlertTriangle size={14} />, text: "Zeige überfällige Installationen", color: "#ef4444" },
    { icon: <TrendingUp size={14} />, text: "Wie ist der aktuelle Status?", color: "#3b82f6" },
    { icon: <Search size={14} />, text: "Suche nach Müller", color: "#EAD068" },
  ], []);

  // Context suggestions based on stats
  const contextSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    const overdue = quickStats.find(s => s.label === "Überfällig");
    const pending = quickStats.find(s => s.label === "Nachbesserung");
    
    if (overdue && Number(overdue.value) > 0) {
      suggestions.push(`${overdue.value} überfällige Anlagen prüfen`);
    }
    if (pending && Number(pending.value) > 0) {
      suggestions.push(`${pending.value} Nachbesserungen bearbeiten`);
    }
    return suggestions;
  }, [quickStats]);

  // Toggle
  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={`flying-ai-button ${isOpen ? "flying-ai-button--open" : ""}`}
        onClick={handleToggle}
        title="Baunity AI Assistent"
      >
        <div className="flying-ai-button-inner">
          {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        </div>
        <div className="flying-ai-button-ring" />
        <div className="flying-ai-button-ring flying-ai-button-ring--2" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`flying-ai-window ${isMinimized ? "flying-ai-window--minimized" : ""} ${isExpanded ? "flying-ai-window--expanded" : ""}`}>
          {/* Animated Background */}
          <div className="flying-ai-bg">
            <div className="flying-ai-bg-orb flying-ai-bg-orb--1" />
            <div className="flying-ai-bg-orb flying-ai-bg-orb--2" />
            <div className="flying-ai-bg-orb flying-ai-bg-orb--3" />
          </div>

          {/* Header */}
          <div className="flying-ai-header">
            <div className="flying-ai-header-left">
              <div className="flying-ai-header-icon">
                <Bot size={20} />
              </div>
              <div className="flying-ai-header-info">
                <span className="flying-ai-header-title">Baunity AI</span>
                <span className="flying-ai-header-status">
                  {loading ? (
                    <><span className="flying-ai-status-dot flying-ai-status-dot--active" /> Denkt nach...</>
                  ) : (
                    <><span className="flying-ai-status-dot" /> Online</>
                  )}
                </span>
              </div>
            </div>
            <div className="flying-ai-header-actions">
              {messages.length > 0 && (
                <button onClick={clearChat} title="Chat leeren" className="flying-ai-header-btn">
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Verkleinern" : "Vergrößern"} className="flying-ai-header-btn">
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} title="Minimieren" className="flying-ai-header-btn">
                <ChevronDown size={14} className={isMinimized ? "rotate-180" : ""} />
              </button>
              <button onClick={() => setIsOpen(false)} title="Schließen" className="flying-ai-header-btn flying-ai-header-btn--close">
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Stats Bar */}
              {quickStats.length > 0 && (
                <div className="flying-ai-stats">
                  {quickStats.map((stat, i) => (
                    <div key={i} className="flying-ai-stat" style={{ "--stat-color": stat.color } as React.CSSProperties}>
                      {stat.icon}
                      <span className="flying-ai-stat-value">{stat.value}</span>
                      <span className="flying-ai-stat-label">{stat.label}</span>
                    </div>
                  ))}
                  <button onClick={loadQuickStats} className="flying-ai-stat-refresh" title="Aktualisieren">
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flying-ai-messages">
                {messages.length === 0 && showQuickActions ? (
                  <div className="flying-ai-welcome">
                    <div className="flying-ai-welcome-avatar">
                      <Bot size={32} />
                      <div className="flying-ai-welcome-pulse" />
                    </div>
                    <h3>Hallo! Ich bin Baunity AI</h3>
                    <p>Dein intelligenter Assistent mit Zugriff auf alle Netzanmeldungen, Statistiken und Analysen.</p>
                    
                    {/* Context Suggestions */}
                    {contextSuggestions.length > 0 && (
                      <div className="flying-ai-context">
                        <span className="flying-ai-context-label">
                          <AlertTriangle size={12} /> Aktuelle Hinweise:
                        </span>
                        {contextSuggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSend(s)} className="flying-ai-context-btn">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Prompts */}
                    <div className="flying-ai-quick-prompts">
                      {quickPrompts.map((prompt, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleSend(prompt.text)}
                          className="flying-ai-quick-prompt"
                          style={{ "--prompt-color": prompt.color } as React.CSSProperties}
                        >
                          {prompt.icon}
                          <span>{prompt.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flying-ai-message flying-ai-message--${msg.role}`}>
                        <div className="flying-ai-message-avatar">
                          {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className="flying-ai-message-bubble">
                          <div className="flying-ai-message-content">
                            {renderContent(msg.content)}
                          </div>
                          <div className="flying-ai-message-meta">
                            <span className="flying-ai-message-time">
                              {msg.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                              {msg.functionCalls ? ` • ${msg.functionCalls} Abfragen` : ""}
                            </span>
                            {msg.role === "assistant" && (
                              <div className="flying-ai-message-actions">
                                <button 
                                  onClick={() => copyMessage(msg.id, msg.content)} 
                                  title="Kopieren"
                                  className={copiedId === msg.id ? "copied" : ""}
                                >
                                  {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                                <button 
                                  onClick={() => rateMessage(msg.id, true)} 
                                  title="Hilfreich"
                                  className={msg.liked === true ? "active" : ""}
                                >
                                  <ThumbsUp size={12} />
                                </button>
                                <button 
                                  onClick={() => rateMessage(msg.id, false)} 
                                  title="Nicht hilfreich"
                                  className={msg.liked === false ? "active" : ""}
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                      <div className="flying-ai-message flying-ai-message--assistant flying-ai-message--loading">
                        <div className="flying-ai-message-avatar">
                          <Bot size={16} />
                        </div>
                        <div className="flying-ai-message-bubble">
                          <div className="flying-ai-typing">
                            <span /><span /><span />
                          </div>
                          <span className="flying-ai-typing-text">Analysiere Daten...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="flying-ai-input-container">
                <div className="flying-ai-input-wrapper">
                  <textarea
                    ref={inputRef}
                    className="flying-ai-input"
                    placeholder="Frag mich etwas... (Enter zum Senden)"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows={1}
                  />
                  <button
                    className="flying-ai-send"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <div className="flying-ai-input-hint">
                  <span>Shift+Enter für neue Zeile</span>
                  <span>GPT-4o-mini</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
