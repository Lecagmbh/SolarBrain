/**
 * EditableField — Inline-Edit für Kernfelder im Detail-Panel
 * Doppelklick → Edit-Modus, Enter/Blur → Speichern, Escape → Abbrechen
 */
import { useState, useRef, useEffect } from "react";

interface Props {
  label: string;
  value?: string | null;
  onSave: (newValue: string) => Promise<void> | void;
  mono?: boolean;
  placeholder?: string;
  editable?: boolean;
}

export default function EditableField({ label, value, onSave, mono, placeholder, editable = true }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!value && !editing) return null;

  const save = async () => {
    if (draft !== (value || "") && draft.trim()) {
      setSaving(true);
      try { await onSave(draft.trim()); } catch { /* ignore */ }
      setSaving(false);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)",
    cursor: editable ? "default" : "pointer",
    minHeight: 28,
  };

  if (editing) {
    return (
      <div style={rowStyle}>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, marginRight: 8 }}>{label}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
            }}
            onBlur={save}
            placeholder={placeholder}
            disabled={saving}
            style={{
              background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 4, padding: "3px 8px", fontSize: 12, color: "#e2e8f0",
              outline: "none", width: "100%", maxWidth: 200, textAlign: "right",
              fontFamily: mono ? "monospace" : "inherit",
            }}
          />
          {saving && <span style={{ fontSize: 10, color: "#D4A843" }}>...</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      style={rowStyle}
      onClick={handleCopy}
      onDoubleClick={(e) => {
        if (!editable) return;
        e.preventDefault();
        setDraft(value || "");
        setEditing(true);
      }}
      title={editable ? "Doppelklick zum Bearbeiten" : undefined}
    >
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
      <span style={{
        fontSize: mono ? 11 : 12, fontWeight: 500, textAlign: "right",
        fontFamily: mono ? "monospace" : "inherit",
        color: mono ? "#a5b4fc" : "#e2e8f0",
      }}>
        {copied ? "✓ Kopiert" : value || "—"}
        {editable && <span style={{ fontSize: 9, color: "#475569", marginLeft: 4, opacity: 0.5 }}>✎</span>}
      </span>
    </div>
  );
}
