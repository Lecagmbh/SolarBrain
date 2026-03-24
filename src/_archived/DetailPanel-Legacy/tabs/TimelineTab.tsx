/**
 * TIMELINE TAB - Kombinierte Timeline mit Kommentaren
 * ==================================================
 * Zeigt System-Events und User-Kommentare zusammen
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Clock, Plus, Loader2, ChevronDown, ChevronRight,
  FileText, Mail, MessageSquare, User, Send, Eye,
  CheckCircle, XCircle, AlertTriangle, Edit3, Trash2, X, Check,
  ArrowRightLeft, Inbox, Zap, Ban,
} from "lucide-react";
import { api } from "../../../services/api";
import type { TimelineEntry, Comment } from "../../../types";

interface TimelineTabProps {
  timeline: TimelineEntry[];
  installationId: number;
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
  currentUserId?: number;
}

// Combined entry type (timeline event or comment)
interface CombinedEntry {
  id: string;
  type: "event" | "comment";
  createdAt: string;
  data: TimelineEntry | Comment;
}

// Event type configuration
const EVENT_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  created: { icon: Plus, color: "#22c55e", bg: "rgba(34,197,94,0.2)", label: "Erstellt" },
  status_changed: { icon: Edit3, color: "#3b82f6", bg: "rgba(59,130,246,0.2)", label: "Status geändert" },
  document_uploaded: { icon: FileText, color: "#a855f7", bg: "rgba(168,85,247,0.2)", label: "Dokument hochgeladen" },
  email_sent: { icon: Send, color: "#f59e0b", bg: "rgba(245,158,11,0.2)", label: "E-Mail gesendet" },
  email_received: { icon: Mail, color: "#06b6d4", bg: "rgba(6,182,212,0.2)", label: "E-Mail empfangen" },
  note_added: { icon: MessageSquare, color: "#6b7280", bg: "rgba(107,114,128,0.2)", label: "Notiz hinzugefügt" },
  manual_note: { icon: MessageSquare, color: "#6b7280", bg: "rgba(107,114,128,0.2)", label: "Notiz" },
  task_created: { icon: CheckCircle, color: "#ec4899", bg: "rgba(236,72,153,0.2)", label: "Aufgabe erstellt" },
  task_completed: { icon: CheckCircle, color: "#22c55e", bg: "rgba(34,197,94,0.2)", label: "Aufgabe erledigt" },
  warning: { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.2)", label: "Warnung" },
  // Workflow V2 Event Types
  phase_changed: { icon: ArrowRightLeft, color: "#D4A843", bg: "rgba(212,168,67,0.2)", label: "Phase geaendert" },
  zustand_changed: { icon: ArrowRightLeft, color: "#EAD068", bg: "rgba(139,92,246,0.2)", label: "Zustand geaendert" },
  nb_response_received: { icon: Mail, color: "#f59e0b", bg: "rgba(245,158,11,0.2)", label: "NB-Antwort" },
  automation_executed: { icon: Zap, color: "#10b981", bg: "rgba(16,185,129,0.2)", label: "Automation" },
  error_occurred: { icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,0.2)", label: "Fehler" },
  storniert: { icon: Ban, color: "#dc2626", bg: "rgba(220,38,38,0.2)", label: "Storniert" },
  inbox_item_created: { icon: Inbox, color: "#06b6d4", bg: "rgba(6,182,212,0.2)", label: "Inbox-Item" },
};

export function TimelineTab({ timeline, installationId, onRefresh, showToast, isKunde, currentUserId }: TimelineTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["heute", "gestern"]));
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const data = await api.comments.getForInstallation(installationId);
      setComments(data);
    } catch (err) {
      console.error("Fehler beim Laden der Kommentare:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [installationId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Combine timeline entries and comments
  const combinedEntries = useMemo((): CombinedEntry[] => {
    const entries: CombinedEntry[] = [];

    // Add timeline events
    timeline.forEach(entry => {
      entries.push({
        id: `event-${entry.id}`,
        type: "event",
        createdAt: entry.createdAt,
        data: entry,
      });
    });

    // Add comments
    comments.forEach(comment => {
      entries.push({
        id: `comment-${comment.id}`,
        type: "comment",
        createdAt: comment.createdAt,
        data: comment,
      });
    });

    // Sort by date (newest first)
    return entries.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [timeline, comments]);

  // Group entries by day
  const groupedEntries = useMemo(() => {
    const groups: Record<string, CombinedEntry[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    combinedEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt).toDateString();
      let groupKey: string;

      if (entryDate === today) {
        groupKey = "heute";
      } else if (entryDate === yesterday) {
        groupKey = "gestern";
      } else {
        groupKey = new Date(entry.createdAt).toLocaleDateString("de-DE", {
          day: "2-digit", month: "2-digit", year: "numeric"
        });
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(entry);
    });

    return groups;
  }, [combinedEntries]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  // Add comment (not note - comments are stored separately)
  const handleAddComment = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const created = await api.comments.add(installationId, newNote.trim());
      setComments(prev => [created, ...prev]);
      showToast("Kommentar hinzugefuegt", "success");
      setNewNote("");
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setAddingNote(false);
    }
  };

  // Edit comment
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editText.trim()) return;

    try {
      await api.comments.update(installationId, editingCommentId, editText.trim());
      setComments(prev => prev.map(c =>
        c.id === editingCommentId ? { ...c, text: editText.trim() } : c
      ));
      setEditingCommentId(null);
      showToast("Kommentar aktualisiert", "success");
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId);
    try {
      await api.comments.delete(installationId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast("Kommentar geloescht", "success");
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAddComment();
    }
  };

  const getEventConfig = (eventType: string) => {
    return EVENT_CONFIG[eventType] || EVENT_CONFIG.note_added;
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

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "gerade eben";
    if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return "gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className="dp-timeline">
      {/* Add Comment Form */}
      <div className="dp-timeline-add">
        <div className="dp-timeline-add__input">
          <MessageSquare size={18} />
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kommentar hinzufuegen... (Strg+Enter zum Senden)"
            rows={2}
          />
        </div>
        <div className="dp-timeline-add__footer">
          <span className="dp-timeline-add__hint">Strg+Enter zum Senden</span>
          <button
            className="dp-btn dp-btn--primary dp-btn--sm"
            onClick={handleAddComment}
            disabled={addingNote || !newNote.trim()}
          >
            {addingNote ? <Loader2 size={14} className="dp-spin" /> : <Send size={14} />}
            Senden
          </button>
        </div>
      </div>

      {/* Loading indicator for comments */}
      {loadingComments && (
        <div className="dp-timeline-loading">
          <Loader2 size={18} className="dp-spin" />
          <span>Lade Kommentare...</span>
        </div>
      )}

      {/* Timeline Groups */}
      <div className="dp-timeline-groups">
        {Object.entries(groupedEntries).map(([group, entries]) => {
          const isExpanded = expandedGroups.has(group);

          return (
            <div key={group} className="dp-timeline-group">
              <button
                className="dp-timeline-group__header"
                onClick={() => toggleGroup(group)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="dp-timeline-group__label">
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </span>
                <span className="dp-timeline-group__count">{entries.length}</span>
              </button>

              {isExpanded && (
                <div className="dp-timeline-group__entries">
                  {entries.map(entry => {
                    // Render comment
                    if (entry.type === "comment") {
                      const comment = entry.data as Comment;
                      const isOwn = currentUserId === comment.authorId;
                      const isEditing = editingCommentId === comment.id;
                      const isDeleting = deletingCommentId === comment.id;

                      return (
                        <div key={entry.id} className={`dp-timeline-entry dp-timeline-entry--comment ${isOwn ? 'dp-timeline-entry--own' : ''}`}>
                          <div className="dp-timeline-entry__avatar">
                            {getInitials(comment.authorName)}
                          </div>

                          <div className="dp-timeline-entry__content">
                            <div className="dp-timeline-entry__header">
                              <span className="dp-timeline-entry__time">
                                {new Date(comment.createdAt).toLocaleTimeString("de-DE", {
                                  hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                              <span className="dp-timeline-entry__author-name">
                                {comment.authorName}
                                {isOwn && <span className="dp-timeline-entry__own-badge">Du</span>}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="dp-timeline-entry__edit">
                                <textarea
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                                <div className="dp-timeline-entry__edit-actions">
                                  <button className="dp-btn dp-btn--sm dp-btn--primary" onClick={handleSaveEdit}>
                                    <Check size={12} /> Speichern
                                  </button>
                                  <button className="dp-btn dp-btn--sm dp-btn--ghost" onClick={handleCancelEdit}>
                                    <X size={12} /> Abbrechen
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="dp-timeline-entry__body dp-timeline-entry__body--comment">
                                {comment.text}
                              </div>
                            )}

                            {isOwn && !isEditing && (
                              <div className="dp-timeline-entry__actions">
                                <button
                                  className="dp-timeline-action"
                                  onClick={() => handleStartEdit(comment)}
                                  title="Bearbeiten"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  className="dp-timeline-action dp-timeline-action--delete"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={isDeleting}
                                  title="Loeschen"
                                >
                                  {isDeleting ? <Loader2 size={12} className="dp-spin" /> : <Trash2 size={12} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Render timeline event
                    const event = entry.data as TimelineEntry;
                    const config = getEventConfig(event.eventType);
                    const Icon = config?.icon || Clock;

                    return (
                      <div key={entry.id} className="dp-timeline-entry dp-timeline-entry--event">
                        <div
                          className="dp-timeline-entry__icon"
                          style={{ background: config?.bg || 'rgba(100,116,139,0.15)', color: config?.color || '#64748b' }}
                        >
                          <Icon size={14} />
                        </div>

                        <div className="dp-timeline-entry__content">
                          <div className="dp-timeline-entry__header">
                            <span className="dp-timeline-entry__time">
                              {new Date(event.createdAt).toLocaleTimeString("de-DE", {
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                            <span className="dp-timeline-entry__type">{config.label}</span>
                            {event.isAutomatic && (
                              <span className="dp-timeline-entry__auto">Automatisch</span>
                            )}
                          </div>

                          <div className="dp-timeline-entry__body">
                            <strong>{event.title}</strong>
                            {event.description && <p>{event.description}</p>}

                            {/* Show metadata if available */}
                            {event.metadata && event.metadata.oldStatus && event.metadata.newStatus && (
                              <div className="dp-timeline-entry__status-change">
                                <span className="dp-timeline-entry__old-status">{event.metadata.oldStatus}</span>
                                <span>→</span>
                                <span className="dp-timeline-entry__new-status">{event.metadata.newStatus}</span>
                              </div>
                            )}
                          </div>

                          <div className="dp-timeline-entry__footer">
                            <span className="dp-timeline-entry__author">
                              <User size={12} />
                              {event.userName || "System"}
                            </span>

                            <div className="dp-timeline-entry__actions">
                              {event.eventType === "document_uploaded" && event.metadata?.documentId && (
                                <button className="dp-timeline-action">
                                  <Eye size={12} /> Ansehen
                                </button>
                              )}
                              {(event.eventType === "email_sent" || event.eventType === "email_received") && (
                                <button className="dp-timeline-action">
                                  <Eye size={12} /> Ansehen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {combinedEntries.length === 0 && !loadingComments && (
          <div className="dp-timeline-empty">
            <Clock size={48} />
            <p>Noch keine Aktivitaeten</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineTab;
