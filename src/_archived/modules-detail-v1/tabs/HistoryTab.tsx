
import { useInstallationDetail } from "../context/InstallationDetailContext";
import { formatDate } from "../logic/utils";

export default function HistoryTab() {
  const { detail } = useInstallationDetail();
  if (!detail) return <div>Keine Daten…</div>;

  const history = detail.statusHistory ?? [];
  const comments = detail.comments ?? [];

  return (
    <div className="installation-history-columns">
      {/* Statusverlauf */}
      <div>
        <h3>Statusverlauf</h3>
        <ul className="detail-timeline">
          {history.map((h, idx) => (
            <li key={idx}>
              <div className="detail-timeline-dot" />
              <div>
                <div className="detail-timeline-title">{h.status}</div>
                <div className="detail-timeline-meta">
                  {formatDate(h.changedAt)} – {h.changedBy}
                </div>
                {h.comment && (
                  <div className="detail-comment-body">{h.comment}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Kommentare */}
      <div>
        <h3>Kommentare</h3>
        <ul className="detail-comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <div className="detail-comment-header">
                <span>{c.author}</span>
                <span className="detail-comment-date">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <div className="detail-comment-body">{c.message}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
