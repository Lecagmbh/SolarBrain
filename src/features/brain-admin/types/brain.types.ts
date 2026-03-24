export interface BrainStats {
  knowledge: { total: number; byCategory: Record<string, number> };
  patterns: { total: number; active: number };
  rules: { total: number; active: number };
  events: { total: number; last24h: number };
  feedback: { total: number; avgRating: number; helpfulPercent: number };
}

export interface BrainKnowledge {
  id: number;
  category: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrainPattern {
  id: number;
  name: string;
  description: string;
  category: string;
  status: "active" | "inactive";
  confidence: number;
  occurrences: number;
  createdAt: string;
}

export interface BrainRule {
  id: number;
  name: string;
  description: string;
  condition: string;
  action: string;
  status: "active" | "inactive";
  priority: number;
  triggerCount: number;
  createdAt: string;
}

export interface BrainEvent {
  id: number;
  eventType: string;
  category: string;
  entityType?: string;
  entityId?: string;
  userId?: number;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface BrainInsight {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  data?: Record<string, unknown>;
}

export type BrainActionType = "summarize" | "analyze" | "suggest" | "draft_reply" | "classify" | "extract";
