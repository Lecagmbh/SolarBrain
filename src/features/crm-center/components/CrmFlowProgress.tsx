import { FLOW_STAGES } from "../types/crm.types";
import type { CrmStage } from "../types/crm.types";
import { C } from "../crm.styles";

export default function CrmFlowProgress({ currentStage }: { currentStage: CrmStage }) {
  const currentIdx = FLOW_STAGES.findIndex(s => s.key === currentStage);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, margin: "12px 0 8px" }}>
      {FLOW_STAGES.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: done ? s.color + "60" : C.border }} />}
              <div style={{
                width: isCurrent ? 28 : 22, height: isCurrent ? 28 : 22, borderRadius: "50%",
                background: done ? s.color + "25" : C.bgCard,
                border: `2px solid ${done ? s.color : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCurrent ? 13 : 10, flexShrink: 0,
                boxShadow: isCurrent ? `0 0 12px ${s.color}40` : "none",
              }}>
                {s.icon}
              </div>
              {i < FLOW_STAGES.length - 1 && <div style={{ flex: 1, height: 2, background: done && i < currentIdx ? FLOW_STAGES[i + 1].color + "60" : C.border }} />}
            </div>
            <div style={{
              fontSize: 8, color: done ? s.color : C.textMuted,
              fontWeight: isCurrent ? 800 : 500, marginTop: 4, textAlign: "center",
              fontFamily: "'DM Mono', monospace",
            }}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
