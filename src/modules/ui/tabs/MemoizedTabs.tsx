import React, { useState } from "react";

export function MemoizedTabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="memo-tabs">
      <div className="memo-tabs-header">
        {tabs.map((t, idx) => (
          <button
            key={idx}
            className={`memo-tab-btn ${idx === active ? "active" : ""}`}
            onClick={() => setActive(idx)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="memo-tabs-body">
        {/* Tabs werden NICHT neu gerendert bei Wechsel */}
        {tabs.map((t, idx) => (
          <div
            key={idx}
            style={{ display: idx === active ? "block" : "none" }}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
