// ============================================
// FINANZEN MODULE - COMMAND PALETTE
// ============================================

import { useState, useEffect, useRef, useMemo } from "react";
import { Command, Search } from "lucide-react";
import type { CommandPaletteProps, CommandAction } from "../types";

// ============================================
// COMPONENT
// ============================================

export function CommandPalette({ isOpen, onClose, actions }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter actions based on search
  const filteredActions = useMemo(() => {
    if (!search.trim()) return actions;
    
    const query = search.toLowerCase();
    return actions.filter(
      (action) =>
        action.label.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query) ||
        action.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }, [actions, search]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredActions.forEach((action) => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    return groups;
  }, [filteredActions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector("[data-selected='true']");
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fin-cmd-overlay" onClick={onClose}>
      <div className="fin-cmd" onClick={(e) => e.stopPropagation()}>
        {/* Header / Search */}
        <div className="fin-cmd__header">
          <Command size={18} className="fin-cmd__icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Suche nach Aktionen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="fin-cmd__input"
          />
          <kbd className="fin-kbd">ESC</kbd>
        </div>

        {/* Actions List */}
        <div className="fin-cmd__body" ref={listRef}>
          {Object.entries(groupedActions).map(([category, items]) => (
            <div key={category} className="fin-cmd__group">
              <div className="fin-cmd__category">{category}</div>
              {items.map((action) => {
                const currentIndex = flatIndex++;
                const isSelected = currentIndex === selectedIndex;
                const Icon = action.icon;

                return (
                  <button
                    key={action.id}
                    className={`fin-cmd__item ${isSelected ? "fin-cmd__item--selected" : ""}`}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    data-selected={isSelected}
                  >
                    <Icon size={16} className="fin-cmd__item-icon" />
                    <span className="fin-cmd__item-label">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="fin-kbd">{action.shortcut}</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Empty State */}
          {filteredActions.length === 0 && (
            <div className="fin-cmd__empty">
              <Search size={24} />
              <span>Keine Aktionen gefunden</span>
              <span className="fin-cmd__empty-hint">
                Versuche einen anderen Suchbegriff
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fin-cmd__footer">
          <span><kbd className="fin-kbd">↑↓</kbd> Navigieren</span>
          <span><kbd className="fin-kbd">↵</kbd> Ausführen</span>
          <span><kbd className="fin-kbd">ESC</kbd> Schließen</span>
        </div>
      </div>
    </div>
  );
}
