/**
 * RAG Admin API Wrapper
 */

import { apiGet, apiPost, apiDelete } from "../../../api/client";
import type {
  RagStatus,
  QueryLog,
  HealthCheck,
  RagMetric,
  ChangeDetection,
  ABTest,
  BackupInfo,
} from "../types/rag.types";

const BASE = "/api/rag";

export const ragApi = {
  // Status & Health
  getStatus: () => apiGet<RagStatus & { success: boolean }>(`${BASE}/status`),
  getHealth: () => apiGet<HealthCheck & { success: boolean }>(`${BASE}/health`),
  getCategories: () => apiGet<{ success: boolean; categories: Array<{ key: string; value: string }> }>(`${BASE}/categories`),

  // Indexierung
  startIndex: (category?: string, async = true) =>
    apiPost<{ success: boolean; jobId?: string; result?: unknown }>(`${BASE}/index`, { category, async }),
  getJobStatus: (jobId: string) =>
    apiGet<{ success: boolean; status: string; results?: unknown; error?: string }>(`${BASE}/index/${jobId}`),
  startReindex: () =>
    apiPost<{ success: boolean; reindexedCategories: number; results: unknown[] }>(`${BASE}/reindex`, {}),

  // Suche
  testSearch: (query: string, options?: { category?: string; limit?: number; enterprise?: boolean }) =>
    apiPost<{ success: boolean; query: string; mode: string; resultCount: number; totalLatencyMs: number; results: unknown[] }>(
      `${BASE}/search`,
      { query, ...options },
    ),

  // Query Logs & Metrics
  getQueryLogs: (limit = 50) =>
    apiGet<{ success: boolean; count: number; logs: QueryLog[] }>(`${BASE}/query-logs?limit=${limit}`),
  getMetrics: (period: "hourly" | "daily" = "daily", limit = 30) =>
    apiGet<{ success: boolean; metrics: RagMetric[] }>(`${BASE}/metrics?period=${period}&limit=${limit}`),

  // Changes
  getChanges: () =>
    apiGet<{ success: boolean; totalCategories: number; pendingChanges: number; changes: ChangeDetection[] }>(`${BASE}/changes`),

  // Feedback
  getFeedbackStats: (days = 30) =>
    apiGet<{ success: boolean; avgRating: number; totalFeedback: number; ratingDistribution: Record<string, number> }>(
      `${BASE}/feedback/stats?days=${days}`,
    ),

  // Cache
  clearCache: () => apiDelete(`${BASE}/cache`),

  // A/B Tests
  getABTests: () => apiGet<{ success: boolean; tests: ABTest[] }>(`${BASE}/ab-tests`),
  createABTest: (data: { name: string; description?: string; variantA: Record<string, unknown>; variantB: Record<string, unknown>; trafficSplitPercent?: number }) =>
    apiPost<{ success: boolean; testId: number }>(`${BASE}/ab-tests`, data),
  stopABTest: (id: number) =>
    apiPost<{ success: boolean }>(`${BASE}/ab-tests/${id}/stop`, {}),
  evaluateABTest: (id: number) =>
    apiGet<{ success: boolean; testName: string; variantA: unknown; variantB: unknown; winner: string | null }>(`${BASE}/ab-tests/${id}/evaluate`),

  // Backup
  createBackup: () => apiPost<{ success: boolean; path?: string; sizeKb?: number }>(`${BASE}/backup`, {}),
  getBackups: () => apiGet<{ success: boolean; backups: BackupInfo[] }>(`${BASE}/backups`),

  // Versions
  getVersions: () =>
    apiGet<{ success: boolean; versions: Array<{ id: number; modelName: string; dimensions: number; isActive: boolean; totalEmbeddings: number }> }>(`${BASE}/versions`),
};
