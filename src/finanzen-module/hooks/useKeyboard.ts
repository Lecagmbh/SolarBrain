// ============================================
// FINANZEN MODULE - useKeyboard Hook
// ============================================

import { useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

// ============================================
// HOOK
// ============================================

export function useKeyboard({ shortcuts, enabled = true }: UseKeyboardOptions): void {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      // Allow Escape to work even in inputs
      if (e.key !== "Escape") return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;
      
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const metaMatch = shortcut.meta ? e.metaKey : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      // For shortcuts requiring ctrl/meta, make sure it's pressed
      if (shortcut.ctrl && !(e.ctrlKey || e.metaKey)) continue;
      if (shortcut.meta && !e.metaKey) continue;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// ============================================
// PRESET SHORTCUTS
// ============================================

export const createShortcuts = {
  commandPalette: (action: () => void): KeyboardShortcut => ({
    key: "k",
    ctrl: true,
    action,
  }),
  
  newItem: (action: () => void): KeyboardShortcut => ({
    key: "n",
    ctrl: true,
    action,
  }),
  
  refresh: (action: () => void): KeyboardShortcut => ({
    key: "r",
    ctrl: true,
    action,
  }),
  
  search: (action: () => void): KeyboardShortcut => ({
    key: "/",
    action,
  }),
  
  escape: (action: () => void): KeyboardShortcut => ({
    key: "Escape",
    action,
  }),
  
  save: (action: () => void): KeyboardShortcut => ({
    key: "s",
    ctrl: true,
    action,
  }),
};
