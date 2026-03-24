import React from "react";
import type { UploadMeta } from "./types";

type Props = {
  uploads: Record<string, UploadMeta[]>;
  onDownload: (groupKey: string, filename: string) => void;
};

const DocumentsTab: React.FC<Props> = ({ uploads, onDownload }) => {
  const keys = Object.keys(uploads);

  if (!keys.length) {
    return (
      <p className="detail-muted">
        Für diese Anlage wurden noch keine Dateien hinterlegt.
      </p>
    );
  }

  return (
    <div className="installation-docs">
      <div className="installation-docs-header">
        <h3>Dokumente</h3>
        <p className="detail-muted">
          Gruppen entsprechen den Upload-Buckets aus dem Wizard.
        </p>
      </div>

      <div className="installation-docs-grid">
        {keys.map((groupKey) => (
          <section key={groupKey} className="installation-docs-section">
            <h4>{groupKey}</h4>
            <ul className="detail-upload-list">
              {uploads[groupKey].map((f, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="detail-upload-link"
                    onClick={() => onDownload(groupKey, f.filename)}
                  >
                    {f.filename}
                  </button>
                  <span className="detail-upload-meta">
                    {typeof f.size === "number"
                      ? `${(f.size / 1024 / 1024).toFixed(1)} MB`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default DocumentsTab;
