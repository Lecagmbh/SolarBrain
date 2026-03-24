/**
 * Invoice Panel Configuration
 * For RechnungsOrdnerPage – inline panel (no overlay)
 */

import type { PanelConfig } from '../types';

export const invoiceConfig: PanelConfig = {
  entityType: 'invoice',
  shellType: 'full-page', // Inline layout, no overlay

  header: {
    title: (data: any) => data.kundeName || data.firmenName || 'Rechnungen',
    badges: (data: any) => [
      ...(data.summary?.totalInstallations ? [{ text: `${data.summary.totalInstallations} Anlagen`, variant: 'muted' as const }] : []),
    ],
    actions: () => [],
  },

  tabs: [],

  fetchData: async () => ({}),
};
