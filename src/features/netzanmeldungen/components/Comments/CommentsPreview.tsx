/**
 * COMMENTS PREVIEW
 * ================
 * Shows latest 2-3 comments in Overview tab
 */

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Plus, Loader2, ChevronRight, Send,
} from "lucide-react";
import { api } from "../../services/api";
import type { Comment } from "../../types";
import { formatRelativeTime } from "./utils";
import type { Permissions } from "../../../../hooks/usePermissions";

interface CommentsPreviewProps {
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
  onShowAll?: () => void; // Callback to switch to timeline tab
  maxComments?: number;
  permissions: Permissions;
}

export function CommentsPreview({
  installationId,
  showToast,
  onShowAll,
  maxComments = 3,
  permissions,
}: CommentsPreviewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickComment, setQuickComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const data = await api.comments.getForInstallation(installationId);
      // Sort newest first and take only the first few
      const sorted = data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sorted.slice(0, maxComments));
    } catch (err) {
      console.error("Fehler beim Laden der Kommentare:", err);
    } finally {
      setLoading(false);
    }
  }, [installationId, maxComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Quick add comment
  const handleQuickAdd = async () => {
    if (!quickComment.trim()) return;

    setSubmitting(true);
    try {
      const created = await api.comments.add(installationId, quickComment.trim());
      setComments(prev => [created, ...prev].slice(0, maxComments));
      setQuickComment("");
      setShowQuickAdd(false);
      showToast("Kommentar hinzugefuegt", "success");
    } catch (err: any) {
      showToast(err.message || "Fehler beim Speichern", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleQuickAdd();
    }
    if (e.key === "Escape") {
      setShowQuickAdd(false);
      setQuickComment("");
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  return (
    <div className="dp-overview-card">
      <div className="dp-overview-card__header">
        <MessageSquare size={18} />
        <h4>Letzte Kommentare</h4>
        {comments.length > 0 && (
          <span className="dp-badge dp-badge--subtle">{comments.length}</span>
        )}
      </div>

      <div className="dp-overview-card__content">
        {loading ? (
          <div className="comments-preview__loading">
            <Loader2 size={18} className="dp-spin" />
            <span>Lade...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-preview__empty">
            <span>Noch keine Kommentare</span>
          </div>
        ) : (
          <div className="comments-preview__list">
            {comments.map(comment => (
              <div key={comment.id} className="comments-preview__item">
                <div className="comments-preview__avatar">
                  {getInitials(comment.authorName)}
                </div>
                <div className="comments-preview__content">
                  <div className="comments-preview__header">
                    <span className="comments-preview__author">
                      {comment.authorName}
                    </span>
                    <span className="comments-preview__time">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <div className="comments-preview__text">
                    {comment.text.length > 100
                      ? `${comment.text.slice(0, 100)}...`
                      : comment.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Form - nur wenn Benutzer Kommentare schreiben darf */}
        {permissions.canWriteComments && showQuickAdd ? (
          <div className="comments-preview__quick-add">
            <textarea
              value={quickComment}
              onChange={e => setQuickComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kurze Notiz... (Strg+Enter)"
              rows={2}
              autoFocus
            />
            <div className="comments-preview__quick-actions">
              <button
                className="dp-btn dp-btn--sm dp-btn--ghost"
                onClick={() => {
                  setShowQuickAdd(false);
                  setQuickComment("");
                }}
              >
                Abbrechen
              </button>
              <button
                className="dp-btn dp-btn--sm dp-btn--primary"
                onClick={handleQuickAdd}
                disabled={submitting || !quickComment.trim()}
              >
                {submitting ? (
                  <Loader2 size={14} className="dp-spin" />
                ) : (
                  <Send size={14} />
                )}
                Senden
              </button>
            </div>
          </div>
        ) : (
          <div className="comments-preview__actions">
            {permissions.canWriteComments && (
              <button
                className="comments-preview__add-btn"
                onClick={() => setShowQuickAdd(true)}
              >
                <Plus size={14} />
                <span>Kommentar hinzufuegen</span>
              </button>
            )}
            {onShowAll && comments.length > 0 && (
              <button
                className="comments-preview__all-btn"
                onClick={onShowAll}
              >
                <span>Alle anzeigen</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentsPreview;
