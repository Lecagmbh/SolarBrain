import { useState } from "react";

import { useInstallationDetail } from "../context/InstallationDetailContext";

export default function RawTab() {
  const { detail } = useInstallationDetail();
  const raw = detail?.raw ?? {};

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(path: string) {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  function renderNode(obj: any, path: string) {
    if (obj === null) {
      return <span style={{ color: "#94a3b8" }}>null</span>;
    }

    if (typeof obj !== "object") {
      return <span style={{ color: "#e2e8f0" }}>{String(obj)}</span>;
    }

    const keys = Object.keys(obj);
    const open = expanded[path] ?? false;

    return (
      <div style={{ marginLeft: "1rem" }}>
        <div
          className="raw-keyline"
          onClick={() => toggle(path)}
          style={{ cursor: "pointer" }}
        >
          <span className="raw-caret">{open ? "▼" : "▶"}</span>
          <strong>{path.split(".").pop()}</strong>
        </div>

        {open &&
          keys.map((k) => (
            <div key={k} style={{ marginLeft: "1rem" }}>
              <strong>{k}: </strong>
              {renderNode(obj[k], path + "." + k)}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="raw-viewer">
      <div className="raw-tree-container">{renderNode(raw, "root")}</div>
    </div>
  );
}
