/**
 * useDashboardData - API Hook für das neue Dashboard
 * ==================================================
 * Fetcht alle Daten für das Dashboard und transformiert sie
 * in das Format der neuen Komponenten.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '../../api/client';
import type {
  PipelineStage,
  ActionItem,
  TaskItem,
  CustomerAnlage,
  NBPerformanceItem,
  TerminItem,
  ActivityItem,
} from '../types';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_REFRESH_INTERVAL = 60000; // 60 seconds

/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: API responses are dynamically typed until backend provides full TypeScript definitions

// =============================================================================
// Types
// =============================================================================

interface DashboardState {
  // Core data
  pipelineStages: PipelineStage[];
  actionItems: ActionItem[];

  // Role-specific
  tasks: TaskItem[];           // Admin only
  anlagen: CustomerAnlage[];   // Kunde only

  // Insights
  nbPerformance: NBPerformanceItem[];
  termine: TerminItem[];
  activities: ActivityItem[];

  // Meta
  openCount: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseDashboardDataOptions {
  isAdmin: boolean;
  kundeId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardDataReturn extends DashboardState {
  refresh: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useDashboardData({
  isAdmin,
  kundeId,
  autoRefresh = true,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
}: UseDashboardDataOptions): UseDashboardDataReturn {
  // State
  const [state, setState] = useState<DashboardState>({
    pipelineStages: [],
    actionItems: [],
    tasks: [],
    anlagen: [],
    nbPerformance: [],
    termine: [],
    activities: [],
    openCount: 0,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Parallel requests
      const results = await Promise.allSettled([
        fetchPipelineData(),
        fetchActionItems(isAdmin),
        isAdmin ? fetchTasks() : fetchAnlagen(kundeId),
        isAdmin ? fetchNBPerformance() : Promise.resolve([]),
        fetchTermine(isAdmin, kundeId),
        fetchActivities(isAdmin, kundeId),
      ]);

      // Extract results
      const [
        pipelineResult,
        actionItemsResult,
        tasksOrAnlagenResult,
        nbPerformanceResult,
        termineResult,
        activitiesResult,
      ] = results;

      const pipelineStages = pipelineResult.status === 'fulfilled'
        ? pipelineResult.value
        : getDefaultPipelineStages();

      const actionItems = actionItemsResult.status === 'fulfilled'
        ? actionItemsResult.value
        : [];

      const tasks = isAdmin && tasksOrAnlagenResult.status === 'fulfilled'
        ? tasksOrAnlagenResult.value as TaskItem[]
        : [];

      const anlagen = !isAdmin && tasksOrAnlagenResult.status === 'fulfilled'
        ? tasksOrAnlagenResult.value as CustomerAnlage[]
        : [];

      const nbPerformance = nbPerformanceResult.status === 'fulfilled'
        ? nbPerformanceResult.value
        : [];

      const termine = termineResult.status === 'fulfilled'
        ? termineResult.value
        : [];

      const activities = activitiesResult.status === 'fulfilled'
        ? activitiesResult.value
        : [];

      // Calculate open count
      const openCount = pipelineStages
        .filter(s => s.key !== 'fertig')
        .reduce((sum, s) => sum + s.count, 0);

      setState({
        pipelineStages,
        actionItems,
        tasks,
        anlagen,
        nbPerformance,
        termine,
        activities,
        openCount,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Fehler beim Laden',
      }));
    }
  }, [isAdmin, kundeId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, fetchData]);

  // Tab visibility handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchData]);

  return {
    ...state,
    refresh: fetchData,
    setAutoRefresh: setAutoRefreshEnabled,
  };
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchPipelineData(): Promise<PipelineStage[]> {
  try {
    const summary = await apiGet('/dashboard/summary') as any;

    // Backend returns pipeline as array: [{key, label, count}, ...]
    // Keys: eingang, beim_nb, rueckfrage, genehmigt, ibn, fertig
    if (summary?.pipeline && Array.isArray(summary.pipeline)) {
      return summary.pipeline.map((stage: any) => ({
        key: stage.key,
        label: stage.label,
        count: stage.count || 0,
      }));
    }

    return getDefaultPipelineStages();
  } catch {
    return getDefaultPipelineStages();
  }
}

async function fetchActionItems(isAdmin: boolean): Promise<ActionItem[]> {
  try {
    if (isAdmin) {
      // Admin: InboxItem-Counts für Echtzeit-Daten
      const counts = await apiGet('/v2/inbox/counts') as {
        total: number;
        critical: number;
        high: number;
        byCategory: Record<string, number>;
      };

      const items: ActionItem[] = [];
      const cat = counts.byCategory || {};

      if (cat.rueckfrage) {
        items.push({ type: 'nb-mails', count: cat.rueckfrage, label: 'Rückfragen bearbeiten', urgent: true });
      }
      if (cat.einreichung) {
        items.push({ type: 'submit', count: cat.einreichung, label: 'Anmeldungen einreichen' });
      }
      if (cat.ibn) {
        items.push({ type: 'ibn', count: cat.ibn, label: 'IBN vorbereiten' });
      }
      if (cat.nachfassen) {
        items.push({ type: 'followup', count: cat.nachfassen, label: 'NB nachfassen', urgent: counts.critical > 0 });
      }
      if (cat.mastr) {
        items.push({ type: 'documents', count: cat.mastr, label: 'MaStR-Einträge' });
      }

      return items;
    }

    // Kunde: Legacy-Alerts (InboxItems nur für Admins)
    const alerts = await apiGet('/dashboard/alerts') as any[];
    return transformAlertsToActionItems(alerts, false);
  } catch {
    return [];
  }
}

async function fetchTasks(): Promise<TaskItem[]> {
  try {
    const response = await apiGet(
      '/installations?status=EINGANG,RUECKFRAGE,GENEHMIGT&limit=20&sort=-updatedAt'
    ) as any;
    // Backend gibt {total, data: [...]} zurück
    const installations = response?.data || response || [];
    if (!Array.isArray(installations)) return [];

    return installations.map((inst: any) => ({
      id: inst.id,
      publicId: inst.publicId,
      title: getTaskTitle(inst),
      subtitle: `${inst.kundenName || 'Unbekannt'} - ${inst.anlagenLeistung || 0} kWp`,
      status: inst.status,
      priority: getTaskPriority(inst),
      type: getTaskType(inst),
      dueDate: inst.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function fetchAnlagen(kundeId?: number): Promise<CustomerAnlage[]> {
  try {
    const query = kundeId ? `?kundeId=${kundeId}&` : '?';
    const response = await apiGet(`/installations${query}limit=10&sort=-updatedAt`) as any;
    // Backend gibt {total, data: [...]} zurück
    const installations = response?.data || response || [];
    if (!Array.isArray(installations)) return [];

    return installations.map((inst: any) => ({
      id: inst.id,
      publicId: inst.publicId,
      standort: inst.standort || inst.adresse || (inst.ort ? `${inst.plz || ''} ${inst.ort}`.trim() : 'Unbekannt'),
      status: mapStatus(inst.status),
      statusLabel: getStatusLabel(inst.status),
      leistung: inst.anlagenLeistung || inst.totalKwp || 0,
      netzbetreiber: inst.netzbetreiberName || inst.gridOperator,
      lastUpdate: inst.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function fetchNBPerformance(): Promise<NBPerformanceItem[]> {
  try {
    const raw = await apiGet('/netzbetreiber/performance');
    const nbs = Array.isArray(raw) ? raw : (raw?.data ?? []);

    return nbs.slice(0, 5).map((nb: any, index: number) => ({
      id: nb.id || index,
      name: nb.name,
      avgDays: nb.avgResponseDays || nb.avgDays || null,
      openCases: nb.openCases || 0,
      approvalRate: nb.approvalRate || 90,
      trend: nb.trend || 'stable',
    }));
  } catch {
    // Fallback: Get from netzbetreiber list
    try {
      const raw = await apiGet('/netzbetreiber?aktiv=true&limit=5');
      const nbs = Array.isArray(raw) ? raw : (raw?.data ?? []);
      return nbs.map((nb: any, index: number) => ({
        id: nb.id || index,
        name: nb.name,
        avgDays: null,
        openCases: 0,
        approvalRate: 90,
        trend: 'stable' as const,
      }));
    } catch {
      return [];
    }
  }
}

async function fetchTermine(isAdmin: boolean, kundeId?: number): Promise<TerminItem[]> {
  try {
    const termine = await apiGet('/dashboard/termine') as any[];

    return termine.map((t: any) => ({
      id: t.id,
      title: t.title || t.titel || 'Termin',
      date: t.date || t.datum,
      time: t.time || t.uhrzeit,
      location: t.location || t.ort,
      type: mapTerminType(t.type || t.typ),
      anmeldungId: t.anmeldungId || t.installationId,
    }));
  } catch {
    return [];
  }
}

async function fetchActivities(isAdmin: boolean, kundeId?: number): Promise<ActivityItem[]> {
  try {
    const query = isAdmin ? '?limit=10' : kundeId ? `?kundeId=${kundeId}&limit=10` : '?limit=10';
    const activities = await apiGet(`/dashboard/activity-feed${query}`) as any[];

    return activities.map((a: any) => {
      // Backend returns either status_change or comment types
      if (a.type === 'status_change') {
        return {
          id: a.data?.installationId || Math.random(),
          publicId: a.data?.publicId,
          type: mapActivityType(a.data?.toStatus || 'default'),
          title: a.data?.statusLabel || `Status: ${a.data?.toStatus}`,
          description: a.data?.customerName || '',
          timestamp: a.timestamp,
          user: a.data?.changedBy,
        };
      } else if (a.type === 'comment') {
        return {
          id: a.data?.installationId || Math.random(),
          publicId: a.data?.publicId,
          type: 'email',
          title: `Kommentar von ${a.data?.author || 'Unbekannt'}`,
          description: a.data?.message || '',
          timestamp: a.timestamp,
          user: a.data?.author,
        };
      }
      // Fallback
      return {
        id: a.id || Math.random(),
        publicId: a.publicId || a.data?.publicId,
        type: mapActivityType(a.type || 'default'),
        title: a.title || a.data?.statusLabel || 'Aktivität',
        description: a.description || a.data?.customerName || '',
        timestamp: a.timestamp || a.createdAt,
        user: a.userName || a.data?.changedBy,
      };
    });
  } catch {
    return [];
  }
}

// =============================================================================
// Transformation Helpers
// =============================================================================

function transformAlertsToActionItems(alerts: any[], isAdmin: boolean): ActionItem[] {
  const items: ActionItem[] = [];

  if (isAdmin) {
    // Admin action items
    const nbMails = alerts.find(a => a.type === 'nb_query' || a.type === 'email_unassigned');
    if (nbMails) {
      items.push({
        type: 'nb-mails',
        count: nbMails.count || 0,
        label: 'NB-Mails bearbeiten',
        urgent: nbMails.severity === 'critical',
      });
    }

    const drafts = alerts.find(a => a.type === 'draft_pending');
    items.push({
      type: 'submit',
      count: drafts?.count || 0,
      label: 'Anmeldungen einreichen',
    });

    const ibnMissing = alerts.find(a => a.type === 'ibn_missing');
    if (ibnMissing) {
      items.push({
        type: 'ibn',
        count: ibnMissing.count || 0,
        label: 'IBN-Protokolle erstellen',
      });
    }

    const overdue = alerts.find(a => a.type === 'followup_needed');
    if (overdue) {
      items.push({
        type: 'followup',
        count: overdue.count || 0,
        label: 'Nachfassen (>14 Tage)',
        urgent: true,
      });
    }
  } else {
    // Customer action items
    const queries = alerts.find(a => a.type === 'nb_query');
    if (queries) {
      items.push({
        type: 'queries',
        count: queries.count || 0,
        label: 'Rückfragen beantworten',
        urgent: true,
      });
    }

    const docs = alerts.find(a => a.type === 'document_missing');
    if (docs) {
      items.push({
        type: 'documents',
        count: docs.count || 0,
        label: 'Dokumente hochladen',
      });
    }

    const termine = alerts.find(a => a.type === 'termin_pending');
    if (termine) {
      items.push({
        type: 'termine',
        count: termine.count || 0,
        label: 'Termin bestätigen',
      });
    }
  }

  return items.filter(item => item.count > 0);
}

function getDefaultPipelineStages(): PipelineStage[] {
  return [
    { key: 'eingang', label: 'Eingang', count: 0 },
    { key: 'beim_nb', label: 'Beim NB', count: 0 },
    { key: 'rueckfrage', label: 'Rückfrage', count: 0 },
    { key: 'genehmigt', label: 'Genehmigt', count: 0 },
    { key: 'ibn', label: 'IBN', count: 0 },
    { key: 'fertig', label: 'Fertig', count: 0 },
  ];
}

function getTaskTitle(inst: any): string {
  switch (inst.status) {
    case 'EINGANG': return 'An NB senden';
    case 'RUECKFRAGE': return 'Rückfrage beantworten';
    case 'GENEHMIGT': return 'Zur IBN';
    case 'IBN': return 'IBN-Protokoll erstellen';
    default: return 'Aktion erforderlich';
  }
}

function getTaskPriority(inst: any): 'high' | 'medium' | 'low' {
  const daysSinceUpdate = getDaysSince(inst.updatedAt);
  if (inst.status === 'RUECKFRAGE') return 'high';
  if (daysSinceUpdate > 7) return 'high';
  if (daysSinceUpdate > 3) return 'medium';
  return 'low';
}

function getTaskType(inst: any): string {
  switch (inst.status) {
    case 'EINGANG': return 'submit';
    case 'RUECKFRAGE': return 'nb-mail';
    case 'GENEHMIGT': return 'ibn';
    case 'IBN': return 'ibn';
    default: return 'submit';
  }
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'EINGANG': 'eingang',
    'BEIM_NB': 'beim-nb',
    'RUECKFRAGE': 'rueckfrage',
    'GENEHMIGT': 'genehmigt',
    'IBN': 'ibn',
    'FERTIG': 'fertig',
  };
  return statusMap[status] || 'eingang';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'EINGANG': 'Eingang',
    'BEIM_NB': 'Beim Netzbetreiber',
    'RUECKFRAGE': 'Rückfrage',
    'GENEHMIGT': 'Genehmigt',
    'IBN': 'IBN',
    'FERTIG': 'Fertig',
  };
  return labels[status] || status;
}

function mapTerminType(type: string): 'ibn' | 'zaehlerwechsel' | 'meeting' | 'other' {
  const typeMap: Record<string, 'ibn' | 'zaehlerwechsel' | 'meeting' | 'other'> = {
    'IBN': 'ibn',
    'ZAEHLERWECHSEL': 'zaehlerwechsel',
    'MEETING': 'meeting',
    'BESPRECHUNG': 'meeting',
  };
  return typeMap[type?.toUpperCase()] || 'other';
}

function mapActivityType(type: string): string {
  const typeMap: Record<string, string> = {
    'ERSTELLT': 'created',
    'CREATED': 'created',
    'EINGEREICHT': 'submitted',
    'SUBMITTED': 'submitted',
    'GENEHMIGT': 'approved',
    'APPROVED': 'approved',
    'RUECKFRAGE': 'query',
    'QUERY': 'query',
    'EMAIL': 'email',
    'WARNUNG': 'warning',
  };
  return typeMap[type?.toUpperCase()] || 'default';
}

function getDaysSince(date: string | Date): number {
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default useDashboardData;
