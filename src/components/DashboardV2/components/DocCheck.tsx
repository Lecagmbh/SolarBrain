import React from "react";
import { C, FONT, PFLICHT_DOCS, DOC_CATEGORIES } from "../constants";
import type { DashboardDocument } from "../constants";

interface DocCheckProps {
  documents: DashboardDocument[];
  compact?: boolean;
  requiredDocs?: readonly string[];
}

export function DocCheck({ documents, compact, requiredDocs }: DocCheckProps) {
  const docList = requiredDocs || PFLICHT_DOCS;
  const checks = docList.map((cat) => {
    const count = documents.filter(
      (d) => d.kategorie === cat || d.dokumentTyp === cat
    ).length;
    return { cat, label: DOC_CATEGORIES[cat] || cat, count, ok: count > 0 };
  });

  const total = checks.length;
  const done = checks.filter((c) => c.ok).length;

  if (compact) {
    return (
      <span style={{ fontSize: 11, color: done === total ? C.ok : C.wr, fontFamily: FONT }}>
        {done}/{total}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "2px 0" }}>
      {checks.map((c) => (
        <div
          key={c.cat}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "3px 6px",
            borderRadius: 4,
          }}
        >
          <span style={{ fontSize: 12, color: c.ok ? C.ok : C.er, width: 14, textAlign: "center" }}>
            {c.ok ? "✓" : "✗"}
          </span>
          <span style={{ fontSize: 12, color: C.t, flex: 1, fontFamily: FONT }}>
            {c.label}
          </span>
          <span style={{ fontSize: 10, color: C.t3, fontFamily: FONT }}>
            {c.count}x
          </span>
        </div>
      ))}
    </div>
  );
}
