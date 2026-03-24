import React from "react";
import { STATUS_MAP, FONT } from "../constants";

interface StatusPillProps {
  status: string;
  small?: boolean;
}

export function StatusPill({ status, small }: StatusPillProps) {
  const cfg = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.eingang;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        fontFamily: FONT,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
