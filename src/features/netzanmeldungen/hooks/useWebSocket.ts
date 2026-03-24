/**
 * NETZANMELDUNGEN ENTERPRISE - WEBSOCKET HOOK
 * Real-time Updates für Installations-Änderungen
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken } from "../../../modules/auth/tokenStorage";

export type WebSocketEvent = 
  | "installation:created"
  | "installation:updated"
  | "installation:deleted"
  | "installation:status_changed"
  | "document:uploaded"
  | "document:deleted"
  | "comment:added"
  | "task:created"
  | "task:completed"
  | "email:sent"
  | "email:received";

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: {
    installationId?: number;
    publicId?: string;
    status?: string;
    previousStatus?: string;
    userId?: number;
    userName?: string;
    timestamp: string;
    [key: string]: any;
  };
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  reconnectAttempts: number;
  send: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    enabled = true,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Use refs for callbacks to avoid reconnection loops
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const getWebSocketUrl = useCallback(() => {
    const token = getAccessToken();

    const wsPath = "/ws/installations";

    // Support VITE_API_BASE_URL for Electron/Desktop builds
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (baseUrl) {
      const url = new URL(baseUrl);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${url.host}${wsPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    }

    // Electron Desktop: app:// kann kein WebSocket → direkt zu baunity.de
    if (window.baunityDesktop?.isDesktop) {
      return `wss://baunity.de${wsPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}${wsPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");

    try {
      const url = getWebSocketUrl();
      // Connecting to WebSocket
      const ws = new WebSocket(url);

      ws.onopen = () => {
        // WebSocket connected
        setIsConnected(true);
        setConnectionStatus("connected");
        setReconnectAttempts(0);
        onConnectRef.current?.();

        // Subscribe to installation updates
        ws.send(JSON.stringify({ 
          type: "subscribe", 
          channels: ["installations", "documents", "tasks"] 
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // WebSocket message received
          setLastMessage(message);
          onMessageRef.current?.(message);
        } catch (e) {
          console.error("[WebSocket] Parse error:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setConnectionStatus("error");
        onErrorRef.current?.(error);
      };

      ws.onclose = (event) => {
        // WebSocket disconnected
        setIsConnected(false);
        setConnectionStatus("disconnected");
        wsRef.current = null;
        onDisconnectRef.current?.();

        // Auto-reconnect (nur bei unerwartetem Disconnect)
        if (enabled && autoReconnect && reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
          const delay = reconnectInterval * Math.min(reconnectAttempts + 1, 3); // Backoff
          // Attempting WebSocket reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[WebSocket] Connection error:", e);
      setConnectionStatus("error");
    }
  }, [getWebSocketUrl, autoReconnect, reconnectInterval, maxReconnectAttempts, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnect");
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setReconnectAttempts(0);
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Not connected, cannot send message");
    }
  }, []);

  // Connect on mount (if enabled)
  useEffect(() => {
    if (enabled) {
      // Delay initial connection to avoid blocking page load
      const timer = setTimeout(connect, 1000);
      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }
    return disconnect;
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionStatus,
    reconnectAttempts,
    send,
    connect,
    disconnect,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useInstallationUpdates
// Spezialisierter Hook für Installation-Updates
// ═══════════════════════════════════════════════════════════════════════════

interface UseInstallationUpdatesOptions {
  onInstallationCreated?: (data: any) => void;
  onInstallationUpdated?: (data: any) => void;
  onInstallationDeleted?: (data: any) => void;
  onStatusChanged?: (data: any) => void;
  onDocumentUploaded?: (data: any) => void;
  onTaskCreated?: (data: any) => void;
  onRefreshNeeded?: () => void;
  enabled?: boolean;
}

export function useInstallationUpdates(options: UseInstallationUpdatesOptions = {}) {
  const {
    onInstallationCreated,
    onInstallationUpdated,
    onInstallationDeleted,
    onStatusChanged,
    onDocumentUploaded,
    onTaskCreated,
    onRefreshNeeded,
    enabled = true,
  } = options;

  // Debounce refresh to avoid too many API calls
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      onRefreshNeeded?.();
    }, 500); // 500ms debounce
  }, [onRefreshNeeded]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.event) {
      case "installation:created":
        onInstallationCreated?.(message.data);
        triggerRefresh();
        break;
      case "installation:updated":
        onInstallationUpdated?.(message.data);
        triggerRefresh();
        break;
      case "installation:deleted":
        onInstallationDeleted?.(message.data);
        triggerRefresh();
        break;
      case "installation:status_changed":
        onStatusChanged?.(message.data);
        triggerRefresh();
        break;
      case "document:uploaded":
        onDocumentUploaded?.(message.data);
        triggerRefresh();
        break;
      case "document:deleted":
        triggerRefresh();
        break;
      case "task:created":
        onTaskCreated?.(message.data);
        break;
      case "task:completed":
        break;
      case "email:sent":
      case "email:received":
        break;
      case "comment:added":
        break;
      // Ignoriere unbekannte Events ohne Refresh
      default:
        // Unknown WebSocket event received
    }
  }, [onInstallationCreated, onInstallationUpdated, onInstallationDeleted, onStatusChanged, onDocumentUploaded, onTaskCreated, triggerRefresh]);

  return useWebSocket({
    onMessage: handleMessage,
    enabled,
  });
}

export default useWebSocket;
