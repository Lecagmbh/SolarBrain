import React, { useState, useCallback } from "react";
import { C, FONT, MONO } from "../constants";

interface CopyFieldProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  id?: string;
}

export function CopyField({ label, value, mono }: CopyFieldProps) {
  const [justCopied, setJustCopied] = useState(false);

  const displayValue = value != null && value !== "" ? String(value) : "—";
  const hasValue = value != null && value !== "" && String(value) !== "—";

  const handleCopy = useCallback(() => {
    if (!hasValue) return;
    navigator.clipboard.writeText(String(value));
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }, [value, hasValue]);

  return (
    <div
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "3px 6px",
        borderRadius: 4,
        cursor: hasValue ? "pointer" : "default",
        transition: "background 0.15s",
        minHeight: 22,
        fontFamily: FONT,
      }}
      onMouseEnter={(e) => {
        if (hasValue) (e.currentTarget as HTMLDivElement).style.background = C.acG;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
      title={hasValue ? `Klick zum Kopieren: ${displayValue}` : undefined}
    >
      <span
        style={{
          fontSize: 11,
          color: C.t3,
          minWidth: 75,
          flexShrink: 0,
          fontFamily: FONT,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: justCopied ? C.ok : C.t,
          fontWeight: 500,
          fontFamily: mono ? MONO : FONT,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          lineHeight: 1.3,
        }}
      >
        {justCopied ? "✓ Kopiert" : displayValue}
      </span>
    </div>
  );
}
