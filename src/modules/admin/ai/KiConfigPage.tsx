import { useState } from "react";

export function KiConfigPage() {
  const [thresholds, setThresholds] = useState({
    status: 75,
    category: 70,
    emailMatching: 65,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>KI-Konfiguration</h1>

      <label>Status Threshold</label>
      <input
        type="number"
        value={thresholds.status}
        onChange={(e) =>
          setThresholds({ ...thresholds, status: Number(e.target.value) })
        }
      />

      <label>Kategorie Threshold</label>
      <input
        type="number"
        value={thresholds.category}
        onChange={(e) =>
          setThresholds({ ...thresholds, category: Number(e.target.value) })
        }
      />

      <label>E-Mail Matching Threshold</label>
      <input
        type="number"
        value={thresholds.emailMatching}
        onChange={(e) =>
          setThresholds({
            ...thresholds,
            emailMatching: Number(e.target.value),
          })
        }
      />
    </div>
  );
}
