/**
 * KEYBOARD NAVIGATION
 * j/k = nächste/vorherige Email
 * Enter = Email öffnen
 * e = Archivieren
 * Escape = Auswahl aufheben
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { InboxEmail } from "./types";
import type { VirtuosoHandle } from "react-virtuoso";

interface Props {
  flatEmails: InboxEmail[];
  selectedEmail: InboxEmail | null;
  onSelect: (email: InboxEmail) => void;
  onArchive: (id: number) => void;
  onReply: () => void;
  onClearSelection: () => void;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
}

export function useKeyboardNav({
  flatEmails,
  selectedEmail,
  onSelect,
  onArchive,
  onReply,
  onClearSelection,
  virtuosoRef,
}: Props) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);

  // Sync focusedIndex when selectedEmail changes externally
  useEffect(() => {
    if (selectedEmail) {
      const idx = flatEmails.findIndex(e => e.id === selectedEmail.id);
      if (idx >= 0) setFocusedIndex(idx);
    }
  }, [selectedEmail, flatEmails]);

  const navigate = useCallback((direction: 1 | -1) => {
    if (flatEmails.length === 0) return;
    setFocusedIndex(prev => {
      const next = Math.max(0, Math.min(flatEmails.length - 1, prev + direction));
      const email = flatEmails[next];
      if (email) {
        onSelect(email);
        virtuosoRef.current?.scrollToIndex({ index: next, behavior: "smooth", align: "center" });
      }
      return next;
    });
  }, [flatEmails, onSelect, virtuosoRef]);

  // j = nächste, k = vorherige
  useHotkeys("j", () => navigate(1), { preventDefault: true });
  useHotkeys("k", () => navigate(-1), { preventDefault: true });

  // Enter = öffnen (selektieren)
  useHotkeys("enter", () => {
    if (focusedIndex >= 0 && flatEmails[focusedIndex]) {
      onSelect(flatEmails[focusedIndex]);
    }
  }, { preventDefault: true });

  // e = archivieren
  useHotkeys("e", () => {
    if (selectedEmail) onArchive(selectedEmail.id);
  }, { preventDefault: true });

  // r = antworten
  useHotkeys("r", () => {
    if (selectedEmail) onReply();
  }, { preventDefault: true });

  // Escape = Auswahl aufheben
  useHotkeys("escape", () => {
    onClearSelection();
    setShowHelp(false);
  });

  // ? = Hilfe togglen
  useHotkeys("shift+/", () => setShowHelp(prev => !prev), { preventDefault: true });

  return { focusedIndex, showHelp, setShowHelp };
}
