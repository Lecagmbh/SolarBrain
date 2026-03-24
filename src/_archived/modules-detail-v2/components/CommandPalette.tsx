// ============================================================================
// Baunity Installation Detail V2 - Command Palette
// ============================================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { useDetail } from "../context/DetailContext";
import { TABS, STATUS_CONFIG, STATUS_ORDER } from "../types";

interface CommandPaletteProps {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    detail,
    setActiveTab,
    updateStatus,
    reload,
  } = useDetail();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // BUILD COMMAND LIST
  // ---------------------------------------------------------------------------

  const commands = useMemo(() => {
    const cmds: Array<{
      id: string;
      label: string;
      description?: string;
      icon: string;
      shortcut?: string;
      category: string;
      handler: () => void;
    }> = [];

    // Navigation
    TABS.forEach((tab, idx) => {
      if (!tab.adminOnly) {
        cmds.push({
          id: `nav-${tab.key}`,
          label: `Zu ${tab.label}`,
          description: `${tab.label}-Tab öffnen`,
          icon: tab.icon ?? "⬤",
          shortcut: String(idx + 1),
          category: "Navigation",
          handler: () => {
            setActiveTab(tab.key);
            setCommandPaletteOpen(false);
          },
        });
      }
    });

    // Actions
    cmds.push({
      id: "reload",
      label: "Neu laden",
      description: "Alle Daten aktualisieren",
      icon: "↻",
      shortcut: "R",
      category: "Aktionen",
      handler: () => {
        reload();
        setCommandPaletteOpen(false);
      },
    });

    cmds.push({
      id: "close",
      label: "Schließen",
      description: "Panel schließen",
      icon: "✕",
      shortcut: "Esc",
      category: "Aktionen",
      handler: () => {
        setCommandPaletteOpen(false);
        onClose();
      },
    });

    // Status changes
    if (detail) {
      STATUS_ORDER.forEach((status) => {
        if (status !== detail.status) {
          const config = STATUS_CONFIG[status];
          cmds.push({
            id: `status-${status}`,
            label: `Status: ${config.label}`,
            description: config.description,
            icon: config.icon ?? "⬤",
            category: "Status ändern",
            handler: () => {
              updateStatus(status);
              setCommandPaletteOpen(false);
            },
          });
        }
      });
    }

    return cmds;
  }, [detail, setActiveTab, setCommandPaletteOpen, updateStatus, reload, onClose]);

  // ---------------------------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------------------------

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // ---------------------------------------------------------------------------
  // GROUPING
  // ---------------------------------------------------------------------------

  const groupedCommands = useMemo(() => {
    const groups: Record<string, typeof filteredCommands> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[activeIndex];
        if (cmd) cmd.handler();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, activeIndex, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  let itemIndex = 0;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`ld-cmd-backdrop ${
        commandPaletteOpen ? "ld-cmd-backdrop--visible" : ""
      }`}
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="ld-cmd-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="ld-cmd-input-wrap">
          <span className="ld-cmd-input-icon">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="ld-cmd-input"
            placeholder="Suche nach Aktionen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="ld-cmd-results">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="ld-cmd-group">
              <div className="ld-cmd-group__label">{category}</div>

              {cmds.map((cmd) => {
                const currentIndex = itemIndex++;
                const isActive = currentIndex === activeIndex;

                return (
                  <div
                    key={cmd.id}
                    className={`ld-cmd-item ${
                      isActive ? "ld-cmd-item--active" : ""
                    }`}
                    onClick={cmd.handler}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                  >
                    <span className="ld-cmd-item__icon">{cmd.icon}</span>

                    <div className="ld-cmd-item__content">
                      <div className="ld-cmd-item__label">{cmd.label}</div>
                      {cmd.description && (
                        <div className="ld-cmd-item__desc">
                          {cmd.description}
                        </div>
                      )}
                    </div>

                    {cmd.shortcut && (
                      <span className="ld-cmd-item__shortcut">
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                color: "var(--ld-text-muted)",
              }}
            >
              Keine Ergebnisse für "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ld-cmd-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigieren
          </span>
          <span>
            <kbd>↵</kbd> ausführen
          </span>
          <span>
            <kbd>Esc</kbd> schließen
          </span>
        </div>
      </div>
    </div>
  );
}
