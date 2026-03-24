/**
 * DEPRECATED: Replaced by new unified Übersichtsschaltplan generator
 * ===================================================================
 * Schaltpläne werden jetzt zentral im Backend via Python/reportlab generiert.
 * Dieser Legacy-Wrapper wird nicht mehr aktiv verwendet.
 *
 * --- Ursprüngliche Beschreibung ---
 * Baunity Schaltplan PDF Generator - UNIFIED WRAPPER
 */

import type { WizardData } from '../../types/wizard.types';
import {
  generateSchaltplan,
  fromWizardData,
} from '../../../lib/generators';

/**
 * Generiert Schaltplan PDF aus WizardData
 * VERWENDET: Unified Generator
 */
export async function generateSchaltplanPDF(
  data: WizardData
): Promise<{ blob: Blob; filename: string }> {
  const unified = fromWizardData(data);
  const doc = await generateSchaltplan(unified);

  return {
    blob: doc.blob,
    filename: doc.filename,
  };
}

/**
 * Synchrone Version (Rückwärtskompatibilität)
 * Hinweis: Gibt Promise zurück, muss mit await verwendet werden
 */
export function generateSchaltplanPDFSync(
  data: WizardData
): Promise<{ blob: Blob; filename: string }> {
  return generateSchaltplanPDF(data);
}
