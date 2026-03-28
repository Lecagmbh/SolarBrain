/**
 * Offline-Aware Submit — Leitet Formulare an API oder Offline-Queue
 * Erkennt automatisch ob online oder offline.
 */
import { getNetworkStatus } from "../hooks/useNetworkStatus";
import { addToQueue } from "../services/offlineFormQueue";
import { getAuthToken } from "../config/storage";

interface SubmitOptions {
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH";
  data: Record<string, unknown>;
  type: string;
  description: string;
}

interface SubmitResult {
  success: boolean;
  offline: boolean;
  queueId?: string;
  data?: any;
  error?: string;
}

export async function offlineAwareSubmit(opts: SubmitOptions): Promise<SubmitResult> {
  const isOnline = getNetworkStatus();

  // Online: direkt an API senden
  if (isOnline) {
    try {
      const token = getAuthToken();
      const res = await fetch(opts.endpoint, {
        method: opts.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(opts.data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Serverfehler" }));
        return { success: false, offline: false, error: err.error || `HTTP ${res.status}` };
      }

      const data = await res.json();
      return { success: true, offline: false, data };
    } catch (err: any) {
      // Netzwerkfehler → in Queue legen
      const queueId = await addToQueue({
        endpoint: opts.endpoint,
        method: opts.method || "POST",
        data: opts.data,
        type: opts.type,
        description: opts.description,
      });
      return { success: true, offline: true, queueId };
    }
  }

  // Offline: in Queue legen
  const queueId = await addToQueue({
    endpoint: opts.endpoint,
    method: opts.method || "POST",
    data: opts.data,
    type: opts.type,
    description: opts.description,
  });

  return { success: true, offline: true, queueId };
}
