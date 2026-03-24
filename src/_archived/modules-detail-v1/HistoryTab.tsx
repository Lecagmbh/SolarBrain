import React from "react";
import type { Comment, StatusHistoryEntry } from "./types";
import { getDisplayStatus } from "./types";

type Props = {
  statusHistory: StatusHistoryEntry[];
  comments: Comment[];
  formatDateTime: (v: string) => string;
};

const HistoryTab: React.FC<Props> = ({
  statusHistory,
  comments,
  formatDateTime,
}) => {
  return (
    <div className="installation-history-columns">
      <div>
        <h3>Statusverlauf</h3>
        {statusHistory.length ? (
          <ul className="detail-timeline">
            {statusHistory.map((entry, idx) => (
              <li key={idx}>
                <span className="detail-timeline-dot" />
                <div>
                  <div className="detail-timeline-title">
                    {getDisplayStatus(entry.status, entry.statusLabel)}
                  </div>
                  <div className="detail-timeline-meta">
                    {formatDateTime(entry.changedAt)} – {entry.changedBy}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-muted">Noch keine Statushistorie vorhanden.</p>
        )}
      </div>

      <div>
        <h3>Kommentare</h3>
        {comments.length ? (
          <ul className="detail-comment-list">
            {comments.map((c) => (
              <li key={c.id}>
                <div className="detail-comment-header">
                  <span>{c.author}</span>
                  <span className="detail-comment-date">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <div className="detail-comment-body">{c.message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-muted">
            Noch keine Kommentare für diese Anlage.
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
