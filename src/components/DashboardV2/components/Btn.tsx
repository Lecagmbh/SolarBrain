import React, { useState } from "react";
import { C, FONT } from "../constants";

interface BtnProps {
  label: string;
  variant?: "primary" | "danger" | "secondary" | "ghost";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: { bg: C.ac, bgH: C.acL, color: "#fff" },
  danger: { bg: C.er, bgH: "#ef4444", color: "#fff" },
  secondary: { bg: C.s3, bgH: C.s4, color: C.t },
  ghost: { bg: "transparent", bgH: C.s3, color: C.t2 },
};

export function Btn({ label, variant = "primary", icon, onClick, disabled, small, fullWidth }: BtnProps) {
  const [hovered, setHovered] = useState(false);
  const v = VARIANTS[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: small ? "4px 10px" : "6px 14px",
        borderRadius: 6,
        border: variant === "ghost" ? `1px solid ${C.bd}` : "none",
        background: disabled ? C.s4 : hovered ? v.bgH : v.bg,
        color: disabled ? C.t3 : v.color,
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        width: fullWidth ? "100%" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
