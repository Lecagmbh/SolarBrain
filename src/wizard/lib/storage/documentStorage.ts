/**
 * Document Storage Service
 * ========================
 * Speichert generierte Dokumente in IndexedDB
 * - Überlebt Page Reload
 * - Automatische Wiederherstellung
 * - Blob ↔ Base64 Konvertierung
 */

const DB_NAME = 'baunity-wizard-docs';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export interface StoredDocument {
  id: string;
  name: string;
  filename: string;
  kategorie: string;
  mimeType: string;
  data: string; // Base64 encoded
  uploadedAt: string; // ISO date string
  size: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Öffnet die IndexedDB Datenbank
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[DocumentStorage] IndexedDB Fehler:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Erstelle Object Store für Dokumente
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('kategorie', 'kategorie', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
  });
}

/**
 * Konvertiert Blob zu Base64 String
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Entferne Data URL Prefix (data:application/pdf;base64,)
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Konvertiert Base64 String zu Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Speichert ein Dokument in IndexedDB
 */
export async function saveDocument(doc: {
  id: string;
  name: string;
  filename: string;
  kategorie: string;
  blob: Blob;
  uploadedAt: Date;
}): Promise<void> {
  try {
    const db = await openDB();

    // Konvertiere Blob zu Base64
    const base64Data = await blobToBase64(doc.blob);

    const storedDoc: StoredDocument = {
      id: doc.id,
      name: doc.name,
      filename: doc.filename,
      kategorie: doc.kategorie,
      mimeType: doc.blob.type || 'application/pdf',
      data: base64Data,
      uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : (doc.uploadedAt || new Date().toISOString()),
      size: doc.blob.size,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storedDoc);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[DocumentStorage] Speichern fehlgeschlagen:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[DocumentStorage] Fehler beim Speichern:', error);
    throw error;
  }
}

/**
 * Lädt alle Dokumente aus IndexedDB
 */
export async function loadAllDocuments(): Promise<Array<{
  id: string;
  name: string;
  filename: string;
  kategorie: string;
  url: string;
  uploadedAt: Date;
  size: number;
}>> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const storedDocs = request.result as StoredDocument[];

        const documents = storedDocs.map((doc) => {
          // Konvertiere Base64 zurück zu Blob und erstelle URL
          const blob = base64ToBlob(doc.data, doc.mimeType);
          const url = URL.createObjectURL(blob);

          return {
            id: doc.id,
            name: doc.name,
            filename: doc.filename,
            kategorie: doc.kategorie,
            url,
            uploadedAt: new Date(doc.uploadedAt),
            size: doc.size,
          };
        });

        resolve(documents);
      };

      request.onerror = () => {
        console.error('[DocumentStorage] Laden fehlgeschlagen:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[DocumentStorage] Fehler beim Laden:', error);
    return [];
  }
}

/**
 * Löscht ein Dokument aus IndexedDB
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[DocumentStorage] Löschen fehlgeschlagen:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[DocumentStorage] Fehler beim Löschen:', error);
    throw error;
  }
}

/**
 * Löscht alle Dokumente aus IndexedDB
 */
export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[DocumentStorage] Löschen fehlgeschlagen:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[DocumentStorage] Fehler beim Löschen:', error);
    throw error;
  }
}

/**
 * Prüft ob IndexedDB verfügbar ist
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Gibt Statistiken über gespeicherte Dokumente zurück
 */
export async function getStorageStats(): Promise<{
  count: number;
  totalSize: number;
  categories: Record<string, number>;
}> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs = request.result as StoredDocument[];

        const stats = {
          count: docs.length,
          totalSize: docs.reduce((sum, doc) => sum + doc.size, 0),
          categories: {} as Record<string, number>,
        };

        docs.forEach((doc) => {
          stats.categories[doc.kategorie] = (stats.categories[doc.kategorie] || 0) + 1;
        });

        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return { count: 0, totalSize: 0, categories: {} };
  }
}
