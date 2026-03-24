/**
 * Baunity Vollmacht PDF Generator - UNIFIED WRAPPER
 * ===================================================
 * Diese Datei existiert für Rückwärtskompatibilität.
 *
 * VERWENDET: /src/lib/generators/VollmachtGenerator.ts
 */

import type { WizardData } from '../../types/wizard.types';
import {
  generateVollmacht,
  fromWizardData,
} from '../../../lib/generators';

/**
 * Legacy Interface für Rückwärtskompatibilität
 */
export interface VollmachtPDFData {
  vorname: string;
  nachname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  anlagenStandort: string;
  anlagenTyp: string;
  leistungKwp: number;
  netzbetreiber: string;
  zaehlerwechsel: boolean;
  mastrRegistrierung: boolean;
  paragraph14a: boolean;
}

/**
 * Extrahiert VollmachtPDFData aus WizardData
 */
export function extractVollmachtPDFData(data: WizardData): VollmachtPDFData {
  const komponenten = data.step1?.komponenten || [];
  const hatPV = komponenten.includes('pv');
  const hatSpeicher = komponenten.includes('speicher');
  const hatWallbox = komponenten.includes('wallbox');

  const anlagenTyp = [
    hatPV ? 'Photovoltaik' : null,
    hatSpeicher ? 'Speicher' : null,
    hatWallbox ? 'Wallbox' : null,
  ].filter(Boolean).join(' + ') || 'PV-Anlage';

  const auth = (data as any).authorization || {};

  return {
    vorname: data.step6?.vorname || '',
    nachname: data.step6?.nachname || '',
    strasse: data.step2?.strasse || '',
    hausnummer: data.step2?.hausnummer || '',
    plz: data.step2?.plz || '',
    ort: data.step2?.ort || '',
    anlagenStandort: `${data.step2?.strasse || ''} ${data.step2?.hausnummer || ''}, ${data.step2?.plz || ''} ${data.step2?.ort || ''}`,
    anlagenTyp,
    leistungKwp: Number(data.step5?.gesamtleistungKwp) || 0,
    netzbetreiber: data.step4?.netzbetreiberName || '',
    zaehlerwechsel: true,
    mastrRegistrierung: auth.mastrRegistration || false,
    paragraph14a: !!(data.step5?.paragraph14a && typeof data.step5.paragraph14a === 'object'
      ? (data.step5.paragraph14a as any).relevant
      : data.step5?.paragraph14a),
  };
}

/**
 * Generiert Vollmacht aus WizardData (Legacy-Export)
 */
export function generateVollmachtFromWizard(
  data: WizardData
): { blob: Blob; filename: string } {
  return generateVollmachtPDF(data);
}

/**
 * Generiert Vollmacht PDF aus WizardData
 * VERWENDET: Unified Generator
 */
export function generateVollmachtPDF(
  data: WizardData
): { blob: Blob; filename: string } {
  const unified = fromWizardData(data);
  const doc = generateVollmacht(unified);

  return {
    blob: doc.blob,
    filename: doc.filename,
  };
}

/**
 * Generiert Vollmacht PDF aus extrahierten Daten
 * Legacy-Funktion für Rückwärtskompatibilität
 */
export function generateVollmachtPDFFromData(
  vollmachtData: VollmachtPDFData
): { blob: Blob; filename: string } {
  // Konstruiere WizardData-artiges Objekt
  const pseudoWizardData = {
    step1: { komponenten: [] },
    step2: {
      strasse: vollmachtData.strasse,
      hausnummer: vollmachtData.hausnummer,
      plz: vollmachtData.plz,
      ort: vollmachtData.ort,
    },
    step4: {
      netzbetreiberName: vollmachtData.netzbetreiber,
    },
    step5: {
      gesamtleistungKwp: vollmachtData.leistungKwp,
    },
    step6: {
      vorname: vollmachtData.vorname,
      nachname: vollmachtData.nachname,
    },
    authorization: {
      mastrRegistration: vollmachtData.mastrRegistrierung,
    },
  } as any;

  return generateVollmachtPDF(pseudoWizardData);
}
