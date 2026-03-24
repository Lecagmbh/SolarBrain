import React from "react";
import { C, FONT } from "../constants";

interface AlertBarProps {
  title: string;
  message: string;
  onUpload?: () => void;
  onShowEmail?: () => void;
}

export function AlertBar({ title, message, onUpload, onShowEmail }: AlertBarProps) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.erB}, ${C.wrB})`,
        border: `1px solid ${C.er}30`,
        borderRadius: 8,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "8px 16px 0",
        fontFamily: FONT,
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, flexShrink: 0 }}>{"⚠"}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.wr }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.t2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </div>
      </div>

      {/* Actions */}
      {onUpload && (
        <button
          onClick={onUpload}
          style={{
            padding: "4px 10px",
            borderRadius: 5,
            border: "none",
            background: C.wr,
            color: C.bg,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT,
            whiteSpace: "nowrap",
          }}
        >
          Hochladen
        </button>
      )}
      {onShowEmail && (
        <button
          onClick={onShowEmail}
          style={{
            padding: "4px 10px",
            borderRadius: 5,
            border: `1px solid ${C.bd}`,
            background: "transparent",
            color: C.t2,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT,
            whiteSpace: "nowrap",
          }}
        >
          E-Mail anzeigen
        </button>
      )}
    </div>
  );
}
