/**
 * Baunity Unified Document Generator
 * ====================================
 * Einheitliches System für alle Dokumenten-Generatoren
 * Verwendet von Wizard UND Dokumenten-Tab
 *
 * VERWENDUNG:
 * ```typescript
 * import { generateDocument, toUnifiedData } from '@/lib/generators';
 *
 * // Aus WizardData oder InstallationDetail
 * const data = toUnifiedData(wizardDataOrInstallationDetail);
 *
 * // Einzelnes Dokument generieren
 * const schaltplan = await generateDocument(data, 'schaltplan');
 *
 * // Alle Dokumente generieren
 * const allDocs = await generateAllDocuments(data);
 * ```
 */

// Types
export type {
  UnifiedInstallationData,
  UnifiedCustomer,
  UnifiedAddress,
  UnifiedPVModule,
  UnifiedInverter,
  UnifiedStorage,
  UnifiedWallbox,
  UnifiedHeatPump,
  UnifiedGridOperator,
  Messkonzept,
  DokumentTyp,
  DokumentKategorie,
  GeneratedDocument,
  GeneratorOptions,
  CompanyConfig,
} from './types';

// Adapter
export { fromWizardData, fromInstallationDetail, toUnifiedData } from './adapter';

// Individual Generators
export { generateSchaltplan, generateSchaltplanSVG } from './SchaltplanGenerator';
export { generateLageplan, generateLageplanSVG } from './LageplanGenerator';
export { generateE1, generateE2, generateE3, generateE8, generateAllVDEFormulare } from './VDEFormulareGenerator';
export { generateVollmacht } from './VollmachtGenerator';

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED API
// ═══════════════════════════════════════════════════════════════════════════

import type { UnifiedInstallationData, DokumentTyp, GeneratedDocument, GeneratorOptions } from './types';
import { toUnifiedData } from './adapter';
import { generateSchaltplan } from './SchaltplanGenerator';
import { generateLageplan } from './LageplanGenerator';
import { generateE1, generateE2, generateE3, generateE8 } from './VDEFormulareGenerator';
import { generateVollmacht } from './VollmachtGenerator';

/**
 * Generiert ein einzelnes Dokument
 * @param input - WizardData, InstallationDetail oder UnifiedInstallationData
 * @param typ - Dokumenttyp
 * @param options - Generator-Optionen
 */
export async function generateDocument(
  input: any,
  typ: DokumentTyp,
  options?: GeneratorOptions
): Promise<GeneratedDocument | null> {
  // Automatisch zu UnifiedInstallationData konvertieren
  const data: UnifiedInstallationData = input.kunde ? input : toUnifiedData(input);

  switch (typ) {
    case 'schaltplan':
      return generateSchaltplan(data, options);

    case 'lageplan':
      return generateLageplan(data, options);

    case 'vde_e1':
      return generateE1(data, options);

    case 'vde_e2':
      return generateE2(data, options);

    case 'vde_e3':
      return generateE3(data, options);

    case 'vde_e8':
      return generateE8(data, options);

    case 'vollmacht':
      return generateVollmacht(data, options);

    case 'projektmappe':
      // TODO: Projektmappe implementieren
      console.warn('[generators] Projektmappe noch nicht implementiert');
      return null;

    default:
      console.warn(`[generators] Unbekannter Dokumenttyp: ${typ}`);
      return null;
  }
}

/**
 * Generiert alle verfügbaren Dokumente
 * @param input - WizardData, InstallationDetail oder UnifiedInstallationData
 * @param options - Generator-Optionen
 */
export async function generateAllDocuments(
  input: any,
  options?: GeneratorOptions
): Promise<GeneratedDocument[]> {
  const data: UnifiedInstallationData = input.kunde ? input : toUnifiedData(input);
  const docs: GeneratedDocument[] = [];

  // VDE-Formulare (synchron)
  docs.push(generateE1(data, options));
  docs.push(generateE2(data, options));

  const e3 = generateE3(data, options);
  if (e3) docs.push(e3);

  docs.push(generateE8(data, options));

  // Vollmacht
  docs.push(generateVollmacht(data, options));

  // Lageplan und Schaltplan (async, parallel)
  const [lageplan, schaltplan] = await Promise.all([
    generateLageplan(data, options),
    generateSchaltplan(data, options),
  ]);

  docs.push(lageplan);
  docs.push(schaltplan);

  return docs;
}

/**
 * Download eines generierten Dokuments
 * Desktop: Nativer OS-Speichern-Dialog, Web: Browser-Download
 */
export async function downloadDocument(doc: GeneratedDocument): Promise<void> {
  const { downloadFile } = await import('@/utils/desktopDownload');
  await downloadFile({ filename: doc.filename, blob: doc.blob, fileType: 'pdf' });
}

/**
 * Öffnet Dokument zum Drucken
 * Desktop: Nativer Druckdialog via IPC, Web: Neuer Tab
 */
export async function openDocumentForPrint(doc: GeneratedDocument): Promise<void> {
  const isDesktop = Boolean(window.baunityDesktop?.isDesktop);

  if (isDesktop) {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(doc.blob);
      });
      await window.baunityDesktop!.print.pdf({ base64Data: base64 });
      return;
    } catch (err) {
      console.warn('[generators] Native print failed, falling back:', err);
    }
  }

  const url = URL.createObjectURL(doc.blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
