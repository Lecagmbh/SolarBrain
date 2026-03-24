import { apiGet, apiPost } from '../../api/client';

export const automationsApi = {
  // Mahnwesen
  getMahnStatus: () => apiGet<any>('/api/mahnungen/status'),
  runMahnlauf: () => apiPost<any>('/api/mahnungen/run', {}),
  getBlockedUsers: () => apiGet<any>('/api/mahnungen/blocked'),
  unblockUser: (userId: number) => apiPost<any>(`/api/mahnungen/unblock/${userId}`, {}),

  // Health
  getHealthDetailed: () => apiGet<any>('/api/health/detailed'),
  getCacheStats: () => apiGet<any>('/api/health/cache-stats'),

  // Feature Flags
  getFeatureFlags: () => apiGet<any>('/api/admin/feature-flags'),
  toggleFeatureFlag: (name: string, enabled: boolean) => apiPost<any>(`/api/admin/feature-flags/${name}`, { enabled }),

  // NB Portal Configs
  getNbPortalConfigs: () => apiGet<any>('/api/nb-portal-configs'),
  triggerNbPolling: () => apiPost<any>('/api/nb-portal-configs/poll', {}),

  // Provisionen Automation
  triggerPayoutDrafts: () => apiPost<any>('/api/admin/provisionen/automation/payout-drafts', {}),
  triggerAutoRelease: () => apiPost<any>('/api/admin/provisionen/automation/auto-release', {}),
};
