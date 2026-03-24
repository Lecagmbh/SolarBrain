/**
 * NETZANMELDUNGEN Dokumente Generator Service
 * ============================================
 * WRAPPER für das neue einheitliche Generator-System
 *
 * Verwendet: /src/lib/generators/
 *
 * Diese Datei existiert für Rückwärtskompatibilität.
 * Neue Entwicklungen sollten direkt das zentrale System verwenden:
 *
 * import { generateDocument, toUnifiedData } from '@/lib/generators';
 */

import type { InstallationDetail } from '../types';
import {
  generateDocument as unifiedGenerateDocument,
  generateAllDocuments as unifiedGenerateAllDocuments,
  downloadDocument as unifiedDownloadDocument,
  openDocumentForPrint as unifiedOpenForPrint,
  fromInstallationDetail,
  type GeneratedDocument as UnifiedGeneratedDocument,
  type DokumentTyp as UnifiedDokumentTyp,
} from '../../../lib/generators';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export type DokumentTyp =
  | 'E1' | 'E2' | 'E3' | 'E8'  // VDE
  | 'vollmacht' | 'lageplan' | 'schaltplan' | 'projektmappe';

export interface GeneratedDocument {
  typ: DokumentTyp;
  name: string;
  blob: Blob;
  filename: string;
  kategorie: string;
}

export interface GeneratorOptionen {
  isAdmin?: boolean;
  produktDBData?: any;
  premiumDesign?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapDokumentTyp(typ: DokumentTyp): UnifiedDokumentTyp {
  switch (typ) {
    case 'E1': return 'vde_e1';
    case 'E2': return 'vde_e2';
    case 'E3': return 'vde_e3';
    case 'E8': return 'vde_e8';
    default: return typ as UnifiedDokumentTyp;
  }
}

function mapKategorie(kategorie: string): string {
  // Unified system uses VDE_E1 format, legacy uses VDE-E1
  return kategorie.replace('_', '-');
}

function convertDocument(doc: UnifiedGeneratedDocument): GeneratedDocument {
  // Map unified typ back to legacy format
  let legacyTyp: DokumentTyp;
  switch (doc.typ) {
    case 'vde_e1': legacyTyp = 'E1'; break;
    case 'vde_e2': legacyTyp = 'E2'; break;
    case 'vde_e3': legacyTyp = 'E3'; break;
    case 'vde_e8': legacyTyp = 'E8'; break;
    default: legacyTyp = doc.typ as DokumentTyp;
  }

  return {
    typ: legacyTyp,
    name: doc.name,
    blob: doc.blob,
    filename: doc.filename,
    kategorie: doc.kategorie,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert ein einzelnes Dokument
 */
export async function generateDocument(
  data: InstallationDetail,
  typ: DokumentTyp,
  optionen?: GeneratorOptionen
): Promise<GeneratedDocument | null> {
  const unifiedData = fromInstallationDetail(data);
  const unifiedTyp = mapDokumentTyp(typ);

  const doc = await unifiedGenerateDocument(unifiedData, unifiedTyp, {
    isAdmin: optionen?.isAdmin,
    showInstallerBadge: optionen?.isAdmin,
  });

  if (!doc) return null;
  return convertDocument(doc);
}

/**
 * Synchrone Version für Rückwärtskompatibilität
 * DEPRECATED: Verwende generateDocument stattdessen
 */
export function generateDocumentSync(
  data: InstallationDetail,
  typ: DokumentTyp,
  optionen?: GeneratorOptionen
): GeneratedDocument | null {
  console.warn('[dokumenteGenerator] generateDocumentSync ist deprecated. Verwende generateDocument.');
  // Kann nicht synchron aufgerufen werden - gebe null zurück
  return null;
}

/**
 * Generiert alle verfügbaren Dokumente
 */
export async function generateAllDocuments(
  data: InstallationDetail,
  optionen?: GeneratorOptionen
): Promise<GeneratedDocument[]> {
  const unifiedData = fromInstallationDetail(data);

  const docs = await unifiedGenerateAllDocuments(unifiedData, {
    isAdmin: optionen?.isAdmin,
    showInstallerBadge: optionen?.isAdmin,
  });

  return docs.map(convertDocument);
}

/**
 * Synchrone Version für Rückwärtskompatibilität
 * DEPRECATED: Verwende generateAllDocuments stattdessen
 */
export function generateAllDocumentsSync(
  data: InstallationDetail,
  optionen?: GeneratorOptionen
): GeneratedDocument[] {
  console.warn('[dokumenteGenerator] generateAllDocumentsSync ist deprecated. Verwende generateAllDocuments.');
  return [];
}

/**
 * Generiert Dokument mit ProduktDB-Anreicherung
 */
export async function generateDocumentWithEnrichment(
  data: InstallationDetail,
  typ: DokumentTyp,
  optionen?: Omit<GeneratorOptionen, 'produktDBData'>
): Promise<GeneratedDocument | null> {
  // Neues System macht automatisch Anreicherung wenn nötig
  return generateDocument(data, typ, optionen);
}

/**
 * Generiert alle Dokumente mit ProduktDB-Anreicherung
 */
export async function generateAllDocumentsWithEnrichment(
  data: InstallationDetail,
  optionen?: Omit<GeneratorOptionen, 'produktDBData'>
): Promise<GeneratedDocument[]> {
  return generateAllDocuments(data, optionen);
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Öffnet Dokument zum Drucken
 */
export function openDocumentForPrint(doc: GeneratedDocument): void {
  unifiedOpenForPrint({
    ...doc,
    typ: mapDokumentTyp(doc.typ) as any,
    kategorie: doc.kategorie as any,
    mimeType: 'application/pdf',
  });
}

/**
 * Download eines Dokuments
 */
export function downloadDocument(doc: GeneratedDocument): void {
  unifiedDownloadDocument({
    ...doc,
    typ: mapDokumentTyp(doc.typ) as any,
    kategorie: doc.kategorie as any,
    mimeType: 'application/pdf',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORTS für Rückwärtskompatibilität
// ═══════════════════════════════════════════════════════════════════════════

export { fromInstallationDetail as parseInstallationForGenerator };
