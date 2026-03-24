/**
 * KPI CARD COMPONENT
 * Animated statistics card with trend indicator
 * Uses inline Dashboard design system styles (no cc-* CSS classes)
 */

import { useEffect, useState, useRef, type ReactNode, type CSSProperties } from "react";

interface KpiCardProps {
  icon: ReactNode;
  value: number;
  label: string;
  trend?: number | null;
  subtext?: string;
  suffix?: string;
  highlight?: boolean;
  warning?: boolean;
  error?: boolean;
  showBar?: boolean;
  barValue?: number;
  barMax?: number;
}

// ---------- style helpers ----------

const baseCardStyle: CSSProperties = {
  background: "var(--dash-card-bg, rgba(255, 255, 255, 0.03))",
  border: "1px solid var(--dash-border, rgba(255, 255, 255, 0.08))",
  borderRadius: "var(--dash-radius, 16px)",
  padding: "20px",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  transition: "all 0.3s ease",
};

function getCardStyle(
  highlight?: boolean,
  warning?: boolean,
  error?: boolean,
): CSSProperties {
  if (error) {
    return {
      ...baseCardStyle,
      borderColor: "rgba(239, 68, 68, 0.3)",
      background:
        "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, var(--dash-card-bg, rgba(255, 255, 255, 0.03)) 100%)",
    };
  }
  if (warning) {
    return {
      ...baseCardStyle,
      borderColor: "rgba(245, 158, 11, 0.3)",
      background:
        "linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, var(--dash-card-bg, rgba(255, 255, 255, 0.03)) 100%)",
    };
  }
  if (highlight) {
    return {
      ...baseCardStyle,
      borderColor: "rgba(212, 168, 67, 0.3)",
      background:
        "linear-gradient(135deg, rgba(212, 168, 67, 0.06) 0%, var(--dash-card-bg, rgba(255, 255, 255, 0.03)) 100%)",
    };
  }
  return baseCardStyle;
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const iconContainerStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  background: "rgba(212, 168, 67, 0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--dash-primary, #D4A843)",
};

const valueStyle: CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  color: "var(--dash-text, #ffffff)",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.2,
};

const suffixStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 500,
  marginLeft: "0.25rem",
  opacity: 0.7,
};

const labelStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--dash-text-muted, #a1a1aa)",
  marginTop: "0.25rem",
};

const subtextStyle: CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--dash-text-subtle, #71717a)",
  marginTop: "0.25rem",
};

const barTrackStyle: CSSProperties = {
  height: 4,
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: 2,
  marginTop: "12px",
  overflow: "hidden",
};

function getBarFillStyle(pct: number): CSSProperties {
  return {
    height: "100%",
    width: `${Math.min(pct, 100)}%`,
    borderRadius: 2,
    background: "linear-gradient(90deg, #D4A843, #EAD068)",
    transition: "width 0.6s ease",
  };
}

function getTrendStyle(
  direction: "up" | "down" | "neutral",
): CSSProperties {
  if (direction === "up") {
    return {
      fontSize: "0.75rem",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: "rgba(16, 185, 129, 0.15)",
      color: "var(--dash-success, #10b981)",
    };
  }
  if (direction === "down") {
    return {
      fontSize: "0.75rem",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: "rgba(239, 68, 68, 0.15)",
      color: "var(--dash-danger, #ef4444)",
    };
  }
  return {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--dash-text-muted, #a1a1aa)",
  };
}

// ---------- component ----------

export function KpiCard({
  icon,
  value,
  label,
  trend,
  subtext,
  suffix,
  highlight,
  warning,
  error,
  showBar,
  barValue,
  barMax = 100,
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const previousValue = useRef(0);

  // Animate number counting
  useEffect(() => {
    if (value === previousValue.current) return;

    setIsCounting(true);
    const startValue = previousValue.current;
    const endValue = value;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        setIsCounting(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const trendDirection: "up" | "down" | "neutral" | null =
    trend === null || trend === undefined
      ? null
      : trend > 0
      ? "up"
      : trend < 0
      ? "down"
      : "neutral";

  const barPct =
    showBar && barValue !== undefined ? (barValue / barMax) * 100 : 0;

  return (
    <div style={getCardStyle(highlight, warning, error)}>
      <div style={headerStyle}>
        <div style={iconContainerStyle}>{icon}</div>
        {trendDirection !== null && (
          <div style={getTrendStyle(trendDirection)}>
            {trend! > 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>

      <div
        style={{
          ...valueStyle,
          transition: isCounting ? "none" : "color 0.3s",
        }}
      >
        {displayValue.toLocaleString("de-DE")}
        {suffix && <small style={suffixStyle}>{suffix}</small>}
      </div>

      <div style={labelStyle}>{label}</div>

      {subtext && <div style={subtextStyle}>{subtext}</div>}

      {showBar && barValue !== undefined && (
        <div style={barTrackStyle}>
          <div style={getBarFillStyle(barPct)} />
        </div>
      )}
    </div>
  );
}
