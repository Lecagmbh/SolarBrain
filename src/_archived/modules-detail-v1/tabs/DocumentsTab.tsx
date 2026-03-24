
import { useInstallationDetail } from "../context/InstallationDetailContext";
import { safe } from "../logic/utils";

export default function DocumentsTab() {
  const { detail } = useInstallationDetail();
  if (!detail) return <div>Keine Daten…</div>;

  const uploads = detail.uploads || {};

  return (
    <div className="installation-docs-grid">
      {Object.entries(uploads).map(([group, files]) => (
        <div key={group} className="installation-docs-section">
          <h4>{group}</h4>

          {files.length === 0 && (
            <p className="detail-muted">Keine Dokumente</p>
          )}

          <ul className="detail-upload-list">
            {files.map((f, idx) => (
              <li key={idx}>
                <button className="detail-upload-link">
                  {f.filename}
                </button>
                <span className="detail-upload-meta">
                  {safe(f.size)} Bytes
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
