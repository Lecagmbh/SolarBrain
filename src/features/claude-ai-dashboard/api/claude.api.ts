import { apiGet, apiPost } from "../../../api/client";
import type { ClaudeAIStatus, ClaudeAIDashboard, EmailAnalysis, InstallationAlert, QualityCheck, InstallationInsight, AssistantResponse } from "../types/claude.types";

const BASE = "/api/claude-ai";

// Backend wraps all responses in { success, data }
interface ApiRes<T> { success: boolean; data: T }

export const claudeApi = {
  getStatus: async (): Promise<ClaudeAIStatus> => {
    const res = await apiGet<ApiRes<{
      configured: boolean;
      model: string;
      stats: { unanalyzedEmails: number; analyzedEmails: number; analysisRate: number };
    }>>(`${BASE}/status`);
    const d = res.data;
    return {
      configured: d.configured,
      model: d.model,
      stats: {
        totalAnalyses: d.stats.analyzedEmails,
        todayAnalyses: 0,
        avgResponseTime: 0,
        cacheHitRate: d.stats.analysisRate,
      },
    };
  },

  getDashboard: async (): Promise<ClaudeAIDashboard> => {
    const res = await apiGet<ApiRes<{
      stats: Record<string, number>;
      recentAnalyses: any[];
      alerts: InstallationAlert[];
      lastUpdated: string;
    }>>(`${BASE}/dashboard`);
    const d = res.data;
    // Map backend recentAnalyses fields to frontend EmailAnalysis
    const recentAnalyses: EmailAnalysis[] = (d.recentAnalyses || []).map((a: any) => ({
      id: a.id,
      emailId: a.id,
      type: a.aiType || "SONSTIGES",
      confidence: a.aiConfidence ?? 0,
      summary: a.aiSummary || a.subject || "",
      createdAt: a.receivedAt || a.updatedAt || "",
    }));
    return {
      stats: {
        totalAnalyses: (d.stats?.genehmigungEmails || 0) + (d.stats?.rueckfrageEmails || 0),
        todayAnalyses: 0,
        avgResponseTime: 0,
        cacheHitRate: 0,
      },
      recentAnalyses,
      alerts: d.alerts || [],
    };
  },

  analyzeEmail: async (emailId: number): Promise<{ success: boolean; analysis: EmailAnalysis }> => {
    const res = await apiPost<ApiRes<any>>(`${BASE}/analyze-email/${emailId}`, {});
    const d = res.data;
    return {
      success: res.success,
      analysis: {
        id: d.id || emailId,
        emailId: d.emailId || emailId,
        installationId: d.installationId,
        type: d.emailType || d.type || "SONSTIGES",
        confidence: d.confidence ?? 0,
        summary: d.summary || "",
        requirements: d.requirements,
        deadline: d.deadline,
        suggestedAction: d.suggestedAction || d.suggestedStatus,
        createdAt: d.createdAt || new Date().toISOString(),
      },
    };
  },

  batchAnalyze: async (limit = 10): Promise<{ success: boolean; analyzed: number; results: EmailAnalysis[] }> => {
    const res = await apiPost<ApiRes<{ processed: number; results: any[] }>>(`${BASE}/analyze-emails/batch`, { limit });
    const d = res.data;
    const results: EmailAnalysis[] = (d.results || []).map((r: any) => ({
      id: r.emailId,
      emailId: r.emailId,
      type: r.emailType || "SONSTIGES",
      confidence: r.confidence ?? 0,
      summary: r.summary || "",
      suggestedAction: r.suggestedStatus,
      createdAt: new Date().toISOString(),
    }));
    return { success: res.success, analyzed: d.processed, results };
  },

  getAlerts: async (daysBack = 7): Promise<{ success: boolean; alerts: InstallationAlert[] }> => {
    const res = await apiGet<ApiRes<{ alerts: InstallationAlert[]; totalChecked?: number }>>(`${BASE}/alerts?daysBack=${daysBack}`);
    return { success: res.success, alerts: res.data?.alerts || [] };
  },

  getQualityCheck: async (installationId: number): Promise<{ success: boolean; quality: QualityCheck }> => {
    const res = await apiGet<ApiRes<QualityCheck>>(`${BASE}/installation/${installationId}/quality-check`);
    return { success: res.success, quality: res.data };
  },

  getInsights: async (installationId: number): Promise<{ success: boolean; insights: InstallationInsight }> => {
    const res = await apiGet<ApiRes<InstallationInsight>>(`${BASE}/installation/${installationId}/insights`);
    return { success: res.success, insights: res.data };
  },

  generateResponse: async (emailId: number, installationId: number): Promise<{ success: boolean; response: string }> => {
    const res = await apiPost<ApiRes<{ response: string }>>(`${BASE}/generate-response`, { emailId, installationId });
    return { success: res.success, response: res.data?.response || "" };
  },

  executeAssistant: async (installationId: number, command: string, execute = false): Promise<AssistantResponse> => {
    const res = await apiPost<ApiRes<AssistantResponse>>(`${BASE}/installation/${installationId}/assistant`, { command, execute });
    return res.data;
  },
};
