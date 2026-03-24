/**
 * Factro Project Panel Configuration
 * For FactroCenterPage – uses PanelShell as modal
 */

import type { PanelConfig } from '../types';

export const factroConfig: PanelConfig = {
  entityType: 'factro-project',
  shellType: 'modal',

  header: {
    title: (data: any) => data.customerName || data.title || 'Projekt',
    badges: (data: any) => [
      { text: data.status || 'NEU', variant: 'primary' as const },
      ...(data.isSold ? [{ text: 'VERKAUFT', variant: 'warning' as const, dot: true }] : []),
      ...(data.factroNumber ? [{ text: `#${data.factroNumber}`, variant: 'info' as const }] : []),
    ],
    actions: () => [],
  },

  tabs: [],

  fetchData: async (id) => {
    const { apiGet } = await import('../../../features/netzanmeldungen/services/api');
    return apiGet(`/factro/projects/${id}`);
  },
};
