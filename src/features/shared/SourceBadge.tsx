/**
 * Source-Badge — zeigt Herkunft eines Projekts/Installation
 * 🟣 CRM (Indigo) | 🟠 Wizard (Orange) | 🔵 API (Cyan)
 */

const SOURCES = {
  CRM: { label: "CRM", color: "#D4A843", bg: "rgba(212,168,67,0.12)", dot: "🟣" },
  WIZARD: { label: "Wizard", color: "#f97316", bg: "rgba(249,115,22,0.12)", dot: "🟠" },
  API: { label: "API", color: "#06b6d4", bg: "rgba(6,182,212,0.12)", dot: "🔵" },
  PARTNER: { label: "Partner", color: "#EAD068", bg: "rgba(139,92,246,0.12)", dot: "🟣" },
  MANUELL: { label: "Manuell", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", dot: "⚪" },
} as const;

type SourceKey = keyof typeof SOURCES;

export function SourceBadge({ source, size = "sm" }: { source: string; size?: "sm" | "md" }) {
  const s = SOURCES[(source?.toUpperCase() as SourceKey)] || SOURCES.MANUELL;
  const isSmall = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: isSmall ? 4 : 6,
      fontSize: isSmall ? 10 : 12, fontWeight: 600,
      padding: isSmall ? "2px 8px" : "3px 10px",
      borderRadius: 4, background: s.bg, color: s.color,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: isSmall ? 8 : 10 }}>{s.dot}</span>
      {s.label}
    </span>
  );
}

export function SourceDot({ source }: { source: string }) {
  const s = SOURCES[(source?.toUpperCase() as SourceKey)] || SOURCES.MANUELL;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} title={s.label} />;
}

export function getNaStatus(hasInstallation: boolean) {
  if (hasInstallation) {
    return { label: "NA ✓", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  }
  return { label: "Keine NA", color: "#64748b", bg: "rgba(148,163,184,0.06)" };
}

export function NaBadge({ hasInstallation }: { hasInstallation: boolean }) {
  const s = getNaStatus(hasInstallation);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
