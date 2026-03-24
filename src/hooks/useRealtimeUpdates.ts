/**
 * useRealtimeUpdates Hook
 * Verbindet WebSocket mit React Query für automatische Cache-Invalidierung
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '../config/storage';
import { showDesktopNotification, flashFrame } from './useDesktopIntegration';

// WebSocket URL ermitteln
function getWebSocketUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl) {
    const url = new URL(baseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws/installations`;
  }

  // Electron Desktop: app:// Protocol kann kein WebSocket → direkt zu baunity.de
  if (window.baunityDesktop?.isDesktop) {
    return 'wss://baunity.de/ws/installations';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/installations`;
}

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectInterval = 3000;

  useEffect(() => {
    const connect = () => {
      // Get token from central storage
      const token = getAuthToken();
      if (!token) {
        console.warn('[RealtimeUpdates] No auth token found, skipping WebSocket connection');
        return;
      }

      // Build URL with token
      const url = `${getWebSocketUrl()}?token=${encodeURIComponent(token)}`;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          // WebSocket connected
          reconnectAttemptsRef.current = 0;

          // Subscribe to channels
          ws.send(JSON.stringify({
            type: 'subscribe',
            channels: ['installations', 'documents', 'tasks', 'intelligence', 'users', 'settings'],
          }));
        };

        ws.onmessage = (event) => {
          try {
            const { event: eventType, data } = JSON.parse(event.data);
            // Realtime event received

            // Invalidiere Cache basierend auf Event-Typ
            switch (eventType) {
              case 'installation:created':
              case 'installation:updated':
              case 'installation:deleted':
              case 'installation:status_changed':
                queryClient.invalidateQueries({ queryKey: ['installations'] });
                queryClient.invalidateQueries({ queryKey: ['installation-detail'] });
                queryClient.invalidateQueries({ queryKey: ['netzanmeldungen'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
                queryClient.invalidateQueries({ queryKey: ['pipeline'] });
                break;

              case 'settings:updated':
                queryClient.invalidateQueries({ queryKey: ['company-settings'] });
                queryClient.invalidateQueries({ queryKey: ['settings'] });
                break;

              case 'user:created':
              case 'user:updated':
              case 'user:deleted':
                queryClient.invalidateQueries({ queryKey: ['users'] });
                break;

              case 'email:sent':
              case 'email:failed':
                queryClient.invalidateQueries({ queryKey: ['emails'] });
                queryClient.invalidateQueries({ queryKey: ['email-queue'] });
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
                break;

              case 'stats:updated':
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
                queryClient.invalidateQueries({ queryKey: ['kpis'] });
                break;

              case 'alert:new':
              case 'alert:acknowledged':
                queryClient.invalidateQueries({ queryKey: ['alerts'] });
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
                break;

              case 'document:uploaded':
              case 'document:created':
              case 'document:updated':
              case 'document:deleted':
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                queryClient.invalidateQueries({ queryKey: ['installation-detail'] });
                break;

              case 'task:created':
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                break;

              case 'tab:analyzed':
              case 'tab:analysis_failed':
              case 'insights:critical':
              case 'emails:processed':
              case 'learning:processed':
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
                queryClient.invalidateQueries({ queryKey: ['intelligence'] });
                break;

              default:
                // Für unbekannte Events: Control Center invalidieren
                queryClient.invalidateQueries({ queryKey: ['control-center'] });
            }

            // Desktop notifications when window is not focused
            if (window.baunityDesktop?.isDesktop && !document.hasFocus()) {
              switch (eventType) {
                case 'alert:new':
                  showDesktopNotification(
                    "Neuer Alert",
                    data?.message || "Ein neuer Alert erfordert Ihre Aufmerksamkeit.",
                    "/alerts"
                  );
                  flashFrame();
                  break;
                case 'installation:status_changed':
                  showDesktopNotification(
                    "Status geändert",
                    `${data?.kundenName || "Netzanmeldung"}: ${data?.fromStatus || ""} → ${data?.toStatus || ""}`,
                    data?.installationId ? `/archiv` : "/archiv"
                  );
                  break;
                case 'installation:created':
                  showDesktopNotification(
                    "Neue Netzanmeldung",
                    data?.kundenName || "Eine neue Netzanmeldung wurde erstellt.",
                    "/archiv"
                  );
                  break;
              }
            }
          } catch (e) {
            console.error('[RealtimeUpdates] Parse error:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('[RealtimeUpdates] WebSocket error:', error);
        };

        ws.onclose = (event) => {
          // WebSocket disconnected
          wsRef.current = null;

          // Auto-reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            // Attempting WebSocket reconnection

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        };
      } catch (e) {
        console.error('[RealtimeUpdates] Connection error:', e);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [queryClient]);
}

export default useRealtimeUpdates;
