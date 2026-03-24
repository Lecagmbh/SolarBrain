/**
 * SUB-OVERVIEW HOOK
 * =================
 * Lädt aggregierte Daten pro Subunternehmer für WhiteLabel-Kunden
 */

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./useEnterpriseApi";

const API_BASE = "/api/installations";

export interface SubContractor {
  id: number;
  name: string;
  email: string;
  company: string | null;
  totalAnlagen: number;
  statusBreakdown: Record<string, number>;
  totalKwp: number;
}

export interface SubOverviewResponse {
  subContractors: SubContractor[];
  totalSubs: number;
  totalAnlagen: number;
  totalKwp: number;
}

export function useSubOverview(enabled: boolean = true) {
  return useQuery<SubOverviewResponse>({
    queryKey: ["installations", "sub-overview"],
    queryFn: () => fetchApi<SubOverviewResponse>(`${API_BASE}/sub-overview`),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled,
  });
}
