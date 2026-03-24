/**
 * LECA Offline Queue Service
 * Queue operations when offline, sync when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@leca_offline_queue';
const CACHE_KEY = '@leca_data_cache';

class OfflineQueueService {
  constructor() {
    this.isOnline = true;
    this.queue = [];
    this.listeners = [];
    this.syncInProgress = false;
  }

  async initialize() {
    // Load queue from storage
    await this.loadQueue();

    // Subscribe to network state changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      this.notifyListeners({ isOnline: this.isOnline });

      // Auto-sync when back online
      if (wasOffline && this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });

    // Initial network check
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected && state.isInternetReachable;

    return this.isOnline;
  }

  // Queue Management
  async loadQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      this.queue = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineQueue] Load error:', error);
      this.queue = [];
    }
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Save error:', error);
    }
  }

  async addToQueue(operation) {
    const item = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3,
      ...operation,
    };

    this.queue.push(item);
    await this.saveQueue();
    this.notifyListeners({ queueUpdated: true, queueLength: this.queue.length });

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return item.id;
  }

  async removeFromQueue(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
    await this.saveQueue();
    this.notifyListeners({ queueUpdated: true, queueLength: this.queue.length });
  }

  getQueueLength() {
    return this.queue.length;
  }

  getQueue() {
    return [...this.queue];
  }

  // Process Queue
  async processQueue() {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners({ syncStarted: true });

    const processedIds = [];
    const failedItems = [];

    for (const item of this.queue) {
      try {
        await this.executeOperation(item);
        processedIds.push(item.id);
      } catch (error) {
        console.error('[OfflineQueue] Operation failed:', item.id, error);
        item.retries++;
        item.lastError = error.message;

        if (item.retries >= item.maxRetries) {
          failedItems.push(item);
          processedIds.push(item.id); // Remove from queue
        }
      }
    }

    // Remove processed items
    this.queue = this.queue.filter((item) => !processedIds.includes(item.id));
    await this.saveQueue();

    this.syncInProgress = false;
    this.notifyListeners({
      syncCompleted: true,
      processed: processedIds.length,
      failed: failedItems.length,
      remaining: this.queue.length,
    });

    return { processed: processedIds.length, failed: failedItems.length };
  }

  async executeOperation(item) {
    // Import API dynamically to avoid circular deps
    const { api } = require('../api/client');

    switch (item.type) {
      case 'CREATE_INSTALLATION':
        return api.post('/installations', item.data);

      case 'UPDATE_INSTALLATION':
        return api.patch(`/installations/${item.data.id}`, item.data);

      case 'UPDATE_STATUS':
        return api.patch(`/installations/${item.data.id}/status`, {
          status: item.data.status,
          note: item.data.note,
        });

      case 'ADD_COMMENT':
        return api.post(`/installations/${item.data.installationId}/comments`, {
          message: item.data.message,
          isInternal: item.data.isInternal,
        });

      case 'UPLOAD_DOCUMENT':
        // Document uploads need special handling
        console.warn('[OfflineQueue] Document uploads not yet supported offline');
        throw new Error('Document uploads not supported offline');

      default:
        throw new Error(`Unknown operation type: ${item.type}`);
    }
  }

  // Caching
  async cacheData(key, data, ttl = 3600000) {
    // TTL in ms, default 1 hour
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('[OfflineQueue] Cache error:', error);
    }
  }

  async getCachedData(key) {
    try {
      const item = await AsyncStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!item) return null;

      const cacheItem = JSON.parse(item);
      const age = Date.now() - cacheItem.timestamp;

      if (age > cacheItem.ttl) {
        // Cache expired
        await AsyncStorage.removeItem(`${CACHE_KEY}_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('[OfflineQueue] Get cache error:', error);
      return null;
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[OfflineQueue] Clear cache error:', error);
    }
  }

  // Listeners
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    });
  }

  // Convenience methods for common operations
  async queueStatusUpdate(installationId, status, note) {
    return this.addToQueue({
      type: 'UPDATE_STATUS',
      data: { id: installationId, status, note },
      description: `Status aendern: ${status}`,
    });
  }

  async queueComment(installationId, message, isInternal = false) {
    return this.addToQueue({
      type: 'ADD_COMMENT',
      data: { installationId, message, isInternal },
      description: 'Kommentar hinzufuegen',
    });
  }

  async queueInstallationCreate(data) {
    return this.addToQueue({
      type: 'CREATE_INSTALLATION',
      data,
      description: `Neue Anlage: ${data.customerName}`,
    });
  }
}

export const offlineQueue = new OfflineQueueService();
export default offlineQueue;
