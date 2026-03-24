/**
 * Portal Context
 * ==============
 * State-Management für das Endkunden-Portal.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../pages/AuthContext";
import {
  getPortalInstallations,
  getOnboardingStatus,
  getPortalNotificationCount,
  type PortalInstallation,
  type OnboardingStatus,
} from "./api";

const NOTIFICATION_POLL_INTERVAL = 30_000; // 30 Sekunden

interface PortalContextValue {
  // State
  installations: PortalInstallation[];
  selectedInstallation: PortalInstallation | null;
  onboardingStatus: OnboardingStatus | null;
  loading: boolean;
  error: string | null;
  unreadNotificationCount: number;

  // Actions
  loadInstallations: () => Promise<void>;
  loadOnboardingStatus: () => Promise<void>;
  selectInstallation: (id: number | null) => void;
  clearError: () => void;
  refreshNotifications: () => Promise<void>;

  // Computed
  needsOnboarding: boolean;
  hasRueckfrage: boolean;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<PortalInstallation[]>([]);
  const [selectedInstallation, setSelectedInstallation] = useState<PortalInstallation | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load installations
  const loadInstallations = useCallback(async () => {
    if (user?.role !== "ENDKUNDE_PORTAL") return;

    try {
      setLoading(true);
      setError(null);
      const data = await getPortalInstallations();
      setInstallations(data);

      // Auto-select first if none selected
      if (!selectedInstallation && data.length > 0) {
        setSelectedInstallation(data[0]);
      }
    } catch (err) {
      console.error("[Portal] Load installations failed:", err);
      setError("Fehler beim Laden der Installationen");
    } finally {
      setLoading(false);
    }
  }, [user?.role, selectedInstallation]);

  // Load onboarding status
  const loadOnboardingStatus = useCallback(async () => {
    if (user?.role !== "ENDKUNDE_PORTAL") return;

    try {
      const data = await getOnboardingStatus();
      setOnboardingStatus(data);
    } catch (err) {
      console.error("[Portal] Load onboarding status failed:", err);
    }
  }, [user?.role]);

  // Refresh notification count
  const refreshNotifications = useCallback(async () => {
    if (user?.role !== "ENDKUNDE_PORTAL") return;
    try {
      const { unreadCount } = await getPortalNotificationCount();
      setUnreadNotificationCount(unreadCount);
    } catch {
      // Silently ignore polling errors
    }
  }, [user?.role]);

  // Select installation
  const selectInstallation = useCallback((id: number | null) => {
    if (id === null) {
      setSelectedInstallation(null);
      return;
    }

    const inst = installations.find((i) => i.id === id);
    if (inst) {
      setSelectedInstallation(inst);
    }
  }, [installations]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load - beide API-Calls zusammen
  useEffect(() => {
    const loadAll = async () => {
      if (user?.role !== "ENDKUNDE_PORTAL") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Alle parallel laden
        const [installationsData, onboardingData] = await Promise.all([
          getPortalInstallations().catch((err) => {
            console.error("[Portal] Load installations failed:", err);
            return [] as PortalInstallation[];
          }),
          getOnboardingStatus().catch((err) => {
            console.error("[Portal] Load onboarding status failed:", err);
            return null;
          }),
        ]);

        setInstallations(installationsData);
        if (installationsData.length > 0 && !selectedInstallation) {
          setSelectedInstallation(installationsData[0]);
        }

        setOnboardingStatus(onboardingData);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [user?.role]);

  // Notification-Count Polling (30s)
  useEffect(() => {
    if (user?.role !== "ENDKUNDE_PORTAL") return;

    // Initial fetch
    refreshNotifications();

    // Polling
    pollRef.current = setInterval(refreshNotifications, NOTIFICATION_POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user?.role, refreshNotifications]);

  // Computed values
  const needsOnboarding = onboardingStatus === null
    ? true
    : !onboardingStatus.onboardingCompleted;

  const hasRueckfrage = installations.some(
    (i) => i.status === "RUECKFRAGE" && !i.nbRueckfrageBeantwortet
  );

  return (
    <PortalContext.Provider
      value={{
        installations,
        selectedInstallation,
        onboardingStatus,
        loading,
        error,
        unreadNotificationCount,
        loadInstallations,
        loadOnboardingStatus,
        selectInstallation,
        clearError,
        refreshNotifications,
        needsOnboarding,
        hasRueckfrage,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

export function usePortalInstallation() {
  const { selectedInstallation } = usePortal();
  return selectedInstallation;
}

export function useNeedsOnboarding() {
  const { needsOnboarding } = usePortal();
  return needsOnboarding;
}
