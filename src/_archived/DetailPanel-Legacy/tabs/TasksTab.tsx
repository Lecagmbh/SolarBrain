/**
 * TASKS TAB - Mit Vorlagen-Integration
 */

import { useState, useMemo } from "react";
import {
  CheckSquare, Square, Plus, Trash2, Loader2, X, Clock,
  AlertTriangle, ChevronDown, ChevronRight,
  Calendar, Flag, CheckCircle, Circle,
  Copy,
} from "lucide-react";
import { api } from "../../../services/api";
import type { Task, Priority } from "../../../types";
import { TaskTemplatesModal, type TaskTemplate } from "../components/TaskTemplates";

interface TasksTabProps {
  tasks: Task[];
  installationId: number;
  onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  isKunde?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: typeof Flag }> = {
  critical: { label: "Kritisch", color: "#ef4444", icon: AlertTriangle },
  high: { label: "Hoch", color: "#f59e0b", icon: Flag },
  medium: { label: "Mittel", color: "#3b82f6", icon: Flag },
  low: { label: "Niedrig", color: "#94a3b8", icon: Flag },
};

export function TasksTab({ tasks, installationId, onRefresh, showToast, isKunde }: TasksTabProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<number | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    dueDate: "",
  });

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const open = tasks.filter(t => t.status === "open" || t.status === "in_progress");
    const done = tasks.filter(t => t.status === "completed" || t.status === "cancelled");
    
    // Sort open by priority then due date
    const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    open.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return { open, done };
  }, [tasks]);

  const toggleTaskExpand = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Handle template selection
  const handleSelectTemplate = (template: TaskTemplate) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.defaultDueDays);

    setNewTask({
      title: template.name,
      description: template.description,
      priority: template.priority as Priority,
      dueDate: dueDate.toISOString().split("T")[0],
    });
    setShowTemplates(false);
    setShowAddTask(true);
  };

  // Create task
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      showToast("Titel erforderlich", "error");
      return;
    }

    setLoading(-1);
    try {
      await api.tasks.create(installationId, {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        status: "open",
      });
      showToast("Aufgabe erstellt", "success");
      setShowAddTask(false);
      resetNewTask();
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setLoading(null);
    }
  };

  const resetNewTask = () => {
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
  };

  // Toggle task completion
  const handleToggleComplete = async (task: Task) => {
    setLoading(task.id);
    try {
      if (task.status === "completed") {
        await api.tasks.update(task.id, { status: "open" });
        showToast("Aufgabe wieder geöffnet", "success");
      } else {
        await api.tasks.complete(task.id);
        showToast("Aufgabe erledigt", "success");
      }
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setLoading(null);
    }
  };

  // Delete task
  const handleDelete = async (taskId: number) => {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    
    setLoading(taskId);
    try {
      await api.tasks.delete(taskId);
      showToast("Aufgabe gelöscht", "success");
      onRefresh();
    } catch (e: any) {
      showToast(e.message || "Fehler", "error");
    } finally {
      setLoading(null);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  const isCompleted = (task: Task) => task.status === "completed" || task.status === "cancelled";

  return (
    <div className="dp-tasks">
      {/* Header */}
      {!isKunde && (
        <div className="dp-tasks-header">
          <div className="dp-tasks-stats">
            <span className="dp-tasks-stat">
              <Circle size={14} /> {groupedTasks.open.length} offen
            </span>
            <span className="dp-tasks-stat dp-tasks-stat--done">
              <CheckCircle size={14} /> {groupedTasks.done.length} erledigt
            </span>
          </div>
          <div className="dp-tasks-actions">
            <button 
              className="dp-btn dp-btn--sm"
              onClick={() => setShowTemplates(true)}
            >
              <Copy size={14} /> Vorlage
            </button>
            <button 
              className="dp-btn dp-btn--primary dp-btn--sm"
              onClick={() => setShowAddTask(true)}
            >
              <Plus size={14} /> Neue Aufgabe
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="dp-tasks-list">
        {/* Open Tasks */}
        {groupedTasks.open.length > 0 && (
          <div className="dp-tasks-section">
            <h4 className="dp-tasks-section__title">
              <Circle size={14} /> Offene Aufgaben
            </h4>
            {groupedTasks.open.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                expanded={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpand(task.id)}
                onToggleComplete={() => handleToggleComplete(task)}
                onDelete={() => handleDelete(task.id)}
                loading={loading === task.id}
                isKunde={isKunde}
                isOverdue={isOverdue(task.dueDate)}
                isDueToday={isDueToday(task.dueDate)}
                isCompleted={isCompleted(task)}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {groupedTasks.done.length > 0 && (
          <div className="dp-tasks-section dp-tasks-section--done">
            <h4 className="dp-tasks-section__title">
              <CheckCircle size={14} /> Erledigte Aufgaben
            </h4>
            {groupedTasks.done.slice(0, 5).map(task => (
              <TaskItem
                key={task.id}
                task={task}
                expanded={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpand(task.id)}
                onToggleComplete={() => handleToggleComplete(task)}
                onDelete={() => handleDelete(task.id)}
                loading={loading === task.id}
                isKunde={isKunde}
                isCompleted={isCompleted(task)}
              />
            ))}
            {groupedTasks.done.length > 5 && (
              <span className="dp-tasks-more">
                +{groupedTasks.done.length - 5} weitere erledigte Aufgaben
              </span>
            )}
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="dp-tasks-empty">
            <CheckSquare size={48} />
            <p>Keine Aufgaben</p>
            {!isKunde && (
              <div className="dp-tasks-empty__actions">
                <button className="dp-btn" onClick={() => setShowTemplates(true)}>
                  <Copy size={14} /> Aus Vorlage
                </button>
                <button className="dp-btn dp-btn--primary" onClick={() => setShowAddTask(true)}>
                  <Plus size={14} /> Neue Aufgabe
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <TaskTemplatesModal
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="dp-modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="dp-modal dp-modal--md" onClick={e => e.stopPropagation()}>
            <div className="dp-modal__header">
              <h3>Neue Aufgabe</h3>
              <button className="dp-btn dp-btn--icon" onClick={() => { setShowAddTask(false); resetNewTask(); }}>
                <X size={18} />
              </button>
            </div>

            <div className="dp-modal__body">
              <div className="dp-task-form">
                <div className="dp-task-form__field">
                  <label>Titel *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Aufgabe beschreiben..."
                    autoFocus
                  />
                </div>

                <div className="dp-task-form__field">
                  <label>Beschreibung</label>
                  <textarea
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Weitere Details..."
                    rows={3}
                  />
                </div>

                <div className="dp-task-form__row">
                  <div className="dp-task-form__field">
                    <label>Priorität</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="critical">Kritisch</option>
                    </select>
                  </div>

                  <div className="dp-task-form__field">
                    <label>Fällig am</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="dp-modal__footer">
              <button className="dp-btn" onClick={() => { setShowAddTask(false); resetNewTask(); }}>
                Abbrechen
              </button>
              <button 
                className="dp-btn dp-btn--primary"
                onClick={handleCreateTask}
                disabled={loading === -1 || !newTask.title.trim()}
              >
                {loading === -1 ? <Loader2 size={14} className="dp-spin" /> : <Plus size={14} />}
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  expanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  loading,
  isKunde,
  isOverdue,
  isDueToday,
  isCompleted,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  loading: boolean;
  isKunde?: boolean;
  isOverdue?: boolean;
  isDueToday?: boolean;
  isCompleted?: boolean;
}) {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const PriorityIcon = priorityConfig?.icon || Flag;

  return (
    <div className={`dp-task-item ${isCompleted ? "dp-task-item--done" : ""} ${isOverdue ? "dp-task-item--overdue" : ""}`}>
      <div className="dp-task-item__main">
        <button 
          className="dp-task-item__checkbox"
          onClick={onToggleComplete}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="dp-spin" />
          ) : isCompleted ? (
            <CheckSquare size={18} />
          ) : (
            <Square size={18} />
          )}
        </button>

        <div className="dp-task-item__content" onClick={task.description ? onToggleExpand : undefined}>
          <div className="dp-task-item__header">
            <span className="dp-task-item__title">{task.title}</span>
            <div className="dp-task-item__meta">
              {task.priority && task.priority !== "medium" && (
                <span 
                  className="dp-task-item__priority"
                  style={{ color: priorityConfig.color }}
                  title={priorityConfig.label}
                >
                  <PriorityIcon size={12} />
                </span>
              )}
              {task.dueDate && (
                <span className={`dp-task-item__due ${isOverdue ? "dp-task-item__due--overdue" : ""} ${isDueToday ? "dp-task-item__due--today" : ""}`}>
                  <Calendar size={12} />
                  {isDueToday ? "Heute" : new Date(task.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {task.description && !expanded && (
            <p className="dp-task-item__description">{task.description.substring(0, 100)}...</p>
          )}
        </div>

        {task.description && (
          <button className="dp-task-item__expand" onClick={onToggleExpand}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {!isKunde && (
          <button className="dp-task-item__delete" onClick={onDelete} disabled={loading}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Expanded Description */}
      {expanded && task.description && (
        <div className="dp-task-item__expanded">
          <p>{task.description}</p>
        </div>
      )}
    </div>
  );
}

export default TasksTab;
