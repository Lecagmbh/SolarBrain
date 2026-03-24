import { useState, useRef, useEffect } from "react";
import "./ai-assistant.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action?: () => void;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions?: Suggestion[];
  onSendMessage?: (message: string) => Promise<string>;
  initialQuery?: string;
}

export default function AIAssistant({ 
  isOpen, 
  onClose,
  suggestions = [],
  onSendMessage,
  initialQuery
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialQuery && messages.length === 0) {
        handleSend(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let response: string;
      if (onSendMessage) {
        response = await onSendMessage(messageText);
      } else {
        // Mock response if no handler provided
        await new Promise(r => setTimeout(r, 1000));
        response = getMockResponse(messageText);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getMockResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("rückfrage") || q.includes("offen")) {
      return "Du hast aktuell 3 offene Rückfragen:\n\n1. **Müller GmbH** - Schaltplan unvollständig (5 Tage)\n2. **Schmidt Solar** - Datenblatt fehlt (3 Tage)\n3. **Weber PV** - Lageplan unklar (2 Tage)\n\nSoll ich dir die Details zu einer davon zeigen?";
    }
    if (q.includes("heute") || q.includes("erledigen")) {
      return "Hier sind deine wichtigsten Aufgaben für heute:\n\n1. ⚠️ Rückfrage von Badenova beantworten (Müller GmbH)\n2. 📄 Fehlende Dokumente bei Schmidt Solar anfordern\n3. ✅ Genehmigung für Weber PV verarbeiten\n\nMit welcher Aufgabe soll ich dir helfen?";
    }
    if (q.includes("netzbetreiber") || q.includes("langsam") || q.includes("e-werk")) {
      return "**E-Werk Mittelbaden** hat eine Ø Bearbeitungszeit von 14 Tagen - das ist 75% länger als andere NB.\n\nHäufige Verzögerungen:\n- Interne Weiterleitung\n- Rückfragen zu Datenblättern\n\n💡 **Tipp:** Bei E-Werk das Datenblatt immer direkt vollständig einreichen.";
    }
    return "Ich habe deine Frage verstanden. Um dir besser helfen zu können, verbinde mich mit deinen Daten über die API-Integration.\n\nIn der Zwischenzeit kann ich dir bei allgemeinen Fragen zu Netzanmeldungen, Dokumenten und Abläufen helfen.";
  };

  if (!isOpen) return null;

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={e => e.stopPropagation()}>
        <div className="ai-header">
          <div className="ai-header-left">
            <span className="ai-header-icon">🤖</span>
            <span className="ai-header-title">AI Assistent</span>
            <span className="ai-header-badge">Beta</span>
          </div>
          <button className="ai-close" onClick={onClose}>✕</button>
        </div>

        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🤖</div>
              <h3>Hallo! Wie kann ich dir helfen?</h3>
              <p>Frag mich zu deinen Anlagen, Dokumenten, oder lass mich Aufgaben für dich erledigen.</p>
              
              {suggestions.length > 0 && (
                <div className="ai-suggestions">
                  {suggestions.map(s => (
                    <button 
                      key={s.id} 
                      className="ai-suggestion"
                      onClick={() => s.action ? s.action() : handleSend(s.title)}
                    >
                      <span className="ai-suggestion-title">{s.title}</span>
                      <span className="ai-suggestion-desc">{s.description}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="ai-quick-prompts">
                <button onClick={() => handleSend("Was muss ich heute erledigen?")}>
                  Was muss ich heute erledigen?
                </button>
                <button onClick={() => handleSend("Zeige offene Rückfragen")}>
                  Zeige offene Rückfragen
                </button>
                <button onClick={() => handleSend("Warum dauert E-Werk so lange?")}>
                  Warum dauert E-Werk so lange?
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`ai-message ai-message--${msg.role}`}>
                  {msg.role === "assistant" && <span className="ai-message-avatar">🤖</span>}
                  <div className="ai-message-content">
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-message ai-message--assistant">
                  <span className="ai-message-avatar">🤖</span>
                  <div className="ai-message-content">
                    <div className="ai-typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="ai-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="ai-input"
            placeholder="Frag mich etwas..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button 
            className="ai-send" 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}
