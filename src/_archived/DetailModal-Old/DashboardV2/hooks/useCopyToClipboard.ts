import { useState, useCallback, useRef } from 'react';

export function useCopyToClipboard(resetMs = 1200) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback((text: string, key?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopiedKey(key || text);
      timerRef.current = setTimeout(() => setCopiedKey(null), resetMs);
    });
  }, [resetMs]);

  const isCopied = useCallback((key: string) => copiedKey === key, [copiedKey]);

  return { copy, isCopied, copiedKey };
}
