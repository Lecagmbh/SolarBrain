/**
 * NETZANMELDUNGEN ENTERPRISE - REACT QUERY HOOKS
 * ================================================
 * Optimiert für 10.000+ Einträge mit Caching
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

const API_BASE = "/api/installations";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StatsData {
  eingang: number;
  beimNb: number;
  rueckfrage: number;
  genehmigt: number;
  ibn: number;
  fertig: number;
  storniert: number;
  abgerechnet: number;
  total: number;
  avgDaysBeimNb: number;
  actionRequired: {
    rueckfragen: number;
    zumEinreichen: number;
    zaehlerTermine: number;
    zuLangeBeimNb: number;
    total: number;
  };
}

export interface NBGroup {
  nbId: number | null;
  nbName: string;
  nbShortName: string | null;
  count: number;
  avgDays: number;
}

export interface ListItem {
  id: number;
  publicId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  plz: string | null;
  ort: string | null;
  gridOperator: string | null;
  gridOperatorId: number | null;
  createdAt: string;
  totalKwp: number;
  daysOld: number;
  daysAtNb: number | null;
  nbEingereichtAm: string | null;
  nbGenehmigungAm: string | null;
  zaehlerwechselDatum: string | null;
  zaehlerwechselKundeInformiert: boolean;
  isBilled: boolean;
  priority: string | null;
  // Sub/WhiteLabel Felder
  kundeId: number | null;
  kundeName: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdByCompany: string | null;
}

export interface SubUser {
  id: number;
  name: string;
  email: string;
  company?: string;
  count: number;
}

export interface ListResponse {
  data: ListItem[];
  total: number;
  hasMore: boolean;
  nextCursor: number | null;
  page: number;
  limit: number;
  subUsers?: SubUser[];
  kpis?: {
    total: number;
    nachbesserung: number;
    warten_auf_nb: number;
    nb_genehmigt: number;
    overdue: number;
    byStatus: Record<string, number>;
  };
}

export interface ListFilters {
  status?: string;
  netzbetreiberId?: number;
  kundeId?: number;
  createdById?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export interface CustomerSummary {
  kundeId: number;
  kundeName: string;
  ansprechpartner: string | null;
  plz: string | null;
  ort: string | null;
  email: string | null;
  count: number;
  totalKwp: number;
  lastActivity: string | null;
  statusBreakdown: Record<string, number>;
}

export interface CustomerGroupsResponse {
  groups: CustomerSummary[];
  total: number;
  totalCustomers: number;
  totalKwp: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CustomerGroupFilters {
  search?: string;
  status?: string;
  sortBy?: "name" | "count" | "totalKwp" | "lastActivity";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("baunity_token") || localStorage.getItem("gridnetz_access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Netzwerkfehler" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS HOOK - Workflow Overview Zahlen
// ═══════════════════════════════════════════════════════════════════════════

export function useStats() {
  return useQuery<StatsData>({
    queryKey: ["installations", "stats"],
    queryFn: () => fetchApi<StatsData>(`${API_BASE}/stats`),
    staleTime: 30 * 1000, // 30 Sekunden frisch
    refetchInterval: 60 * 1000, // Alle 60 Sekunden aktualisieren
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUPED BY NB HOOK - Für Netzbetreiber-Übersicht
// ═══════════════════════════════════════════════════════════════════════════

export function useGroupedByNB(status?: string) {
  return useQuery<{ groups: NBGroup[]; total: number }>({
    queryKey: ["installations", "grouped-by-nb", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      return fetchApi<{ groups: NBGroup[]; total: number }>(
        `${API_BASE}/grouped-by-nb?${params.toString()}`
      );
    },
    staleTime: 30 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUPED BY CUSTOMER HOOK - Für Kunden-Übersicht
// ═══════════════════════════════════════════════════════════════════════════

export function useCustomerGroups(filters: CustomerGroupFilters = {}) {
  return useQuery<CustomerGroupsResponse>({
    queryKey: ["installations", "grouped-by-customer", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      return fetchApi<CustomerGroupsResponse>(
        `${API_BASE}/grouped-by-customer?${params.toString()}`
      );
    },
    staleTime: 30 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST HOOK - Paginierte Liste
// ═══════════════════════════════════════════════════════════════════════════

export function useList(filters: ListFilters = {}) {
  const { enabled = true, ...queryFilters } = filters;
  const params = new URLSearchParams();
  if (queryFilters.status) params.set("status", queryFilters.status);
  if (queryFilters.netzbetreiberId) params.set("netzbetreiberId", String(queryFilters.netzbetreiberId));
  if (queryFilters.kundeId !== undefined) params.set("kundeId", String(queryFilters.kundeId));
  if (queryFilters.createdById) params.set("createdById", String(queryFilters.createdById));
  if (queryFilters.search) params.set("search", queryFilters.search);
  if (queryFilters.sortBy) params.set("sortBy", queryFilters.sortBy);
  if (queryFilters.sortOrder) params.set("sortOrder", queryFilters.sortOrder);
  if (queryFilters.page) params.set("page", String(queryFilters.page));
  if (queryFilters.limit) params.set("limit", String(queryFilters.limit || 100));

  // Enterprise-Endpoint nutzen (liefert subUsers + createdBy-Felder)
  return useQuery<ListResponse>({
    queryKey: ["installations", "list", queryFilters],
    queryFn: () => fetchApi<ListResponse>(`${API_BASE}/enterprise?${params.toString()}`),
    staleTime: 15 * 1000,
    enabled,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// INFINITE LIST HOOK - Für virtualisierte endlose Liste
// ═══════════════════════════════════════════════════════════════════════════

export function useInfiniteList(filters: Omit<ListFilters, "page"> = {}) {
  return useInfiniteQuery<ListResponse>({
    queryKey: ["installations", "infinite-list", filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.netzbetreiberId) params.set("netzbetreiberId", String(filters.netzbetreiberId));
      if (filters.search) params.set("search", filters.search);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.limit) params.set("limit", String(filters.limit));
      if (pageParam) params.set("cursor", String(pageParam));

      return fetchApi<ListResponse>(`${API_BASE}/list?${params.toString()}`);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 15 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION REQUIRED ITEMS - Spezielle Abfrage für dringende Aufgaben
// ═══════════════════════════════════════════════════════════════════════════

export function useActionRequired() {
  // Lade Rückfragen
  const rueckfragen = useQuery<ListResponse>({
    queryKey: ["installations", "action-required", "rueckfrage"],
    queryFn: () => fetchApi<ListResponse>(`${API_BASE}/list?status=RUECKFRAGE&limit=20&sortBy=createdAt&sortOrder=asc`),
    staleTime: 30 * 1000,
  });

  // Lade zum Einreichen
  const einreichen = useQuery<ListResponse>({
    queryKey: ["installations", "action-required", "eingang"],
    queryFn: () => fetchApi<ListResponse>(`${API_BASE}/list?status=EINGANG&limit=20&sortBy=createdAt&sortOrder=asc`),
    staleTime: 30 * 1000,
  });

  // Lade Zählerwechsel-Termine (genehmigt + ibn mit Termin)
  const zaehlerTermine = useQuery<ListResponse>({
    queryKey: ["installations", "action-required", "zaehler"],
    queryFn: () => fetchApi<ListResponse>(`${API_BASE}/list?status=GENEHMIGT,IBN&limit=20&sortBy=createdAt&sortOrder=asc`),
    staleTime: 30 * 1000,
  });

  return {
    rueckfragen: rueckfragen.data?.data || [],
    einreichen: einreichen.data?.data || [],
    zaehlerTermine: (zaehlerTermine.data?.data || []).filter(i => i.zaehlerwechselDatum),
    isLoading: rueckfragen.isLoading || einreichen.isLoading || zaehlerTermine.isLoading,
    error: rueckfragen.error || einreichen.error || zaehlerTermine.error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS UPDATE MUTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      return fetchApi<{ success: boolean }>(`${API_BASE}/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      queryClient.invalidateQueries({ queryKey: ["installation-detail"] });
      queryClient.invalidateQueries({ queryKey: ["netzanmeldungen"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PREFETCH HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function usePrefetchStats() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ["installations", "stats"],
      queryFn: () => fetchApi<StatsData>(`${API_BASE}/stats`),
    });
  };
}

export function usePrefetchList(filters: ListFilters) {
  const queryClient = useQueryClient();

  return () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.netzbetreiberId) params.set("netzbetreiberId", String(filters.netzbetreiberId));
    if (filters.limit) params.set("limit", String(filters.limit));

    queryClient.prefetchQuery({
      queryKey: ["installations", "list", filters],
      queryFn: () => fetchApi<ListResponse>(`${API_BASE}/list?${params.toString()}`),
    });
  };
}
