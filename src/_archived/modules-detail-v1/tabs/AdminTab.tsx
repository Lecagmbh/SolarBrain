
import { useInstallationDetail } from "../context/InstallationDetailContext";


export default function AdminTab() {
  const { detail, reload, updateStatus } = useInstallationDetail();

  if (!detail) return <div>Keine Daten…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="installation-overview-card">
        <h3>Admin-Werkzeuge</h3>

        <button
          className="admin-btn admin-btn-sm"
          onClick={() => reload()}
        >
          Neu laden
        </button>

        <button
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ marginTop: "0.5rem" }}
          onClick={() => updateStatus("freigegeben", "Admin-Override")}
        >
          Sofort freigeben (Override)
        </button>

        <p className="detail-muted" style={{ marginTop: "0.8rem" }}>
          Admin kann jeden Status setzen. Diese Änderungen werden mit
          <strong> reason: manual_admin </strong> gespeichert.
        </p>
      </div>

      <div className="installation-overview-card">
        <h3>Debug: Raw Data</h3>
        <pre
          style={{
            fontSize: "0.75rem",
            whiteSpace: "pre-wrap",
            maxHeight: "40vh",
            overflow: "auto",
          }}
        >
{JSON.stringify(detail.raw, null, 2)}
        </pre>
      </div>
    </div>
  );
}
