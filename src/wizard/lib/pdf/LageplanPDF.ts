/**
 * Baunity Lageplan PDF Generator - UNIFIED WRAPPER
 * ==================================================
 * Diese Datei existiert für Rückwärtskompatibilität.
 *
 * VERWENDET: /src/lib/generators/LageplanGenerator.ts
 */

import type { WizardData } from '../../types/wizard.types';
import {
  generateLageplan,
  fromWizardData,
} from '../../../lib/generators';

/**
 * Generiert Lageplan PDF aus WizardData
 * VERWENDET: Unified Generator (mit Google Maps Satellitenbild)
 */
export async function generateLageplanPDF(
  data: WizardData
): Promise<{ blob: Blob; filename: string; hasSatelliteImage?: boolean }> {
  const unified = fromWizardData(data);
  const doc = await generateLageplan(unified);

  return {
    blob: doc.blob,
    filename: doc.filename,
    hasSatelliteImage: true, // Unified generator includes satellite by default
  };
}

/**
 * Synchrone Version (Rückwärtskompatibilität)
 * Hinweis: Gibt Promise zurück, muss mit await verwendet werden
 */
export function generateLageplanPDFSync(
  data: WizardData
): Promise<{ blob: Blob; filename: string }> {
  return generateLageplanPDF(data);
}
