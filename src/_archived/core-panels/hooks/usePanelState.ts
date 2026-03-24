/**
 * Zustand Store for Unified Panel State
 * Manages open/close, entity tracking, active tab
 */

import { create } from 'zustand';
import type { PanelConfig } from '../types';

interface PanelStore {
  isOpen: boolean;
  entityType: string | null;
  entityId: string | number | null;
  activeTab: string;
  config: PanelConfig | null;

  openPanel: (entityType: string, entityId: string | number, config: PanelConfig) => void;
  closePanel: () => void;
  setActiveTab: (tabId: string) => void;
  setConfig: (config: PanelConfig) => void;
}

export const usePanelState = create<PanelStore>((set) => ({
  isOpen: false,
  entityType: null,
  entityId: null,
  activeTab: '',
  config: null,

  openPanel: (entityType, entityId, config) =>
    set({
      isOpen: true,
      entityType,
      entityId,
      config,
      activeTab: config.tabs[0]?.id ?? '',
    }),

  closePanel: () =>
    set({
      isOpen: false,
      entityType: null,
      entityId: null,
      config: null,
      activeTab: '',
    }),

  setActiveTab: (tabId) => set({ activeTab: tabId }),

  setConfig: (config) => set({ config }),
}));

/** Convenience function to open a panel from anywhere */
export function openPanel(entityType: string, entityId: string | number, config: PanelConfig) {
  usePanelState.getState().openPanel(entityType, entityId, config);
}

/** Convenience function to close the panel from anywhere */
export function closePanel() {
  usePanelState.getState().closePanel();
}
