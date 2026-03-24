import { useState, useEffect } from "react";
import type { FieldTicket } from "../constants";
import { getContextMeta, getStatusMeta, getPriorityMeta, STATUSES } from "../constants";
import { fetchTicket, updateTicket, addReply } from "../services/ticketApi";

const C = {
  bg: "#0a0a12", bgCard: "rgba(12,12,20,0.85)", bgInput: "rgba(15,15,25,0.9)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
};

interface TicketDetailViewProps {
  ticketId: number;
  onBack: () => void;
}

export function TicketDetailView({ ticketId, onBack }: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<FieldTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTicket(await fetchTicket(ticketId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      setTicket(await updateTicket(ticket.id, { status: newStatus }) as any);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setSending(true);
    try {
      await addReply(ticket.id, replyText.trim());
      setReplyText("");
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return <div style={{ padding: 20, color: C.textMuted, fontSize: 12, textAlign: "center" }}>Laden...</div>;
  }

  const ctx = getContextMeta(ticket.context);
  const status = getStatusMeta(ticket.status);
  const prio = getPriorityMeta(ticket.priority);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16 }}>←</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textBright, flex: 1 }}>Ticket #{ticket.id}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* Title + badges */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textBright, margin: "0 0 10px" }}>{ticket.title}</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={badge(ctx.bg, ctx.color)}>{ctx.label}</span>
          <span style={badge(status.bg, status.color)}>{status.label}</span>
          <span style={badge(prio.bg, prio.color)}>{prio.label}</span>
        </div>

        {/* Meta */}
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12 }}>
          <div>Erstellt von <strong style={{ color: C.text }}>{ticket.authorName}</strong> am {new Date(ticket.createdAt).toLocaleString("de-DE")}</div>
          {ticket.assignedToName && <div style={{ marginTop: 2 }}>Zugewiesen an <strong style={{ color: C.text }}>{ticket.assignedToName}</strong></div>}
          {ticket.installation && <div style={{ marginTop: 2 }}>Installation: <strong style={{ color: C.text }}>{ticket.installation.publicId}</strong> — {ticket.installation.customerName}</div>}
        </div>

        {/* Message */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>
          {ticket.message}
        </div>

        {/* Status buttons */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Status ändern</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STATUSES.map(s => (
              <button key={s.value} onClick={() => handleStatusChange(s.value)} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                border: `1px solid ${ticket.status === s.value ? s.color : C.border}`,
                background: ticket.status === s.value ? s.bg : "transparent",
                color: ticket.status === s.value ? s.color : C.textMuted, cursor: "pointer",
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Replies */}
        {ticket.replies && ticket.replies.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Antworten ({ticket.replies.length})</div>
            {ticket.replies.map(r => (
              <div key={r.id} style={{
                background: r.authorType === "staff" ? C.primaryGlow : C.bgCard,
                border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{r.authorName}</span>
                  <span style={{ fontSize: 10, color: C.textMuted }}>{new Date(r.createdAt).toLocaleString("de-DE")}</span>
                </div>
                <div style={{ fontSize: 12, color: C.text, whiteSpace: "pre-wrap" }}>{r.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Antwort schreiben..."
          style={{ width: "100%", height: 60, padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgInput, color: C.text, fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply(); }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <button onClick={handleReply} disabled={sending || !replyText.trim()} style={{
            padding: "6px 14px", borderRadius: 6, border: "none",
            background: C.primary, color: "#fff", fontSize: 11, fontWeight: 600,
            cursor: sending ? "wait" : "pointer", opacity: (sending || !replyText.trim()) ? 0.5 : 1,
          }}>
            {sending ? "Sende..." : "Antworten"}
          </button>
        </div>
      </div>
    </div>
  );
}

function badge(bg: string, color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: bg, color, letterSpacing: 0.3 };
}
