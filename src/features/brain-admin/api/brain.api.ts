import { apiGet, apiPost } from "../../../api/client";
import type { BrainStats, BrainKnowledge, BrainPattern, BrainRule, BrainEvent, BrainInsight, BrainActionType } from "../types/brain.types";

const BASE = "/api/brain";

// Backend wraps all responses in { success, data }
interface ApiRes<T> { success: boolean; data: T }

// Backend stats use flat field names
interface BackendStats {
  totalKnowledge: number;
  totalPatterns: number;
  totalRules: number;
  totalEvents: number;
  eventsLast24h: number;
  eventsLast7d: number;
  topCategories: Array<{ category: string; count: number }>;
  activePatternsCount: number;
  activeRulesCount: number;
}

interface BackendInsight {
  title: string;
  description: string;
  category: string;
  priority: string;
  actionable: boolean;
}

function mapSeverity(priority: string): "info" | "warning" | "critical" {
  if (priority === "critical" || priority === "high") return "critical";
  if (priority === "medium") return "warning";
  return "info";
}

export const brainApi = {
  getStats: async (): Promise<BrainStats> => {
    const res = await apiGet<ApiRes<BackendStats>>(`${BASE}/stats`);
    const d = res.data;
    const byCategory: Record<string, number> = {};
    for (const cat of d.topCategories || []) {
      byCategory[cat.category] = cat.count;
    }
    return {
      knowledge: { total: d.totalKnowledge, byCategory },
      patterns: { total: d.totalPatterns, active: d.activePatternsCount },
      rules: { total: d.totalRules, active: d.activeRulesCount },
      events: { total: d.totalEvents, last24h: d.eventsLast24h },
      feedback: { total: 0, avgRating: 0, helpfulPercent: 0 },
    };
  },

  getInsights: async (): Promise<{ insights: BrainInsight[] }> => {
    const res = await apiGet<ApiRes<BackendInsight[]>>(`${BASE}/insights`);
    const insights: BrainInsight[] = (res.data || []).map(i => ({
      type: i.category,
      title: i.title,
      description: i.description,
      severity: mapSeverity(i.priority),
    }));
    return { insights };
  },

  getKnowledge: async (category?: string, limit = 50): Promise<{ entries: BrainKnowledge[] }> => {
    const res = await apiGet<ApiRes<any[]>>(`${BASE}/knowledge?limit=${limit}${category ? `&category=${category}` : ""}`);
    const entries: BrainKnowledge[] = (res.data || []).map(e => ({
      id: e.id,
      category: e.category,
      key: e.key,
      value: typeof e.value === "string" ? e.value : JSON.stringify(e.value),
      confidence: e.confidence,
      source: e.source,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
    return { entries };
  },

  addKnowledge: async (data: { category: string; key: string; value: string; source?: string }): Promise<{ success: boolean }> => {
    const res = await apiPost<ApiRes<unknown>>(`${BASE}/knowledge`, data);
    return { success: res.success };
  },

  getPatterns: async (): Promise<{ patterns: BrainPattern[] }> => {
    const res = await apiGet<ApiRes<any[]>>(`${BASE}/patterns`);
    const patterns: BrainPattern[] = (res.data || []).map(p => ({
      id: p.id,
      name: p.patternType || p.name || "Unbekannt",
      description: p.description || "",
      category: p.patternType || "",
      status: p.isActive ? "active" as const : "inactive" as const,
      confidence: p.confidence,
      occurrences: p.triggerCount || 0,
      createdAt: p.createdAt,
    }));
    return { patterns };
  },

  getRules: async (): Promise<{ rules: BrainRule[] }> => {
    const res = await apiGet<ApiRes<any[]>>(`${BASE}/rules`);
    const rules: BrainRule[] = (res.data || []).map(r => ({
      id: r.id,
      name: r.name || "Unbekannt",
      description: r.description || "",
      condition: typeof r.trigger === "string" ? r.trigger : JSON.stringify(r.trigger || {}),
      action: typeof r.action === "string" ? r.action : JSON.stringify(r.action || {}),
      status: r.isActive ? "active" as const : "inactive" as const,
      priority: r.priority,
      triggerCount: r.triggerCount || 0,
      createdAt: r.createdAt,
    }));
    return { rules };
  },

  getEvents: async (options?: { eventType?: string; category?: string; limit?: number; from?: string; to?: string }): Promise<{ events: BrainEvent[] }> => {
    const params = new URLSearchParams();
    if (options?.eventType) params.set("eventType", options.eventType);
    if (options?.category) params.set("category", options.category);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.from) params.set("from", options.from);
    if (options?.to) params.set("to", options.to);
    const res = await apiGet<ApiRes<any[]>>(`${BASE}/events?${params.toString()}`);
    const events: BrainEvent[] = (res.data || []).map(e => ({
      id: e.id,
      eventType: e.eventType,
      category: e.category,
      entityType: e.entityType,
      entityId: e.entityId ? String(e.entityId) : undefined,
      userId: e.userId,
      data: e.metadata || {},
      createdAt: e.createdAt,
    }));
    return { events };
  },

  submitFeedback: async (data: { actionId: string; rating: number; helpful: boolean; comment?: string }): Promise<{ success: boolean }> => {
    const res = await apiPost<ApiRes<unknown>>(`${BASE}/feedback`, { actionType: "brain_action", ...data });
    return { success: res.success };
  },

  executeAction: async (action: BrainActionType, input: string, context?: Record<string, unknown>): Promise<{ success: boolean; result: string; action: string }> => {
    const res = await apiPost<ApiRes<{ result: string; action: string }>>(`${BASE}/action`, {
      action,
      context: context || { entityType: "text", input },
    });
    return { success: res.success, result: res.data?.result || "", action: res.data?.action || action };
  },

  triggerLearning: async (): Promise<{ data: { patternsFound: number; patternsCreated: number; patternsUpdated: number } }> => {
    const res = await apiPost<ApiRes<{ patternsFound: number; patternsCreated: number; patternsUpdated: number }>>(`${BASE}/learn`, {});
    return { data: res.data };
  },
};
