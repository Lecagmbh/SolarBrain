/**
 * ===============================================================================
 * USE TRACKING HOOK - Intelligence System Phase 2
 * Frontend Tracking mit Event Buffering & API Integration
 * ===============================================================================
 */

import { useCallback, useRef } from "react";
import { useAuth } from "../pages/AuthContext";

// ===============================================================================
// TYPES
// ===============================================================================

export type TrackingEventType =
  | "PAGE_VIEW"
  | "CLICK"
  | "FORM_SUBMIT"
  | "SEARCH"
  | "API_CALL"
  | "CUSTOM";

export interface TrackingEvent {
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

// ===============================================================================
// CONFIGURATION
// ===============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

// ===============================================================================
// HOOK
// ===============================================================================

/** Auth-Header für Tracking-Requests (Cookie + Bearer-Token Fallback) */
function getTrackingHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("baunity_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function useTracking() {
  const { user } = useAuth() as { user: { id?: number; role?: string } | null };
  const bufferRef = useRef<TrackingEvent[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Get or set the session ID
   */
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current =
        sessionStorage.getItem("tracking_session_id") || null;
    }
    return sessionIdRef.current;
  }, []);

  const setSessionId = useCallback((id: string) => {
    sessionIdRef.current = id;
    sessionStorage.setItem("tracking_session_id", id);
  }, []);

  /**
   * Flush buffer to API
   */
  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;

    const events = [...bufferRef.current];
    bufferRef.current = [];

    try {
      const response = await fetch(`${API_BASE_URL}/api/tracking/batch`, {
        method: "POST",
        headers: getTrackingHeaders(),
        credentials: "include",
        body: JSON.stringify({
          events: events.map((e) => ({
            ...e,
            sessionId: e.sessionId || getSessionId(),
          })),
        }),
      });

      if (!response.ok) {
        // Re-add failed events to buffer
        bufferRef.current.unshift(...events);
        console.error("[Tracking] Flush failed:", response.status);
      }
    } catch (error) {
      // Re-add failed events to buffer
      bufferRef.current.unshift(...events);
      console.error("[Tracking] Flush error:", error);
    }
  }, [getSessionId]);

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
      bufferRef.current.push({
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || getSessionId() || undefined,
      });

      // Immediate flush if buffer is full
      if (bufferRef.current.length >= BUFFER_SIZE) {
        flush();
      } else {
        scheduleFlush();
      }
    },
    [flush, scheduleFlush, getSessionId]
  );

  /**
   * Track a generic event
   */
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

  /**
   * Track a page view
   */
  const trackPageView = useCallback(
    (pagePath?: string, referrer?: string) => {
      const path = pagePath || window.location.pathname;

      // Send immediately for page views
      fetch(`${API_BASE_URL}/api/tracking/page-view`, {
        method: "POST",
        headers: getTrackingHeaders(),
        credentials: "include",
        body: JSON.stringify({
          sessionId: getSessionId(),
          pagePath: path,
          referrer: referrer || document.referrer,
        }),
      }).catch((err) => console.error("[Tracking] Page view error:", err));
    },
    [getSessionId]
  );

  /**
   * Track a click event
   */
  const trackClick = useCallback(
    (
      element: string,
      options?: {
        componentName?: string;
        pagePath?: string;
      }
    ) => {
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

  /**
   * Track a form submission
   */
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

  /**
   * Track a search event
   */
  const trackSearch = useCallback(
    (
      query: string,
      options?: {
        resultsCount?: number;
        pagePath?: string;
        searchType?: string;
      }
    ) => {
      // Send immediately for search events
      fetch(`${API_BASE_URL}/api/tracking/search`, {
        method: "POST",
        headers: getTrackingHeaders(),
        credentials: "include",
        body: JSON.stringify({
          sessionId: getSessionId(),
          query,
          resultsCount: options?.resultsCount,
          pagePath: options?.pagePath || window.location.pathname,
          searchType: options?.searchType,
        }),
      }).catch((err) => console.error("[Tracking] Search error:", err));
    },
    [getSessionId]
  );

  /**
   * Track installation action
   */
  const trackInstallation = useCallback(
    (installationId: number | string, action: string, details?: Record<string, unknown>) => {
      trackEvent(`installation_${action}`, "installation", {
        entityType: "Installation",
        entityId: String(installationId),
        properties: details,
      });
    },
    [trackEvent]
  );

  /**
   * Track document action
   */
  const trackDocument = useCallback(
    (documentId: number | string, action: string, details?: Record<string, unknown>) => {
      trackEvent(`document_${action}`, "document", {
        entityType: "Document",
        entityId: String(documentId),
        properties: details,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackInstallation,
    trackDocument,
    flush,
    getSessionId,
    setSessionId,
  };
}

export default useTracking;
