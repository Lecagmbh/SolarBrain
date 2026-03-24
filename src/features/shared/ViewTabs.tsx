/**
 * View-Tabs — Ansicht umschalten
 * Liste | Pipeline | Gantt
 */

const VIEWS = [
  { key: "liste", label: "Liste", icon: "☰" },
  { key: "pipeline", label: "Pipeline", icon: "▥" },
  { key: "gantt", label: "Gantt", icon: "▤" },
] as const;

export type ViewMode = "liste" | "pipeline" | "gantt";

interface Props {
  active: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewTabs({ active, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {VIEWS.map(v => (
        <button
          key={v.key}
          onClick={() => onChange(v.key as ViewMode)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 6,
            border: active === v.key ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.06)",
            fontSize: 11, fontWeight: active === v.key ? 600 : 400,
            cursor: "pointer", fontFamily: "inherit",
            background: active === v.key ? "rgba(212,168,67,0.1)" : "transparent",
            color: active === v.key ? "#a5b4fc" : "#64748b",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 12 }}>{v.icon}</span>
          {v.label}
        </button>
      ))}
    </div>
  );
}

export default ViewTabs;
