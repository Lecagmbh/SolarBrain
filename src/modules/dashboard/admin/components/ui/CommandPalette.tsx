/**
 * COMMAND PALETTE v2.0
 * Quick search and navigation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Home,
  Zap,
  Mail,
  FolderOpen,
  Receipt,
  Building,
  Users,
  Settings,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  Hash,
} from "lucide-react";
import "./command-palette.css";

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle, close]);

  return { isOpen, open, close, toggle };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigation commands
  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", title: "Dashboard", icon: <Home size={18} />, action: () => navigate("/dashboard"), keywords: ["home", "start"], group: "Navigation" },
    { id: "nav-netzanmeldungen", title: "Netzanmeldungen", icon: <Zap size={18} />, action: () => navigate("/netzanmeldungen"), keywords: ["anmeldungen", "liste"], group: "Navigation" },
    { id: "nav-emails", title: "E-Mails", icon: <Mail size={18} />, action: () => navigate("/emails"), keywords: ["mail", "nachrichten"], group: "Navigation" },
    { id: "nav-dokumente", title: "Dokumente", icon: <FolderOpen size={18} />, action: () => navigate("/dokumente"), keywords: ["files", "dateien"], group: "Navigation" },
    { id: "nav-rechnungen", title: "Rechnungen", icon: <Receipt size={18} />, action: () => navigate("/rechnungen"), keywords: ["invoices", "billing"], group: "Navigation" },
    { id: "nav-netzbetreiber", title: "Netzbetreiber", icon: <Building size={18} />, action: () => navigate("/netzbetreiber"), keywords: ["nb", "grid"], group: "Navigation" },
    { id: "nav-benutzer", title: "Benutzer", icon: <Users size={18} />, action: () => navigate("/benutzer"), keywords: ["users", "mitarbeiter"], group: "Navigation" },
    { id: "nav-settings", title: "Einstellungen", icon: <Settings size={18} />, action: () => navigate("/settings/company"), keywords: ["settings", "config"], group: "Navigation" },
    
    // Actions
    { id: "action-new", title: "Neue Anmeldung erstellen", icon: <Plus size={18} />, action: () => navigate("/anlagen-wizard"), keywords: ["create", "neu", "wizard"], group: "Aktionen" },
    { id: "action-search-id", title: "Nach ID suchen", subtitle: "z.B. NA25-ABC123", icon: <Hash size={18} />, action: () => {}, keywords: ["id", "publicId", "nummer"], group: "Aktionen" },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchStr = `${cmd.title} ${cmd.subtitle || ""} ${cmd.keywords?.join(" ") || ""}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
      })
    : commands;

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle selection
  const handleSelect = (cmd: CommandItem) => {
    // Save to recent
    setRecentSearches((prev) => [cmd.title, ...prev.filter((s) => s !== cmd.title)].slice(0, 5));
    cmd.action();
    onClose();
    setQuery("");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-input-wrap">
          <Search size={20} className="cmd-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Suchen oder Befehl eingeben..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="cmd-results">
          {Object.entries(groupedCommands).map(([group, items]) => (
            <div key={group} className="cmd-group">
              <div className="cmd-group__title">{group}</div>
              {items.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`cmd-item ${globalIndex === selectedIndex ? "cmd-item--selected" : ""}`}
                    onClick={() => handleSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="cmd-item__icon">{cmd.icon}</span>
                    <div className="cmd-item__content">
                      <span className="cmd-item__title">{cmd.title}</span>
                      {cmd.subtitle && <span className="cmd-item__subtitle">{cmd.subtitle}</span>}
                    </div>
                    <ArrowRight size={14} className="cmd-item__arrow" />
                  </div>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="cmd-empty">
              <p>Keine Ergebnisse für "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> Navigation</span>
          <span><kbd>↵</kbd> Auswählen</span>
          <span><kbd>ESC</kbd> Schließen</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
