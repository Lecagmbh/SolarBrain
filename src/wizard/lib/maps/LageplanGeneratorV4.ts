/**
 * Baunity Lageplan Generator V4 - UNIFIED WRAPPER
 * =================================================
 * Diese Datei existiert für Rückwärtskompatibilität.
 *
 * VERWENDET: /src/lib/generators/LageplanGenerator.ts
 */

import type { WizardData } from '../../types/wizard.types';
import {
  generateLageplanSVG as unifiedGenerateLageplanSVG,
  fromWizardData,
} from '../../../lib/generators';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (für Rückwärtskompatibilität)
// ═══════════════════════════════════════════════════════════════════════════

export interface LageplanConfig {
  kundenname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  pvKwp: number;
  moduleAnzahl: number;
  dachflaechen: Array<{
    name: string;
    anzahl: number;
    ausrichtung: string;
    neigung: number;
    leistungWp: number;
  }>;
  speicherKwh: number;
  wechselrichterKva?: number;
  messkonzept?: string;
  netzbetreiber?: string;
}

export interface LageplanResult {
  svg: string;
  hasSatelliteImage: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extrahiert LageplanConfig aus WizardData
 */
export function extractLageplanConfig(data: WizardData): LageplanConfig {
  const unified = fromWizardData(data);
  return {
    kundenname: `${unified.kunde.vorname} ${unified.kunde.nachname}`.trim(),
    strasse: unified.standort.strasse,
    hausnummer: unified.standort.hausnummer,
    plz: unified.standort.plz,
    ort: unified.standort.ort,
    pvKwp: unified.gesamtleistungKwp,
    moduleAnzahl: unified.pvModule.reduce((sum, m) => sum + m.anzahl, 0),
    dachflaechen: unified.pvModule.map(m => ({
      name: m.name || 'Dachfläche',
      anzahl: m.anzahl,
      ausrichtung: m.ausrichtung || 'S',
      neigung: m.neigung ?? 30,
      leistungWp: m.leistungWp,
    })),
    speicherKwh: unified.speicherKapazitaetKwh,
    wechselrichterKva: unified.gesamtleistungKva,
    messkonzept: unified.messkonzept,
    netzbetreiber: unified.netzbetreiber?.name,
  };
}

/**
 * Generiert Lageplan SVG aus WizardData
 * VERWENDET: Unified Generator
 */
export async function generateLageplanSVG(
  data: WizardData
): Promise<LageplanResult> {
  const unified = fromWizardData(data);
  const result = await unifiedGenerateLageplanSVG(unified);

  return {
    svg: result.svg,
    hasSatelliteImage: result.hasSatelliteImage,
  };
}

/**
 * Generiert Lageplan aus WizardData (Haupt-Export)
 * VERWENDET: Unified Generator
 */
export async function generateLageplanFromWizard(
  data: WizardData
): Promise<LageplanResult | null> {
  try {
    return await generateLageplanSVG(data);
  } catch (error) {
    console.error('[LageplanGeneratorV4] Generation failed:', error);
    return null;
  }
}

// Default export für Kompatibilität
export default {
  generateLageplanSVG,
  generateLageplanFromWizard,
  extractLageplanConfig,
};
