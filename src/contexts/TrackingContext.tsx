/**
 * ===============================================================================
 * TRACKING PROVIDER - Intelligence System Phase 2
 * Automatic Session Management, Page View Tracking, Event Buffering
 * ===============================================================================
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";

// ===============================================================================
// TYPES
// ===============================================================================

type TrackingEventType =
  | "PAGE_VIEW"
  | "CLICK"
  | "FORM_SUBMIT"
  | "SEARCH"
  | "API_CALL"
  | "CUSTOM";

interface TrackingEvent {
  eventType: TrackingEventType;
  eventName: string;
  eventCategory: string;
  sessionId?: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
  pagePath?: string;
  componentName?: string;
  duration?: number;
  timestamp?: Date;
}

interface TrackingContextValue {
  sessionId: string | null;
  isActive: boolean;
  trackEvent: (
    eventName: string,
    category: string,
    options?: {
      eventType?: TrackingEventType;
      entityType?: string;
      entityId?: string;
      properties?: Record<string, unknown>;
      pagePath?: string;
      componentName?: string;
      duration?: number;
    }
  ) => void;
  trackClick: (
    element: string,
    options?: { componentName?: string; pagePath?: string }
  ) => void;
  trackFormSubmit: (
    formName: string,
    options?: {
      success?: boolean;
      errorMessage?: string;
      pagePath?: string;
      componentName?: string;
    }
  ) => void;
  trackSearch: (
    query: string,
    options?: { resultsCount?: number; pagePath?: string; searchType?: string }
  ) => void;
  trackInstallation: (
    installationId: number | string,
    action: string,
    details?: Record<string, unknown>
  ) => void;
  trackDocument: (
    documentId: number | string,
    action: string,
    details?: Record<string, unknown>
  ) => void;
}

// ===============================================================================
// CONFIGURATION
// ===============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

/** Auth-Header für Tracking-Requests (Cookie + Bearer-Token Fallback) */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("baunity_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ===============================================================================
// CONTEXT
// ===============================================================================

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function useTracking() {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    // Return no-op functions if used outside provider
    return {
      sessionId: null,
      isActive: false,
      trackEvent: () => {},
      trackClick: () => {},
      trackFormSubmit: () => {},
      trackSearch: () => {},
      trackInstallation: () => {},
      trackDocument: () => {},
    };
  }
  return ctx;
}

// ===============================================================================
// PROVIDER
// ===============================================================================

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const bufferRef = useRef<TrackingEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPageRef = useRef<string>("");

  // ===============================================================================
  // SESSION MANAGEMENT
  // ===============================================================================

  /**
   * Start a new tracking session
   */
  const startSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracking/session/start`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          landingPage: window.location.pathname,
          referrer: document.referrer || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.sessionId) {
          setSessionId(data.data.sessionId);
          sessionStorage.setItem("tracking_session_id", data.data.sessionId);
          setIsActive(true);
          // Tracking session started
        }
      }
    } catch (error) {
      console.error("[Tracking] Failed to start session:", error);
    }
  }, []);

  /**
   * Associate user with session (after login)
   */
  const associateUser = useCallback(async () => {
    const sid = sessionId || sessionStorage.getItem("tracking_session_id");
    if (!sid || !user?.id) return;

    try {
      await fetch(`${API_BASE_URL}/api/tracking/session/associate`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ sessionId: sid }),
      });
      // User associated with tracking session
    } catch (error) {
      console.error("[Tracking] Failed to associate user:", error);
    }
  }, [sessionId, user?.id]);

  /**
   * Send heartbeat to keep session alive
   */
  const sendHeartbeat = useCallback(async () => {
    const sid = sessionId || sessionStorage.getItem("tracking_session_id");
    if (!sid) return;

    try {
      await fetch(`${API_BASE_URL}/api/tracking/session/heartbeat`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ sessionId: sid }),
      });
    } catch (error) {
      // Silent fail for heartbeat
    }
  }, [sessionId]);

  /**
   * End session (on page unload)
   */
  const endSession = useCallback(async () => {
    const sid = sessionId || sessionStorage.getItem("tracking_session_id");
    if (!sid) return;

    // Use sendBeacon for reliability during unload
    const data = JSON.stringify({
      sessionId: sid,
      exitPage: window.location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${API_BASE_URL}/api/tracking/session/end`,
        new Blob([data], { type: "application/json" })
      );
    } else {
      fetch(`${API_BASE_URL}/api/tracking/session/end`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: data,
        keepalive: true,
      }).catch(() => {});
    }

    sessionStorage.removeItem("tracking_session_id");
    setSessionId(null);
    setIsActive(false);
  }, [sessionId]);

  // ===============================================================================
  // EVENT TRACKING
  // ===============================================================================

  /**
   * Flush buffer to API
   */
  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;

    const events = [...bufferRef.current];
    bufferRef.current = [];

    const sid = sessionId || sessionStorage.getItem("tracking_session_id");

    try {
      const response = await fetch(`${API_BASE_URL}/api/tracking/batch`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          events: events.map((e) => ({
            ...e,
            sessionId: e.sessionId || sid,
          })),
        }),
      });

      if (!response.ok) {
        bufferRef.current.unshift(...events);
      }
    } catch (error) {
      bufferRef.current.unshift(...events);
    }
  }, [sessionId]);

  /**
   * Schedule flush
   */
  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(flush, FLUSH_INTERVAL_MS);
  }, [flush]);

  /**
   * Add event to buffer
   */
  const addToBuffer = useCallback(
    (event: TrackingEvent) => {
      const sid = sessionId || sessionStorage.getItem("tracking_session_id");
      bufferRef.current.push({
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || sid || undefined,
      });

      if (bufferRef.current.length >= BUFFER_SIZE) {
        flush();
      } else {
        scheduleFlush();
      }
    },
    [flush, scheduleFlush, sessionId]
  );

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    (pagePath: string) => {
      const sid = sessionId || sessionStorage.getItem("tracking_session_id");

      fetch(`${API_BASE_URL}/api/tracking/page-view`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          sessionId: sid,
          pagePath,
          referrer: lastPageRef.current || document.referrer,
        }),
      }).catch((err) => console.error("[Tracking] Page view error:", err));

      lastPageRef.current = pagePath;
    },
    [sessionId]
  );

  // ===============================================================================
  // PUBLIC TRACKING METHODS
  // ===============================================================================

  const trackEvent = useCallback(
    (
      eventName: string,
      category: string,
      options?: {
        eventType?: TrackingEventType;
        entityType?: string;
        entityId?: string;
        properties?: Record<string, unknown>;
        pagePath?: string;
        componentName?: string;
        duration?: number;
      }
    ) => {
      addToBuffer({
        eventType: options?.eventType || "CUSTOM",
        eventName,
        eventCategory: category,
        entityType: options?.entityType,
        entityId: options?.entityId,
        properties: options?.properties,
        pagePath: options?.pagePath || window.location.pathname,
        componentName: options?.componentName,
        duration: options?.duration,
      });
    },
    [addToBuffer]
  );

  const trackClick = useCallback(
    (element: string, options?: { componentName?: string; pagePath?: string }) => {
      addToBuffer({
        eventType: "CLICK",
        eventName: `click_${element}`,
        eventCategory: "interaction",
        componentName: options?.componentName,
        pagePath: options?.pagePath || window.location.pathname,
      });
    },
    [addToBuffer]
  );

  const trackFormSubmit = useCallback(
    (
      formName: string,
      options?: {
        success?: boolean;
        errorMessage?: string;
        pagePath?: string;
        componentName?: string;
      }
    ) => {
      addToBuffer({
        eventType: "FORM_SUBMIT",
        eventName: `form_submit_${formName}`,
        eventCategory: "form",
        pagePath: options?.pagePath || window.location.pathname,
        componentName: options?.componentName,
        properties: {
          success: options?.success,
          errorMessage: options?.errorMessage,
        },
      });
    },
    [addToBuffer]
  );

  const trackSearch = useCallback(
    (
      query: string,
      options?: { resultsCount?: number; pagePath?: string; searchType?: string }
    ) => {
      const sid = sessionId || sessionStorage.getItem("tracking_session_id");

      fetch(`${API_BASE_URL}/api/tracking/search`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          sessionId: sid,
          query,
          resultsCount: options?.resultsCount,
          pagePath: options?.pagePath || window.location.pathname,
          searchType: options?.searchType,
        }),
      }).catch((err) => console.error("[Tracking] Search error:", err));
    },
    [sessionId]
  );

  const trackInstallation = useCallback(
    (
      installationId: number | string,
      action: string,
      details?: Record<string, unknown>
    ) => {
      trackEvent(`installation_${action}`, "installation", {
        entityType: "Installation",
        entityId: String(installationId),
        properties: details,
      });
    },
    [trackEvent]
  );

  const trackDocument = useCallback(
    (
      documentId: number | string,
      action: string,
      details?: Record<string, unknown>
    ) => {
      trackEvent(`document_${action}`, "document", {
        entityType: "Document",
        entityId: String(documentId),
        properties: details,
      });
    },
    [trackEvent]
  );

  // ===============================================================================
  // EFFECTS
  // ===============================================================================

  // Initialize session
  useEffect(() => {
    const existingSession = sessionStorage.getItem("tracking_session_id");
    if (existingSession) {
      setSessionId(existingSession);
      setIsActive(true);
    } else {
      startSession();
    }

    // Setup heartbeat
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Cleanup on unload
    const handleUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flush();
    };
  }, [startSession, sendHeartbeat, endSession, flush]);

  // Associate user when logged in
  useEffect(() => {
    if (user?.id && sessionId) {
      associateUser();
    }
  }, [user?.id, sessionId, associateUser]);

  // Track page views on route change
  useEffect(() => {
    if (isActive && location.pathname !== lastPageRef.current) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, isActive, trackPageView]);

  // ===============================================================================
  // RENDER
  // ===============================================================================

  const value: TrackingContextValue = {
    sessionId,
    isActive,
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackInstallation,
    trackDocument,
  };

  return (
    <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
  );
}

export default TrackingContext;
