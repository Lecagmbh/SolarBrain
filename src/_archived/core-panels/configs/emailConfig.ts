/**
 * Email Detail Panel Configuration
 * For inline email detail views
 */

import type { PanelConfig } from '../types';

export const emailConfig: PanelConfig = {
  entityType: 'email',
  shellType: 'slide-over',
  width: '600px',

  header: {
    title: (data: any) => data.subject || 'E-Mail',
    badges: (data: any) => [
      { text: data.direction === 'incoming' ? 'Eingehend' : 'Ausgehend', variant: data.direction === 'incoming' ? 'info' as const : 'primary' as const },
    ],
    actions: () => [],
  },

  tabs: [],

  fetchData: async () => ({}),
};
