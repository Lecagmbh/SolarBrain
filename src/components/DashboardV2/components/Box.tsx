import React from "react";
import { C, FONT } from "../constants";

interface BoxProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export function Box({ title, icon, badge, children, noPadding }: BoxProps) {
  return (
    <div
      style={{
        background: C.s2,
        borderRadius: 10,
        border: `1px solid ${C.bd}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: C.s1,
          borderBottom: `1px solid ${C.bd}`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon && (
          <span style={{ color: C.t3, display: "flex", alignItems: "center" }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.t2,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontFamily: FONT,
            flex: 1,
          }}
        >
          {title}
        </span>
        {badge}
      </div>
      {/* Content */}
      <div style={{ padding: noPadding ? 0 : "4px 6px" }}>
        {children}
      </div>
    </div>
  );
}
