/**
 * Dashboard Types - Baunity Dashboard Redesign
 */

// User roles
export type UserRole = 'ADMIN' | 'MITARBEITER' | 'KUNDE' | 'SUBUNTERNEHMER' | 'DEMO';

// Pipeline stages
export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  icon?: string;
}

// Action required item
export type ActionType =
  | 'nb-mails'
  | 'submit'
  | 'ibn'
  | 'followup'
  | 'queries'
  | 'documents'
  | 'termine';

export interface ActionItem {
  type: ActionType;
  count: number;
  label: string;
  urgent?: boolean;
  onClick?: () => void;
}

// Task/Handlungsbedarf item
export interface TaskItem {
  id: string | number;
  publicId?: string;
  title: string;
  subtitle?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date | string;
  assignee?: string;
  type: string;
  onClick?: () => void;
}

// Customer Anlage
export interface CustomerAnlage {
  id: string | number;
  publicId?: string;
  standort: string;
  status: string;
  statusLabel: string;
  leistung?: number;
  netzbetreiber?: string;
  lastUpdate?: Date | string;
  onClick?: () => void;
}

// NB Performance stats
export interface NBPerformanceItem {
  id: string | number;
  name: string;
  avgDays: number | null;
  openCases: number;
  approvalRate: number;
  trend: 'up' | 'down' | 'stable';
}

// Activity feed item
export interface ActivityItem {
  id: string | number;
  publicId?: string;
  type: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: string;
  status?: string;
  onClick?: () => void;
}

// Upcoming Termin
export interface TerminItem {
  id: string | number;
  title: string;
  date: Date | string;
  time?: string;
  location?: string;
  type: 'ibn' | 'zaehlerwechsel' | 'meeting' | 'other';
  anmeldungId?: string | number;
  onClick?: () => void;
}

// Dashboard data aggregated
export interface DashboardData {
  // Header
  openCount: number;

  // Action Required
  actionItems: ActionItem[];

  // Pipeline
  pipelineStages: PipelineStage[];

  // Tasks (Admin)
  tasks?: TaskItem[];

  // Anlagen (Kunde)
  anlagen?: CustomerAnlage[];

  // Insights
  nbPerformance?: NBPerformanceItem[];
  activities: ActivityItem[];
  termine?: TerminItem[];

  // Meta
  lastUpdated: Date | string;
  isLoading: boolean;
  error?: string;
}

// Quick action types
export type QuickActionType =
  | 'new-anmeldung'
  | 'import'
  | 'emails'
  | 'documents'
  | 'analytics'
  | 'settings';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  primary?: boolean;
  onClick?: () => void;
}
