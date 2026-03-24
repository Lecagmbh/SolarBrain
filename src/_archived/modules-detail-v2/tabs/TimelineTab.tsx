// ============================================================================
// Baunity Installation Detail V2 - Timeline Tab
// ============================================================================

import { useState, useMemo } from "react";
import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../auth/AuthContext";
import { STATUS_CONFIG, type InstallationStatus } from "../types";
import { formatDateTime, formatRelativeTime, canEditStatus } from "../utils";

type TimelineItem = {
  id: string;
  type: "status" | "comment" | "document" | "email";
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  actorEmail?: string;
  meta?: Record<string, any>;
};

export default function TimelineTab() {
  const { detail, addComment, loading } = useDetail();
  const { user } = useAuth();
  const role = (user?.role ?? "mitarbeiter") as "admin" | "mitarbeiter" | "kunde";

  const [commentDraft, setCommentDraft] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "status" | "comment">("all");

  // Combine all timeline items
  const timelineItems = useMemo((): TimelineItem[] => {
    if (!detail) return [];

    const items: TimelineItem[] = [];

    // Status history
    (detail.statusHistory || []).forEach((entry, idx) => {
      const statusConfig = STATUS_CONFIG[entry.status as InstallationStatus];
      items.push({
        id: `status-${idx}`,
        type: "status",
        title: `Status: ${statusConfig?.label || entry.status}`,
        description: entry.comment,
        timestamp: entry.changedAt,
        actor: entry.changedBy,
        actorEmail: entry.changedByEmail,
        meta: {
          status: entry.status,
          source: entry.source,
          color: statusConfig?.color,
          icon: statusConfig?.icon,
        },
      });
    });

    // Comments
    (detail.comments || []).forEach((comment) => {
      items.push({
        id: `comment-${comment.id}`,
        type: "comment",
        title: comment.author,
        description: comment.message,
        timestamp: comment.createdAt,
        actor: comment.author,
        actorEmail: comment.authorEmail,
        meta: {
          isInternal: comment.isInternal,
          role: comment.authorRole,
        },
      });
    });

    // Sort by timestamp descending (newest first)
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items;
  }, [detail]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filter === "all") return timelineItems;
    return timelineItems.filter((item) => item.type === filter);
  }, [timelineItems, filter]);

  async function handleAddComment() {
    if (!commentDraft.trim()) return;

    setSaving(true);
    try {
      await addComment(commentDraft.trim(), isInternal);
      setCommentDraft("");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !detail) {
    return (
      <div>
        <div className="ld-skeleton ld-skeleton--card" />
        <div className="ld-skeleton ld-skeleton--card" />
        <div className="ld-skeleton ld-skeleton--card" />
      </div>
    );
  }

  return (
    <div>
      {/* Add Comment Form */}
      {canEditStatus(role) && (
        <div className="ld-card" style={{ marginBottom: 24 }}>
          <div className="ld-card__header">
            <h3 className="ld-card__title">
              <span className="ld-card__title-icon">💬</span>
              Kommentar hinzufügen
            </h3>
          </div>
          <div className="ld-form-group">
            <textarea
              className="ld-input ld-textarea"
              placeholder="Schreiben Sie einen Kommentar..."
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--ld-text-secondary)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                style={{ accentColor: "var(--ld-accent)" }}
              />
              Interner Kommentar (nicht für Kunden sichtbar)
            </label>
            <button
              className="ld-btn ld-btn--primary"
              onClick={handleAddComment}
              disabled={saving || !commentDraft.trim()}
            >
              {saving ? "Speichern..." : "Kommentar hinzufügen"}
            </button>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--ld-text-muted)",
            }}
          >
            Tipp: Drücken Sie ⌘/Ctrl + Enter zum Speichern
          </div>
        </div>
      )}

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {(["all", "status", "comment"] as const).map((f) => (
          <button
            key={f}
            className={`ld-btn ld-btn--sm ${
              filter === f ? "ld-btn--primary" : "ld-btn--ghost"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && "Alle"}
            {f === "status" && "Statusänderungen"}
            {f === "comment" && "Kommentare"}
          </button>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--ld-text-muted)",
            alignSelf: "center",
          }}
        >
          {filteredItems.length} Einträge
        </span>
      </div>

      {/* Timeline */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--ld-text-muted)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📜</div>
          <div style={{ fontSize: 14 }}>Keine Einträge vorhanden</div>
        </div>
      ) : (
        <div className="ld-timeline">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`ld-timeline-item ld-timeline-item--${item.type}`}
            >
              <div
                className="ld-timeline-item__dot"
                style={{
                  borderColor:
                    item.type === "status"
                      ? item.meta?.color || "var(--ld-accent)"
                      : undefined,
                }}
              />
              <div className="ld-timeline-item__content">
                <div className="ld-timeline-item__header">
                  <div className="ld-timeline-item__title">
                    {item.type === "status" && (
                      <span style={{ marginRight: 6 }}>{item.meta?.icon}</span>
                    )}
                    {item.title}
                    {item.type === "comment" && item.meta?.isInternal && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          padding: "2px 6px",
                          background: "rgba(139, 92, 246, 0.15)",
                          color: "#f0d878",
                          borderRadius: 4,
                        }}
                      >
                        Intern
                      </span>
                    )}
                  </div>
                  <div className="ld-timeline-item__time">
                    {formatRelativeTime(item.timestamp)}
                  </div>
                </div>

                {item.actor && (
                  <div className="ld-timeline-item__meta">
                    von {item.actor}
                    {item.meta?.source && item.meta.source !== "manual" && (
                      <span style={{ opacity: 0.7 }}>
                        {" "}
                        • {item.meta.source === "automation" ? "Automatisch" : item.meta.source}
                      </span>
                    )}
                  </div>
                )}

                {item.description && (
                  <div className="ld-timeline-item__body">{item.description}</div>
                )}

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--ld-text-muted)",
                  }}
                >
                  {formatDateTime(item.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
