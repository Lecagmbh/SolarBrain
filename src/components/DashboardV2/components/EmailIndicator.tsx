import React, { useState } from "react";
import { C, FONT } from "../constants";
import type { DashboardEmail } from "../constants";

interface EmailIndicatorProps {
  emails: DashboardEmail[];
  onOpenKommunikation: () => void;
}

export function EmailIndicator({ emails, onOpenKommunikation }: EmailIndicatorProps) {
  const [hovered, setHovered] = useState(false);
  const unreadCount = emails.filter((e) => !e.isRead).length;
  const lastEmail = emails[0];

  if (emails.length === 0) {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${C.bd}`,
          background: C.s2,
          color: C.t3,
          fontSize: 12,
          fontFamily: FONT,
          textAlign: "center",
        }}
      >
        Keine E-Mails vorhanden
      </div>
    );
  }

  return (
    <div
      onClick={onOpenKommunikation}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid ${unreadCount > 0 ? C.bl + "30" : C.bd}`,
        background: hovered ? C.s3 : unreadCount > 0 ? C.blB : C.s2,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT,
        transition: "all 0.15s",
      }}
    >
      {/* Mail icon */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>{"✉"}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: unreadCount > 0 ? C.bl : C.t }}>
          {unreadCount > 0 ? `${unreadCount} neue E-Mail${unreadCount > 1 ? "s" : ""}` : `${emails.length} E-Mail${emails.length > 1 ? "s" : ""}`}
        </div>
        {lastEmail && (
          <div
            style={{
              fontSize: 11,
              color: C.t3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Letzte: {lastEmail.fromName || lastEmail.fromAddress} {"—"} {lastEmail.subject}
          </div>
        )}
      </div>

      {/* Arrow */}
      <span style={{ color: C.t3, fontSize: 12 }}>{"Öffnen →"}</span>
    </div>
  );
}
