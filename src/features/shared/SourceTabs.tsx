/**
 * Source-Tabs — filtert Projekte nach Herkunft
 * Tabs: Alle | 🟣 CRM | 🟠 Wizard | 🔵 API
 * Mit Counts pro Tab.
 */
import { useState } from "react";

const TABS = [
  { key: "alle", label: "Alle", dot: null },
  { key: "CRM", label: "CRM", dot: "#D4A843" },
  { key: "WIZARD", label: "Wizard", dot: "#f97316" },
  { key: "API", label: "API", dot: "#06b6d4" },
] as const;

export type SourceFilter = "alle" | "CRM" | "WIZARD" | "API";

interface Props {
  active: SourceFilter;
  onChange: (tab: SourceFilter) => void;
  counts?: Record<string, number>;
}

export function SourceTabs({ active, onChange, counts }: Props) {
  return (
    <div style={{ display: "flex", gap: 2, background: "rgba(15,15,25,0.5)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
      {TABS.map(t => {
        const isActive = active === t.key;
        const count = t.key === "alle" ? undefined : counts?.[t.key];
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key as SourceFilter)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 6, border: "none",
              fontSize: 12, fontWeight: isActive ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit",
              background: isActive ? "rgba(212,168,67,0.15)" : "transparent",
              color: isActive ? "#a5b4fc" : "#64748b",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            {t.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.dot, flexShrink: 0 }} />}
            {t.label}
            {count !== undefined && (
              <span style={{ fontSize: 10, color: isActive ? "#EAD068" : "#475569", fontWeight: 600, marginLeft: 2 }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SourceTabs;
