/**
 * CONTROL CENTER HOOKS
 * Data fetching and state management for Control Center
 */

import { useState, useEffect, useCallback } from "react";
import { controlCenterApi } from "../api/control-center.api";
import type { ControlCenterOverview, QuickStatsData, HealthData } from "../types";

export function useControlCenter() {
  const [data, setData] = useState<ControlCenterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await controlCenterApi.getOverview();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { data, loading, error, refresh };
}

export function useQuickStats() {
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const result = await controlCenterApi.getQuickStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "QuickStats Fehler");
      console.warn("[useQuickStats] Fehler:", err);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Quick stats refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return { stats, error };
}

export function useSystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      const result = await controlCenterApi.getHealth();
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health Check Fehler");
      console.warn("[useSystemHealth] Fehler:", err);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    // Health check every 5 minutes
    const interval = setInterval(loadHealth, 300000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  return { health, error };
}
