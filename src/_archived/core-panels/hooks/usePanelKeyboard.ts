/**
 * Keyboard shortcuts for the Unified Panel System
 * ESC = close, 1-9 = tab switch, R = reload
 */

import { useEffect, useCallback } from 'react';

interface UsePanelKeyboardOptions {
  /** Available tab IDs in order */
  tabIds: string[];
  /** Currently active tab */
  activeTab: string;
  /** Set the active tab */
  onTabChange: (tabId: string) => void;
  /** Close the panel */
  onClose: () => void;
  /** Reload panel data */
  onReload?: () => void;
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean;
}

export function usePanelKeyboard({
  tabIds,
  activeTab,
  onTabChange,
  onClose,
  onReload,
  enabled = true,
}: UsePanelKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (e.key === 'Escape') {
          (target as HTMLElement).blur();
          return;
        }
        return;
      }

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Don't process shortcuts with modifier keys (except for Escape above)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Number keys 1-9 for tab switching
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (index < tabIds.length) {
          e.preventDefault();
          onTabChange(tabIds[index]);
        }
        return;
      }

      // R to reload
      if (e.key === 'r' && onReload) {
        e.preventDefault();
        onReload();
      }
    },
    [enabled, tabIds, onTabChange, onClose, onReload]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
