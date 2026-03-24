// =============================================================================
// Baunity Dashboard V4 - Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface DashboardSummary {
  totalInstallations: number;
  openNetRegistrations: number;
  avgStartHours: number | null;
  lastActivityLabel: string | null;
  pipeline: PipelineStage[];
  activities: ActivityItem[];
}

export interface DashboardKPIs {
  neueAnmeldungen: KPIData;
  abgeschlossen: KPIData;
  kunden: KPIData;
  anlagen: KPIData;
  offeneRechnungen: KPIDataWithSum;
}

export interface KPIData {
  value: number;
  trend?: number;
  label: string;
}

export interface KPIDataWithSum extends KPIData {
  summe: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
}

export interface ActivityItem {
  id: number;
  publicId: string;
  customerName: string;
  location: string;
  status: string;
  statusLabel: string;
  gridOperator: string | null;
  updatedAt: string;
  createdBy: string;
  createdByRole: string;
}

export interface PriorityData {
  p1: { count: number; label: string };
  p2: { count: number; label: string };
  p3: { count: number; label: string };
}

// -----------------------------------------------------------------------------
// Alert Types
// -----------------------------------------------------------------------------

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = 
  | "nb_query" 
  | "ibn_missing" 
  | "invoice_overdue" 
  | "email_unassigned"
  | "document_missing"
  | "approval_received";

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  count?: number;
  oldestDays?: number;
  amount?: number;
  installationIds?: number[];
  link: string;
  actionLabel?: string;
}

// -----------------------------------------------------------------------------
// Grid Operator Performance
// -----------------------------------------------------------------------------

export interface GridOperatorPerformance {
  id: number;
  name: string;
  shortName?: string;
  avgDays: number | null;
  openCases: number;
  totalCases: number;
  approvalRate: number;
  trend: "up" | "down" | "stable";
}

// -----------------------------------------------------------------------------
// Email Stats
// -----------------------------------------------------------------------------

export interface EmailStats {
  unreadCount: number;
  unassignedCount: number;
  needsReviewCount: number;
}

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

export interface AlertBoxProps {
  alerts: AlertItem[];
  maxItems?: number;
  onViewAll: () => void;
  onAlertClick: (alert: AlertItem) => void;
}

export interface KPICardsProps {
  kpis: DashboardKPIs | null;
  loading?: boolean;
}

export interface WorkflowPipelineProps {
  stages: PipelineStage[];
  onStageClick: (stageKey: string) => void;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  onViewAll: () => void;
  onActivityClick: (activity: ActivityItem) => void;
}

export interface GridOperatorRankingProps {
  operators: GridOperatorPerformance[];
  maxItems?: number;
  onViewAll: () => void;
}

export interface EmailWidgetProps {
  stats: EmailStats | null;
  onOpenInbox: () => void;
}

// -----------------------------------------------------------------------------
// Workflow Configuration
// -----------------------------------------------------------------------------

export interface WorkflowStageConfig {
  key: string;
  label: string;
  statuses: string[];
  color: string;
  icon: string; // Lucide icon name
}

export const WORKFLOW_STAGES: WorkflowStageConfig[] = [
  { key: "eingang", label: "Eingang", statuses: ["EINGANG"], color: "#3b82f6", icon: "Zap" },
  { key: "beim_nb", label: "Beim NB", statuses: ["BEIM_NB"], color: "#f59e0b", icon: "Clock" },
  { key: "rueckfrage", label: "Rückfrage", statuses: ["RUECKFRAGE"], color: "#ef4444", icon: "AlertTriangle" },
  { key: "genehmigt", label: "Genehmigt", statuses: ["GENEHMIGT"], color: "#22c55e", icon: "CheckCircle" },
  { key: "ibn", label: "IBN", statuses: ["IBN"], color: "#EAD068", icon: "FileText" },
  { key: "fertig", label: "Fertig", statuses: ["FERTIG"], color: "#10b981", icon: "PartyPopper" },
];

// -----------------------------------------------------------------------------
// Status Mapping
// -----------------------------------------------------------------------------

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  eingang: { label: "Eingang", color: "#3b82f6", bgColor: "#eff6ff" },
  beim_nb: { label: "Beim NB", color: "#f59e0b", bgColor: "#fffbeb" },
  rueckfrage: { label: "Rückfrage", color: "#ef4444", bgColor: "#fef2f2" },
  genehmigt: { label: "Genehmigt", color: "#22c55e", bgColor: "#f0fdf4" },
  ibn: { label: "IBN", color: "#EAD068", bgColor: "#f5f3ff" },
  fertig: { label: "Fertig", color: "#10b981", bgColor: "#f0fdfa" },
  storniert: { label: "Storniert", color: "#6b7280", bgColor: "#f9fafb" },
};
