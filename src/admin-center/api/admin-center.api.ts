import { apiGet, apiPost, apiPatch, apiDelete } from '../../api/client';

// ============================================
// HELPER: Build query string
// ============================================
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const query = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
}

// ============================================
// API FUNCTIONS - Types match component expectations
// ============================================

export const adminCenterApi = {
  // Dashboard - returns DashboardData matching AdminCenterPage.tsx interface
  getDashboard: async () => {
    const raw = await apiGet<any>('/api/admin/dashboard');
    // Transform to match expected interface
    return {
      overview: {
        totalUsers: raw.overview?.totalUsers ?? 0,
        activeUsers: raw.overview?.activeUsers ?? 0,
        totalInstallations: raw.overview?.totalInstallations ?? 0,
        totalKunden: raw.overview?.totalKunden ?? 0,
      },
      today: {
        logins: raw.today?.logins ?? 0,
        errors: raw.today?.errors ?? 0,
        installations: raw.today?.installations ?? 0,
      },
      thisWeek: {
        newUsers: raw.thisWeek?.newUsers ?? 0,
        installations: raw.thisWeek?.installations ?? 0,
      },
      bugs: {
        open: raw.bugs?.open ?? 0,
        critical: raw.bugs?.critical ?? 0,
      },
      email: {
        sentToday: raw.email?.sentToday ?? 0,
        failedThisWeek: raw.email?.failedThisWeek ?? 0,
      },
      recentActivity: raw.recentActivity ?? [],
      recentErrors: raw.recentErrors ?? [],
    };
  },

  // Activity Logs - returns { data, pagination } matching ActivityLogsComponent.tsx
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const result = await apiGet<any>(`/api/admin/logs${buildQueryString(params)}`);
    // Transform logs to match expected interface (entityId as number)
    const rawLogs = (result.logs || []) as any[];
    const logs = rawLogs.map((log: any) => ({
      ...log,
      entityId: log.entityId ? parseInt(String(log.entityId), 10) || undefined : undefined,
      details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
    }));
    return {
      data: logs,
      pagination: {
        page: result.pagination?.page ?? 1,
        totalPages: result.pagination?.pages ?? result.pagination?.totalPages ?? 1,
        total: result.pagination?.total ?? 0,
      },
    };
  },

  getLogStats: () => apiGet<any>('/api/admin/logs/stats'),

  // Bug Reports
  getBugs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    category?: string;
    search?: string;
  }) => {
    return apiGet<any>(`/api/admin/bugs${buildQueryString(params)}`);
  },

  createBug: (data: Record<string, unknown>) => apiPost<any>('/api/admin/bugs', data),

  updateBug: (id: number, data: Record<string, unknown>) => apiPatch<any>(`/api/admin/bugs/${id}`, data),

  getBugStats: () => apiGet<any>('/api/admin/bugs/stats'),

  // Announcements - accepts { includeInactive } object matching AnnouncementsComponent.tsx
  getAnnouncements: async (options?: { includeInactive?: boolean } | boolean) => {
    const includeInactive = typeof options === 'boolean' ? options : options?.includeInactive ?? true;
    const result = await apiGet<any>(`/api/admin/announcements?includeInactive=${includeInactive}`);
    // Transform to match expected interface
    const rawAnnouncements = (Array.isArray(result) ? result : []) as any[];
    const announcements = rawAnnouncements.map((a: any) => ({
      ...a,
      activeFrom: a.activeFrom || new Date().toISOString(),
      targetRoles: Array.isArray(a.targetRoles) ? JSON.stringify(a.targetRoles) : a.targetRoles,
      _count: a._count || { reads: 0 },
    }));
    return { data: announcements };
  },

  getUnreadAnnouncements: async () => {
    try {
      const result = await apiGet<any>('/api/admin/unread');
      const rawItems = (Array.isArray(result) ? result : []) as any[];
      return rawItems.map((a: any) => ({
        ...a,
        activeFrom: a.activeFrom || new Date().toISOString(),
        targetRoles: Array.isArray(a.targetRoles) ? JSON.stringify(a.targetRoles) : a.targetRoles,
        _count: a._count || { reads: 0 },
      }));
    } catch (error) {
      console.warn('[AdminCenter] Failed to fetch unread announcements:', error);
      return [];
    }
  },

  createAnnouncement: (data: Record<string, unknown>) => {
    // Transform targetRoles back to array for API
    const payload = {
      ...data,
      targetRoles: data.targetRoles && typeof data.targetRoles === 'string'
        ? JSON.parse(data.targetRoles)
        : data.targetRoles,
    };
    return apiPost<any>('/api/admin/announcements', payload);
  },

  updateAnnouncement: (id: number, data: Record<string, unknown>) => {
    // Transform targetRoles back to array for API
    const payload = {
      ...data,
      targetRoles: data.targetRoles && typeof data.targetRoles === 'string'
        ? JSON.parse(data.targetRoles)
        : data.targetRoles,
    };
    return apiPatch<any>(`/api/admin/announcements/${id}`, payload);
  },

  deleteAnnouncement: (id: number) => apiDelete(`/api/admin/announcements/${id}`),

  markAsRead: (id: number) => apiPost<any>(`/api/admin/${id}/read`, {}),

  markAllAsRead: (ids: number[]) => apiPost<any>('/api/admin/read-all', { ids }),
};

export default adminCenterApi;
