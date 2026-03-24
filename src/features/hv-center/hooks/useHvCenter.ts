/**
 * HV CENTER HOOKS
 * Data fetching and state management for Handelsvertreter Center
 */

import { useState, useEffect, useCallback } from "react";
import { hvCenterApi } from "../api/hv-center.api";
import type { HvDashboardData } from "../types";

export function useHvDashboard() {
  const [data, setData] = useState<HvDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await hvCenterApi.getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Fehler beim Laden");
      console.warn("useHvDashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refresh };
}
