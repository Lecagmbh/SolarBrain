import { useState } from "react";
import type { FieldTicket } from "../constants";
import { getContextMeta, getStatusMeta, getPriorityMeta } from "../constants";

const C = {
  bg: "#06060b", bgCard: "rgba(12,12,20,0.85)", bgCardHover: "rgba(18,18,30,0.95)",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", primaryGlow: "rgba(212,168,67,0.15)",
};

interface TicketCardProps {
  ticket: FieldTicket;
  compact?: boolean;
  onClick?: (ticket: FieldTicket) => void;
}

export function TicketCard({ ticket, compact, onClick }: TicketCardProps) {
  const [hovered, setHovered] = useState(false);
  const ctx = getContextMeta(ticket.context);
  const status = getStatusMeta(ticket.status);
  const prio = getPriorityMeta(ticket.priority);
  const replyCount = ticket._count?.replies || 0;
  const age = formatAge(ticket.createdAt);

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(ticket)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
          background: hovered ? C.bgCardHover : "transparent",
          borderRadius: 6, cursor: "pointer", transition: "background 0.15s",
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: prio.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.title}</span>
        <span style={{ ...badge(ctx.bg, ctx.color), fontSize: 9 }}>{ctx.label}</span>
        <span style={{ ...badge(status.bg, status.color), fontSize: 9 }}>{status.label}</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(ticket)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.bgCardHover : C.bgCard,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: prio.color, flexShrink: 0, marginTop: 5 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textBright, marginBottom: 3 }}>{ticket.title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.message}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={badge(ctx.bg, ctx.color)}>{ctx.label}</span>
        <span style={badge(status.bg, status.color)}>{status.label}</span>
        <span style={badge(prio.bg, prio.color)}>{prio.label}</span>
        {ticket.installation && (
          <span style={{ fontSize: 10, color: C.textMuted }}>{ticket.installation.publicId}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textMuted }}>
          {replyCount > 0 && <span style={{ marginRight: 8 }}>💬 {replyCount}</span>}
          {age}
        </span>
      </div>
      {ticket.assignedToName && (
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>
          → {ticket.assignedToName}
        </div>
      )}
    </div>
  );
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700,
    padding: "2px 8px", borderRadius: 4, background: bg, color, letterSpacing: 0.3,
  };
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
