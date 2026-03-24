// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED PANEL SYSTEM – Public API
// ═══════════════════════════════════════════════════════════════════════════

// Shell
export { PanelShell } from './shell/PanelShell';
export { PanelHeader } from './shell/PanelHeader';
export { PanelTabBar } from './shell/PanelTabBar';
export type { PanelTab } from './shell/PanelTabBar';
export { PanelProgress } from './shell/PanelProgress';
export { PanelAlerts } from './shell/PanelAlerts';
export type { PanelAlert } from './shell/PanelAlerts';
export { PanelToast } from './shell/PanelToast';
export type { ToastState } from './shell/PanelToast';

// Primitives
export { SectionCard } from './primitives/SectionCard';
export { DataGrid } from './primitives/DataGrid';
export type { DataGridItem } from './primitives/DataGrid';
export { CopyableField } from './primitives/CopyableField';
export { StatusBadge } from './primitives/StatusBadge';
export { InlineEdit } from './primitives/InlineEdit';
export { EmptyState } from './primitives/EmptyState';

// Hooks
export { usePanelState, openPanel, closePanel } from './hooks/usePanelState';
export { usePanelKeyboard } from './hooks/usePanelKeyboard';
export { usePanelUrl } from './hooks/usePanelUrl';

// Unified Panel (main entry point)
export { UnifiedDetailPanel } from './UnifiedDetailPanel';

// Registry
export { getPanelConfig, registerPanelConfig, hasPanelConfig } from './registry';

// Data Hooks (TanStack Query)
export { useInstallationDetail } from './hooks/useInstallationDetail';
export { useInstallationMutations } from './hooks/useInstallationMutations';
export { useDocuments } from './hooks/useDocuments';
export { useTimeline } from './hooks/useTimeline';
export { useEmails } from './hooks/useEmails';
export { useTasks } from './hooks/useTasks';
export { useComments } from './hooks/useComments';
export { useGridOperators } from './hooks/useGridOperators';

// Types
export type * from './types';
