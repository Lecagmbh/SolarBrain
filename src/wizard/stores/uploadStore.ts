/**
 * Upload Tracking Store
 * =====================
 * Verfolgt den Status von Background-Uploads nach Wizard-Submit
 * - Zeigt Status in UI
 * - Ermöglicht Retry bei Fehlern
 * - Benachrichtigt User bei Fehlern
 */

import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'partial';

export interface DocumentUploadState {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadState {
  // Aktueller Status
  status: UploadStatus;
  installationId: number | null;
  publicId: string | null;

  // Dokument-Status
  documents: DocumentUploadState[];

  // Zusammenfassung
  totalCount: number;
  successCount: number;
  errorCount: number;

  // Fehlermeldung
  errorMessage: string | null;

  // UI State
  isVisible: boolean;
  isMinimized: boolean;

  // Actions
  startUpload: (installationId: number, publicId: string, documentNames: string[]) => void;
  updateDocument: (name: string, status: DocumentUploadState['status'], error?: string) => void;
  setComplete: (allSuccess: boolean) => void;
  setError: (message: string) => void;
  dismiss: () => void;
  minimize: () => void;
  maximize: () => void;
  reset: () => void;

  // Retry
  canRetry: boolean;
  retryFailed: () => void;
  setRetryHandler: (handler: () => Promise<void>) => void;
}

export const useUploadStore = create<UploadState>((set, get) => {
  let retryHandler: (() => Promise<void>) | null = null;

  return {
    // Initial State
    status: 'idle',
    installationId: null,
    publicId: null,
    documents: [],
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    errorMessage: null,
    isVisible: false,
    isMinimized: false,
    canRetry: false,

    startUpload: (installationId, publicId, documentNames) => {
      set({
        status: 'uploading',
        installationId,
        publicId,
        documents: documentNames.map(name => ({
          name,
          status: 'pending',
        })),
        totalCount: documentNames.length,
        successCount: 0,
        errorCount: 0,
        errorMessage: null,
        isVisible: true,
        isMinimized: false,
        canRetry: false,
      });
    },

    updateDocument: (name, status, error) => {
      set(state => {
        const documents = state.documents.map(doc =>
          doc.name === name ? { ...doc, status, error } : doc
        );

        const successCount = documents.filter(d => d.status === 'success').length;
        const errorCount = documents.filter(d => d.status === 'error').length;

        return { documents, successCount, errorCount };
      });
    },

    setComplete: (allSuccess) => {
      set(state => ({
        status: allSuccess ? 'success' : (state.errorCount > 0 ? 'partial' : 'success'),
        canRetry: !allSuccess && state.errorCount > 0,
      }));
    },

    setError: (message) => {
      set({
        status: 'error',
        errorMessage: message,
        canRetry: true,
      });
    },

    dismiss: () => {
      set({ isVisible: false });
    },

    minimize: () => {
      set({ isMinimized: true });
    },

    maximize: () => {
      set({ isMinimized: false });
    },

    reset: () => {
      set({
        status: 'idle',
        installationId: null,
        publicId: null,
        documents: [],
        totalCount: 0,
        successCount: 0,
        errorCount: 0,
        errorMessage: null,
        isVisible: false,
        isMinimized: false,
        canRetry: false,
      });
      retryHandler = null;
    },

    setRetryHandler: (handler) => {
      retryHandler = handler;
    },

    retryFailed: async () => {
      if (retryHandler) {
        set({ status: 'uploading', canRetry: false });
        try {
          await retryHandler();
        } catch (e) {
          console.error('[UploadStore] Retry fehlgeschlagen:', e);
        }
      }
    },
  };
});
