/**
 * Offline Form Queue (Web/Capacitor)
 * ====================================
 * Speichert Formular-Submissions in IndexedDB wenn offline.
 * Synchronisiert automatisch wenn Internet wieder verfügbar.
 */

import { getNetworkStatus, onNetworkChange } from '../hooks/useNetworkStatus';

const DB_NAME = 'baunity-offline-forms';
const DB_VERSION = 1;
const STORE_NAME = 'form_queue';

// Queue Item Type
export type QueueItem = {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  data: Record<string, unknown>;
  description: string;
  createdAt: string;
  retries: number;
  maxRetries: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
};

type QueueListener = (event: {
  type: 'added' | 'synced' | 'failed' | 'sync_complete';
  item?: QueueItem;
  remaining: number;
}) => void;

// Singleton DB connection
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// Listeners
const listeners = new Set<QueueListener>();

function notify(event: Parameters<QueueListener>[0]) {
  listeners.forEach(fn => {
    try { fn(event); } catch (e) { console.error('[OfflineFormQueue] Listener error:', e); }
  });
}

/**
 * Formular zur Offline-Queue hinzufügen
 */
export async function addToQueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'retries' | 'maxRetries' | 'status'>): Promise<string> {
  const db = await openDB();
  const id = `form_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const entry: QueueItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
    retries: 0,
    maxRetries: 5,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => {
      notify({ type: 'added', item: entry, remaining: -1 });
      // Try sync immediately if online
      if (getNetworkStatus()) processQueue();
      resolve(id);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Alle Queue-Items laden
 */
export async function getQueue(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Anzahl wartender Items
 */
export async function getQueueCount(): Promise<number> {
  const items = await getQueue();
  return items.filter(i => i.status !== 'failed').length;
}

/**
 * Ein Item aus der Queue entfernen
 */
async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Item in der Queue updaten
 */
async function updateItem(item: QueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Sync lock
let syncing = false;

/**
 * Queue abarbeiten — sendet alle pending Items an den Server
 */
export async function processQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing || !getNetworkStatus()) return { synced: 0, failed: 0 };
  syncing = true;

  let synced = 0;
  let failed = 0;

  try {
    const items = await getQueue();
    const pending = items.filter(i => i.status === 'pending');

    for (const item of pending) {
      if (!getNetworkStatus()) break; // Stop if went offline

      item.status = 'syncing';
      await updateItem(item);

      try {
        const token = localStorage.getItem('baunity_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}${item.endpoint}`, {
          method: item.method,
          headers,
          credentials: 'include',
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          await removeFromQueue(item.id);
          synced++;
          notify({ type: 'synced', item, remaining: pending.length - synced - failed });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        item.retries++;
        item.lastError = (err as Error).message;
        item.status = item.retries >= item.maxRetries ? 'failed' : 'pending';
        await updateItem(item);
        failed++;
        notify({ type: 'failed', item, remaining: pending.length - synced - failed });
      }
    }
  } finally {
    syncing = false;
    const remaining = await getQueueCount();
    notify({ type: 'sync_complete', remaining });
  }

  return { synced, failed };
}

/**
 * Listener registrieren
 */
export function onQueueChange(fn: QueueListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * Auto-Sync starten: Synchronisiert automatisch wenn online
 */
let autoSyncInitialized = false;

export function initAutoSync(): void {
  if (autoSyncInitialized) return;
  autoSyncInitialized = true;

  // Bei Netzwerkwechsel: Queue verarbeiten
  onNetworkChange((online) => {
    if (online) {
      // Kurz warten bis Verbindung stabil
      setTimeout(() => processQueue(), 2000);
    }
  });

  // Initial: wenn online, Queue verarbeiten
  if (getNetworkStatus()) {
    processQueue();
  }
}
