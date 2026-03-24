/**
 * NB Response Panel Configuration
 * For OpsCenter and NbResponse pages – uses PanelShell as slide-over
 */

import type { PanelConfig } from '../types';

export const nbResponseConfig: PanelConfig = {
  entityType: 'nb-response',
  shellType: 'slide-over',
  width: '680px',

  header: {
    title: (data: any) => `NB-Rückfrage: ${data.installation?.gridOperator || 'Unbekannt'}`,
    badges: (data: any) => [
      { text: data.status || 'ANALYZING', variant: 'primary' as const },
      ...(data.resolveStatus === 'resolved' ? [{ text: 'Gelöst', variant: 'success' as const, dot: true }] : []),
      ...(data.resolveStatus === 'manual_needed' ? [{ text: 'Manuell', variant: 'warning' as const, dot: true }] : []),
    ],
    actions: () => [],
  },

  tabs: [],

  fetchData: async (id) => {
    const { apiGet } = await import('../../../features/netzanmeldungen/services/api');
    return apiGet(`/nb-response/tasks/${id}`);
  },
};
