/**
 * useDocuments Hook
 * =================
 * Verwaltet Dokumente mit IndexedDB Persistenz
 * - Automatisches Speichern bei Generierung
 * - Wiederherstellung nach Page Reload
 * - Blob URL Management
 */

import { useEffect, useState, useCallback } from 'react';
import { useWizardStore } from '../stores/wizardStore';
import {
  saveDocument,
  loadAllDocuments,
  deleteDocument,
  clearAllDocuments,
  isIndexedDBAvailable,
  getStorageStats,
} from '../lib/storage';
import type { DokumentUpload } from '../types/wizard.types';

interface UseDocumentsResult {
  documents: DokumentUpload[];
  isLoading: boolean;
  isIndexedDBSupported: boolean;
  stats: { count: number; totalSize: number } | null;

  // Aktionen
  addDocument: (doc: Omit<DokumentUpload, 'id'> & { id?: string; blob?: Blob }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  clearDocuments: () => Promise<void>;
  reloadDocuments: () => Promise<void>;
}

// Generiere eindeutige ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Hook für Dokument-Management mit IndexedDB Persistenz
 */
export function useDocuments(): UseDocumentsResult {
  const { data, updateStep7 } = useWizardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<{ count: number; totalSize: number } | null>(null);

  const isIndexedDBSupported = isIndexedDBAvailable();

  // Lade Dokumente aus IndexedDB beim ersten Mount
  useEffect(() => {
    if (isInitialized || !isIndexedDBSupported) {
      setIsLoading(false);
      return;
    }

    const loadDocs = async () => {
      try {
        const storedDocs = await loadAllDocuments() || [];

        if (storedDocs.length > 0) {
          // Konvertiere zu DokumentUpload Format
          const dokumente: DokumentUpload[] = storedDocs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            filename: doc.filename,
            kategorie: doc.kategorie as DokumentUpload['kategorie'],
            url: doc.url,
            uploadedAt: doc.uploadedAt,
          }));

          // Merge mit bestehenden Dokumenten (falls welche im Store sind)
          const existingDocs = data.step7.dokumente || [];
          const existingIds = new Set(existingDocs.map((d) => d.id));
          const newDocs = dokumente.filter((d) => !existingIds.has(d.id));

          if (newDocs.length > 0) {
            updateStep7({
              dokumente: [...existingDocs, ...newDocs],
            });
          }
        }

        // Lade Stats
        const storageStats = await getStorageStats();
        setStats({ count: storageStats.count, totalSize: storageStats.totalSize });
      } catch (error) {
        console.error('[useDocuments] Fehler beim Laden:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadDocs();
  }, [isInitialized, isIndexedDBSupported]);

  // Dokument hinzufügen
  const addDocument = useCallback(
    async (doc: Omit<DokumentUpload, 'id'> & { id?: string; blob?: Blob }) => {
      const docId = doc.id || generateId();

      // Wenn Blob vorhanden, in IndexedDB speichern
      if (doc.blob && isIndexedDBSupported) {
        try {
          await saveDocument({
            id: docId,
            name: doc.name,
            filename: doc.filename,
            kategorie: doc.kategorie,
            blob: doc.blob,
            uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt),
          });

          // Stats aktualisieren
          const storageStats = await getStorageStats();
          setStats({ count: storageStats.count, totalSize: storageStats.totalSize });
        } catch (error) {
          console.error('[useDocuments] Fehler beim Speichern in IndexedDB:', error);
        }
      }

      // Prüfe ob Dokument mit gleichem Namen bereits existiert
      const existingIndex = data.step7.dokumente.findIndex((d) => d.name === doc.name);
      let newDokumente: DokumentUpload[];

      const newDoc: DokumentUpload = {
        id: docId,
        name: doc.name,
        filename: doc.filename,
        kategorie: doc.kategorie,
        url: doc.url,
        uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt),
      };

      if (existingIndex >= 0) {
        // Ersetze existierendes
        newDokumente = [...data.step7.dokumente];
        newDokumente[existingIndex] = newDoc;
      } else {
        // Füge hinzu
        newDokumente = [...data.step7.dokumente, newDoc];
      }

      updateStep7({ dokumente: newDokumente });
    },
    [data.step7.dokumente, updateStep7, isIndexedDBSupported]
  );

  // Dokument entfernen
  const removeDocument = useCallback(
    async (id: string) => {
      // Aus IndexedDB löschen
      if (isIndexedDBSupported) {
        try {
          await deleteDocument(id);

          // Stats aktualisieren
          const storageStats = await getStorageStats();
          setStats({ count: storageStats.count, totalSize: storageStats.totalSize });
        } catch (error) {
          console.error('[useDocuments] Fehler beim Löschen aus IndexedDB:', error);
        }
      }

      // Aus Store entfernen
      updateStep7({
        dokumente: data.step7.dokumente.filter((d) => d.id !== id),
      });
    },
    [data.step7.dokumente, updateStep7, isIndexedDBSupported]
  );

  // Alle Dokumente löschen
  const clearDocuments = useCallback(async () => {
    if (isIndexedDBSupported) {
      try {
        await clearAllDocuments();
        setStats({ count: 0, totalSize: 0 });
      } catch (error) {
        console.error('[useDocuments] Fehler beim Löschen:', error);
      }
    }

    updateStep7({ dokumente: [] });
  }, [updateStep7, isIndexedDBSupported]);

  // Dokumente neu laden
  const reloadDocuments = useCallback(async () => {
    if (!isIndexedDBSupported) return;

    setIsLoading(true);
    try {
      const storedDocs = await loadAllDocuments();

      const dokumente: DokumentUpload[] = storedDocs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        filename: doc.filename,
        kategorie: doc.kategorie as DokumentUpload['kategorie'],
        url: doc.url,
        uploadedAt: doc.uploadedAt,
      }));

      updateStep7({ dokumente });

      const storageStats = await getStorageStats();
      setStats({ count: storageStats.count, totalSize: storageStats.totalSize });
    } catch (error) {
      console.error('[useDocuments] Fehler beim Neuladen:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateStep7, isIndexedDBSupported]);

  return {
    documents: data.step7.dokumente,
    isLoading,
    isIndexedDBSupported,
    stats,
    addDocument,
    removeDocument,
    clearDocuments,
    reloadDocuments,
  };
}
