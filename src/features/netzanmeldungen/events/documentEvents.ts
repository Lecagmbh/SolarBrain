/**
 * DOCUMENT EVENTS - Synchronisation zwischen DokumentenCenter und DocumentsTab
 * 
 * Emits events wenn Dokumente geändert werden:
 * - document:uploaded
 * - document:deleted
 * - document:generated
 * 
 * Beide UIs subscriben und refreshen bei Änderungen.
 */

export type DocumentEventType = 
  | 'document:uploaded'
  | 'document:deleted' 
  | 'document:generated'
  | 'documents:refresh';

export interface DocumentEventDetail {
  installationId: number;
  documentId?: number;
  kategorie?: string;
  count?: number;
}

/**
 * Emit document change event
 */
export function emitDocumentEvent(type: DocumentEventType, detail: DocumentEventDetail): void {
  const event = new CustomEvent(type, { detail });
  window.dispatchEvent(event);
  
  // Also emit generic refresh event
  if (type !== 'documents:refresh') {
    window.dispatchEvent(new CustomEvent('documents:refresh', { detail }));
  }
}

/**
 * Subscribe to document events
 * Returns unsubscribe function
 */
export function onDocumentEvent(
  type: DocumentEventType | DocumentEventType[],
  handler: (detail: DocumentEventDetail) => void
): () => void {
  const types = Array.isArray(type) ? type : [type];
  
  const listener = (e: Event) => {
    const customEvent = e as CustomEvent<DocumentEventDetail>;
    handler(customEvent.detail);
  };
  
  types.forEach(t => window.addEventListener(t, listener));
  
  return () => {
    types.forEach(t => window.removeEventListener(t, listener));
  };
}

/**
 * Subscribe to all document changes for a specific installation
 */
export function onDocumentsChanged(
  installationId: number,
  handler: () => void
): () => void {
  return onDocumentEvent('documents:refresh', (detail) => {
    if (detail.installationId === installationId) {
      handler();
    }
  });
}

// Convenience functions
export const documentEvents = {
  uploaded: (installationId: number, kategorie?: string, count = 1) => 
    emitDocumentEvent('document:uploaded', { installationId, kategorie, count }),
  
  deleted: (installationId: number, documentId: number) =>
    emitDocumentEvent('document:deleted', { installationId, documentId }),
  
  generated: (installationId: number, kategorie: string) =>
    emitDocumentEvent('document:generated', { installationId, kategorie }),
  
  refresh: (installationId: number) =>
    emitDocumentEvent('documents:refresh', { installationId }),
};
