import { apiGet, apiPost } from "../../../api/client";
import type { AgentTask, AgentLog, AgentStats } from "../types/agent.types";

const BASE = "/api/agent";

// Backend stats have different field names
interface BackendStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  todayCount: number;
  successRate: number;
  avgDurationSeconds: number;
}

export const agentApi = {
  getStats: async (): Promise<AgentStats> => {
    const res = await apiGet<BackendStats>(`${BASE}/stats`);
    // Also fetch recent tasks for the dashboard
    let recentTasks: AgentTask[] = [];
    let tasksByType: Record<string, number> = {};
    let tasksByStatus: Record<string, number> = {};
    let pending = 0;
    let cancelled = 0;
    try {
      const tasksRes = await apiGet<{ tasks: AgentTask[]; total: number }>(`${BASE}/tasks?limit=50`);
      recentTasks = tasksRes.tasks || [];
      // Calculate tasksByType and tasksByStatus from recent tasks
      for (const t of recentTasks) {
        tasksByType[t.type] = (tasksByType[t.type] || 0) + 1;
        tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
      }
      pending = recentTasks.filter(t => t.status === "PENDING").length;
      cancelled = recentTasks.filter(t => t.status === "CANCELLED").length;
    } catch {
      // tasks endpoint might not exist yet
    }
    return {
      totalTasks: res.total || 0,
      pendingTasks: pending,
      runningTasks: res.running || 0,
      completedTasks: res.completed || 0,
      failedTasks: res.failed || 0,
      cancelledTasks: cancelled,
      avgDurationMs: (res.avgDurationSeconds || 0) * 1000,
      successRate: res.successRate || 0,
      tasksByType,
      tasksByStatus,
      recentTasks: recentTasks.slice(0, 10),
    };
  },

  getTasks: (options?: { status?: string; type?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.type) params.set("type", options.type);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    return apiGet<{ tasks: AgentTask[]; total: number }>(`${BASE}/tasks?${params.toString()}`);
  },

  getTask: (id: number) => apiGet<AgentTask>(`${BASE}/task/${id}`),

  getTaskLogs: (id: number, limit = 100) =>
    apiGet<{ logs: AgentLog[] }>(`${BASE}/task/${id}/logs?limit=${limit}`),

  createTask: (type: string, input: Record<string, unknown>) =>
    apiPost<{ success: boolean; taskId: number }>(`${BASE}/task`, { type, input }),

  cancelTask: (id: number) =>
    apiPost<{ success: boolean }>(`${BASE}/task/${id}/cancel`, {}),

  confirmTask: (id: number, approved: boolean, reason?: string) =>
    apiPost<{ success: boolean }>(`${BASE}/task/${id}/confirm`, { approved, reason }),

  provideInput: (id: number, input: Record<string, unknown>) =>
    apiPost<{ success: boolean }>(`${BASE}/task/${id}/input`, input),
};
