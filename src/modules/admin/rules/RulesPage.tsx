import { useState } from "react";
import type { AutomationRule } from "./rule.types";
import { RuleEditor } from "./RuleEditor";

export function RulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [editing, setEditing] = useState<AutomationRule | null>(null);

  function saveRule(rule: AutomationRule) {
    setRules((prev) => {
      const existing = prev.find((r) => r.id === rule.id);
      if (existing) {
        return prev.map((r) => (r.id === rule.id ? rule : r));
      }
      return [...prev, rule];
    });
    setEditing(null);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Regeln</h1>

      {!editing && (
        <>
          <button
            className="rule-btn"
            onClick={() =>
              setEditing({
                id: Math.random().toString(36).slice(2),
                name: "",
                conditions: [],
                actions: [],
                enabled: true,
                priority: 100,
              })
            }
          >
            Neue Regel
          </button>

          <div className="rule-list">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rule-item"
                onClick={() => setEditing(r)}
              >
                <strong>{r.name || "(ohne Namen)"}</strong>
                <span> · Prio: {r.priority}</span>
                <span> · {r.enabled ? "aktiv" : "inaktiv"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <RuleEditor
          rule={editing}
          onSave={saveRule}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
