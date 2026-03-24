/**
 * COMMENTS SECTION
 * ================
 * Full comments list with input for TimelineTab
 */

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Loader2, Trash2, Edit2, X, Check,
  User, Clock, AlertCircle,
} from "lucide-react";
import { api } from "../../services/api";
import type { Comment } from "../../types";
import { formatRelativeTime } from "./utils";
import type { Permissions } from "../../../../hooks/usePermissions";

interface CommentsSectionProps {
  installationId: number;
  showToast: (msg: string, type: "success" | "error") => void;
  permissions: Permissions;
}

export function CommentsSection({ installationId, showToast, permissions }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const data = await api.comments.getForInstallation(installationId);
      // Sort newest first
      setComments(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error("Fehler beim Laden der Kommentare:", err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Add comment
  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const created = await api.comments.add(installationId, newComment.trim());
      setComments(prev => [created, ...prev]);
      setNewComment("");
      showToast("Kommentar hinzugefuegt", "success");
    } catch (err: any) {
      showToast(err.message || "Fehler beim Speichern", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;

    try {
      await api.comments.update(installationId, editingId, editText.trim());
      setComments(prev => prev.map(c =>
        c.id === editingId ? { ...c, text: editText.trim() } : c
      ));
      setEditingId(null);
      showToast("Kommentar aktualisiert", "success");
    } catch (err: any) {
      showToast(err.message || "Fehler beim Bearbeiten", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // Delete comment
  const handleDelete = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      await api.comments.delete(installationId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast("Kommentar geloescht", "success");
    } catch (err: any) {
      showToast(err.message || "Fehler beim Loeschen", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  return (
    <div className="comments-section">
      {/* Input - nur wenn Benutzer Kommentare schreiben darf */}
      {permissions.canWriteComments ? (
        <div className="comments-input">
          <div className="comments-input__header">
            <MessageSquare size={16} />
            <span>Kommentar hinzufuegen</span>
          </div>
          <div className="comments-input__body">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Notiz zur Anlage eingeben... (Strg+Enter zum Senden)"
              rows={3}
              disabled={submitting}
            />
          </div>
          <div className="comments-input__footer">
            <span className="comments-input__hint">
              <Clock size={12} /> Strg+Enter zum Senden
            </span>
            <button
              className="comments-input__submit"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Send size={16} />
              )}
              Senden
            </button>
          </div>
        </div>
      ) : (
        <div className="comments-input comments-input--disabled">
          <div className="comments-input__header">
            <AlertCircle size={16} />
            <span>Nur Ansicht - Keine Berechtigung zum Kommentieren</span>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        <div className="comments-list__header">
          <MessageSquare size={16} />
          <span>Kommentare</span>
          <span className="comments-list__count">{comments.length}</span>
        </div>

        {loading ? (
          <div className="comments-list__loading">
            <Loader2 size={24} className="spin" />
            <span>Lade Kommentare...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-list__empty">
            <MessageSquare size={32} />
            <span>Noch keine Kommentare</span>
            <span className="comments-list__empty-hint">
              Fuege den ersten Kommentar hinzu
            </span>
          </div>
        ) : (
          <div className="comments-list__items">
            {comments.map(comment => {
              const isOwn = permissions.userId === comment.authorId;
              const isEditing = editingId === comment.id;
              const isDeleting = deletingId === comment.id;

              // 🔒 Permission check for editing/deleting
              const canEdit = isOwn && permissions.canWriteComments;
              const canDelete = permissions.canDeleteAllComments || (isOwn && permissions.canDeleteOwnComments);

              return (
                <div
                  key={comment.id}
                  className={`comment-item ${isOwn ? "comment-item--own" : ""}`}
                >
                  <div className="comment-item__avatar">
                    {getInitials(comment.authorName)}
                  </div>

                  <div className="comment-item__content">
                    <div className="comment-item__header">
                      <span className="comment-item__author">
                        {comment.authorName}
                        {isOwn && <span className="comment-item__own-badge">Du</span>}
                      </span>
                      <span className="comment-item__time">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="comment-item__edit">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="comment-item__edit-actions">
                          <button
                            className="comment-item__edit-btn comment-item__edit-btn--save"
                            onClick={handleSaveEdit}
                          >
                            <Check size={14} /> Speichern
                          </button>
                          <button
                            className="comment-item__edit-btn comment-item__edit-btn--cancel"
                            onClick={handleCancelEdit}
                          >
                            <X size={14} /> Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="comment-item__text">
                        {comment.text}
                      </div>
                    )}

                    {/* Actions - based on permissions */}
                    {(canEdit || canDelete) && !isEditing && (
                      <div className="comment-item__actions">
                        {canEdit && (
                          <button
                            className="comment-item__action"
                            onClick={() => handleStartEdit(comment)}
                            title="Bearbeiten"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="comment-item__action comment-item__action--delete"
                            onClick={() => handleDelete(comment.id)}
                            disabled={isDeleting}
                            title="Loeschen"
                          >
                            {isDeleting ? (
                              <Loader2 size={12} className="spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentsSection;
