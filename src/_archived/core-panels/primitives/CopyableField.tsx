/**
 * CopyableField – Text field with copy-to-clipboard button and feedback
 */

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableFieldProps {
  value: string;
  /** Monospace font */
  mono?: boolean;
  className?: string;
}

export function CopyableField({ value, mono, className = '' }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <span className={`inline-flex items-center gap-1.5 group ${className}`}>
      <span className={`text-xs text-[var(--text-primary)] truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
      <button
        className={`
          shrink-0 flex items-center justify-center w-5 h-5 rounded
          transition-all duration-150
          ${copied
            ? 'text-green-400'
            : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-secondary)] hover:bg-white/5'
          }
        `}
        onClick={handleCopy}
        title="Kopieren"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </span>
  );
}
