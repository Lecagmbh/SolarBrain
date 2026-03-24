/**
 * TASK MANAGER - Create, Edit, Complete Tasks
 */

import { useState, useEffect } from "react";
import {
  X, CheckSquare, Plus, Save, Loader2, Calendar, User,
  Check, Square, Trash2, Edit3,
} from "lucide-react";
import { api } from "../../services/api";
import type { Task, TeamMember } from "../../types";

// ═══════════════════════════════════════════════════════════════════════════
// TASK CREATOR MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface TaskCreatorProps {
  installationId?: number;
  task?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function TaskCreator({ installationId, task, onClose, onSuccess, showToast }: TaskCreatorProps) {
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    assignedToId: string;
    dueDate: string;
    priority: "critical" | "high" | "medium" | "low";
  }>({
    title: task?.title || "",
    description: task?.description || "",
    assignedToId: task?.assignedToId?.toString() || "",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    priority: task?.priority || "medium",
  });

  useEffect(() => {
    setLoadingTeam(true);
    api.team.getMembers()
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]))
      .finally(() => setLoadingTeam(false));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("Bitte Titel angeben", "error");
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: form.title,
        description: form.description || undefined,
        assignedToId: form.assignedToId ? parseInt(form.assignedToId) : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        priority: form.priority,
        installationId,
      };

      if (task?.id) {
        await api.tasks.update(task.id, data);
        showToast("Aufgabe aktualisiert", "success");
      } else {
        await api.tasks.create(installationId!, data);
        showToast("Aufgabe erstellt", "success");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || "Fehler beim Speichern", "error");
    } finally {
      setSaving(false);
    }
  };

  const priorities = [
    { value: "critical", label: "Kritisch", color: "#ef4444", icon: "🔴" },
    { value: "high", label: "Hoch", color: "#f59e0b", icon: "🟠" },
    { value: "medium", label: "Mittel", color: "#3b82f6", icon: "🔵" },
    { value: "low", label: "Niedrig", color: "#64748b", icon: "⚪" },
  ];

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal__header">
          <div className="tm-modal__title">
            <CheckSquare size={20} />
            <span>{task ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</span>
          </div>
          <button className="tm-btn tm-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="tm-modal__body">
          <div className="tm-form">
            <div className="tm-field">
              <label>Titel *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Was muss erledigt werden?"
                autoFocus
              />
            </div>

            <div className="tm-field">
              <label>Beschreibung</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Weitere Details..."
                rows={4}
              />
            </div>

            <div className="tm-form__row">
              <div className="tm-field">
                <label>Zuweisen an</label>
                <select
                  value={form.assignedToId}
                  onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                  disabled={loadingTeam}
                >
                  <option value="">Nicht zugewiesen</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="tm-field">
                <label>Fällig am</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="tm-field">
              <label>Priorität</label>
              <div className="tm-priority-options">
                {priorities.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`tm-priority-option ${form.priority === p.value ? "tm-priority-option--active" : ""}`}
                    style={{ "--priority-color": p.color } as React.CSSProperties}
                    onClick={() => setForm({ ...form, priority: p.value as "critical" | "high" | "medium" | "low" })}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="tm-modal__footer">
          <button className="tm-btn" onClick={onClose}>Abbrechen</button>
          <button className="tm-btn tm-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {task ? "Aktualisieren" : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface TaskListProps {
  tasks: Task[];
  installationId: number;
  onRefresh: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}

export function TaskList({ tasks, installationId, onRefresh, showToast }: TaskListProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleComplete = async (taskId: number) => {
    try {
      await api.tasks.complete(taskId);
      showToast("Aufgabe erledigt", "success");
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    try {
      await api.tasks.delete(taskId);
      showToast("Aufgabe gelöscht", "success");
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return "🔴";
      case "high": return "🟠";
      case "medium": return "🔵";
      default: return "⚪";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
  };

  const openTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="tm-tasks">
      <div className="tm-tasks__header">
        <h3>Aufgaben</h3>
        <button className="tm-btn tm-btn--primary tm-btn--sm" onClick={() => setShowCreator(true)}>
          <Plus size={14} /> Neue Aufgabe
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="tm-empty">
          <CheckSquare size={48} />
          <p>Keine Aufgaben vorhanden</p>
          <button className="tm-btn tm-btn--primary" onClick={() => setShowCreator(true)}>
            <Plus size={16} /> Erste Aufgabe erstellen
          </button>
        </div>
      ) : (
        <>
          {/* Open Tasks */}
          {openTasks.length > 0 && (
            <div className="tm-task-list">
              {openTasks.map(task => (
                <div
                  key={task.id}
                  className={`tm-task-item ${isOverdue(task) ? "tm-task-item--overdue" : ""}`}
                >
                  <button
                    className="tm-task-item__check"
                    onClick={() => handleComplete(task.id)}
                    title="Als erledigt markieren"
                  >
                    <Square size={18} />
                  </button>

                  <div className="tm-task-item__content" onClick={() => setEditingTask(task)}>
                    <div className="tm-task-item__header">
                      <span className="tm-task-item__priority">{getPriorityIcon(task.priority)}</span>
                      <span className="tm-task-item__title">{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="tm-task-item__desc">{task.description}</p>
                    )}
                    <div className="tm-task-item__meta">
                      {task.assignedToName && (
                        <span><User size={12} /> {task.assignedToName}</span>
                      )}
                      {task.dueDate && (
                        <span className={isOverdue(task) ? "tm-overdue" : ""}>
                          <Calendar size={12} /> {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="tm-task-item__actions">
                    <button onClick={() => setEditingTask(task)} title="Bearbeiten">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(task.id)} title="Löschen">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="tm-completed">
              <div className="tm-completed__header">
                <Check size={14} />
                <span>{completedTasks.length} erledigt</span>
              </div>
              <div className="tm-task-list tm-task-list--completed">
                {completedTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="tm-task-item tm-task-item--done">
                    <div className="tm-task-item__check tm-task-item__check--done">
                      <Check size={18} />
                    </div>
                    <div className="tm-task-item__content">
                      <span className="tm-task-item__title">{task.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Creator/Editor Modal */}
      {(showCreator || editingTask) && (
        <TaskCreator
          installationId={installationId}
          task={editingTask}
          onClose={() => { setShowCreator(false); setEditingTask(null); }}
          onSuccess={() => { setShowCreator(false); setEditingTask(null); onRefresh(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const TaskManagerStyles = `
.tm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}

.tm-modal {
  width: 100%;
  max-width: 500px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.tm-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tm-modal__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.tm-modal__body { padding: 1.25rem; }

.tm-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Buttons */
.tm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tm-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
.tm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.tm-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: transparent;
  color: #fff;
}
.tm-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg, #60a5fa, #3b82f6); }
.tm-btn--sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
.tm-btn--icon { width: 36px; height: 36px; padding: 0; }

/* Form */
.tm-form { display: flex; flex-direction: column; gap: 1rem; }
.tm-form__row { display: flex; gap: 1rem; }
.tm-form__row .tm-field { flex: 1; }
.tm-field { display: flex; flex-direction: column; gap: 0.375rem; }
.tm-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
}
.tm-field input,
.tm-field select,
.tm-field textarea {
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
}
.tm-field input:focus,
.tm-field select:focus,
.tm-field textarea:focus {
  outline: none;
  border-color: #3b82f6;
}
.tm-field textarea { resize: vertical; }

/* Priority Options */
.tm-priority-options {
  display: flex;
  gap: 0.5rem;
}
.tm-priority-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tm-priority-option:hover {
  background: rgba(255, 255, 255, 0.05);
}
.tm-priority-option--active {
  background: color-mix(in srgb, var(--priority-color) 15%, transparent);
  border-color: var(--priority-color);
  color: var(--priority-color);
}

/* Task List */
.tm-tasks__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.tm-tasks__header h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.tm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #64748b;
  text-align: center;
}
.tm-empty p { margin: 0; }

.tm-task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tm-task-list--completed { opacity: 0.6; }

.tm-task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s;
}
.tm-task-item:hover {
  background: rgba(255, 255, 255, 0.04);
}
.tm-task-item--overdue {
  border-color: rgba(239, 68, 68, 0.3);
}
.tm-task-item--done {
  opacity: 0.5;
}
.tm-task-item--done .tm-task-item__title {
  text-decoration: line-through;
}

.tm-task-item__check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}
.tm-task-item__check:hover { color: #22c55e; }
.tm-task-item__check--done { color: #22c55e; cursor: default; }

.tm-task-item__content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.tm-task-item__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tm-task-item__priority { font-size: 0.875rem; }
.tm-task-item__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}
.tm-task-item__desc {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tm-task-item__meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  color: #64748b;
}
.tm-task-item__meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.tm-overdue { color: #ef4444 !important; }

.tm-task-item__actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.tm-task-item:hover .tm-task-item__actions { opacity: 1; }
.tm-task-item__actions button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 6px;
}
.tm-task-item__actions button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Completed Section */
.tm-completed {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.tm-completed__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
