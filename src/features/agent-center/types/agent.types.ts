export interface AgentTask {
  id: number;
  type: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "WAITING_CONFIRMATION" | "WAITING_INPUT";
  priority: number;
  input: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  progress?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  userId?: number;
}

export interface AgentLog {
  id: number;
  taskId: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface AgentStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  avgDurationMs: number;
  successRate: number;
  tasksByType: Record<string, number>;
  tasksByStatus: Record<string, number>;
  recentTasks: AgentTask[];
}
