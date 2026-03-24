/**
 * Baunity WebSocket Hook
 * =======================
 * Echtzeit-Updates für alle Komponenten
 *
 * Features:
 * - Automatische Verbindung mit Token
 * - Automatische Reconnection
 * - Channel-Subscription
 * - Event-Handler
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getAuthToken } from "../config/storage";
import { refreshTokens } from "../utils/tokenRefresh";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage {
  event: string;
  data: unknown;
}

type EventHandler = (data: unknown) => void;

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  subscribe: (event: string, handler: EventHandler) => () => void;
  unsubscribe: (event: string, handler: EventHandler) => void;
  send: (type: string, payload?: Record<string, unknown>) => void;
  connect: () => void;
  disconnect: () => void;
  subscribeToChannel: (channel: string) => void;
  unsubscribeFromChannel: (channel: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET URL
// ═══════════════════════════════════════════════════════════════════════════

function getWebSocketUrl(): string {
  // Support VITE_API_BASE_URL for Electron/Desktop builds
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl) {
    const url = new URL(baseUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/ws/installations`;
  }

  // Electron Desktop: app:// kann kein WebSocket → direkt zu baunity.de
  if (window.baunityDesktop?.isDesktop) {
    return "wss://baunity.de/ws/installations";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws/installations`;
}

/**
 * Prüft ob ein JWT-Token bald abläuft
 */
function isTokenExpiringSoon(token: string, bufferSeconds: number): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload?.exp) return false;
    const secondsRemaining = payload.exp - Math.floor(Date.now() / 1000);
    return secondsRemaining <= bufferSeconds;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnectRef = useRef(false);
  const tokenCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECT
  // ═══════════════════════════════════════════════════════════════════════════

  const connect = useCallback(() => {
    // Don't connect if already connected/connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    isManualDisconnectRef.current = false;
    setStatus("connecting");

    // Get token from central storage
    const token = getAuthToken();
    if (!token) {
      console.warn("[WebSocket] No auth token found, connection deferred");
      setStatus("disconnected");
      return;
    }

    // Build URL with token
    const url = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // WebSocket connected
        setStatus("connected");
        reconnectAttemptsRef.current = 0;

        // Subscribe to default channels
        ws.send(JSON.stringify({
          type: "subscribe",
          channels: ["installations", "documents", "tasks", "intelligence"],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handlers = handlersRef.current.get(message.event);

          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(message.data);
              } catch (e) {
                console.error("[WebSocket] Handler error:", e);
              }
            });
          }

          // Also emit to "*" handlers (global listeners)
          const globalHandlers = handlersRef.current.get("*");
          if (globalHandlers) {
            globalHandlers.forEach((handler) => {
              try {
                handler({ event: message.event, data: message.data });
              } catch (e) {
                console.error("[WebSocket] Global handler error:", e);
              }
            });
          }
        } catch (e) {
          console.error("[WebSocket] Failed to parse message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setStatus("error");
      };

      ws.onclose = (event) => {
        // WebSocket disconnected
        setStatus("disconnected");
        wsRef.current = null;

        // Auto-reconnect unless manually disconnected
        if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * Math.min(reconnectAttemptsRef.current, 3);
          // Attempting WebSocket reconnection

          reconnectTimeoutRef.current = setTimeout(async () => {
            // Try to refresh token before reconnecting
            const token = getAuthToken();
            if (token && isTokenExpiringSoon(token, 30)) {
              try {
                await refreshTokens();
              } catch {
                // Continue with reconnect even if refresh fails
              }
            }
            connect();
          }, delay);
        }
      };
    } catch (e) {
      console.error("[WebSocket] Connection error:", e);
      setStatus("error");
    }
  }, [reconnectInterval, maxReconnectAttempts]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCONNECT
  // ═══════════════════════════════════════════════════════════════════════════

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setStatus("disconnected");
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIBE / UNSUBSCRIBE
  // ═══════════════════════════════════════════════════════════════════════════

  const subscribe = useCallback((event: string, handler: EventHandler): (() => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const unsubscribe = useCallback((event: string, handler: EventHandler) => {
    handlersRef.current.get(event)?.delete(handler);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  const subscribeToChannel = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "subscribe",
        channels: [channel],
      }));
    }
  }, []);

  const unsubscribeFromChannel = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "unsubscribe",
        channels: [channel],
      }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  const send = useCallback((type: string, payload?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn("[WebSocket] Cannot send - not connected");
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN FRESHNESS CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (status !== "connected") {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
      return;
    }

    tokenCheckIntervalRef.current = setInterval(async () => {
      const token = getAuthToken();
      if (!token) return;

      if (isTokenExpiringSoon(token, 120)) {
        // Token expiring soon, attempting refresh
        try {
          const refreshed = await refreshTokens();
          if (refreshed) {
            // Token renewed, reconnecting
            // Disconnect and reconnect with fresh token
            if (wsRef.current) {
              isManualDisconnectRef.current = false;
              wsRef.current.close(1000, "Token refresh");
              wsRef.current = null;
            }
            // Small delay before reconnect
            setTimeout(() => connect(), 500);
          }
        } catch (err) {
          console.warn("[WebSocket] Token-Refresh fehlgeschlagen:", err);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
    };
  }, [status, connect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-CONNECT ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    isConnected: status === "connected",
    subscribe,
    unsubscribe,
    send,
    connect,
    disconnect,
    subscribeToChannel,
    unsubscribeFromChannel,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL WEBSOCKET CONTEXT (Optional)
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useContext, type ReactNode } from "react";

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket();

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): UseWebSocketReturn {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to listen for specific WebSocket events
 */
export function useWebSocketEvent(event: string, handler: EventHandler) {
  const { subscribe } = useWebSocket({ autoConnect: false });

  useEffect(() => {
    return subscribe(event, handler);
  }, [event, handler, subscribe]);
}

/**
 * Hook for real-time installation updates
 */
export function useInstallationUpdates(
  onCreated?: (data: unknown) => void,
  onUpdated?: (data: unknown) => void,
  onStatusChanged?: (data: unknown) => void
) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    if (onCreated) {
      unsubs.push(subscribe("installation:created", onCreated));
    }
    if (onUpdated) {
      unsubs.push(subscribe("installation:updated", onUpdated));
    }
    if (onStatusChanged) {
      unsubs.push(subscribe("installation:status_changed", onStatusChanged));
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [subscribe, onCreated, onUpdated, onStatusChanged]);

  return { isConnected };
}

/**
 * Hook for real-time stats updates
 */
export function useStatsUpdates(onUpdate: (data: unknown) => void) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    return subscribe("stats:updated", onUpdate);
  }, [subscribe, onUpdate]);

  return { isConnected };
}

/**
 * Hook for real-time alert updates
 */
export function useAlertUpdates(onNewAlert: (data: unknown) => void) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    return subscribe("alert:new", onNewAlert);
  }, [subscribe, onNewAlert]);

  return { isConnected };
}

export default useWebSocket;
