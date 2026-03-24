/**
 * Agent Tasks Tab - Filter, List, Logs, Actions
 */

import { useState, useEffect, useCallback } from "react";
import { agentApi } from "../../api/agent.api";
import type { AgentTask, AgentLog } from "../../types/agent.types";

const STATUS_OPTIONS = [
  { value: "", label: "Alle Status" },
  { value: "PENDING", label: "Wartend" },
  { value: "RUNNING", label: "Laufend" },
  { value: "COMPLETED", label: "Abgeschlossen" },
  { value: "FAILED", label: "Fehlgeschlagen" },
  { value: "CANCELLED", label: "Abgebrochen" },
  { value: "WAITING_CONFIRMATION", label: "Warte auf Bestätigung" },
  { value: "WAITING_INPUT", label: "Warte auf Eingabe" },
] as const;

const TYPE_OPTIONS = [
  { value: "", label: "Alle Typen" },
  { value: "email_analyze", label: "email_analyze" },
  { value: "email_respond", label: "email_respond" },
  { value: "nb_submit", label: "nb_submit" },
  { value: "nb_status_check", label: "nb_status_check" },
  { value: "nb_form_fill", label: "nb_form_fill" },
  { value: "nb_portal", label: "nb_portal" },
  { value: "smart_import", label: "smart_import" },
  { value: "data_process", label: "data_process" },
  { value: "report_generate", label: "report_generate" },
  { value: "db_health", label: "db_health" },
  { value: "code_analysis", label: "code_analysis" },
  { value: "duplicate_finder", label: "duplicate_finder" },
  { value: "captcha_workflow", label: "captcha_workflow" },
  { value: "system_admin", label: "system_admin" },
] as const;

const LIMIT_OPTIONS = [10, 25, 50, 100] as const;

export function TasksTab() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState(0);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [taskLogs, setTaskLogs] = useState<Record<number, AgentLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inputDialogTaskId, setInputDialogTaskId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [confirmDialogTaskId, setConfirmDialogTaskId] = useState<number | null>(null);
  const [confirmReason, setConfirmReason] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const res = await agentApi.getTasks({
        status: filterStatus || undefined,
        type: filterType || undefined,
        limit,
        offset,
      });
      setTasks(res.tasks || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Tasks laden fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, limit, offset]);

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [loadTasks]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(loadTasks, 10000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const loadLogs = async (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }
    setExpandedTaskId(taskId);
    if (taskLogs[taskId]) return;

    setLogsLoading(taskId);
    try {
      const res = await agentApi.getTaskLogs(taskId);
      setTaskLogs((prev) => ({ ...prev, [taskId]: res.logs || [] }));
    } catch (err) {
      console.error(`Logs für Task #${taskId} laden fehlgeschlagen:`, err);
    } finally {
      setLogsLoading(null);
    }
  };

  const handleCancel = async (taskId: number) => {
    setActionLoading(taskId);
    setMessage(null);
    try {
      await agentApi.cancelTask(taskId);
      setMessage({ type: "success", text: `Task #${taskId} wurde abgebrochen.` });
      loadTasks();
    } catch (err) {
      setMessage({ type: "error", text: `Task #${taskId} konnte nicht abgebrochen werden.` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (taskId: number, approved: boolean) => {
    setActionLoading(taskId);
    setMessage(null);
    try {
      await agentApi.confirmTask(taskId, approved, confirmReason || undefined);
      setMessage({
        type: "success",
        text: `Task #${taskId} wurde ${approved ? "bestätigt" : "abgelehnt"}.`,
      });
      setConfirmDialogTaskId(null);
      setConfirmReason("");
      loadTasks();
    } catch (err) {
      setMessage({ type: "error", text: `Bestätigung für Task #${taskId} fehlgeschlagen.` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProvideInput = async (taskId: number) => {
    if (!inputValue.trim()) return;
    setActionLoading(taskId);
    setMessage(null);
    try {
      let inputData: Record<string, unknown>;
      try {
        inputData = JSON.parse(inputValue);
      } catch {
        inputData = { value: inputValue };
      }
      await agentApi.provideInput(taskId, inputData);
      setMessage({ type: "success", text: `Input für Task #${taskId} gesendet.` });
      setInputDialogTaskId(null);
      setInputValue("");
      loadTasks();
    } catch (err) {
      setMessage({ type: "error", text: `Input für Task #${taskId} konnte nicht gesendet werden.` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = () => {
    setOffset(0);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (loading && tasks.length === 0) {
    return (
      <div className="agent-tab-loading">
        <div className="agent-spinner" />
      </div>
    );
  }

  return (
    <div className="agent-tab-content">
      {/* Message */}
      {message && (
        <div className={`agent-message agent-message-${message.type}`}>
          {message.text}
          <button className="agent-message-close" onClick={() => setMessage(null)}>
            x
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="agent-filter-bar">
        <select
          className="agent-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            handleFilterChange();
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="agent-select"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            handleFilterChange();
          }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="agent-select"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setOffset(0);
          }}
        >
          {LIMIT_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l} Einträge
            </option>
          ))}
        </select>

        <button className="agent-btn-ghost" onClick={loadTasks}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56M21 3v5h-5" />
          </svg>
          Aktualisieren
        </button>

        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#71717a" }}>
          {total} Task{total !== 1 ? "s" : ""} gesamt
        </span>
      </div>

      {/* Task List */}
      <div className="agent-task-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`agent-task-card ${expandedTaskId === task.id ? "expanded" : ""}`}
          >
            {/* Header - clickable to expand */}
            <div className="agent-task-header" onClick={() => loadLogs(task.id)}>
              <div className="agent-task-header-left">
                <span className="agent-task-id">#{task.id}</span>
                <span className="agent-task-type-badge">{task.type}</span>
                <span className={`agent-task-status-badge agent-task-status-${task.status}`}>
                  {task.status}
                </span>
                <span className="agent-task-priority">P{task.priority}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#71717a"
                strokeWidth="2"
                style={{
                  transition: "transform 0.2s",
                  transform: expandedTaskId === task.id ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Meta */}
            <div className="agent-task-meta">
              <span className="agent-task-meta-item">
                Erstellt: {new Date(task.createdAt).toLocaleString("de-DE")}
              </span>
              {task.startedAt && (
                <span className="agent-task-meta-item">
                  Gestartet: {new Date(task.startedAt).toLocaleString("de-DE")}
                </span>
              )}
              {task.startedAt && task.completedAt && (
                <span className="agent-task-meta-item">
                  Dauer: {formatDuration(task.startedAt, task.completedAt)}
                </span>
              )}
              {task.startedAt && !task.completedAt && task.status === "RUNNING" && (
                <span className="agent-task-meta-item" style={{ color: "#60a5fa" }}>
                  Läuft seit: {formatDuration(task.startedAt, new Date().toISOString())}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {task.status === "RUNNING" && task.progress != null && (
              <div className="agent-progress-wrap">
                <div className="agent-progress-bar">
                  <div
                    className="agent-progress-fill"
                    style={{ width: `${Math.min(task.progress, 100)}%` }}
                  />
                </div>
                <div className="agent-progress-text">{task.progress}%</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="agent-task-actions">
              {(task.status === "RUNNING" || task.status === "PENDING") && (
                <button
                  className="agent-btn agent-btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel(task.id);
                  }}
                  disabled={actionLoading === task.id}
                >
                  {actionLoading === task.id ? (
                    <span className="agent-spinner-small" />
                  ) : null}
                  Abbrechen
                </button>
              )}

              {task.status === "WAITING_CONFIRMATION" && (
                <>
                  {confirmDialogTaskId === task.id ? (
                    <div className="agent-confirm-inline" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="agent-input"
                        placeholder="Grund (optional)"
                        value={confirmReason}
                        onChange={(e) => setConfirmReason(e.target.value)}
                        style={{ maxWidth: "200px" }}
                      />
                      <button
                        className="agent-btn agent-btn-success"
                        onClick={() => handleConfirm(task.id, true)}
                        disabled={actionLoading === task.id}
                      >
                        Ja
                      </button>
                      <button
                        className="agent-btn agent-btn-danger"
                        onClick={() => handleConfirm(task.id, false)}
                        disabled={actionLoading === task.id}
                      >
                        Nein
                      </button>
                      <button
                        className="agent-btn agent-btn-ghost"
                        onClick={() => {
                          setConfirmDialogTaskId(null);
                          setConfirmReason("");
                        }}
                        style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="agent-btn agent-btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialogTaskId(task.id);
                        }}
                      >
                        Bestätigen
                      </button>
                      <button
                        className="agent-btn agent-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(task.id, false);
                        }}
                        disabled={actionLoading === task.id}
                      >
                        Ablehnen
                      </button>
                    </>
                  )}
                </>
              )}

              {task.status === "WAITING_INPUT" && (
                <>
                  {inputDialogTaskId === task.id ? (
                    <div className="agent-confirm-inline" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="agent-input"
                        placeholder="Eingabe (Text oder JSON)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleProvideInput(task.id);
                        }}
                      />
                      <button
                        className="agent-btn agent-btn-purple"
                        onClick={() => handleProvideInput(task.id)}
                        disabled={actionLoading === task.id || !inputValue.trim()}
                      >
                        Senden
                      </button>
                      <button
                        className="agent-btn agent-btn-ghost"
                        onClick={() => {
                          setInputDialogTaskId(null);
                          setInputValue("");
                        }}
                        style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      className="agent-btn agent-btn-purple"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputDialogTaskId(task.id);
                      }}
                    >
                      Input senden
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Error Display */}
            {task.error && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "0.75rem",
                  color: "#f87171",
                }}
              >
                {task.error}
              </div>
            )}

            {/* Expandable Log Viewer */}
            {expandedTaskId === task.id && (
              <div className="agent-log-viewer">
                <div className="agent-log-viewer-header">
                  <span className="agent-log-viewer-title">
                    Logs ({taskLogs[task.id]?.length || 0})
                  </span>
                  <button
                    className="agent-btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Force reload logs
                      setTaskLogs((prev) => {
                        const next = { ...prev };
                        delete next[task.id];
                        return next;
                      });
                      setLogsLoading(task.id);
                      agentApi.getTaskLogs(task.id).then((res) => {
                        setTaskLogs((prev) => ({ ...prev, [task.id]: res.logs || [] }));
                        setLogsLoading(null);
                      }).catch(() => setLogsLoading(null));
                    }}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                  >
                    Neu laden
                  </button>
                </div>

                {logsLoading === task.id ? (
                  <div className="agent-tab-loading" style={{ padding: "1rem 0" }}>
                    <div className="agent-spinner-small" />
                  </div>
                ) : taskLogs[task.id] && taskLogs[task.id].length > 0 ? (
                  <div className="agent-log-list">
                    {taskLogs[task.id].map((log) => (
                      <div key={log.id} className="agent-log-entry">
                        <span className="agent-log-time">
                          {new Date(log.createdAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        <span className={`agent-log-level agent-log-level-${log.level}`}>
                          {log.level}
                        </span>
                        <span className="agent-log-message">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="agent-empty" style={{ padding: "1rem" }}>
                    Keine Logs vorhanden.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && !loading && (
        <div className="agent-empty">
          Keine Tasks gefunden.
          {(filterStatus || filterType) && " Versuche andere Filter."}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="agent-pagination">
          <span>
            Seite {currentPage} von {totalPages} ({total} Tasks)
          </span>
          <div className="agent-pagination-buttons">
            <button
              className="agent-btn-ghost"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Zurück
            </button>
            <button
              className="agent-btn-ghost"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}
