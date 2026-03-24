import { useState } from "react";
import type { AutomationRule } from "./rule.types";
import "./rules.css";

export function RuleEditor({
  rule,
  onSave,
  onCancel,
}: {
  rule?: AutomationRule;
  onSave: (r: AutomationRule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AutomationRule>(
    rule || {
      id: Math.random().toString(36).slice(2),
      name: "",
      conditions: [],
      actions: [],
      enabled: true,
      priority: 100,
    }
  );

  return (
    <div className="rule-editor">
      <h2>Regel bearbeiten</h2>

      <label>Name</label>
      <input
        className="rule-input"
        value={draft.name}
        onChange={(e) =>
          setDraft({ ...draft, name: e.target.value })
        }
      />

      <div className="rule-footer">
        <button className="rule-btn" onClick={() => onSave(draft)}>
          Speichern
        </button>
        <button className="rule-btn rule-btn-cancel" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
