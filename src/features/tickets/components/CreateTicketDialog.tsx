import { useState } from "react";
import { CONTEXTS, PRIORITIES } from "../constants";
import { createTicket } from "../services/ticketApi";

const C = {
  bg: "#060b18", bgCard: "rgba(12,12,20,0.95)", bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.12)", borderHover: "rgba(212,168,67,0.3)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", red: "#f87171",
};

interface CreateTicketDialogProps {
  installationId?: number;
  context?: string;
  contextRef?: string;
  fieldId?: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTicketDialog({ installationId, context: initContext, contextRef, fieldId, onClose, onCreated }: CreateTicketDialogProps) {
  const [instId, setInstId] = useState(installationId?.toString() || "");
  const [context, setContext] = useState(initContext || "allgemein");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!instId || !title || !message) {
      setError("Installation-ID, Titel und Nachricht sind Pflichtfelder");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createTicket({
        installationId: Number(instId),
        context,
        contextRef: contextRef || undefined,
        fieldId: fieldId || undefined,
        title,
        message,
        priority,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Fehler beim Erstellen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textBright, margin: 0 }}>Neues Ticket</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {!installationId && (
          <Field label="Installation ID *">
            <input type="number" value={instId} onChange={e => setInstId(e.target.value)} placeholder="z.B. 511" style={inputStyle} />
          </Field>
        )}

        <Field label="Kontext">
          <select value={context} onChange={e => setContext(e.target.value)} style={inputStyle}>
            {CONTEXTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>

        <Field label="Priorität">
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITIES.map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)} style={{
                flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${priority === p.value ? p.color : C.border}`,
                background: priority === p.value ? p.bg : "transparent",
                color: priority === p.value ? p.color : C.textMuted, cursor: "pointer",
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Titel *">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Kurze Beschreibung..." style={inputStyle} maxLength={200} />
        </Field>

        <Field label="Nachricht *">
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Details zum Problem..." style={{ ...inputStyle, height: 100, resize: "vertical" }} />
        </Field>

        {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
            Abbrechen
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: "8px 20px", borderRadius: 6, border: "none",
            background: C.primary, color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Erstelle..." : "Ticket erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 6,
  border: `1px solid rgba(212,168,67,0.12)`, background: "rgba(15,15,25,0.9)",
  color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box",
};
