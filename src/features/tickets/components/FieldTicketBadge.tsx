import { useState, useEffect, useRef } from "react";
import type { FieldTicket } from "../constants";
import { getStatusMeta, getPriorityMeta } from "../constants";
import { fetchInstallationTickets, addReply, updateTicket } from "../services/ticketApi";

const C = {
  bgCard: "rgba(12,12,20,0.95)", border: "rgba(212,168,67,0.12)",
  text: "#e2e8f0", textMuted: "#64748b", textBright: "#f1f5f9",
  primary: "#D4A843", red: "#f87171", redBg: "rgba(248,113,113,0.12)",
  orange: "#fb923c", orangeBg: "rgba(251,146,60,0.12)",
  green: "#34d399",
};

interface FieldTicketBadgeProps {
  installationId: number;
  fieldId: string;
  context?: string;
}

export function FieldTicketBadge({ installationId, fieldId, context }: FieldTicketBadgeProps) {
  const [tickets, setTickets] = useState<FieldTicket[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchInstallationTickets(installationId).then(all => {
      if (!active) return;
      const relevant = all.filter(t =>
        t.fieldId === fieldId &&
        (!context || t.context === context) &&
        ["open", "in_progress", "waiting"].includes(t.status)
      );
      setTickets(relevant);
    }).catch(() => {});
    return () => { active = false; };
  }, [installationId, fieldId, context]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPopover(false);
    };
    if (showPopover) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopover]);

  if (tickets.length === 0) return null;

  const hasCritical = tickets.some(t => t.priority === "critical" || t.priority === "high");
  const badgeColor = hasCritical ? C.red : C.orange;
  const badgeBg = hasCritical ? C.redBg : C.orangeBg;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={e => { e.stopPropagation(); setShowPopover(!showPopover); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "1px 6px", borderRadius: 4,
          background: badgeBg, border: `1px solid ${badgeColor}30`,
          color: badgeColor, fontSize: 10, fontWeight: 700, cursor: "pointer",
        }}
        title={`${tickets.length} offene(s) Ticket(s)`}
      >
        {tickets.length}
      </button>

      {showPopover && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 1000,
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: 10, minWidth: 240, maxWidth: 320, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textBright, marginBottom: 8 }}>
            {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""} an diesem Feld
          </div>
          {tickets.map(t => {
            const status = getStatusMeta(t.status);
            const prio = getPriorityMeta(t.priority);
            return (
              <div key={t.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: prio.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{t.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: status.bg, color: status.color }}>{status.label}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{t.authorName}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
