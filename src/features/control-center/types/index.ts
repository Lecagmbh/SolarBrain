/**
 * CONTROL CENTER TYPES
 * Unified Admin Dashboard Type Definitions
 */

export interface KpiData {
  value: number;
  trend?: number | null;
  label: string;
  avgWaitDays?: number;
  total?: number;
  overdue?: number;
}

export interface PipelineData {
  ENTWURF: number;
  WARTEN_AUF_DOKUMENTE: number;
  BEREIT_ZUR_EINREICHUNG: number;
  BEIM_NB: number;
  NB_RUECKFRAGE: number;
  GENEHMIGT: number;
  FERTIG: number;
  STORNIERT: number;
}

export interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  message: string | null;
  category: string;
  timestamp: string;
  userName: string;
}

export interface LongestWaiting {
  id: number;
  publicId: string;
  customerName: string;
  netzbetreiber: string | null;
  waitDays: number;
}

export interface ControlCenterOverview {
  kpis: {
    totalInstallations: KpiData;
    activeInstallations: KpiData;
    beimNb: KpiData;
    emailsToday: KpiData;
    openInvoices: KpiData;
    activeUsers: KpiData;
    netzbetreiber: KpiData;
    errors: KpiData;
  };
  pipeline: PipelineData;
  alerts: Alert[];
  recentActivity: ActivityItem[];
  longestWaiting: LongestWaiting[];
  generatedAt: string;
}

export interface QuickStatsData {
  active: number;
  beimNb: number;
  errors: number;
  emails: number;
}

export interface HealthData {
  status: "ok" | "warning" | "error";
  checks: Record<string, { status: "ok" | "warning" | "error"; message?: string }>;
  timestamp: string;
}
