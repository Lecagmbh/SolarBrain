// ============================================
// FINANZEN MODULE - useInvoices Hook
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import type { 
  Invoice, 
  InvoiceDetail, 
  FilterState, 
  KPIData
} from "../types";
import { 
  fetchInvoices, 
  fetchInvoiceDetail, 
  markInvoicePaid, 
  finalizeInvoice,
  bulkMarkPaid
} from "../api";
import { 
  filterInvoices, 
  sortInvoices, 
  calculateKPIs, 
  getStatusCounts 
} from "../utils";

// ============================================
// HOOK
// ============================================

interface UseInvoicesOptions {
  initialPage?: number;
  initialLimit?: number;
  autoLoad?: boolean;
}

interface UseInvoicesReturn {
  // Data
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  selectedInvoice: InvoiceDetail | null;
  kpis: KPIData;
  statusCounts: Record<string, number>;
  
  // State
  loading: boolean;
  refreshing: boolean;
  detailLoading: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  
  // Selection
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  selectedIds: Set<number>;
  toggleSelect: (id: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // Actions
  load: (refresh?: boolean) => Promise<void>;
  loadDetail: (id: number) => Promise<void>;
  markPaid: (id: number) => Promise<boolean>;
  finalize: (id: number) => Promise<boolean>;
  bulkPaid: () => Promise<{ success: number; failed: number }>;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  status: "all",
  sortKey: "rechnungs_datum",
  sortDir: "desc",
};

export function useInvoices(options: UseInvoicesOptions = {}): UseInvoicesReturn {
  const { 
    initialPage = 1, 
    initialLimit = 100, 
    autoLoad = true 
  } = options;

  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  
  // Loading State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const limit = initialLimit;
  
  // Selection State
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Filter State
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);

  // ============================================
  // LOAD DATA
  // ============================================

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetchInvoices(page, limit);
      setInvoices(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      
      // Auto-select first invoice if none selected
      if (!selectedId && response.data?.[0]) {
        setSelectedId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, selectedId]);

  const loadDetail = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      const detail = await fetchInvoiceDetail(id);
      setSelectedInvoice(detail);
    } catch (err) {
      console.error("Failed to load invoice detail:", err);
      setSelectedInvoice(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [page, autoLoad]);

  // Load detail when selection changes
  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedId, loadDetail]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const filteredInvoices = useMemo(() => {
    let result = filterInvoices(invoices, filters.search, filters.status);
    result = sortInvoices(result, filters.sortKey, filters.sortDir);
    return result;
  }, [invoices, filters]);

  const kpis = useMemo(() => calculateKPIs(invoices), [invoices]);
  
  const statusCounts = useMemo(() => getStatusCounts(invoices), [invoices]);

  // ============================================
  // SELECTION HANDLERS
  // ============================================

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredInvoices.map(inv => inv.id)));
  }, [filteredInvoices]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ============================================
  // FILTER HANDLERS
  // ============================================

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const markPaid = useCallback(async (id: number): Promise<boolean> => {
    try {
      await markInvoicePaid(id);
      await load(true);
      if (id === selectedId) {
        await loadDetail(id);
      }
      return true;
    } catch (err) {
      console.error("Failed to mark as paid:", err);
      return false;
    }
  }, [load, loadDetail, selectedId]);

  const finalize = useCallback(async (id: number): Promise<boolean> => {
    try {
      await finalizeInvoice(id);
      await load(true);
      if (id === selectedId) {
        await loadDetail(id);
      }
      return true;
    } catch (err) {
      console.error("Failed to finalize:", err);
      return false;
    }
  }, [load, loadDetail, selectedId]);

  const bulkPaid = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkMarkPaid(ids);
    if (result.success > 0) {
      await load(true);
      setSelectedIds(new Set());
    }
    return result;
  }, [selectedIds, load]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    invoices,
    filteredInvoices,
    selectedInvoice,
    kpis,
    statusCounts,
    
    // State
    loading,
    refreshing,
    detailLoading,
    error,
    
    // Pagination
    page,
    totalPages,
    setPage,
    
    // Selection
    selectedId,
    setSelectedId,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    
    // Filters
    filters,
    setFilters,
    resetFilters,
    
    // Actions
    load,
    loadDetail,
    markPaid,
    finalize,
    bulkPaid,
  };
}
