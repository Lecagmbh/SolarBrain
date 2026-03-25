import { useState, useEffect, useCallback } from 'react';

type NetworkStatus = {
  isOnline: boolean;
  wasOffline: boolean;
};

const listeners = new Set<(online: boolean) => void>();
let currentStatus = navigator.onLine;

// Global listener (once) so all hook instances share state
function initGlobalListeners() {
  if ((initGlobalListeners as any).__done) return;
  (initGlobalListeners as any).__done = true;

  const update = (online: boolean) => {
    currentStatus = online;
    listeners.forEach(fn => fn(online));
  };

  window.addEventListener('online', () => update(true));
  window.addEventListener('offline', () => update(false));
}

/**
 * Hook: Network-Status erkennen (online/offline)
 * - Nutzt browser events + optional connectivity check
 * - wasOffline = true wenn seit Mount mindestens einmal offline war
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(currentStatus);
  const [wasOffline, setWasOffline] = useState(!currentStatus);

  useEffect(() => {
    initGlobalListeners();

    const handler = (online: boolean) => {
      setIsOnline(online);
      if (!online) setWasOffline(true);
    };

    listeners.add(handler);
    // Sync with current state
    setIsOnline(currentStatus);

    return () => { listeners.delete(handler); };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Globale Helfer für nicht-React Code (z.B. OfflineQueue)
 */
export function getNetworkStatus(): boolean {
  return currentStatus;
}

export function onNetworkChange(fn: (online: boolean) => void): () => void {
  initGlobalListeners();
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
