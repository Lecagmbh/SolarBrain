// =============================================================================
// Baunity Dashboard - Custom Hooks
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { dashboardApi } from "../services/dashboard.service";
import { DASHBOARD_PREFS_KEY } from "../config/storage";
import type {
  DashboardSummary,
  DashboardKPIs,
  AlertItem,
  GridOperatorPerformance,
  EmailStats,
} from "../types/dashboard.types";

// -----------------------------------------------------------------------------
// Hook Configuration
// -----------------------------------------------------------------------------

const DEFAULT_REFRESH_INTERVAL = 60000; // 60 Sekunden
const ALERTS_REFRESH_INTERVAL = 30000; // 30 Sekunden (kritischer)

// -----------------------------------------------------------------------------
// useDashboardData - Haupt-Hook für alle Dashboard-Daten
// -----------------------------------------------------------------------------

interface UseDashboardDataReturn {
  // Data
  summary: DashboardSummary | null;
  kpis: DashboardKPIs | null;
  alerts: AlertItem[];
  gridOperators: GridOperatorPerformance[];
  emailStats: EmailStats | null;
  
  // State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
}

export function useDashboardData(
  autoRefreshInterval: number = DEFAULT_REFRESH_INTERVAL
): UseDashboardDataReturn {
  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [gridOperators, setGridOperators] = useState<GridOperatorPerformance[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Refs für Interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallele Requests für bessere Performance
      const [
        summaryData,
        kpisData,
        alertsData,
        gridOperatorsData,
        emailStatsData,
      ] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getKPIs(),
        dashboardApi.getAlerts(),
        dashboardApi.getGridOperatorPerformance(),
        dashboardApi.getEmailStats(),
      ]);

      // Summary
      if (summaryData.status === "fulfilled") {
        setSummary(summaryData.value);
      }

      // KPIs (kann fehlschlagen wenn User = Kunde)
      if (kpisData.status === "fulfilled") {
        setKpis(kpisData.value);
      }

      // Alerts
      if (alertsData.status === "fulfilled") {
        setAlerts(alertsData.value);
      }

      // Grid Operators
      if (gridOperatorsData.status === "fulfilled") {
        setGridOperators(gridOperatorsData.value);
      }

      // Email Stats
      if (emailStatsData.status === "fulfilled") {
        setEmailStats(emailStatsData.value);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Daten");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Nur Alerts refreshen (häufiger)
  const fetchAlerts = useCallback(async () => {
    try {
      const alertsData = await dashboardApi.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error("Alerts fetch error:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshEnabled && autoRefreshInterval > 0) {
      // Haupt-Refresh
      intervalRef.current = setInterval(fetchData, autoRefreshInterval);
      
      // Alerts häufiger refreshen
      alertsIntervalRef.current = setInterval(fetchAlerts, ALERTS_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (alertsIntervalRef.current) clearInterval(alertsIntervalRef.current);
    };
  }, [autoRefreshEnabled, autoRefreshInterval, fetchData, fetchAlerts]);

  // Page visibility handling (pausiere refresh wenn Tab nicht sichtbar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData(); // Refresh beim Tab-Wechsel
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchData]);

  return {
    summary,
    kpis,
    alerts,
    gridOperators,
    emailStats,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    setAutoRefresh: setAutoRefreshEnabled,
  };
}

// -----------------------------------------------------------------------------
// useRelativeTime - Formatiert relative Zeitangaben
// -----------------------------------------------------------------------------

export function useRelativeTime(date: Date | string | null): string {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    if (!date) {
      setRelativeTime("");
      return;
    }

    const updateTime = () => {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) {
        setRelativeTime("Gerade eben");
      } else if (minutes < 60) {
        setRelativeTime(`vor ${minutes} Min.`);
      } else if (hours < 24) {
        setRelativeTime(`vor ${hours} Std.`);
      } else if (days === 1) {
        setRelativeTime("Gestern");
      } else if (days < 7) {
        setRelativeTime(`vor ${days} Tagen`);
      } else {
        setRelativeTime(d.toLocaleDateString("de-DE"));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update jede Minute

    return () => clearInterval(interval);
  }, [date]);

  return relativeTime;
}

// -----------------------------------------------------------------------------
// useLocalStorage - Persistente Einstellungen
// -----------------------------------------------------------------------------

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  return [storedValue, setValue];
}

// -----------------------------------------------------------------------------
// useDashboardPreferences - Benutzer-Einstellungen
// -----------------------------------------------------------------------------

interface DashboardPreferences {
  showKPIs: boolean;
  showPipeline: boolean;
  showAlerts: boolean;
  showActivityFeed: boolean;
  showGridOperators: boolean;
  showEmailWidget: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  showKPIs: true,
  showPipeline: true,
  showAlerts: true,
  showActivityFeed: true,
  showGridOperators: true,
  showEmailWidget: true,
  autoRefresh: true,
  compactMode: false,
};

export function useDashboardPreferences() {
  return useLocalStorage<DashboardPreferences>(
    DASHBOARD_PREFS_KEY,
    DEFAULT_PREFERENCES
  );
}
