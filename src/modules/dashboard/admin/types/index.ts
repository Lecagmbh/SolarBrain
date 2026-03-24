/**
 * TYPES v3.0
 * Shared type definitions
 */

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
}

export type UserRole = "ADMIN" | "MITARBEITER" | "KUNDE" | "SUBUNTERNEHMER" | "DEMO";

// Installation Types
export interface Installation {
  id: number;
  publicId: string;
  customerName: string;
  status: InstallationStatus;
  statusLabel?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  gridOperator?: string;
  netzbetreiberId?: number;
  totalKwp?: number;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdByName?: string;
  createdByCompany?: string;
}

export type InstallationStatus = 
  | "entwurf"
  | "eingereicht"
  | "in-pruefung"
  | "warten-auf-nb"
  | "nachbesserung"
  | "nb-genehmigt"
  | "abgeschlossen"
  | "storniert";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  kpis?: {
    total: number;
    open: number;
    thisWeek: number;
    totalKwp: number;
  };
  subUsers?: SubUserStats[];
}

export interface SubUserStats {
  id: number;
  name: string;
  email: string;
  company?: string;
  count: number;
}

// Filter Types
export interface InstallationFilters {
  search?: string;
  status?: string | string[];
  gridOperator?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: number;
}

// Dashboard Types
export interface DashboardKpis {
  total: number;
  open: number;
  thisWeek: number;
  thisMonth: number;
  totalKwp: number;
  openInvoicesCount: number;
  openInvoicesSum: number;
  avgProcessingDays: number;
  completionRate: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface UrgentItem {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  daysWaiting: number;
  type: "overdue" | "sla" | "query" | "nachbesserung";
}

export interface ActivityItem {
  id: number;
  publicId: string;
  customerName: string;
  action: string;
  status: string;
  timestamp: string;
  user?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  category: "system" | "installation" | "email" | "document";
}

// Table Types
export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface SortConfig {
  key: string;
  order: "asc" | "desc";
}

// Form Types
export interface SelectOption {
  value: string;
  label: string;
}
