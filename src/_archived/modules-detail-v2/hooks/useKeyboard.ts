// ============================================================================
// Baunity Installation Detail V2 - Keyboard Hooks
// ============================================================================

import { useEffect, useCallback } from "react";
import { useDetail } from "../context/DetailContext";
import { TABS } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// useKeyboardNavigation - Global keyboard shortcuts
// ─────────────────────────────────────────────────────────────────────────────

export function useKeyboardNavigation(onClose: () => void) {
  const {
    activeTab,
    setActiveTab,
    commandPaletteOpen,
    setCommandPaletteOpen,
    previewDocument,
    setPreviewDocument,
    previewEmail,
    setPreviewEmail,
  } = useDetail();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ESC - Close modals/previews or panel
      if (e.key === "Escape") {
        e.preventDefault();
        
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        
        if (previewDocument) {
          setPreviewDocument(null);
          return;
        }
        
        if (previewEmail) {
          setPreviewEmail(null);
          return;
        }
        
        onClose();
        return;
      }

      // CMD/CTRL + K - Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Don't handle other shortcuts if in input
      if (isInput) return;

      // Number keys 1-6 for tab switching
      const tabIndex = parseInt(e.key) - 1;
      if (tabIndex >= 0 && tabIndex < TABS.length) {
        const tab = TABS[tabIndex];
        if (tab && !tab.adminOnly) {
          e.preventDefault();
          setActiveTab(tab.key);
          return;
        }
      }

      // Arrow Left/Right for prev/next tab
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIndex = TABS.findIndex((t) => t.key === activeTab);
        let nextIndex =
          e.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;

        // Wrap around
        if (nextIndex < 0) nextIndex = TABS.length - 1;
        if (nextIndex >= TABS.length) nextIndex = 0;

        // Skip admin tab if needed
        const nextTab = TABS[nextIndex];
        if (nextTab && !nextTab.adminOnly) {
          e.preventDefault();
          setActiveTab(nextTab.key);
        }
      }

      // R - Reload
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        // Let the detail context handle reload
      }
    },
    [
      activeTab,
      setActiveTab,
      commandPaletteOpen,
      setCommandPaletteOpen,
      previewDocument,
      setPreviewDocument,
      previewEmail,
      setPreviewEmail,
      onClose,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useCommandPalette - Command palette logic
// ─────────────────────────────────────────────────────────────────────────────

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: "navigation" | "action" | "status" | "document";
  handler: () => void;
  disabled?: boolean;
}

export function useCommandPalette(onClose: () => void) {
  const {
    detail,
    setActiveTab,
    setCommandPaletteOpen,
    updateStatus,
    reload,
  } = useDetail();

  const getCommands = useCallback((): Command[] => {
    const commands: Command[] = [];

    // Navigation commands
    TABS.forEach((tab, index) => {
      if (!tab.adminOnly) {
        commands.push({
          id: `nav-${tab.key}`,
          label: tab.label,
          description: `Zu ${tab.label} wechseln`,
          icon: tab.icon,
          shortcut: String(index + 1),
          category: "navigation",
          handler: () => {
            setActiveTab(tab.key);
            setCommandPaletteOpen(false);
          },
        });
      }
    });

    // Action commands
    commands.push({
      id: "reload",
      label: "Neu laden",
      description: "Daten aktualisieren",
      icon: "↻",
      shortcut: "R",
      category: "action",
      handler: () => {
        reload();
        setCommandPaletteOpen(false);
      },
    });

    commands.push({
      id: "close",
      label: "Schließen",
      description: "Panel schließen",
      icon: "✕",
      shortcut: "Esc",
      category: "action",
      handler: () => {
        setCommandPaletteOpen(false);
        onClose();
      },
    });

    // Status commands
    if (detail) {
      const statusActions = [
        { status: "eingegangen", label: "Als Eingegangen markieren" },
        { status: "in_pruefung", label: "In Prüfung setzen" },
        { status: "beim_netzbetreiber", label: "An Netzbetreiber übergeben" },
        { status: "freigegeben", label: "Als Freigegeben markieren" },
      ];

      statusActions.forEach((action) => {
        if (detail.status !== action.status) {
          commands.push({
            id: `status-${action.status}`,
            label: action.label,
            icon: "◉",
            category: "status",
            handler: () => {
              updateStatus(action.status as any);
              setCommandPaletteOpen(false);
            },
          });
        }
      });
    }

    return commands;
  }, [detail, setActiveTab, setCommandPaletteOpen, updateStatus, reload, onClose]);

  return { getCommands };
}
