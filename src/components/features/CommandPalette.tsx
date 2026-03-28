import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./command-palette.css";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  recentItems?: Array<{ id: number; title: string; subtitle: string }>;
  onOpenItem?: (id: number) => void;
  onAskAI?: (query: string) => void;
}

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  recentItems = [],
  onOpenItem,
  onAskAI
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: "new", title: "Neuer Lead", subtitle: "PV-Wizard öffnen", icon: "🌟", action: () => window.open("/wizard", "_blank"), keywords: ["neu", "lead", "wizard", "anlage", "erstellen"] },
    { id: "dashboard", title: "Dashboard", subtitle: "Zur Übersicht", icon: "📊", action: () => navigate("/dashboard"), keywords: ["start", "home", "übersicht"] },
    { id: "netzanmeldungen", title: "Netzanmeldungen", subtitle: "Alle Anmeldungen anzeigen", icon: "📋", action: () => navigate("/leads"), keywords: ["liste", "anlagen", "vorgänge"] },
    { id: "emails", title: "E-Mails", subtitle: "E-Mail Center öffnen", icon: "📧", action: () => navigate("/emails"), keywords: ["mail", "kommunikation", "nachrichten"] },
    { id: "dokumente", title: "Dokumente", subtitle: "Dokumentenverwaltung", icon: "📄", action: () => navigate("/dokumente"), keywords: ["docs", "dateien", "uploads"] },
    { id: "rechnungen", title: "Rechnungen", subtitle: "Finanzen verwalten", icon: "💰", action: () => navigate("/rechnungen"), keywords: ["finanzen", "geld", "rechnung"] },
    { id: "netzbetreiber", title: "Netzbetreiber", subtitle: "NB Übersicht", icon: "🏢", action: () => navigate("/netzbetreiber"), keywords: ["nb", "versorger", "stadtwerke"] },
    { id: "analytics", title: "Analytics", subtitle: "Statistiken & Reports", icon: "📈", action: () => navigate("/analytics"), keywords: ["statistik", "report", "auswertung"] },
    { id: "settings", title: "Einstellungen", subtitle: "Konfiguration", icon: "⚙️", action: () => navigate("/settings/company"), keywords: ["config", "setup"] },
  ];

  const filteredCommands = query.trim()
    ? commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : commands;

  const filteredRecent = query.trim()
    ? recentItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : recentItems.slice(0, 5);

  const allItems = [
    ...filteredRecent.map(r => ({ ...r, type: "recent" as const })),
    ...filteredCommands.map(c => ({ ...c, type: "command" as const }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) {
        if (item.type === "recent" && onOpenItem) {
          onOpenItem((item as any).id);
        } else if (item.type === "command") {
          (item as CommandItem).action();
        }
        onClose();
      } else if (query.trim() && onAskAI) {
        onAskAI(query);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [allItems, selectedIndex, onClose, onOpenItem, onAskAI, query]);

  if (!isOpen) return null;

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <span className="command-icon">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Suche oder Befehl eingeben..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-esc">ESC</kbd>
        </div>

        <div className="command-results">
          {filteredRecent.length > 0 && (
            <div className="command-section">
              <div className="command-section-title">Zuletzt</div>
              {filteredRecent.map((item, idx) => (
                <div
                  key={`recent-${item.id}`}
                  className={`command-item ${selectedIndex === idx ? "command-item--selected" : ""}`}
                  onClick={() => { onOpenItem?.(item.id); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="command-item-icon">📋</span>
                  <div className="command-item-content">
                    <span className="command-item-title">{item.title}</span>
                    <span className="command-item-subtitle">{item.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredCommands.length > 0 && (
            <div className="command-section">
              <div className="command-section-title">Aktionen</div>
              {filteredCommands.map((cmd, idx) => {
                const actualIndex = filteredRecent.length + idx;
                return (
                  <div
                    key={cmd.id}
                    className={`command-item ${selectedIndex === actualIndex ? "command-item--selected" : ""}`}
                    onClick={() => { cmd.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                  >
                    <span className="command-item-icon">{cmd.icon}</span>
                    <div className="command-item-content">
                      <span className="command-item-title">{cmd.title}</span>
                      <span className="command-item-subtitle">{cmd.subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && query.trim() && (
            <div className="command-empty">
              <p>Keine Ergebnisse für "{query}"</p>
              {onAskAI && (
                <button className="command-ask-ai" onClick={() => { onAskAI(query); onClose(); }}>
                  🤖 AI fragen: "{query}"
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
