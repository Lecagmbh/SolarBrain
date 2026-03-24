/**
 * InlineEdit – Click-to-edit field with save/cancel
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Edit3, Loader2 } from 'lucide-react';

interface InlineEditProps {
  /** Current display value */
  value: string;
  /** Called with new value on save */
  onSave: (value: string) => Promise<void> | void;
  /** Label above the field */
  label?: string;
  /** Placeholder when empty */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  /** Multi-line textarea */
  multiline?: boolean;
  /** Disable editing */
  disabled?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  label,
  placeholder = 'Eingeben...',
  type = 'text',
  multiline = false,
  disabled = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus input on edit
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      // Keep editing on error
    } finally {
      setSaving(false);
    }
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline]
  );

  if (editing) {
    const inputClasses =
      'w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border-active)] rounded-md text-[var(--text-primary)] outline-none';

    return (
      <div className="flex flex-col gap-0.5">
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
            {label}
          </span>
        )}
        <div className="flex items-start gap-1">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${inputClasses} min-h-[60px] resize-y`}
              placeholder={placeholder}
              disabled={saving}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClasses}
              placeholder={placeholder}
              disabled={saving}
            />
          )}
          <button
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded text-green-400 hover:bg-green-500/10 transition-colors"
            onClick={handleSave}
            disabled={saving}
            title="Speichern"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded text-[var(--text-muted)] hover:bg-white/5 transition-colors"
            onClick={handleCancel}
            disabled={saving}
            title="Abbrechen"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
          {label}
        </span>
      )}
      <span
        className={`
          inline-flex items-center gap-1.5 group cursor-pointer
          text-xs text-[var(--text-primary)]
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setEditing(true)}
      >
        <span className="truncate">{value || <span className="text-[var(--text-muted)]">{placeholder}</span>}</span>
        {!disabled && (
          <Edit3
            size={11}
            className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </span>
    </div>
  );
}
