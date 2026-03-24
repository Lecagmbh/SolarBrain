import React from "react";
import { ClipboardList } from "lucide-react";
import { C, FONT, MONO, STATUS_MAP, STATUS_ACTIONS } from "../constants";
import { StatusPill } from "./StatusPill";

interface TopBarProps {
  publicId: string;
  customerName?: string;
  status: string;
  totalKwp?: number;
  onClose: () => void;
  onUpload?: () => void;
  onStornieren?: () => void;
  onNbData?: () => void;
  primaryAction?: { label: string; onClick: () => void };
}

export function TopBar({
  publicId,
  customerName,
  status,
  totalKwp,
  onClose,
  onUpload,
  onStornieren,
  onNbData,
  primaryAction,
}: TopBarProps) {
  // Determine the target status color for the primary action button
  const actions = STATUS_ACTIONS[status?.toLowerCase()] || [];
  const nextAction = actions[0];
  const targetStatusCfg = nextAction ? STATUS_MAP[nextAction.target] : undefined;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: C.s1,
        borderBottom: `1px solid ${C.bd}`,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT,
      }}
    >
      {/* Gradient Logo Square */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${C.ac}, ${C.bl})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
          letterSpacing: -0.5,
        }}
      >
        G
      </div>

      <div
        style={{
          width: 1,
          height: 20,
          background: C.bd,
          margin: "0 4px",
        }}
      />

      {/* Customer name */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: C.t,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 200,
        }}
      >
        {customerName || "Unbekannt"}
      </span>

      {/* Public ID Pill */}
      <span
        style={{
          fontSize: 10,
          color: C.t2,
          fontFamily: MONO,
          background: C.s3,
          padding: "2px 8px",
          borderRadius: 6,
          letterSpacing: 0.3,
        }}
      >
        {publicId}
      </span>

      {/* kWp */}
      {totalKwp != null && totalKwp > 0 && (
        <span
          style={{
            fontSize: 11,
            color: C.t2,
            fontFamily: MONO,
          }}
        >
          {totalKwp.toFixed(1)} kWp
        </span>
      )}

      {/* Status */}
      <StatusPill status={status} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      {onNbData && (
        <button
          onClick={onNbData}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 6,
            border: `1px solid ${C.ac}40`,
            background: `${C.ac}18`,
            color: C.ac,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          <ClipboardList size={13} />
          NB-Daten
        </button>
      )}
      {onUpload && (
        <ActionBtn label="Hochladen" onClick={onUpload} />
      )}
      {onStornieren && status !== "storniert" && status !== "fertig" && (
        <ActionBtn label="Stornieren" onClick={onStornieren} danger />
      )}
      {primaryAction && targetStatusCfg && (
        <ActionBtn
          label={primaryAction.label}
          onClick={primaryAction.onClick}
          primary
          accentColor={targetStatusCfg.color}
          accentBg={targetStatusCfg.bg}
        />
      )}
      {primaryAction && !targetStatusCfg && (
        <ActionBtn label={primaryAction.label} onClick={primaryAction.onClick} primary />
      )}

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: C.t3,
          cursor: "pointer",
          padding: "4px 8px",
          fontSize: 18,
          lineHeight: 1,
          borderRadius: 4,
          fontFamily: FONT,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = C.t;
          (e.currentTarget as HTMLButtonElement).style.background = C.s3;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = C.t3;
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        ✕
      </button>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  primary,
  danger,
  accentColor,
  accentBg,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  accentColor?: string;
  accentBg?: string;
}) {
  // If primary with target color, use that color scheme
  const usePrimary = primary && accentColor;

  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 12px",
        borderRadius: 6,
        border: usePrimary
          ? `1px solid ${accentColor}40`
          : primary
            ? "none"
            : `1px solid ${danger ? C.er + "40" : C.bd}`,
        background: usePrimary
          ? (accentBg || accentColor + "18")
          : primary
            ? C.ac
            : danger
              ? C.erB
              : "transparent",
        color: usePrimary
          ? accentColor
          : primary
            ? "#fff"
            : danger
              ? C.er
              : C.t2,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {primary && <span style={{ fontSize: 10 }}>{"→"}</span>}
    </button>
  );
}
