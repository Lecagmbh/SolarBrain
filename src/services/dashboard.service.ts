// =============================================================================
// Baunity Dashboard V4 - API Service
// =============================================================================

import { apiGet } from "../modules/api/client";
import type {
  DashboardSummary,
  DashboardKPIs,
  PriorityData,
  ActivityItem,
  AlertItem,
  GridOperatorPerformance,
  EmailStats,
} from "../types/dashboard.types";

// -----------------------------------------------------------------------------
// Dashboard API Endpoints
// -----------------------------------------------------------------------------

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiGet("/dashboard/summary") as DashboardSummary;
    return response;
  },

  async getKPIs(): Promise<DashboardKPIs> {
    const response = await apiGet("/dashboard/kpis") as DashboardKPIs;
    return response;
  },

  async getPriorities(): Promise<PriorityData> {
    const response = await apiGet("/dashboard/priorities") as PriorityData;
    return response;
  },

  async getActivityFeed(limit: number = 20): Promise<ActivityItem[]> {
    const response = await apiGet(`/dashboard/activity-feed?limit=${limit}`) as ActivityItem[];
    return response;
  },

  async getAlerts(): Promise<AlertItem[]> {
    try {
      const response = await apiGet("/dashboard/alerts") as AlertItem[];
      return response;
    } catch {
      return generateAlertsFromData();
    }
  },

  async getGridOperatorPerformance(): Promise<GridOperatorPerformance[]> {
    try {
      const raw = await apiGet("/netzbetreiber/performance");
      const response = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.data ?? []);
      return response as GridOperatorPerformance[];
    } catch {
      try {
        const raw = await apiGet("/netzbetreiber");
        const nbs = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.data ?? []);
        return transformToPerformance(nbs as any);
      } catch {
        return [];
      }
    }
  },

  async getEmailStats(): Promise<EmailStats> {
    try {
      const response = await apiGet("/emails/stats") as EmailStats;
      return response;
    } catch {
      return { unreadCount: 0, unassignedCount: 0, needsReviewCount: 0 };
    }
  },
};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

async function generateAlertsFromData(): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  try {
    const installations = await apiGet("/installations?status=RUECKFRAGE,GENEHMIGT,IBN&limit=100") as Array<{ id: number; status: string; updatedAt?: string; createdAt?: string }>;

    const queries = installations.filter(i => i.status === "RUECKFRAGE");
    if (queries.length > 0) {
      const oldest = getOldestDays(queries);
      alerts.push({
        id: "nb_queries",
        type: "nb_query",
        severity: oldest > 3 ? "critical" : "warning",
        title: `${queries.length} Rückfrage${queries.length > 1 ? "n" : ""} vom NB`,
        description: `Älteste seit ${oldest} Tag${oldest > 1 ? "en" : ""} unbeantwortet`,
        count: queries.length,
        oldestDays: oldest,
        installationIds: queries.map(q => q.id),
        link: "/netzanmeldungen?status=RUECKFRAGE",
        actionLabel: "Beantworten",
      });
    }

    const ibnPending = installations.filter(i => i.status === "IBN" || i.status === "GENEHMIGT");
    if (ibnPending.length > 0) {
      const oldest = getOldestDays(ibnPending);
      alerts.push({
        id: "ibn_missing",
        type: "ibn_missing",
        severity: oldest > 7 ? "critical" : "warning",
        title: `${ibnPending.length} IBN-Protokoll${ibnPending.length > 1 ? "e" : ""} ausstehend`,
        description: `Anlage${ibnPending.length > 1 ? "n" : ""} genehmigt, IBN ausstehend`,
        count: ibnPending.length,
        oldestDays: oldest,
        installationIds: ibnPending.map(i => i.id),
        link: "/netzanmeldungen?status=IBN,GENEHMIGT",
        actionLabel: "Hochladen",
      });
    }

    try {
      const invoices = await apiGet("/rechnungen?status=UEBERFAELLIG") as Array<{ betragBrutto?: string | number }>;
      if (invoices.length > 0) {
        const totalAmount = invoices.reduce((sum: number, inv) =>
          sum + parseFloat(String(inv.betragBrutto || 0)), 0
        );
        alerts.push({
          id: "invoices_overdue",
          type: "invoice_overdue",
          severity: "critical",
          title: `${invoices.length} Rechnung${invoices.length > 1 ? "en" : ""} überfällig`,
          description: `Gesamt: ${formatCurrency(totalAmount)}`,
          count: invoices.length,
          amount: totalAmount,
          link: "/finanzen?status=UEBERFAELLIG",
          actionLabel: "Mahnen",
        });
      }
    } catch { /* ignore */ }

    try {
      const emailStats = await apiGet("/emails/stats") as { unassignedCount?: number };
      if ((emailStats?.unassignedCount ?? 0) > 0) {
        alerts.push({
          id: "emails_unassigned",
          type: "email_unassigned",
          severity: "info",
          title: `${emailStats.unassignedCount!} E-Mail${emailStats.unassignedCount! > 1 ? "s" : ""} nicht zugeordnet`,
          description: "Neue E-Mails benötigen Zuordnung",
          count: emailStats.unassignedCount,
          link: "/emails?assigned=false",
          actionLabel: "Zuordnen",
        });
      }
    } catch { /* ignore */ }

  } catch (error) {
    console.error("Error generating alerts:", error);
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

function getOldestDays(items: Array<{ updatedAt?: string; createdAt?: string }>): number {
  if (items.length === 0) return 0;
  const now = new Date();
  let oldest = 0;
  for (const item of items) {
    const date = new Date(item.updatedAt || item.createdAt || 0);
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days > oldest) oldest = days;
  }
  return oldest;
}

function transformToPerformance(netzbetreiber: Array<Record<string, unknown>>): GridOperatorPerformance[] {
  return netzbetreiber
    .filter(nb => nb.aktiv)
    .map(nb => ({
      id: nb.id as number,
      name: nb.name as string,
      shortName: nb.kurzname as string | undefined,
      avgDays: (nb.avgResponseDays as number) || 10,
      openCases: (nb.openCases as number) || 0,
      totalCases: (nb.totalCases as number) || 0,
      approvalRate: (nb.approvalRate as number) || 95,
      trend: "stable" as const,
    }))
    .sort((a, b) => a.avgDays - b.avgDays)
    .slice(0, 5);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default dashboardApi;
