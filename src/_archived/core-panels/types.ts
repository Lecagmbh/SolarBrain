// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED PANEL SYSTEM – Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';

// ── Panel Shell Types ────────────────────────────────────────────────────

export type PanelType = 'slide-over' | 'modal' | 'full-page';

export interface PanelState {
  isOpen: boolean;
  entityType: string;
  entityId: string | number | null;
  config: PanelConfig | null;
}

// ── Badge ────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple';

export interface BadgeConfig {
  text: string;
  variant: BadgeVariant;
  dot?: boolean;
}

// ── Header ───────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'primary'
  | 'primary-outline'
  | 'success'
  | 'danger'
  | 'ghost';

export interface HeaderAction {
  id: string;
  label: string | ((data: Record<string, unknown>) => string);
  variant: ButtonVariant;
  icon?: ReactNode;
  onClick: () => void;
  confirm?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

export interface HeaderConfig<T = Record<string, unknown>> {
  title: (data: T) => string;
  badges: (data: T) => BadgeConfig[];
  actions: (data: T, callbacks: ActionCallbacks) => HeaderAction[];
}

export interface ActionCallbacks {
  close: () => void;
  reload: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

// ── Tabs ─────────────────────────────────────────────────────────────────

export interface TabConfig {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  badge?: number | string;
  component: React.LazyExoticComponent<React.ComponentType<TabProps>> | React.ComponentType<TabProps>;
  /** Only show this tab for certain roles */
  roles?: string[];
}

export interface TabProps {
  entityId: string | number;
  data: Record<string, unknown>;
  onUpdate?: () => void;
}

// ── Sections (Cards) ─────────────────────────────────────────────────────

export interface SectionCardProps {
  title: string;
  badge?: string | number;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

// ── DataGrid ─────────────────────────────────────────────────────────────

export interface DataGridItem {
  label: string;
  value: string | number | ReactNode | null | undefined;
  copyable?: boolean;
  editable?: boolean;
  link?: string;
  sensitive?: boolean;
  mono?: boolean;
}

export interface DataGridProps {
  data: DataGridItem[];
  columns?: 1 | 2;
}

// ── Status Badge ─────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

// ── Workflow Stepper ─────────────────────────────────────────────────────

export type StepStatus = 'completed' | 'active' | 'pending';

export interface WorkflowStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface WorkflowAction {
  id: string;
  label: string;
  variant: ButtonVariant;
  onClick: () => void;
  confirm?: boolean;
  disabled?: boolean;
}

// ── Component Card (PV/WR/Speicher) ──────────────────────────────────────

export type ComponentType = 'pv-module' | 'inverter' | 'battery' | 'wallbox' | 'heatpump';

export interface ComponentCardData {
  type: ComponentType;
  data: Record<string, string | number | null | undefined>;
  count?: number;
}

// ── Panel Config (main config per entity) ────────────────────────────────

export interface PanelConfig {
  entityType: string;
  shellType: PanelType;
  header: HeaderConfig;
  tabs: TabConfig[];
  /** Fetch the entity data */
  fetchData: (id: string | number, token?: string) => Promise<Record<string, unknown>>;
  /** Width override for slide-over */
  width?: string;
}

// ── Layout (for tab content arrangement) ─────────────────────────────────

export interface LayoutRow {
  type: 'row';
  columns: LayoutColumn[];
  className?: string;
}

export interface LayoutColumn {
  section: string;
  span: number;
}
