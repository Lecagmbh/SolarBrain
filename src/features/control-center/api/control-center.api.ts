/**
 * CONTROL CENTER API
 * Unified Admin Dashboard API Client
 */

import type { ControlCenterOverview, QuickStatsData, HealthData } from "../types";

const BASE_URL = "/api/control-center";

async function fetchWithAuth<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.data as T;
}

export const controlCenterApi = {
  /**
   * Get full dashboard overview with all KPIs, alerts, and activity
   */
  getOverview: () => fetchWithAuth<ControlCenterOverview>(`${BASE_URL}/overview`),

  /**
   * Get lightweight quick stats for live updates
   */
  getQuickStats: () => fetchWithAuth<QuickStatsData>(`${BASE_URL}/quick-stats`),

  /**
   * Get system health status
   */
  getHealth: () => fetchWithAuth<HealthData>(`${BASE_URL}/health`),
};
