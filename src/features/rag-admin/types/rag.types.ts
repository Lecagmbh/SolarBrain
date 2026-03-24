/**
 * RAG Admin Dashboard - TypeScript Types
 */

export interface RagStatus {
  available: boolean;
  pgvectorVersion?: string;
  totalEmbeddings: number;
  embeddingsByCategory: Record<string, number>;
  lastIndexingJobs: IndexingJob[];
  cacheStats: { entries: number; totalHits: number };
  enterprise?: {
    sourceTracking: SourceTracking[];
    embeddingVersion: EmbeddingVersion | null;
    performance: PerformanceSummary | null;
  };
}

export interface IndexingJob {
  id: number;
  category: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SourceTracking {
  category: string;
  sourceType: string;
  lastIndexedAt: string;
  lastSourceUpdatedAt: string | null;
  itemCount: number;
  needsReindex: boolean;
}

export interface EmbeddingVersion {
  id: number;
  modelName: string;
  dimensions: number;
  isActive: boolean;
  totalEmbeddings: number;
  createdAt: string;
}

export interface PerformanceSummary {
  period: string;
  totalQueries: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgSimilarity: number;
  cacheHitRate: number;
}

export interface QueryLog {
  queryText: string;
  strategy: string;
  categories: string[];
  resultCount: number;
  topSimilarity: number | null;
  totalLatencyMs: number;
  cachedHit: boolean;
  context?: string;
  abVariant?: string;
}

export interface HealthCheck {
  healthy: boolean;
  alerts: MonitorAlert[];
  metrics: {
    pgvectorAvailable: boolean;
    embeddingCount: number;
    avgLatency24h: number;
    p95Latency24h: number;
    avgSimilarity24h: number;
    queryCount24h: number;
    errorCount24h: number;
    cacheHitRate24h: number;
  };
}

export interface MonitorAlert {
  severity: "info" | "warning" | "critical";
  type: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export interface RagMetric {
  period: string;
  totalQueries: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  cacheHitRate: number;
  avgResultCount: number;
  avgTopSimilarity: number;
  categoryCounts: Record<string, number>;
}

export interface ChangeDetection {
  category: string;
  hasChanges: boolean;
  currentCount?: number;
  indexedCount?: number;
  lastIndexedAt?: string;
}

export interface ABTest {
  id: number;
  name: string;
  description: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  trafficSplitPercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface BackupInfo {
  fileName: string;
  sizeKb: number;
  createdAt: string;
}
