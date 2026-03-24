
import { useInstallationDetail } from "../context/InstallationDetailContext";
import { formatDate, safe } from "../logic/utils";

export default function EmailsTab() {
  const { detail } = useInstallationDetail();

  if (!detail) return <div>Keine Daten…</div>;

  const emails = (detail as any).emails ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {emails.length === 0 && (
        <p className="detail-muted">Keine zugeordneten E-Mails</p>
      )}

      {emails.map((mail: any) => (
        <div key={mail.id} className="installation-overview-card">
          <h3 style={{ marginBottom: "0.3rem" }}>{mail.subject}</h3>

          <ul className="detail-list">
            <li>
              <span>Von</span>
              <span>{mail.from}</span>
            </li>
            <li>
              <span>Gesendet</span>
              <span>{formatDate(mail.date)}</span>
            </li>
          </ul>

          <p className="detail-muted" style={{ marginTop: "0.5rem" }}>
            {mail.body?.slice(0, 300) || "Keine Vorschau"}
          </p>

          {mail.attachments?.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Anhänge:</strong>
              <ul className="detail-upload-list">
                {mail.attachments.map((att: any, idx: number) => (
                  <li key={idx}>
                    <button className="detail-upload-link">
                      {att.filename}
                    </button>
                    <span className="detail-upload-meta">
                      {safe(att.size)} Bytes
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
