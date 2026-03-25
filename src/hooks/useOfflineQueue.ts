import { useState, useEffect } from 'react';
import {
  getQueueCount,
  getQueue,
  onQueueChange,
  initAutoSync,
  type QueueItem,
} from '../services/offlineFormQueue';

/**
 * Hook: Offline-Queue Status für UI-Anzeige
 * - pendingCount: Anzahl wartender Formulare
 * - items: Alle Queue-Items (optional, nur bei Bedarf)
 * - lastEvent: Letztes Queue-Event
 */
export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    // Auto-Sync initialisieren
    initAutoSync();

    // Initial laden
    getQueueCount().then(setPendingCount);
    getQueue().then(setItems);

    // Updates abonnieren
    const unsub = onQueueChange((event) => {
      getQueueCount().then(setPendingCount);
      getQueue().then(setItems);

      if (event.type === 'synced') {
        setLastEvent(`"${event.item?.description}" erfolgreich gesendet`);
      } else if (event.type === 'sync_complete' && event.remaining === 0) {
        setLastEvent('Alle Formulare synchronisiert');
      }
    });

    return unsub;
  }, []);

  return { pendingCount, items, lastEvent };
}
