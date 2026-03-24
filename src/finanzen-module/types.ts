// ============================================
// FINANZEN MODULE - TYPES
// ============================================

import type { LucideIcon } from "lucide-react";

// ============================================
// INVOICE TYPES
// ============================================

export interface Invoice {
  id: number;
  rechnungsnummer: string;
  kunde_id: number;
  kunde_name: string;
  rechnungs_datum: string | null;
  faellig_am: string | null;
  betrag_netto: number;
  betrag_mwst: number;
  betrag_brutto: number;
  status: InvoiceStatus;
  notizen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceDetail extends Invoice {
  kunde_email?: string;
  kunde_adresse?: string;
  positionen?: InvoicePosition[];
  zahlungen?: Payment[];
  dokumente?: Document[];
}

export interface InvoicePosition {
  id: number;
  beschreibung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  gesamtpreis: number;
  mwst_satz: number;
}

export interface Payment {
  id: number;
  datum: string;
  betrag: number;
  methode: string;
  referenz?: string;
}

export interface Document {
  id: number;
  name: string;
  typ: string;
  url: string;
  created_at: string;
}

export type InvoiceStatus = 
  | "ENTWURF" 
  | "OFFEN" 
  | "VERSENDET" 
  | "BEZAHLT" 
  | "UEBERFAELLIG" 
  | "STORNIERT";

// ============================================
// API TYPES
// ============================================

export interface ListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================
// UI TYPES
// ============================================

export type StatusFilter = "all" | InvoiceStatus;
export type SortKey = "rechnungsnummer" | "kunde_name" | "rechnungs_datum" | "betrag_brutto" | "status";
export type SortDir = "asc" | "desc";
export type ViewMode = "table" | "grid";

export interface StatusInfo {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export interface CommandAction {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

// ============================================
// KPI TYPES
// ============================================

export interface KPIData {
  total: {
    count: number;
    sum: number;
    trend: number;
  };
  paid: {
    count: number;
    sum: number;
    percent: number;
    trend: number;
  };
  open: {
    count: number;
    sum: number;
    trend: number;
  };
  overdue: {
    count: number;
    sum: number;
  };
  drafts: {
    count: number;
  };
}

// ============================================
// FILTER STATE
// ============================================

export interface FilterState {
  search: string;
  status: StatusFilter;
  sortKey: SortKey;
  sortDir: SortDir;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface KPICardsProps {
  data: KPIData;
  loading?: boolean;
  onFilterChange?: (status: StatusFilter) => void;
}

export interface InvoiceTableProps {
  invoices: Invoice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  bulkMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onMarkPaid?: (id: number) => void;
  onPreview?: (id: number) => void;
  isKunde?: boolean;
}

export interface InvoiceGridProps {
  invoices: Invoice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export interface InvoiceDetailProps {
  invoice: InvoiceDetail | null;
  loading?: boolean;
  onClose: () => void;
  onFinalize?: (id: number) => void;
  onMarkPaid?: (id: number) => void;
  onPreview?: (id: number) => void;
  isKunde?: boolean;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  counts: Record<StatusFilter, number>;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  bulkMode: boolean;
  onBulkModeChange: (enabled: boolean) => void;
  selectedCount?: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBulkAction?: (action: string) => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}
